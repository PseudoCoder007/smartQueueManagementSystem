# External Integrations

**Analysis Date:** 2026-06-15

## APIs & External Services

**Authentication (external identity):**
- Supabase Auth — OTP/magic-link login for regular users
  - SDK/Client (frontend): `@supabase/supabase-js` initialized in `frontend/src/auth/supabase.ts`
  - Auth (frontend): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - Auth (backend): `SUPABASE_URL`, `SUPABASE_ANON_KEY` (backend validates Supabase-issued sessions via sync endpoint)
  - Sync endpoint: `POST /api/auth/user/supabase-sync` — called after Supabase OTP verification to provision/sync user in local DB
  - Flow handled in: `frontend/src/pages/OtpCallbackPage.tsx`, `frontend/src/pages/LoginPage.tsx`

## Data Storage

**Databases:**
- PostgreSQL — primary relational store for all application data (queues, tokens, services, users)
  - Connection env var: `DATABASE_URL` (JDBC format, e.g. `jdbc:postgresql://localhost:5432/smartqueue`)
  - Credentials: `DATABASE_USERNAME`, `DATABASE_PASSWORD`
  - Client: Spring Data JPA / Hibernate (repositories at `backend/src/main/java/com/smartqueue/repository/`)
  - Schema managed by: Flyway (`backend/src/main/resources/db/migration/V1__init.sql`)
  - DDL strategy: `validate` (Hibernate validates against Flyway-managed schema)

**File Storage:**
- Not detected

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- Supabase Auth — handles OTP/magic-link flows for customer (user) role
  - Implementation: frontend calls Supabase SDK; on callback the frontend calls `POST /api/auth/user/supabase-sync` with the Supabase session; backend issues its own JWT
- Custom JWT (JJWT 0.12.6) — all API access uses backend-issued JWTs regardless of login method
  - Admin login: `POST /api/auth/admin/login` with email/password (BCrypt hashed, stored in local DB)
  - User login: via Supabase OTP then sync endpoint
  - JWT secret: `APP_JWT_SECRET` env var (min 32 chars)
  - JWT TTL: `APP_JWT_TTL_MINUTES` (default 720 minutes)
  - Filter: `backend/src/main/java/com/smartqueue/security/JwtAuthFilter.java`

**Password Hashing:**
- BCrypt via Spring Security `BCryptPasswordEncoder` — used for admin accounts only

## Real-time Communication

**WebSocket:**
- Spring WebSocket + STOMP broker — server pushes queue status updates to connected clients
  - Endpoint: `/ws` (SockJS-compatible)
  - Config: `backend/src/main/java/com/smartqueue/config/WebSocketConfig.java`
  - Client hook: `frontend/src/hooks/useQueueSocket.ts`
  - Client libs: `@stomp/stompjs` + `sockjs-client`
  - WS base URL env var: `VITE_WS_BASE_URL` (default: `http://localhost:8080/ws`)

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Spring Boot default logging (stdout); no structured logging framework detected

## CI/CD & Deployment

**Hosting:**
- Not determined — no Dockerfile, docker-compose, or cloud config files detected in repository root

**CI Pipeline:**
- None detected

## Environment Configuration

**Required backend env vars:**
- `DATABASE_URL` — PostgreSQL JDBC connection string
- `DATABASE_USERNAME` — DB user
- `DATABASE_PASSWORD` — DB password
- `APP_JWT_SECRET` — JWT signing key (32+ chars)
- `APP_JWT_TTL_MINUTES` — token lifetime in minutes
- `APP_CORS_ORIGINS` — comma-separated allowed frontend origins
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anon key
- `ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PASSWORD` — initial admin seed
- `DEV_AUTH_ENABLED` — set `true` to bypass JWT in development
- `PORT` — HTTP port (default 8080)

**Required frontend env vars:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_WS_BASE_URL`

**Secrets location:**
- Backend: `backend/.env` (git-ignored; loaded by Spring via `spring.config.import`)
- Frontend: `frontend/.env` (git-ignored; consumed by Vite at build time)

## Webhooks & Callbacks

**Incoming:**
- None detected (Supabase auth callback is a frontend-side redirect, not a server webhook)

**Outgoing:**
- None detected

---

*Integration audit: 2026-06-15*
