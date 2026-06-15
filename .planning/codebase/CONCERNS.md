# Codebase Concerns

**Analysis Date:** 2026-06-15

## Tech Debt

**Synchronous Supabase token validation on every user request:**
- Issue: `SupabaseAuthService.validate()` makes a blocking HTTP call to the Supabase `/auth/v1/user` endpoint using a bare `new RestTemplate()` (no timeout, no connection pool config) on every authenticated user request. This adds network latency to each API call and has no caching or retry logic.
- Files: `backend/src/main/java/com/smartqueue/service/SupabaseAuthService.java`
- Impact: Latency spike under load; any Supabase outage makes the entire user-facing API unavailable. No request timeout means threads can hang indefinitely.
- Fix approach: Cache validated tokens in a short-lived in-memory map (keyed by token hash, TTL ~60s), configure `RestTemplate` with `SimpleClientHttpRequestFactory` timeouts, or switch to Supabase JWT verification (verify locally using the Supabase JWT secret without a network call).

**`averageWaitMinutes` stat is computed from `estimatedWaitMinutes` on tokens, not actual elapsed time:**
- Issue: `TokenRepository.averageWaitMinutes()` averages `estimated_wait_minutes` (a calculated snapshot integer) for completed tokens. This is a proxy metric, not real measured wait time. No actual start/end wait timestamps are averaged.
- Files: `backend/src/main/java/com/smartqueue/repository/TokenRepository.java`, `backend/src/main/java/com/smartqueue/service/StatsService.java`
- Impact: Stats dashboard shows a misleading average wait figure that reflects model assumptions, not real-world performance.
- Fix approach: Record actual wait duration (`serving_started_at - created_at`) on completion and aggregate that field; add a `actual_wait_minutes` computed column or service-layer calculation.

**StatsService.overview() uses N+1 pattern for active queue count:**
- Issue: `overview()` calls `services.findAll()` and then for each service calls `sessions.existsByServiceIdAndStatus(...)` in a loop — this is O(n) individual session queries.
- Files: `backend/src/main/java/com/smartqueue/service/StatsService.java`
- Impact: Scales poorly as the number of services grows. Each request to `/api/admin/stats/overview` executes `1 + N` queries.
- Fix approach: Add a single repository query `countByStatus(QueueSessionStatus.OPEN)` or a native query that joins services and sessions.

**QueueMapper issues N+1 DB queries per service listing:**
- Issue: `QueueMapper.service()` calls `sessions.findByServiceIdAndStatus(...)` and then `tokens.countByQueueSessionIdAndStatus(...)` and `tokens.findByQueueSessionIdAndStatusOrderByCreatedAtAsc(...)` individually for each service in the list. Every `/api/user/services` and `/api/admin/services` list call triggers 3×N queries.
- Files: `backend/src/main/java/com/smartqueue/service/QueueMapper.java`
- Impact: As services grow, listing performance degrades linearly. High DB load on a shared Supabase/Postgres instance.
- Fix approach: Use a JPQL or native query to join sessions and aggregate token counts in a single round trip; project into a DTO.

**Token number allocation is not concurrency-safe:**
- Issue: `nextNumber()` in `TokenService` uses `findFirstByQueueSessionIdOrderByTokenNumberDesc()` to get the max token number, then adds 1. Under concurrent requests for the same session, two threads can read the same max value and produce duplicate token numbers. The DB constraint `tokens_token_number_per_session_unique` will surface this as a constraint violation rather than graceful handling.
- Files: `backend/src/main/java/com/smartqueue/service/TokenService.java` (line 109–111)
- Impact: Concurrent token creation for the same queue session can cause a `DataIntegrityViolationException` exposed to the user as a 500 error.
- Fix approach: Use a DB sequence per session, a `SELECT ... FOR UPDATE` lock on the session row, or a `SERIAL`/`gen_random_uuid()`-based token number that uses a DB counter.

