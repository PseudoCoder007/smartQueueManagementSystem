# SmartQueue Management System PRD

## 1. Product Overview

SmartQueue Management System is a real-time virtual queue platform for organizations that want to reduce physical waiting lines, crowding, manual token handling, and uncertainty around waiting time.

The system lets an admin configure service queues for any business type, such as a tea cafe, hospital, bank, government office, college office, or service center. Users sign in, select an active service, generate a virtual token, and track their queue position live.

Phase 1 is a web application using React.js, Spring Boot, Supabase PostgreSQL, Hibernate/JPA, Supabase Auth (password, email OTP/magic link, Google OAuth) for user login, backend-managed admin accounts, JWT/role-based access, WebSockets for live updates, and Resend for transactional email. The frontend is responsive across desktop, tablet, and mobile breakpoints.

## 2. Product Goals

- Let users join queues remotely without standing in a physical line.
- Let admins configure service queues based on their organization.
- Show users live queue position, current serving token, and estimated waiting time.
- Give admins tools to call, skip, recall, complete, and prioritize tokens.
- Store queue history and statistics for reporting.
- Keep users informed by email at the moments that matter: account creation, sign-in, token creation, and the approach of their turn.
- Build a clean Phase 1 foundation that can later support native mobile apps, AI prediction, SMS/WhatsApp alerts, QR check-in, and advanced analytics.

## 3. Target Use Cases

The system is business-type agnostic. Admins decide what services exist.

- Tea cafe: Tea Counter, Coffee Counter, Snacks Pickup, Billing.
- Hospital: OPD Registration, Doctor Consultation, Pharmacy, Lab Test, Billing.
- Bank: Cash Deposit, Cash Withdrawal, Loan Desk, Customer Support.
- Government office: Citizen Service, Documents, Support Desk.
- College/university: Admissions, Examination Office, Registration, Fee Counter.
- Service center: Vehicle Service, Electronics Repair, Customer Support.

## 4. User Roles

### Guest

- Can view the app entry screen.
- Can start password, email OTP, or Google sign-in.
- Cannot generate tokens or access queue details until authenticated.

### User or Customer

- Signs in via password, email OTP/magic link, or Google OAuth (all through Supabase Auth).
- Can recover access via "forgot password" email reset.
- Can view active services.
- Can generate a virtual token for an active service.
- Can track own token status and queue position in real time.
- Can cancel own waiting token (rate-limited to discourage repeated cancel/rejoin abuse).
- Receives email at account creation, sign-in, token creation, and ~5 minutes before their turn.
- Cannot access admin features.

### Admin

- Created only from the backend through a protected seed/script/API flow.
- Cannot be created through public signup.
- Logs in using backend-managed credentials.
- Can create, rename, activate, deactivate, and manage services.
- Can open/close queues and control token flow.
- Can view queue statistics and history.

## 5. Phase 1 Technology Stack

- Frontend: React.js, TypeScript, Vite (responsive layout, dark theme)
- Backend: Spring Boot
- Database: Supabase PostgreSQL
- ORM: Hibernate/JPA
- User login: Supabase Auth — password, email OTP/magic link, Google OAuth
- Admin creation: backend-managed only
- Authorization: backend role checks with JWT/session validation
- Real-time updates: WebSockets
- Transactional email: Resend
- Deployment target: Vercel (frontend) on the `smart-queue.in` custom domain, cloud-hosted backend

## 6. MVP Modules

### Authentication And Authorization

Users authenticate through Supabase Auth, with three interchangeable methods: password (with signup + forgot-password recovery), email OTP/magic link, and Google OAuth. Whichever method is used, the frontend receives a Supabase session/access token and sends it to the Spring Boot backend for validation and application-user synchronization. Backend token validation is provider-agnostic, so adding further OAuth providers needs no backend changes — only Supabase dashboard configuration.

Admins are not created through Supabase public signup. Admin accounts must be created from the backend using a seed command, protected admin-only endpoint, or internal setup process. This prevents normal users from becoming admins.

Backend authorization must enforce role-based access for every protected API.

### Configurable Service Queues

A service queue is a configurable queue category. Admins create services based on the organization.

Each service has:

