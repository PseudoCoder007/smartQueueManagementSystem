<!-- refreshed: 2026-06-15 -->
# Architecture

**Analysis Date:** 2026-06-15

## System Overview

```text
┌───────────────────────────────────────────────────────────────────────┐
│                          React SPA (frontend)                         │
│  Pages / Routes          Components          Auth / Hooks / API       │
│  `frontend/src/pages`    `frontend/src/      `frontend/src/auth`      │
│                          components`         `frontend/src/hooks`     │
└──────────┬──────────────────────────┬────────────────────┬───────────┘
           │  REST (HTTP/JSON)        │  STOMP/SockJS      │ Supabase OTP
           ▼                          ▼                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                  Spring Boot REST API (backend)                       │
│  Controllers          Services              Security                  │
│  `backend/.../        `backend/.../         `backend/.../             │
│   controller`          service`              security`                │
└──────────────────────────────┬────────────────────────────────────────┘
                               │ JPA / Hibernate
                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (via Supabase)                       │
│  Managed by Flyway migrations                                         │
│  `backend/src/main/resources/db/migration/V1__init.sql`              │
└───────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | Path |
|-----------|----------------|------|
| `AuthController` | User OTP sync + admin credential login | `backend/.../controller/AuthController.java` |
| `AdminQueueController` | Open/close queues, call/complete/skip tokens (admin) | `backend/.../controller/AdminQueueController.java` |
| `AdminServiceController` | CRUD for services, activate/deactivate | `backend/.../controller/AdminServiceController.java` |
| `UserTokenController` | Create, view, cancel tokens (user) | `backend/.../controller/UserTokenController.java` |
| `UserServiceController` | Browse public service list | `backend/.../controller/UserServiceController.java` |
| `StatsController` | Overview and daily analytics for admin | `backend/.../controller/StatsController.java` |
| `AdminQueueService` | Queue session lifecycle, token state transitions | `backend/.../service/AdminQueueService.java` |
| `TokenService` | Token creation, position recalc, user operations | `backend/.../service/TokenService.java` |
| `AuthService` | Supabase token exchange → app JWT; admin password login | `backend/.../service/AuthService.java` |
| `SupabaseAuthService` | Validates Supabase access tokens via REST call | `backend/.../service/SupabaseAuthService.java` |
| `QueueAuditService` | Appends immutable `QueueEvent` audit records | `backend/.../service/QueueAuditService.java` |
| `QueueEventPublisher` | Broadcasts STOMP messages to topic subscribers | `backend/.../websocket/QueueEventPublisher.java` |
| `JwtAuthFilter` | Per-request JWT parsing → Spring `SecurityContext` | `backend/.../security/JwtAuthFilter.java` |
| `AuthContext` | Frontend session store (token + profile in localStorage) | `frontend/src/auth/AuthContext.tsx` |
| `useQueueSocket` | STOMP/SockJS client hook with auto-reconnect | `frontend/src/hooks/useQueueSocket.ts` |
| `AppRoutes` | Role-based route guards (`USER` / `ADMIN`) | `frontend/src/routes/AppRoutes.tsx` |

## Pattern Overview

**Overall:** Layered monolith backend (Controller → Service → Repository → JPA Entity) paired with a single-page React frontend. Real-time queue updates are pushed via STOMP over SockJS WebSocket.

**Key Characteristics:**
- Backend is a classic Spring Boot layered architecture with no domain events or CQRS — state mutations and WebSocket broadcasts happen inline inside service methods.
- Frontend uses a thin API module (`frontend/src/api/`) that calls the Spring REST API directly. No Redux or server-state caching library; components call API functions via `useAsync`.
- Authentication is dual-path: regular users authenticate via Supabase OTP → backend exchanges for an app-issued JWT; admins use email/password directly against the backend.
- All real-time updates flow through two STOMP topic families: `/topic/queues/{serviceId}` (public queue changes) and `/topic/users/{userId}/tokens` (per-user token updates).

## Layers

**Controller layer:**
- Purpose: HTTP routing, request validation, response serialization
- Location: `backend/src/main/java/com/smartqueue/controller/`
- Contains: `@RestController` classes; one per functional area
- Depends on: Service layer, `CurrentUser` helper
- Used by: Frontend REST calls

**Service layer:**
- Purpose: All business logic, transaction management, audit recording, WebSocket publishing
- Location: `backend/src/main/java/com/smartqueue/service/`
- Contains: `@Service` beans, exception types (`BadRequestException`, `NotFoundException`, `ForbiddenException`), `QueueMapper`, `CurrentUser`
- Depends on: Repository layer, `QueueEventPublisher`, `JwtService`, `SupabaseAuthService`
- Used by: Controllers

**Repository layer:**
- Purpose: JPA data access
- Location: `backend/src/main/java/com/smartqueue/repository/`
- Contains: Spring Data JPA interfaces: `TokenRepository`, `QueueSessionRepository`, `ServiceQueueRepository`, `UserRepository`, `NotificationRepository`, `QueueEventRepository`
- Depends on: JPA entities in `domain/`
- Used by: Services

**Domain layer:**
- Purpose: JPA entity definitions and enumerations
- Location: `backend/src/main/java/com/smartqueue/domain/`
- Contains: `AppUser`, `Token`, `ServiceQueue`, `QueueSession`, `Notification`, `QueueEvent` entities; enums `UserRole`, `TokenStatus`, `QueueSessionStatus`, `ServiceStatus`, `PriorityType`, `QueueEventType`
- Depends on: Nothing application-specific
- Used by: Repositories, Services

**Security layer:**
- Purpose: JWT parsing filter, Spring Security configuration
- Location: `backend/src/main/java/com/smartqueue/security/`
- Contains: `JwtAuthFilter`, `JwtService`, `AppPrincipal`, `SecurityConfig`
- Depends on: Nothing from business domain
- Used by: Spring Security filter chain

**WebSocket layer:**
- Purpose: STOMP message broadcasting
- Location: `backend/src/main/java/com/smartqueue/websocket/`
- Contains: `QueueEventPublisher`
- Depends on: Spring `SimpMessagingTemplate`
- Used by: Service layer after each state mutation

**Frontend API layer:**
- Purpose: Typed wrappers around backend REST endpoints
- Location: `frontend/src/api/`
- Contains: `client.ts` (raw `fetch` wrapper + `ApiError`), `services.ts` (`userApi` and `adminApi` objects)
- Depends on: Browser `fetch`, env var `VITE_API_BASE_URL`
- Used by: Pages and hooks

**Frontend pages:**
- Purpose: Route-level UI views
- Location: `frontend/src/pages/`
- Contains: One file per page (12 pages); split by USER and ADMIN roles
- Depends on: `frontend/src/api/services.ts`, `AuthContext`, hooks

## Data Flow

### User joins a queue (primary happy path)

1. User logs in via Supabase OTP → `OtpCallbackPage` calls `POST /api/auth/sync` (`AuthController.java`)
2. `AuthService.syncSupabaseUser()` validates the Supabase token via `SupabaseAuthService`, upserts `AppUser`, returns app JWT
3. JWT stored in `localStorage` via `AuthContext.setUserSession()` (`frontend/src/auth/AuthContext.tsx`)
4. User browses to `ServiceDetailPage`, clicks "Join Queue" → `userApi.createToken()` calls `POST /api/tokens`
5. `TokenService.create()` validates service/session state, saves `Token`, recalculates positions, records audit event
6. `QueueEventPublisher.queueChanged()` sends `TOKEN_CREATED` to `/topic/queues/{serviceId}` and `/topic/admin/queues`; `userTokenChanged()` sends to `/topic/users/{userId}/tokens`
7. All subscribed STOMP clients (admin queue page, user token tracking page) receive the event and re-fetch state

### Admin calls next token

1. Admin clicks "Call Next" → `adminApi.next()` calls `POST /api/admin/queues/{serviceId}/next`
2. `AdminQueueService.callNext()` finds the highest-priority waiting token, sets status to `CALLED`, records audit, publishes `TOKEN_UPDATED`
3. Frontend subscribers receive STOMP event and refresh queue state UI

### WebSocket connection lifecycle

1. Page mounts, calls `useQueueSocket(topics, onMessage)` (`frontend/src/hooks/useQueueSocket.ts`)
2. STOMP client connects to `VITE_WS_BASE_URL/ws` via SockJS with 3-second reconnect delay
3. On connect, subscribes to all requested topics; any received frame triggers `onMessage` callback (typically a data refetch)
4. On unmount, client deactivated cleanly

**State Management:**
- No global frontend state store. Session persisted in `localStorage` via `AuthContext`. All other data is fetched on demand per page/component using the `useAsync` hook (`frontend/src/hooks/useAsync.ts`). WebSocket events trigger refetch rather than direct state updates.

## Key Abstractions

**`QueueSession`:**
- Purpose: Represents a single open/closed lifecycle of a service's queue (one per day typically)
- Examples: `backend/src/main/java/com/smartqueue/domain/QueueSession.java`, `QueueSessionRepository.java`
- Pattern: A `ServiceQueue` has many `QueueSession`s; tokens belong to a session

**`Token`:**
- Purpose: A user's place in a queue session, with lifecycle status and priority
- Examples: `backend/src/main/java/com/smartqueue/domain/Token.java`
- Pattern: Stateful entity transitioned through `WAITING → CALLED → SERVING → COMPLETED` (or `SKIPPED`, `CANCELLED`)

**`QueueEventPublisher`:**
- Purpose: Single point for all WebSocket broadcasts; decouples service logic from messaging details
- Examples: `backend/src/main/java/com/smartqueue/websocket/QueueEventPublisher.java`
- Pattern: Called at end of every state-mutating service method

**`QueueAuditService`:**
- Purpose: Append-only event log for all queue state changes
- Pattern: `QueueEvent` records written but never mutated; provides audit trail

**`CurrentUser`:**
- Purpose: Resolves the authenticated `AppUser` from the Spring `SecurityContext` within a request
- Location: `backend/src/main/java/com/smartqueue/service/CurrentUser.java`
- Pattern: Injected into controllers; calls `requireUser()` to enforce authentication

**`ProtectedRoute`:**
- Purpose: React route guard enforcing role-based access
- Location: `frontend/src/routes/ProtectedRoute.tsx`
- Pattern: Wraps `<Outlet />` and redirects unauthenticated/unauthorized users to login

## Entry Points

**Backend application:**
- Location: `backend/src/main/java/com/smartqueue/` (Spring Boot `@SpringBootApplication` main class, look for `*Application.java`)
- Triggers: JVM startup; Spring Boot embeds Tomcat
- Responsibilities: Bootstraps Spring context, registers filters, starts WebSocket broker

**Frontend application:**
- Location: `frontend/src/` (Vite entry — `frontend/index.html` + `src/main.tsx` or similar)
- Triggers: Browser navigation to app URL
- Responsibilities: Mounts React app, wraps with `AuthProvider` and `BrowserRouter`, renders `AppRoutes`

**Database migrations:**
- Location: `backend/src/main/resources/db/migration/V1__init.sql`
- Triggers: Flyway on application startup
- Responsibilities: Creates all tables, enums, and seed data

**Admin seed:**
- Location: `backend/src/main/java/com/smartqueue/config/AdminSeedRunner.java`
- Triggers: `ApplicationRunner` on first startup
- Responsibilities: Creates default admin account if none exists

## Architectural Constraints

- **Threading:** Spring Boot default (multi-threaded Tomcat). Each HTTP request runs in its own thread. WebSocket STOMP broker is in-memory (simple broker — not scalable beyond single node).
- **Global state:** `SupabaseAuthService` holds a `RestTemplate` instance as a field (effectively a singleton). All Spring beans are singletons by default.
- **Circular imports:** `AdminQueueService` depends on `TokenService`; `TokenService` depends on `ServiceQueueService`. No detected circular Spring beans, but coupling is high within the service layer.
- **In-memory broker:** `/topic` WebSocket broker is Spring's simple in-memory broker. Horizontal scaling (multiple backend instances) would break real-time delivery — requires upgrading to an external broker (e.g., RabbitMQ/Redis).
- **Supabase dependency at auth time:** Every new user session hits Supabase's REST API synchronously. If Supabase is unavailable, user login fails completely.

## Anti-Patterns

### WebSocket publishing inside @Transactional methods

**What happens:** `QueueEventPublisher.queueChanged()` is called inside `@Transactional` service methods before the transaction commits (e.g., `TokenService.create()` line 56, `AdminQueueService.open()` line 47).
**Why it's wrong:** Clients receive the WebSocket event and fetch updated data before the database transaction has committed, causing them to see stale state.
**Do this instead:** Use `TransactionSynchronizationManager.registerSynchronization()` to publish after the transaction commits, or use Spring's `@TransactionalEventListener`.

### Inline state recalculation on every token mutation

**What happens:** `TokenService` calls `recalculate(session)` on every create/cancel to recompute all token positions and wait times.
**Why it's wrong:** Under load (many concurrent tokens), this triggers a full table scan per mutation, which degrades linearly with queue length.
**Do this instead:** Compute position on read (query-time calculation) or use a background scheduled recalculation.

## Error Handling

**Strategy:** Custom unchecked exceptions mapped to HTTP status codes via `ApiExceptionHandler`.

**Patterns:**
- `BadRequestException` → 400 (`backend/.../service/BadRequestException.java`)
- `ForbiddenException` → 403 (`backend/.../service/ForbiddenException.java`)
- `NotFoundException` → 404 (`backend/.../service/NotFoundException.java`)
- Handler class: `backend/.../controller/ApiExceptionHandler.java`
- Frontend: `ApiError` class in `frontend/src/api/client.ts` captures HTTP status and message body

## Cross-Cutting Concerns

**Logging:** Standard Spring Boot logging (SLF4J/Logback). No structured logging or correlation IDs observed.
**Validation:** Jakarta Bean Validation (`@Valid`) on controller request bodies.
**Authentication:** JWT filter on every request (`JwtAuthFilter`); Supabase OTP + password login both produce app-issued JWTs with identical format.

---

*Architecture analysis: 2026-06-15*
