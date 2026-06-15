# Codebase Structure

**Analysis Date:** 2026-06-15

## Directory Layout

```
smartQueueManagementSystem/
├── backend/                          # Spring Boot REST API
│   └── src/
│       ├── main/
│       │   ├── java/com/smartqueue/
│       │   │   ├── config/           # Spring config beans (WebSocket, Security seed)
│       │   │   ├── controller/       # @RestController classes
│       │   │   ├── domain/           # JPA entity classes and enums
│       │   │   ├── dto/              # Request/response record types
│       │   │   ├── repository/       # Spring Data JPA interfaces
│       │   │   ├── security/         # JWT filter, JwtService, AppPrincipal, SecurityConfig
│       │   │   ├── service/          # Business logic @Service beans + exceptions
│       │   │   └── websocket/        # STOMP publisher
│       │   └── resources/
│       │       ├── application.yml   # App config (DB, Supabase, JWT, dev flags)
│       │       └── db/migration/
│       │           └── V1__init.sql  # Flyway schema + enum definitions
│       └── test/
│           └── java/com/smartqueue/
│               └── service/          # Unit tests for service layer
├── frontend/                         # React + Vite SPA
│   ├── index.html                    # Vite HTML entry point
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts             # Raw fetch wrapper, ApiError class
│   │   │   └── services.ts           # Typed userApi and adminApi objects
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx       # Session provider (token + user profile)
│   │   │   └── supabase.ts           # Supabase JS client initialisation
│   │   ├── components/
│   │   │   ├── AppLayout.tsx         # Sidebar shell (shared by user + admin)
│   │   │   ├── ErrorBoundary.tsx     # React error boundary
│   │   │   ├── State.tsx             # Loading/error/empty state UI primitives
│   │   │   └── TokenList.tsx         # Reusable token list component
│   │   ├── hooks/
│   │   │   ├── useAsync.ts           # Generic async data fetch hook
│   │   │   └── useQueueSocket.ts     # STOMP/SockJS WebSocket hook
│   │   ├── pages/
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── AdminLoginPage.tsx
│   │   │   ├── AdminQueuePage.tsx
│   │   │   ├── AdminServicesPage.tsx
│   │   │   ├── AdminStatsPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── MyTokensPage.tsx
│   │   │   ├── OtpCallbackPage.tsx
│   │   │   ├── ServiceDetailPage.tsx
│   │   │   ├── ServicesPage.tsx
│   │   │   ├── TokenTrackingPage.tsx
│   │   │   └── UserDashboardPage.tsx
│   │   ├── routes/
│   │   │   ├── AppRoutes.tsx         # All route definitions + role guards
│   │   │   ├── ProtectedRoute.tsx    # Role-checking Outlet wrapper
│   │   │   └── ProtectedRoute.test.tsx
│   │   ├── styles.css                # Global stylesheet
│   │   └── types/
│   │       └── models.ts             # Shared TypeScript types (mirror of backend DTOs)
│   └── .agents/skills/               # GSD skill definitions (Supabase patterns)
├── docs/                             # Project report output
├── PRD.md                            # Product requirements document
└── README.md
```

## Directory Purposes

**`backend/src/main/java/com/smartqueue/controller/`:**
- Purpose: HTTP entry points; one controller per feature area
- Contains: `AdminQueueController`, `AdminServiceController`, `AuthController`, `StatsController`, `UserServiceController`, `UserTokenController`, `ApiExceptionHandler`
- Key files: `AdminQueueController.java` (queue lifecycle), `UserTokenController.java` (user token operations)

**`backend/src/main/java/com/smartqueue/service/`:**
- Purpose: All business logic and transaction boundaries
- Contains: Core services, helper services, domain-scoped exceptions, `QueueMapper`, `CurrentUser`
- Key files: `TokenService.java`, `AdminQueueService.java`, `AuthService.java`, `SupabaseAuthService.java`, `QueueAuditService.java`

**`backend/src/main/java/com/smartqueue/domain/`:**
- Purpose: JPA entity definitions and associated enums
- Contains: Entities: `AppUser`, `Token`, `ServiceQueue`, `QueueSession`, `Notification`, `QueueEvent`; Enums: `UserRole`, `TokenStatus`, `QueueSessionStatus`, `ServiceStatus`, `PriorityType`, `QueueEventType`

**`backend/src/main/java/com/smartqueue/dto/`:**
- Purpose: Request/response types (Java records) grouped by feature
- Contains: `AuthDtos.java`, `QueueDtos.java`, `ServiceDtos.java`, `StatsDtos.java`, `TokenDtos.java`
- Pattern: All DTOs for a feature area in one file as nested records

**`backend/src/main/java/com/smartqueue/repository/`:**
- Purpose: Data access interfaces; Spring Data JPA
- Contains: `TokenRepository`, `QueueSessionRepository`, `ServiceQueueRepository`, `UserRepository`, `NotificationRepository`, `QueueEventRepository`

**`backend/src/main/java/com/smartqueue/security/`:**
- Purpose: JWT infrastructure and Spring Security wiring
- Contains: `JwtAuthFilter`, `JwtService`, `AppPrincipal`, `SecurityConfig`

**`backend/src/main/java/com/smartqueue/websocket/`:**
- Purpose: STOMP message broadcasting
- Contains: `QueueEventPublisher`