- Name
- Description
- Average service duration
- Active/inactive status
- Queue sessions
- Token history

Users only see active services. If a service has historical tokens, admins should deactivate it instead of hard deleting it.

### Virtual Token Generation

Users select an active service and generate a token. The system assigns a token number within the active queue session, calculates the user's position, estimates waiting time, sends real-time updates, and emails the user a confirmation with their token number and estimated wait.

### Real-Time Queue Tracking

WebSockets broadcast queue changes after token creation, admin actions, wait-time recalculation, and queue session changes. Users should not need to refresh the page.

### Admin Queue Control

Admins can:

- Open or close service queue sessions.
- Call the next token.
- Call a specific token.
- Mark tokens as serving, skipped, completed, cancelled, or recalled.
- Assign or update priority.
- View waiting, called, skipped, completed, and cancelled tokens.

### Estimated Waiting Time

Estimated wait time is calculated from the number of tokens ahead and the service's average service duration. It recalculates whenever queue state changes. When a token's estimated wait drops to 5 minutes or less, the user is emailed a one-time reminder to come and take their item or complete billing.

### Priority Queue Handling

Priority types include emergency, senior citizen, VIP, and admin-marked priority. Priority changes must be recorded with a reason and actor for audit.

### Queue History And Statistics

Admins can view total tokens, completed tokens, skipped tokens, active queues, average wait time, and service-wise performance.

### Transactional Email

Resend delivers branded, mobile-responsive HTML email for: welcome (first sign-in), sign-in notification (every later sign-in), token-created confirmation, and the 5-minute turn reminder. Sending is asynchronous and non-blocking; if no API key is configured, sends are skipped rather than failing requests. See [EMAIL_TEMPLATES.md](EMAIL_TEMPLATES.md).

## 7. Backend API Summary

Detailed API contracts are in [backend-api-list.md](backend-api-list.md).

Core groups:

- Auth APIs
- User service APIs
- User token APIs
- Admin service APIs
- Admin queue APIs
- Admin token APIs
- Statistics APIs
- WebSocket topics

## 8. Frontend Summary

Detailed frontend plan is in [frontend-plan.md](frontend-plan.md).

Required pages:

- Login (password / OTP / Google, signup, forgot password)
- Auth callback (OTP/magic-link/OAuth/verification landing)
- Reset password
- User dashboard
- Service selection
- Token live tracking
- My tokens/history
- Admin login
- Admin dashboard
- Admin service management
- Admin queue control
- Admin statistics

All pages are responsive down to mobile widths (breakpoints at 900px, 768px, 640px, and 480px).

## 9. Database Summary

Logical database model is in [database-model.md](database-model.md). SQL-level schema design is in [schema-design.md](schema-design.md).

Core tables:

- users
- services
- queue_sessions
- tokens (includes `five_min_reminder_sent_at` to guarantee a single reminder email per token)
- queue_events
- notifications

## 10. Phase 2 Roadmap

- Native mobile app
- AI/ML wait-time prediction
- SMS/WhatsApp alerts
- QR code check-in
- Geofencing
- Advanced analytics dashboard
- Docker and microservices deployment
- Push notifications through Firebase Cloud Messaging

## 11. Acceptance Criteria

- Users can sign in through password, email OTP/magic link, or Google OAuth.
- Users can recover a forgotten password by email.
- Backend validates user identity before allowing protected actions.
- Admin accounts cannot be created through public signup.
- Admin can configure service queues for different business types.
- Users see active services only.
- Users can generate virtual tokens.
- Users can track live queue position and estimated wait time.
- Admin can call, skip, complete, recall, and prioritize tokens.
- Queue changes are broadcast in real time.
- Users receive email at sign-up/sign-in, token creation, and ~5 minutes before their turn.
- Supabase PostgreSQL stores persistent data.
- Historical service/token data remains available after service deactivation.
- The frontend is usable on mobile-width screens.

## 12. Assumptions

- Supabase is used for PostgreSQL and user authentication (password, OTP, Google OAuth).
- Resend is used for transactional email delivery.
- Spring Boot owns business authorization and admin role enforcement.
- Admin accounts are created from backend-controlled flows only.
- Phase 1 is web-only; native mobile is Phase 2.
- Services are configurable for any organization type.
