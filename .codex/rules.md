# SmartQueue Engineering Rules

## Modularity

- Keep files under 300 lines when practical and never above 400 lines unless explicitly justified.
- Use clear backend layers: controllers, services, repositories, DTOs, config, security, websocket, and domain models.
- Put business logic in service classes, not controllers or React components.
- Create helper functions when logic is reused, complex, or improves readability.
- Keep React pages screen-focused; move reusable UI into components and shared behavior into hooks.

## API And Data Safety

- Use DTOs for API input and output; never expose JPA entities directly.
- Validate all external input on the backend and validate forms on the frontend.
- Keep frontend TypeScript types aligned with backend DTOs.
- Return predictable errors without exposing secrets, stack traces, tokens, or password hashes.
- Do not hard-delete services with queue history; deactivate them instead.

## Security

- Enforce role checks on every protected backend route.
- Public Supabase user sync must always create or update `USER` accounts only.
- Admin accounts are backend-managed only through the seed command.
- Hash admin passwords with BCrypt.
- Store secrets only in environment variables or ignored local config files.
- Do not log JWTs, Supabase tokens, passwords, or OTP values.

## Queue Integrity

- Use Flyway migrations for schema changes; do not rely on Hibernate auto-DDL in production.
- Preserve one open queue session per service.
- Preserve one active token per user per queue session.
- Record important queue, token, priority, and admin actions in `queue_events`.
- Emit WebSocket events only after successful queue-changing transactions.
- Existing serving tokens must not be interrupted by priority updates.

## Reliability And UX

- Every page that loads data must support loading, empty, error, unauthorized/forbidden, mutation progress, and WebSocket disconnected states.
- Backend mutations should be transactional where queue state changes.
- Frontend mutations should disable repeated submit/action buttons while pending.
- Add tests for queue ordering, auth restrictions, token lifecycle, and priority handling.
- Prefer small, focused tests for business rules before broad end-to-end coverage.
