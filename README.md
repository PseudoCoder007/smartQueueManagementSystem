# SmartQueue Management System

SmartQueue Management System is a web application for managing virtual queues. It helps people take a token online, track their position live, and avoid standing in crowded physical lines.

The same project can be used by many types of organizations: a cafe, restaurant, hospital, shopping mall, bank, college office, government office, or service center. The admin decides what services exist, and customers join the service queue they need.

## What Problem Does It Solve?

In many places, people wait without knowing:

- How many people are ahead of them.
- Which token is currently being served.
- How long they may need to wait.
- Whether they missed their turn.

This app makes the queue visible and manageable. Customers can generate a virtual token, and admins can call, skip, complete, recall, and prioritize tokens from a dashboard.

## Main Features

- User login with Supabase Email OTP.
- Backend-managed admin login.
- Admin service management.
- Active and inactive service queues.
- Virtual token generation.
- Live queue position tracking.
- Estimated waiting time.
- Priority handling for emergency, senior citizen, VIP, and admin-marked tokens.
- Admin queue controls: open queue, close queue, call next, call specific token, skip, recall, complete.
- Token cancellation by users.
- Queue history and audit events.
- Admin statistics dashboard.
- Real-time queue updates through WebSockets.

## Simple Example

Imagine a restaurant has these service queues:

- Table Booking
- Food Pickup
- Billing Counter

A customer logs in, chooses "Food Pickup", and gets token number 18. The screen shows:

- Current serving token: 14
- Customer position: 4
- Estimated wait time: 20 minutes

When the counter staff calls token 15, 16, and 17, the customer's position updates automatically. The customer does not need to refresh the page.

## Example Use Cases

### Cafe Or Restaurant

An admin can create services like:

- Tea Counter
- Coffee Counter
- Snacks Pickup
- Food Pickup
- Billing

Customers can generate tokens before reaching the counter. Staff can call the next token, skip someone who is absent, or complete the token after serving.

### Hospital

An admin can create services like:

- OPD Registration
- Doctor Consultation
- Pharmacy
- Lab Test
- Billing

Hospital staff can mark emergency patients as priority. Senior citizens can also be served earlier based on the priority rules. Patients can track their position from their phone instead of crowding around the desk.

### Shopping Mall

Mall management can create services like:

- Parking Help Desk
- Customer Support
- Gift Wrapping
- Lost And Found
- Billing Support

Visitors can join the correct queue and come to the desk when their token is close. Admins can monitor queue length and service performance.

## User Roles

### Guest

A guest can open the app and start login, but cannot create tokens or view protected queue details.

### User Or Customer

A user can:

- Log in using email OTP.
- View active services.
- Generate a token for a service.
- Track token status, position, and estimated wait time.
- View their token history.
- Cancel their own waiting token.

### Admin

An admin can:

- Log in with backend-managed credentials.
- Create and update services.
- Activate or deactivate services.
- Open and close queue sessions.
- Call, skip, recall, complete, and prioritize tokens.
- View queue state and statistics.

Normal users cannot create admin accounts from public signup.

## Technology Used

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Supabase JavaScript client
- STOMP and SockJS for WebSocket updates
- Lucide React icons
- Vitest and Testing Library for frontend tests

### Backend

- Java 21
- Spring Boot 3.3.5
- Spring Web
- Spring Security
- Spring Data JPA
- Spring Validation
- Spring WebSocket
- JWT authentication using JJWT
- Flyway database migrations
- Maven
- JUnit for backend tests

### Database And Authentication

- PostgreSQL
- Supabase PostgreSQL
- Supabase Email OTP for customer login
- Backend-managed admin accounts

## Project Structure

```text
smartQueueManagementSystem/
  backend/                 Spring Boot backend
  frontend/                React frontend
  docs/                    Project documentation
  PRD.md                   Product requirements document
  README.md                Main project guide
```

Important backend folders:

```text
backend/src/main/java/com/smartqueue/controller   REST API controllers
backend/src/main/java/com/smartqueue/service      Business logic
backend/src/main/java/com/smartqueue/domain       JPA entities and enums
backend/src/main/java/com/smartqueue/repository   Database repositories
backend/src/main/resources/db/migration           Flyway SQL migrations
```

Important frontend folders:

```text
frontend/src/pages        App pages
frontend/src/components   Shared UI components
frontend/src/api          API client functions
frontend/src/auth         Auth context and Supabase client
frontend/src/hooks        Custom React hooks
frontend/src/types        TypeScript models
```

## Requirements

Install these before running the project:

