# Technology Stack

**Analysis Date:** 2026-06-15

## Languages

**Primary:**
- Java 21 - Backend (Spring Boot application at `backend/`)
- TypeScript 5.6 - Frontend (React SPA at `frontend/`)

**Secondary:**
- SQL - Database migrations via Flyway (`backend/src/main/resources/db/migration/`)

## Runtime

**Environment:**
- JVM (Java 21) — backend
- Node.js (via Vite dev server) — frontend development

**Package Manager:**
- Maven — backend (wrapper: `backend/pom.xml`)
- npm — frontend (`frontend/package.json`)
- Lockfile: `frontend/package-lock.json` expected; Maven uses `pom.xml` as lock equivalent

## Frameworks

**Core:**
- Spring Boot 3.3.5 — REST API, dependency injection, lifecycle management
- React 18.3 — frontend UI component tree
- React Router DOM 6.28 — client-side routing (`frontend/src/`)

**Security:**
- Spring Security — stateless JWT-based auth filter chain (`backend/src/main/java/com/smartqueue/config/SecurityConfig.java`)
- JJWT 0.12.6 — JWT creation and validation (`backend/src/main/java/com/smartqueue/security/`)

**Database ORM:**
- Spring Data JPA / Hibernate — entity persistence (`backend/src/main/java/com/smartqueue/repository/`)
- Flyway — schema migrations (`backend/src/main/resources/db/migration/V1__init.sql`)

**Real-time:**
- Spring WebSocket + STOMP — server-side WebSocket broker (`backend/src/main/java/com/smartqueue/config/WebSocketConfig.java`)
- @stomp/stompjs 7.0 + SockJS 1.6 — client-side WebSocket consumer (`frontend/src/hooks/useQueueSocket.ts`)

**Testing:**
- Spring Boot Test + Spring Security Test — backend integration tests
- H2 (in-memory) — backend test database
- Vitest 2.1 + @testing-library/react 15 — frontend unit/component tests

**Build/Dev:**
- Vite 5.4 — frontend dev server and production bundler (`frontend/vite.config.ts`)
- spring-boot-maven-plugin — backend JAR packaging

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.45 — user authentication (OTP/magic link) on the frontend (`frontend/src/auth/supabase.ts`)
- `spring-boot-starter-websocket` — real-time queue status push
- `spring-boot-starter-security` + JJWT — stateless JWT auth for all `/api/**` routes
- `spring-boot-starter-data-jpa` + `postgresql` — primary data persistence

**Infrastructure:**
- `org.postgresql:postgresql` — JDBC driver for PostgreSQL (runtime scope)
- `org.flywaydb:flyway-database-postgresql` — automated schema evolution
- `react-hot-toast` 2.6 — user-facing toast notifications (`frontend/src/`)
- `lucide-react` 0.468 — icon library

## Configuration

**Environment:**
- Backend reads from `.env` file (via `spring.config.import: optional:file:.env[.properties]`) and system env vars
- Frontend reads from `.env` file via Vite (`VITE_` prefix required for exposure to browser)

**Key backend env vars required:**
- `DATABASE_URL` — PostgreSQL JDBC URL (default: `jdbc:postgresql://localhost:5432/smartqueue`)
- `DATABASE_USERNAME` / `DATABASE_PASSWORD` — DB credentials
- `APP_JWT_SECRET` — JWT signing secret (min 32 chars)
- `APP_JWT_TTL_MINUTES` — JWT expiry (default: 720)
- `APP_CORS_ORIGINS` — comma-separated allowed origins (default: `http://localhost:5173`)
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — Supabase project config
- `ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PASSWORD` — seed admin account
- `DEV_AUTH_ENABLED` — bypass auth in development (default: false)
- `PORT` — server port (default: 8080)

**Key frontend env vars required:**
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
- `VITE_WS_BASE_URL` — WebSocket endpoint (default: `http://localhost:8080/ws`)

**Build:**
- `frontend/vite.config.ts` — Vite build config; sets `global: 'globalThis'` for SockJS compatibility
- `frontend/tsconfig.json` — TypeScript compiler options
- `backend/pom.xml` — Maven build descriptor, Java 21 target

## Platform Requirements

**Development:**
- Java 21+
- Node.js (LTS recommended)
- PostgreSQL 14+ running locally on port 5432
- npm for frontend dependency management

**Production:**
- JVM runtime (Java 21) for backend JAR
- Static file hosting for frontend build output (`frontend/dist/`)
- PostgreSQL database instance
- Supabase project (for OTP auth)

---

*Stack analysis: 2026-06-15*