**AdminSeedRunner re-hashes and overwrites the admin password on every startup:**
- Issue: `AdminSeedRunner.run()` always calls `passwordEncoder.encode(password)` and `users.save(admin)` when the admin seed vars are set, regardless of whether the admin already exists. Every application restart performs a redundant DB write and bcrypt hash computation.
- Files: `backend/src/main/java/com/smartqueue/config/AdminSeedRunner.java`
- Impact: Minor unnecessary write on startup; also means the admin password cannot be changed through the app without unsetting the env var, since it is reset on each restart.
- Fix approach: Only set the password hash if the user does not yet exist, or compare the new password against the stored hash before updating.

**`dev-auth` mode allows arbitrary email-based authentication bypass:**
- Issue: When `DEV_AUTH_ENABLED=true`, any access token prefixed with `dev:` is accepted and a user identity is fabricated from the suffix email without any verification. This flag and its behavior exist in production-capable code with no runtime guard beyond the config value.
- Files: `backend/src/main/java/com/smartqueue/service/SupabaseAuthService.java` (lines 29–31), `backend/src/main/resources/application.yml`
- Impact: If `DEV_AUTH_ENABLED` is accidentally set to `true` in a production environment, anyone can authenticate as any email address, including admins.
- Fix approach: Assert that `devAuthEnabled` cannot be active when the Spring profile is `prod`; add an `@Profile("!prod")` guard or a startup check that fails fast if the flag is enabled in a non-dev context.

**WebSocket endpoint has no authentication:**
- Issue: `WebSocketConfig` registers `/ws` with `setAllowedOriginPatterns("*")` and `SecurityConfig` permits all `/ws/**` requests without authentication. Any unauthenticated client can subscribe to any STOMP topic, including `/topic/admin/queues` and per-user token topics (`/topic/users/{userId}/tokens`).
- Files: `backend/src/main/java/com/smartqueue/config/WebSocketConfig.java`, `backend/src/main/java/com/smartqueue/config/SecurityConfig.java` (line 30)
- Impact: Real-time queue events (which include token details, user IDs, service state) are broadcast to unauthenticated third parties. Per-user topics are also exposed since topic paths only use UUIDs as a weak obscurity barrier.
- Fix approach: Implement a `ChannelInterceptor` that validates a JWT during STOMP `CONNECT` frames; restrict admin topics to users with ADMIN role in the interceptor.

**Frontend JWT stored in `localStorage`:**
- Issue: `AuthContext` stores the full session object (including the backend JWT) in `localStorage.setItem('smartqueue.session', ...)`. `localStorage` is accessible to any JavaScript on the page.
- Files: `frontend/src/auth/AuthContext.tsx` (lines 40, 47)
- Impact: XSS vulnerability — any injected script can exfiltrate the token. `localStorage` is not cleared on browser close.
- Fix approach: Store the token in an `httpOnly` cookie managed server-side, or at minimum use `sessionStorage` to limit the persistence window.

**`call()` action sets both `calledAt` and `servingStartedAt` to the same instant, collapsing the CALLED state:**
- Issue: In `AdminQueueService.call()`, both `token.setCalledAt(Instant.now())` and `token.setServingStartedAt(Instant.now())` are set simultaneously, and the status is immediately set to `SERVING` (skipping the `CALLED` status entirely). The `CALLED` token status exists in the domain model and DB enum but is never set.
- Files: `backend/src/main/java/com/smartqueue/service/AdminQueueService.java` (lines 143–146), `backend/src/main/java/com/smartqueue/domain/TokenStatus.java`
- Impact: Dead code in the domain; any logic that checks for `TokenStatus.CALLED` (e.g., `complete()` and `skip()`) handles a state that is never reached through normal flow. Reporting/audit trails are inaccurate.
- Fix approach: Either remove `CALLED` from the status enum and related checks, or implement a genuine two-step call→serve flow.

**`onMessage` callback in `useQueueSocket` is not memoized by callers:**
- Issue: `useQueueSocket` includes `onMessage` in its `useEffect` dependency array via `[topics.join('|'), onMessage]`. In `AdminQueuePage`, the `refresh` callback is wrapped with `useCallback([reload])`, but `reload` itself is re-created on every render of `useAsync` due to `deps` array comparison. This can cause the WebSocket client to deactivate and reconnect on each render cycle.
- Files: `frontend/src/hooks/useQueueSocket.ts` (line 25), `frontend/src/pages/AdminQueuePage.tsx` (line 16), `frontend/src/hooks/useAsync.ts`
- Impact: Intermittent WebSocket reconnection flicker; unnecessary STOMP session churn.
- Fix approach: Wrap `onMessage` with `useRef` inside `useQueueSocket` so the effect only re-runs when topics change, not on every callback identity change.

