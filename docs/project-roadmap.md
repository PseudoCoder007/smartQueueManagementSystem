# Project Roadmap

## Phase 0: Documentation

1. Create `PRD.md`.
2. Create `docs/features.md`.
3. Create `docs/backend-api-list.md`.
4. Create `docs/frontend-plan.md`.
5. Create `docs/database-model.md`.
6. Create `docs/schema-design.md`.
7. Create `docs/project-roadmap.md`.

## Phase 1: Backend Foundation

1. Scaffold Spring Boot backend.
2. Add dependencies:
   - Spring Web
   - Spring Security
   - Spring Data JPA
   - PostgreSQL driver
   - WebSocket support
   - Validation
   - JWT support for backend/admin session if used
3. Configure Supabase PostgreSQL JDBC connection.
4. Implement schema migrations or initialization.
5. Implement JPA entities and repositories.

## Phase 2: Authentication And Authorization

1. Configure Supabase project for Email OTP login.
2. Build frontend user OTP login flow.
3. Add backend endpoint to validate Supabase user token and sync local user.
4. Ensure synced public users always receive `USER` role.
5. Add backend-managed admin creation.
6. Add admin login flow.
7. Add role-based backend route protection.

## Phase 3: Service Queue Management

1. Implement admin service creation.
2. Implement service rename/edit.
3. Implement activate/deactivate.
4. Implement user service listing for active services only.
5. Add service average duration for wait-time calculation.

## Phase 4: Queue Sessions And Tokens

1. Implement open/close queue session.
2. Implement token generation.
3. Implement token numbering per queue session.
4. Prevent duplicate active tokens per user/session.
5. Calculate queue position.
6. Calculate estimated wait time.

## Phase 5: Admin Queue Controls

1. Implement call next.
2. Implement call specific token.
3. Implement complete token.
4. Implement skip token.
5. Implement recall token.
6. Implement priority update.
7. Record all important actions in queue events.

## Phase 6: WebSockets

1. Configure backend WebSocket endpoint.
2. Broadcast service queue updates.
3. Broadcast private user token updates.
4. Broadcast admin dashboard updates.
5. Connect frontend WebSocket subscriptions.
6. Handle reconnect and disconnected states.

## Phase 7: Frontend Build

1. Scaffold React frontend.
2. Add routing.
3. Add Supabase client.
4. Build user OTP login and callback pages.
5. Build admin login page.
6. Build protected route wrappers.
7. Build user dashboard.
8. Build service list/detail pages.
9. Build token live tracking.
10. Build admin dashboard.
11. Build admin service management.
12. Build admin queue control.
13. Build admin statistics.

## Phase 8: Integration

1. Connect frontend to backend REST APIs.
2. Connect frontend to WebSocket topics.
3. Verify user role access.
4. Verify admin role access.
5. Verify service queue changes update user screens.
6. Verify queue actions update all connected clients.

## Phase 9: Testing

1. Test Supabase OTP user login.
2. Test backend user sync.
3. Test admin creation and login.
4. Test service creation, edit, activation, and deactivation.
5. Test token generation.
6. Test queue ordering and priority.
7. Test call, skip, recall, complete, and cancel.
8. Test WebSocket updates with multiple clients.
9. Test security restrictions.
10. Test statistics calculations.

## Phase 10: Phase 2 Enhancements

Future features:

- Mobile app
- AI/ML wait-time prediction
- SMS/WhatsApp alerts
- QR code check-in
- Geofencing
- Advanced analytics dashboard
- Docker/microservices deployment
- Push notifications
