# Coding Conventions

**Analysis Date:** 2026-06-15

## Naming Patterns

**Files (Backend):**
- Classes use PascalCase matching the type: `TokenService.java`, `AdminQueueController.java`
- DTOs grouped in container classes per domain: `TokenDtos.java`, `QueueDtos.java`, `ServiceDtos.java`
- Exceptions named by HTTP meaning: `BadRequestException.java`, `NotFoundException.java`, `ForbiddenException.java`

**Files (Frontend):**
- React page components use PascalCase with `Page` suffix: `AdminServicesPage.tsx`, `ServiceDetailPage.tsx`
- Hooks prefixed with `use`: `useAsync.ts`, `useQueueSocket.ts`
- API modules named by layer: `client.ts` (raw fetch), `services.ts` (domain methods)
- Type definitions in `models.ts`

**Classes & Interfaces:**
- Java: PascalCase for all classes, `@Service`, `@RestController`, `@RestControllerAdvice` annotations declare role
- TypeScript: `interface` for object shapes (`UserProfile`, `ServiceQueue`), `type` for unions (`UserRole`, `TokenStatus`, `ServiceStatus`)

**Functions & Methods:**
- Java: camelCase; method names describe actions: `callNext`, `callSpecific`, `priority`, `recalculate`
- TypeScript: camelCase; handlers prefixed with action verb: `submit`, `toggle`, `toggleQueue`

**Variables:**
- Java: camelCase; repository fields named by entity (plural): `tokens`, `services`, `sessions`
- TypeScript: camelCase; state follows `[noun, setNoun]` React convention

**Constants:**
- Java: UPPER_SNAKE_CASE: `ACTIVE` (`List<TokenStatus>`)
- TypeScript: string literal union values use UPPER_SNAKE_CASE: `'WAITING'`, `'SENIOR_CITIZEN'`

## Code Style

**Formatting (Backend):**
- No formatter config file detected; code uses 2-space indentation consistently
- One-liner getters/setters on single lines in entity classes (see `Token.java`)
- Compact stream pipelines kept on one line where readable

**Formatting (Frontend):**
- No `.prettierrc` or `eslint.config.*` detected
- TypeScript 5.6 with strict mode via `tsconfig.json`
- Inline arrow functions for simple event handlers: `e => setForm({ ...form, name: e.target.value })`

## Import Organization

**Backend (Java):**
1. Package declaration
2. Domain/DTO/repository imports from `com.smartqueue.*`
3. Jakarta EE imports (`jakarta.validation.*`, `jakarta.persistence.*`)
4. Java standard library (`java.time.*`, `java.util.*`)
5. Spring imports (`org.springframework.*`)

**Frontend (TypeScript):**
1. React and third-party library imports
2. Internal API imports (`../api/services`, `../api/client`)
3. Auth imports (`../auth/AuthContext`)
4. Component imports (`../components/State`)
5. Hook imports (`../hooks/useAsync`)
6. Type imports (`../types/models`) — use `import type` for pure types

**Path Aliases:**
- None configured; all imports use relative paths

## Error Handling

**Backend:**
- Custom exception classes in `backend/src/main/java/com/smartqueue/service/` annotated with `@ResponseStatus`:
  - `BadRequestException` → HTTP 400
  - `NotFoundException` → HTTP 404
  - `ForbiddenException` → HTTP 403
- `ApiExceptionHandler` (`controller/ApiExceptionHandler.java`) catches `MethodArgumentNotValidException`, `ConstraintViolationException`, and any `@ResponseStatus`-annotated `RuntimeException` and serialises `{ "message": "..." }` JSON
- Unknown `RuntimeException` (no `@ResponseStatus`) is re-thrown, reaching Spring's default handler
- Pattern: throw domain exception at service layer, never return `null` success on failure

**Frontend:**
- `ApiError` class (`src/api/client.ts`) wraps HTTP error status + extracted `message`/`error`/`code` JSON field
- `useAsync` hook catches all errors and converts to `string | null` via `err instanceof Error ? err.message : 'Something went wrong'`
- Pages render `<ErrorState message={error} />` when `useAsync` returns an error string
- Catch blocks in form handlers use bare `try/finally` (no error display) where the action is fire-and-forget after reload

## Logging

**Framework:** None — no logging framework calls observed in source
**Patterns:** Errors surface to the user via HTTP responses and `ApiError`; no `console.log` or `logger.info` calls detected in the project source

## Comments

**When to Comment:**
- Inline comments explain non-obvious intent, not what the code does
- Examples: `// Non-JSON responses are still valid error payloads.` in `client.ts`; `// Ignore old or malformed sessions so the app can render the login page.` in `AuthContext.tsx`
- JavaDoc not used; comments are prose sentences in English

**JSDoc/TSDoc:**
- Not used in this codebase

## Function Design

**Size:** Services methods are short (10–30 lines); `TokenService.create` is the longest at ~25 lines
**Parameters:** Services receive domain objects (`AppUser`, entity IDs as `UUID`) not raw primitives; frontend API functions receive typed primitives
**Return Values:** Service methods return DTOs (Java records) or `void`; frontend API functions return typed `Promise<T>`

## Module Design

**Backend:**
- DTOs are `final` utility classes with a private constructor, containing only `record` definitions (see `TokenDtos.java`)
- Repositories extend Spring Data JPA interfaces; custom queries declared as method signatures
- Services are `@Service` beans injected via constructor (no field/setter injection)
- Controllers are thin — delegate entirely to service, resolve current user via `CurrentUser` component

**Frontend Exports:**
- One named export per file for components and hooks
- API modules export plain objects (`userApi`, `adminApi`) grouping related fetch calls
- No barrel/index files; direct relative imports used throughout

---

*Convention analysis: 2026-06-15*