**`window.prompt()` used for admin priority input:**
- Issue: `AdminQueuePage` uses `window.prompt()` to collect priority type and reason from admin users.
- Files: `frontend/src/pages/AdminQueuePage.tsx` (lines 30–33)
- Impact: Blocks the browser UI thread; cannot be styled or validated; breaks in environments where `window.prompt` is blocked (some browsers, iframes, test environments). Very poor UX for a production admin interface.
- Fix approach: Replace with an inline modal/dialog component that renders a controlled form with validation.

**Default JWT secret is a weak placeholder:**
- Issue: `application.yml` defaults `APP_JWT_SECRET` to the literal string `"change-this-secret-to-at-least-32-characters"` if the env var is not set.
- Files: `backend/src/main/resources/application.yml` (line 24)
- Impact: If the secret env var is omitted in a deployment, the application starts with a known, public secret and all tokens can be forged.
- Fix approach: Add a startup assertion (e.g., `@PostConstruct` check in `JwtService`) that fails if the secret equals the placeholder value or is shorter than 32 bytes when not in a dev profile.

**`CORS` configuration uses empty lambda (`cors -> {}`):**
- Issue: `SecurityConfig` applies `.cors(cors -> {})` which relies on a `CorsConfigurationSource` bean. While the bean exists, the lambda provides no explicit reference to it, relying on Spring's auto-detection. This is fragile — the link between the CORS config bean and the security chain is implicit.
- Files: `backend/src/main/java/com/smartqueue/config/SecurityConfig.java` (line 27)
- Impact: Low risk currently, but a future refactor could break CORS silently.
- Fix approach: Use `.cors(cors -> cors.configurationSource(corsConfigurationSource))` with an explicit bean reference.

## Known Bugs

**`StatsServiceTest` calls `tokens.averageWaitMinutes()` with no argument, but the method signature requires a `TokenStatus` parameter:**
- Symptoms: `StatsServiceTest` will fail to compile as written because `TokenRepository.averageWaitMinutes()` is defined with `@Param("status") TokenStatus status` but the test mocks `when(tokens.averageWaitMinutes()).thenReturn(null)` with zero arguments.
- Files: `backend/src/test/java/com/smartqueue/service/StatsServiceTest.java` (line 28), `backend/src/main/java/com/smartqueue/repository/TokenRepository.java` (line 37)
- Trigger: Running `./mvnw test`
- Workaround: The test is likely broken/skipped in CI. Fix by passing `TokenStatus.COMPLETED` as the argument to the mock.

**`ServiceDetailPage` allows selecting any `PriorityType` value via a plain `<option>` string, including `ADMIN_MARKED`:**
- Symptoms: The priority select in `ServiceDetailPage` hardcodes option strings (`NORMAL`, `SENIOR_CITIZEN`, `EMERGENCY`, `VIP`) but does not include `ADMIN_MARKED`, yet the backend accepts all `PriorityType` values. The `<option>` values are raw strings with no type assertion beyond a cast, so a manipulated request could submit arbitrary values.
- Files: `frontend/src/pages/ServiceDetailPage.tsx` (line 43)
- Trigger: Direct API call bypassing UI validation.
- Workaround: Backend silently accepts valid enum values; invalid strings trigger a 400 from Jackson deserialization.

## Security Considerations

**Unauthenticated WebSocket subscriptions expose queue and user data:**
- Risk: Any client can subscribe to `/topic/queues/{serviceId}` or `/topic/users/{userId}/tokens` and receive real-time token updates including user IDs and token status.
- Files: `backend/src/main/java/com/smartqueue/config/WebSocketConfig.java`, `backend/src/main/java/com/smartqueue/config/SecurityConfig.java`
- Current mitigation: None. Topic paths use UUIDs which provide obscurity only.
- Recommendations: Implement STOMP `ChannelInterceptor` with JWT validation on CONNECT; validate subscriptions against the authenticated user's ID server-side.