- Java 21
- Maven
- Node.js 18 or newer
- npm
- PostgreSQL, or a Supabase PostgreSQL project

## Frontend Status

The frontend is complete enough for the current MVP flow. It includes:

- User Supabase Email OTP login and backend user sync.
- Admin email/password login.
- Protected user and admin routes.
- User dashboard, service list, service detail, token creation, token tracking, and token history pages.
- Admin dashboard, service management, queue control, and daily statistics pages.
- WebSocket refresh for live queue and token updates.
- Loading, empty, error, and basic reconnecting states.

It still has a few polish items that can be improved later:

- Admin service management can create and activate/deactivate services, but editing existing services is not exposed in the UI yet.
- Priority updates currently use browser prompt dialogs instead of a polished form.
- Notifications and success messages are basic.
- Only a small frontend test set exists, so more page and API interaction tests would be useful.

## Backend Setup

Follow these steps to run the Spring Boot backend.

### 1. Open the backend folder

```bash
cd backend
```

### 2. Create or update the backend env file

The project includes `backend/.env.example`. Copy it to `backend/.env` if the `.env` file does not already exist:

```bash
cp .env.example .env
```

For Supabase IPv4 Shared Pooler, use these values in `backend/.env`:

```env
DATABASE_URL=jdbc:postgresql://aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
DATABASE_USERNAME=postgres.guyqvchogbkbcgsnghrw
DATABASE_PASSWORD=YOUR_SUPABASE_DATABASE_PASSWORD
APP_JWT_SECRET=change-this-secret-to-at-least-32-characters
APP_JWT_TTL_MINUTES=720
APP_CORS_ORIGINS=http://localhost:5173

SUPABASE_URL=https://guyqvchogbkbcgsnghrw.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

ADMIN_EMAIL=admin@example.com
ADMIN_NAME=Admin
ADMIN_PASSWORD=admin12345

DEV_AUTH_ENABLED=false
```

Replace these placeholders before using real Supabase login:

- `YOUR_SUPABASE_DATABASE_PASSWORD`
- `YOUR_SUPABASE_ANON_KEY`

The backend automatically reads `backend/.env` when it starts.

### 3. Run the backend

If Maven is installed on your machine:

```bash
mvn spring-boot:run
```

If your terminal shows `mvn: command not found`, use the local Maven and JDK bundled in this workspace:

```bash
PATH="$PWD/../.tools/apache-maven-3.9.9/bin:$PATH" JAVA_HOME="$PWD/../.tools/jdk-21.0.11+10/Contents/Home" mvn spring-boot:run
```

The backend runs at:

```text
http://localhost:8080
```

Flyway automatically creates the database tables from:

```text
backend/src/main/resources/db/migration/V1__init.sql
```

### 4. Run backend tests

If Maven is installed on your machine:

```bash
mvn test
```

If your terminal shows `mvn: command not found`, use:

```bash
PATH="$PWD/../.tools/apache-maven-3.9.9/bin:$PATH" JAVA_HOME="$PWD/../.tools/jdk-21.0.11+10/Contents/Home" mvn test
```

## Frontend Setup

Follow these steps to run the React frontend.

### 1. Open the frontend folder

From the project root:

```bash
cd frontend
```

### 2. Install frontend dependencies

Run this once:

```bash
npm install
```

### 3. Create or update the frontend env file

The project includes `frontend/.env.example`. Copy it to `frontend/.env` if the `.env` file does not already exist:

```bash
cp .env.example .env
```

Use these values in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_BASE_URL=http://localhost:8080/ws
VITE_SUPABASE_URL=https://guyqvchogbkbcgsnghrw.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Replace `YOUR_SUPABASE_ANON_KEY` with your Supabase anon key.

### 4. Run the frontend

```bash
npm run dev
```

The frontend usually runs at:

```text
http://localhost:5173
```

### 5. Run frontend tests

```bash
npm test
```

### 6. Run a frontend production build check

```bash
npm run build
```

## Quick Start

Use two terminals.

Terminal 1:

```bash
cd backend
PATH="$PWD/../.tools/apache-maven-3.9.9/bin:$PATH" JAVA_HOME="$PWD/../.tools/jdk-21.0.11+10/Contents/Home" mvn spring-boot:run
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

## How To Use The App

### Admin Flow

1. Start the backend and frontend.
2. Open `http://localhost:5173/admin/login`.
3. Log in using the seeded admin email and password.
4. Create services such as "Tea Counter", "OPD Registration", or "Customer Support".
5. Activate the services.
6. Open a queue for a service.
7. Use the queue screen to call, skip, recall, complete, or prioritize tokens.
8. Open the statistics page to view queue performance.