**`backend/src/main/resources/db/migration/`:**
- Purpose: Flyway-managed database migrations
- Contains: `V1__init.sql` — full schema, PostgreSQL enum types, initial structure
- Pattern: Versioned files `V{n}__{description}.sql`

**`frontend/src/api/`:**
- Purpose: All backend communication; typed fetch wrappers
- Contains: `client.ts` (low-level), `services.ts` (feature-level `userApi`/`adminApi`)
- Pattern: Consumers import from `services.ts`, never call `fetch` directly

**`frontend/src/auth/`:**
- Purpose: Session management and Supabase client
- Contains: `AuthContext.tsx` (React context + provider), `supabase.ts` (Supabase JS client)

**`frontend/src/components/`:**
- Purpose: Shared UI building blocks used across pages
- Contains: Layout shell (`AppLayout`), primitives (`State`, `TokenList`), error boundary

**`frontend/src/hooks/`:**
- Purpose: Reusable React hooks
- Contains: `useAsync.ts` (data fetching state), `useQueueSocket.ts` (WebSocket subscription)

**`frontend/src/pages/`:**
- Purpose: One file per application route; full-page views
- Contains: 12 pages split by user role prefix (`Admin*` vs non-prefixed)

**`frontend/src/routes/`:**
- Purpose: Routing configuration and access control
- Contains: `AppRoutes.tsx` (all routes), `ProtectedRoute.tsx` (role guard)

**`frontend/src/types/`:**
- Purpose: TypeScript interfaces mirroring backend DTOs
- Contains: `models.ts` — single file with all shared types

## Key File Locations

**Backend entry point:**
- Look for `*Application.java` in `backend/src/main/java/com/smartqueue/`

**Backend configuration:**
- `backend/src/main/resources/application.yml` — database URL, Supabase credentials, JWT secret, dev-auth flag

**Database schema:**
- `backend/src/main/resources/db/migration/V1__init.sql`

**Frontend entry point:**
- `frontend/index.html` — Vite HTML shell
- `frontend/src/` — application root (main component file expected here)

**Route definitions:**
- `frontend/src/routes/AppRoutes.tsx`

**All API calls:**
- `frontend/src/api/services.ts` — `userApi` and `adminApi` objects
- `frontend/src/api/client.ts` — raw HTTP wrapper

**Auth session:**
- `frontend/src/auth/AuthContext.tsx`

**Real-time updates:**
- `frontend/src/hooks/useQueueSocket.ts`
- `backend/src/main/java/com/smartqueue/websocket/QueueEventPublisher.java`

## Naming Conventions

**Backend files:**
- Entities: `PascalCase.java` matching the domain concept (`AppUser`, `QueueSession`)
- Controllers: `{Feature}Controller.java` or `Admin{Feature}Controller.java`
- Services: `{Feature}Service.java`
- Repositories: `{Entity}Repository.java`
- DTOs: `{Feature}Dtos.java` — all DTOs for a feature in one file as inner records

**Frontend files:**
- Pages: `{Name}Page.tsx` in `src/pages/`
- Components: `PascalCase.tsx` in `src/components/`
- Hooks: `use{Name}.ts` in `src/hooks/`
- API modules: lowercase `client.ts`, `services.ts`
- Types: `models.ts` in `src/types/`

**Directories:**
- Backend: lowercase package names (`controller`, `service`, `domain`)
- Frontend: camelCase (`src/api`, `src/auth`, `src/hooks`, `src/pages`, `src/routes`, `src/types`, `src/components`)

## Where to Add New Code

**New backend feature area (controller + service):**
- Controller: `backend/src/main/java/com/smartqueue/controller/{Feature}Controller.java`
- Service: `backend/src/main/java/com/smartqueue/service/{Feature}Service.java`
- DTOs: Add nested records to `backend/src/main/java/com/smartqueue/dto/{Feature}Dtos.java` (create file if new feature area)

**New domain entity:**
- Entity: `backend/src/main/java/com/smartqueue/domain/{Entity}.java`
- Repository: `backend/src/main/java/com/smartqueue/repository/{Entity}Repository.java`
- Schema change: New migration file `backend/src/main/resources/db/migration/V{n}__{description}.sql`

**New frontend page:**
- Page component: `frontend/src/pages/{Name}Page.tsx`
- Register route in: `frontend/src/routes/AppRoutes.tsx`
- Protect with `ProtectedRoute` if authentication required

**New API call:**
- Add method to `userApi` or `adminApi` in `frontend/src/api/services.ts`
- Add corresponding TypeScript type to `frontend/src/types/models.ts` if new shape

**New reusable component:**
- `frontend/src/components/{ComponentName}.tsx`

**New custom hook:**
- `frontend/src/hooks/use{Name}.ts`

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD codebase map documents (this file and siblings)
- Generated: Yes (by GSD mapper agent)
- Committed: Yes

**`frontend/.agents/skills/`:**
- Purpose: GSD skill definitions for Supabase and Postgres best practices
- Generated: No (project configuration)
- Committed: Yes

**`backend/target/`:**
- Purpose: Maven build output
- Generated: Yes
- Committed: No (in .gitignore)

**`frontend/node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-06-15*