**Dev auth bypass with no profile guard:**
- Risk: `DEV_AUTH_ENABLED=true` in production allows unauthenticated impersonation of any user.
- Files: `backend/src/main/java/com/smartqueue/service/SupabaseAuthService.java`
- Current mitigation: Relies on operator discipline to not set the env var in production.
- Recommendations: Add Spring profile guard (`@Profile("!prod")`) or startup assertion.

**JWT stored in localStorage is XSS-accessible:**
- Risk: Stored app JWT token can be stolen via XSS.
- Files: `frontend/src/auth/AuthContext.tsx`
- Current mitigation: None beyond standard browser same-origin XSS protections.
- Recommendations: Use `httpOnly` session cookies; implement Content Security Policy headers on the frontend.

**Admin password reset on every startup if seed vars are set:**
- Risk: Seed env vars present in prod config will silently override any manually changed admin password on each restart.
- Files: `backend/src/main/java/com/smartqueue/config/AdminSeedRunner.java`
- Current mitigation: None.
- Recommendations: Only set password during initial creation; skip update if user already exists.

## Performance Bottlenecks

**N+1 queries in stats overview:**
- Problem: `StatsService.overview()` executes 1 query for all services then 1 session-existence query per service.
- Files: `backend/src/main/java/com/smartqueue/service/StatsService.java`
- Cause: Stream-based loop calling `sessions.existsByServiceIdAndStatus(...)` per service.
- Improvement path: Single aggregate query joining services and open sessions.

**N+1 queries in service listing (QueueMapper):**
- Problem: Each service in the list triggers 2–3 additional queries (session lookup, waiting count, serving token fetch).
- Files: `backend/src/main/java/com/smartqueue/service/QueueMapper.java`
- Cause: Per-entity method calls inside a stream map with no batch loading.
- Improvement path: JPQL JOIN FETCH with aggregation or a native SQL projection query.

**Blocking Supabase HTTP call per authenticated request:**
- Problem: Every user-auth API request blocks a thread waiting for Supabase network I/O with no timeout configured.
- Files: `backend/src/main/java/com/smartqueue/service/SupabaseAuthService.java`
- Cause: Synchronous `RestTemplate` with default (infinite) socket timeout and no caching.
- Improvement path: Token validation result cache (keyed by token hash, TTL 60s) + explicit connect/read timeouts.

**`recalculate()` does a full load and bulk update of all waiting tokens on every state change:**
- Problem: Every token action (call, complete, skip, cancel, recall, priority change) triggers `recalculate()`, which loads all WAITING tokens for the session and calls `tokens.saveAll(ordered)` to update position and estimated wait on all of them.
- Files: `backend/src/main/java/com/smartqueue/service/TokenService.java` (lines 98–107)
- Cause: Position snapshot stored on token rows rather than computed on read.
- Improvement path: Compute position and estimated wait at read time from the ordered list rather than persisting snapshots; or use a bulk UPDATE with a window function.

## Fragile Areas

**Token number uniqueness relies on application-level read-then-write under a transaction:**
- Files: `backend/src/main/java/com/smartqueue/service/TokenService.java` (lines 109–111)
- Why fragile: `@Transactional` does not prevent a race between two concurrent transactions both reading the same max token number before either commits. The unique constraint will catch duplicates but surfaces as an unhandled 500 to the caller.
- Safe modification: Serialize via DB sequence or advisory lock before changing this code.
- Test coverage: No concurrency test exists.

**`useQueueSocket` deactivates/reconnects on every re-render if `onMessage` identity changes:**
- Files: `frontend/src/hooks/useQueueSocket.ts`
- Why fragile: The dependency on the `onMessage` function reference makes reconnection behaviour sensitive to parent component render frequency.
- Safe modification: Always wrap `onMessage` in `useCallback` with stable deps at call sites, or fix internally with `useRef`.
- Test coverage: No hook-level test exists.