### User Flow

1. Open `http://localhost:5173/login`.
2. Log in with email OTP through Supabase.
3. Open the services page.
4. Choose an active service.
5. Generate a token.
6. Track the token position and estimated waiting time.
7. Cancel the token if it is still waiting and no longer needed.

## Quick API Testing Without Supabase

For local backend testing, enable:

```bash
export DEV_AUTH_ENABLED=true
```

Then sync a user with a development token:

```bash
curl -X POST http://localhost:8080/api/auth/user/supabase-sync \
  -H "Content-Type: application/json" \
  -d '{"supabaseAccessToken":"dev:user@example.com"}'
```

The backend returns an application JWT. Use that JWT as:

```text
Authorization: Bearer YOUR_APP_TOKEN
```

Admin login example:

```bash
curl -X POST http://localhost:8080/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin12345"}'
```

Create a service as admin:

```bash
curl -X POST http://localhost:8080/api/admin/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT" \
  -d '{
    "name": "Tea Counter",
    "description": "Queue for tea orders",
    "averageServiceMinutes": 3,
    "status": "ACTIVE"
  }'
```

Open the queue:

```bash
curl -X POST http://localhost:8080/api/admin/queues/SERVICE_ID/open \
  -H "Authorization: Bearer ADMIN_JWT"
```

Create a user token:

```bash
curl -X POST http://localhost:8080/api/tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_JWT" \
  -d '{
    "serviceId": "SERVICE_ID",
    "priorityType": "NORMAL"
  }'
```

Call the next token:

```bash
curl -X POST http://localhost:8080/api/admin/queues/SERVICE_ID/next \
  -H "Authorization: Bearer ADMIN_JWT"
```

## How To Test The App

### Backend Tests

From the backend folder:

```bash
cd backend
PATH="$PWD/../.tools/apache-maven-3.9.9/bin:$PATH" JAVA_HOME="$PWD/../.tools/jdk-21.0.11+10/Contents/Home" mvn test
```

The backend test setup includes H2 for tests and checks queue priority ordering.

### Frontend Tests

From the frontend folder:

```bash
cd frontend
npm test
```

The frontend tests use Vitest.

### Frontend Build Test

Use this to make sure the React app compiles correctly:

```bash
cd frontend
npm run build
```

### Manual End-To-End Test

1. Start PostgreSQL or configure Supabase PostgreSQL.
2. Start the backend with admin seed variables.
3. Start the frontend.
4. Log in as admin.
5. Create a service named "Coffee Counter".
6. Open the queue for that service.
7. Log in as a user.
8. Generate a token for "Coffee Counter".
9. Return to the admin queue page and call the next token.
10. Confirm the user's token page updates with the new status.
11. Complete the token as admin.
12. Check the admin statistics page.

## Database Tables

The first Flyway migration creates these main tables:

- `users`
- `services`
- `queue_sessions`
- `tokens`
- `queue_events`
- `notifications`

The database also stores enums for roles, token status, queue session status, service status, priority type, and queue event type.

## Main API Groups

The backend API starts with:

```text
/api
```

Important API groups:

- `/api/auth` for user sync, admin login, and current user profile.
- `/api/services` for user-visible active services.
- `/api/tokens` for user token actions.
- `/api/admin/services` for admin service management.
- `/api/admin/queues` for admin queue control.
- `/api/admin/tokens` for admin token actions.
- `/api/admin/stats` for statistics.

More details are available in:

```text
docs/backend-api-list.md
```

## Real-Time Updates

The app uses WebSockets so queue screens can update automatically.

Frontend WebSocket URL:

```text
http://localhost:8080/ws
```

The frontend subscribes to queue topics and reloads queue data when a queue event is received.

## Useful Documentation

- `PRD.md` explains the product goals and acceptance criteria.
- `docs/features.md` explains the feature behavior.
- `docs/backend-api-list.md` lists backend API endpoints.
- `docs/database-model.md` explains the database model.
- `docs/schema-design.md` explains the SQL schema.
- `docs/frontend-plan.md` explains the frontend pages.
- `docs/project-roadmap.md` explains future improvements.

## Future Improvements

Planned future ideas include:

- Mobile app.
- AI-based wait-time prediction.
- SMS and WhatsApp alerts.
- QR code check-in.
- Push notifications.
- Advanced analytics.
- Docker-based deployment.

## Short Summary

SmartQueue is a virtual queue system. Admins create services and manage queues. Users join queues, receive tokens, and track their turn live. It is flexible enough for restaurants, hospitals, shopping malls, banks, offices, and many other places where people wait for service.
