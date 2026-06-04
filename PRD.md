# SmartQueue Management System PRD

## 1. Product Overview

SmartQueue Management System is a real-time virtual queue platform for organizations that want to reduce physical waiting lines, crowding, manual token handling, and uncertainty around waiting time.

The system lets an admin configure service queues for any business type, such as a tea cafe, hospital, bank, government office, college office, or service center. Users log in, select an active service, generate a virtual token, and track their queue position live.

Phase 1 is a web application using React.js, Spring Boot, Supabase PostgreSQL, Hibernate/JPA, Supabase Email OTP for user login, backend-managed admin accounts, JWT/role-based access, and WebSockets.

## 2. Product Goals

- Let users join queues remotely without standing in a physical line.
- Let admins configure service queues based on their organization.
- Show users live queue position, current serving token, and estimated waiting time.
- Give admins tools to call, skip, recall, complete, and prioritize tokens.
- Store queue history and statistics for reporting.
- Build a clean Phase 1 foundation that can later support mobile apps, AI prediction, SMS/WhatsApp alerts, QR check-in, and advanced analytics.

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
- Can start email OTP login.
- Cannot generate tokens or access queue details until authenticated.

### User or Customer

- Logs in through Supabase Email OTP.
- Can view active services.
- Can generate a virtual token for an active service.
- Can track own token status and queue position.
- Can cancel own waiting token.
- Cannot access admin features.

### Admin

- Created only from the backend through a protected seed/script/API flow.
- Cannot be created through public signup.
- Logs in using backend-managed credentials or a protected admin auth flow.
- Can create, rename, activate, deactivate, and manage services.
- Can open/close queues and control token flow.
- Can view queue statistics and history.

## 5. Phase 1 Technology Stack

- Frontend: React.js
- Backend: Spring Boot
- Database: Supabase PostgreSQL
- ORM: Hibernate/JPA
- User login: Supabase Email OTP
- Admin creation: backend-managed only
- Authorization: backend role checks with JWT/session validation
- Real-time updates: WebSockets
- Deployment target: cloud-ready web application

## 6. MVP Modules

### Authentication And Authorization

Users authenticate through Supabase Email OTP. The frontend requests an OTP for the user's email. After the user verifies the OTP, the frontend receives a Supabase session/access token and sends it to the Spring Boot backend for validation and application-user synchronization.

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

Users select an active service and generate a token. The system assigns a token number within the active queue session, calculates the user's position, estimates waiting time, and sends real-time updates.

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

Estimated wait time is calculated from the number of tokens ahead and the service's average service duration. It recalculates whenever queue state changes.

### Priority Queue Handling

Priority types include emergency, senior citizen, VIP, and admin-marked priority. Priority changes must be recorded with a reason and actor for audit.

### Queue History And Statistics

Admins can view total tokens, completed tokens, skipped tokens, active queues, average wait time, and service-wise performance.

## 7. Backend API Summary

Detailed API contracts are in [docs/backend-api-list.md](docs/backend-api-list.md).

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

Detailed frontend plan is in [docs/frontend-plan.md](docs/frontend-plan.md).

Required pages:

- Login
- OTP verification
- User dashboard
- Service selection
- Token live tracking
- My tokens/history
- Admin login
- Admin dashboard
- Admin service management
- Admin queue control
- Admin statistics

## 9. Database Summary

Logical database model is in [docs/database-model.md](docs/database-model.md). SQL-level schema design is in [docs/schema-design.md](docs/schema-design.md).

Core tables:

- users
- services
- queue_sessions
- tokens
- queue_events
- notifications

## 10. Phase 2 Roadmap

- Mobile app
- AI/ML wait-time prediction
- SMS/WhatsApp alerts
- QR code check-in
- Geofencing
- Advanced analytics dashboard
- Docker and microservices deployment
- Push notifications through Firebase Cloud Messaging

## 11. Acceptance Criteria

- Users can log in through Supabase Email OTP.
- Backend validates user identity before allowing protected actions.
- Admin accounts cannot be created through public signup.
- Admin can configure service queues for different business types.
- Users see active services only.
- Users can generate virtual tokens.
- Users can track live queue position and estimated wait time.
- Admin can call, skip, complete, recall, and prioritize tokens.
- Queue changes are broadcast in real time.
- Supabase PostgreSQL stores persistent data.
- Historical service/token data remains available after service deactivation.

## 12. Assumptions

- Supabase is used for PostgreSQL and user Email OTP authentication.
- Spring Boot owns business authorization and admin role enforcement.
- Admin accounts are created from backend-controlled flows only.
- Phase 1 is web-only.
- Services are configurable for any organization type.