**`QueueMapper.service()` silently returns `estimatedWaitMinutes` as `int * int` (potential overflow for large queues):**
- Files: `backend/src/main/java/com/smartqueue/service/QueueMapper.java` (line 32)
- Why fragile: `(int) queueLength * service.getAverageServiceMinutes()` — `queueLength` is a `long` cast to `int` before multiplication, which overflows for queues larger than ~2 billion. Additionally, `int * int` multiplication overflows before widening.
- Safe modification: Cast to `long` before multiplying: `queueLength * (long) service.getAverageServiceMinutes()`.

## Scaling Limits

**In-memory STOMP broker (`enableSimpleBroker`) does not support multi-instance deployment:**
- Current capacity: Single JVM instance only.
- Limit: Running more than one backend instance causes WebSocket events to only reach clients connected to the instance that emitted the event.
- Scaling path: Replace `enableSimpleBroker` with an external message broker (RabbitMQ or Redis pub/sub via Spring's `StompBrokerRelay`).

**`recalculate()` writes N rows per queue event:**
- Current capacity: Acceptable for small queues (< 100 tokens).
- Limit: Queues with hundreds of concurrent waiting tokens will produce heavy write amplification on every state change.
- Scaling path: Compute position on-read rather than persisting snapshots.

## Dependencies at Risk

**`sockjs-client` in frontend:**
- Risk: SockJS is a legacy polling/WebSocket compatibility library that adds significant bundle weight and is no longer actively developed. Modern browsers universally support native WebSockets.
- Impact: Larger bundle; WebSocket connection negotiation overhead (HTTP upgrade with SockJS handshake).
- Migration plan: Switch to native `WebSocket` or the STOMP.js client's built-in WebSocket factory; remove SockJS from both frontend and `WebSocketConfig.registerStompEndpoints()`.

## Missing Critical Features

**No pagination on any list endpoint:**
- Problem: `TokenRepository.findByUserIdOrderByCreatedAtDesc()`, `findByQueueSessionIdOrderByCreatedAtAsc()`, and service listing all return unbounded lists.
- Blocks: Production deployment with heavy token history; `myTokens()` will grow without limit per user.

**No notification delivery mechanism:**
- Problem: The `notifications` table exists in the DB schema and `NotificationRepository` is scaffolded, but no code creates, reads, or delivers notifications to users. The feature is entirely unimplemented.
- Files: `backend/src/main/java/com/smartqueue/repository/NotificationRepository.java`, `backend/src/main/resources/db/migration/V1__init.sql` (lines 86–95)
- Blocks: Users cannot receive push/in-app alerts when their token is called.

**No rate limiting on token creation:**
- Problem: Users can call `/api/user/tokens` repeatedly (once per session after cancelling). No IP or user-level rate limiting is applied on any endpoint.
- Blocks: Spam/abuse protection in production.

## Test Coverage Gaps

**No integration or end-to-end tests:**
- What's not tested: Full HTTP request/response cycle; database interaction under real Flyway schema; WebSocket event delivery; authentication filter chain.
- Files: `backend/src/test/` — only two unit tests exist: `QueueOrderingTest.java`, `StatsServiceTest.java`
- Risk: Regressions in controller layer, security config, or DB queries go undetected.
- Priority: High

**No frontend tests beyond a single `ProtectedRoute.test.tsx`:**
- What's not tested: All page components, `useAsync`, `useQueueSocket`, `AuthContext`, API client error handling.
- Files: `frontend/src/routes/ProtectedRoute.test.tsx`
- Risk: UI regressions ship silently.
- Priority: High

**`StatsServiceTest` is likely broken (method signature mismatch):**
- What's not tested: The test as written does not compile against the current `TokenRepository` interface, meaning the `StatsService.overview()` null-average-guard is effectively untested.
- Files: `backend/src/test/java/com/smartqueue/service/StatsServiceTest.java`
- Risk: The null-guard for `averageWaitMinutes` could be incorrectly removed in a refactor with no test failure.
- Priority: Medium

**Concurrent token creation race condition is untested:**
- What's not tested: Two simultaneous requests to create a token in the same queue session.
- Files: `backend/src/main/java/com/smartqueue/service/TokenService.java`
- Risk: Constraint violation 500 error surfaces to users under concurrent load.
- Priority: High

---

*Concerns audit: 2026-06-15*
