<img src="docs/logo.svg" alt="SmartQueue" width="420" />

# SmartQueue Management System

**Live:** [smart-queue.in](https://smart-queue.in)

**Queues, made invisible.**

SmartQueue is a web app for managing virtual queues. People take a token online, track their position live, and avoid standing in a crowded physical line. The same system works for a cafe, restaurant, hospital, bank, college office, government office, or any service center — admins define the services, customers join the one they need.

## What Problem Does It Solve?

In many places, people wait without knowing how many are ahead of them, which token is being served, how long they'll wait, or whether they missed their turn. SmartQueue makes the queue visible: customers generate a virtual token and watch it live; admins call, skip, complete, recall, and prioritize tokens from a dashboard.

## Main Features

- Sign in with password, email OTP/magic link, or Google OAuth (Supabase Auth), plus forgot-password recovery.
- Admin service management with active/inactive queues.
- Virtual token generation with live position tracking and estimated wait time.
- Priority handling for emergency, senior citizen, VIP, and admin-marked tokens.
- Admin queue controls: open/close queue, call next, call specific, skip, recall, complete.
- Real-time updates over WebSockets — no manual refresh.
- Transactional email via Resend: welcome, sign-in alert, token-created confirmation, and a reminder ~5 minutes before your turn.
- Admin statistics dashboard.

See **[docs/features.md](docs/features.md)** for how each feature works in detail.

## Technology Used

| | |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, React Router, Supabase JS client, STOMP/SockJS (WebSockets), Lucide icons, Vitest |
| **Backend** | Java 21, Spring Boot 3.3.5 (Web, Security, Data JPA, Validation, WebSocket), JJWT, Flyway, Maven, JUnit |
| **Data & Auth** | PostgreSQL (Supabase-hosted), Supabase Auth (password, OTP, Google OAuth), backend-managed admin accounts |
| **Email** | Resend |

## Project Structure

```text
smartQueueManagementSystem/
  backend/                 Spring Boot backend
  frontend/                React frontend
  docs/                    Project documentation (including PRD.md)
  README.md                This file
```

```text
backend/src/main/java/com/smartqueue/controller   REST API controllers
backend/src/main/java/com/smartqueue/service      Business logic
backend/src/main/java/com/smartqueue/domain       JPA entities and enums
backend/src/main/java/com/smartqueue/repository   Database repositories
backend/src/main/resources/db/migration           Flyway SQL migrations

frontend/src/pages        App pages
frontend/src/components   Shared UI components
frontend/src/api          API client functions
frontend/src/auth         Auth context and Supabase client
frontend/src/hooks        Custom React hooks
frontend/src/types        TypeScript models
```

## Getting Started

Requirements: Java 21, Maven, Node.js 18+, npm, and a PostgreSQL or Supabase Postgres project.

Full setup steps (env files, Supabase/Google OAuth config, Resend config, quick-start commands, curl-based API testing without Supabase) live in **[docs/SETUP.md](docs/SETUP.md)**.

Short version:

```bash
# Terminal 1
cd backend && mvn spring-boot:run

# Terminal 2
cd frontend && npm install && npm run dev
```

Then open `http://localhost:5173`.

## Documentation

| Doc | Covers |
|---|---|
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | Step-by-step usage for customers and admins |
| [docs/features.md](docs/features.md) | Detailed feature behavior, including auth and email |
| [docs/SETUP.md](docs/SETUP.md) | Backend/frontend setup, env vars, Supabase & Resend config |
| [docs/TESTING.md](docs/TESTING.md) | Running backend/frontend tests and manual E2E checks |
| [docs/backend-api-list.md](docs/backend-api-list.md) | REST API endpoint reference |
| [docs/database-model.md](docs/database-model.md) | Database model |
| [docs/schema-design.md](docs/schema-design.md) | SQL schema |
| [docs/frontend-plan.md](docs/frontend-plan.md) | Frontend page plan |
| [docs/project-roadmap.md](docs/project-roadmap.md) | Future improvements |
| [docs/BRAND.md](docs/BRAND.md) | Logo, slogan, colors |
| [docs/EMAIL_TEMPLATES.md](docs/EMAIL_TEMPLATES.md) | Branded email templates (Supabase + app emails) |
| [docs/PRD.md](docs/PRD.md) | Product goals and acceptance criteria |

## Future Improvements

Mobile app, AI-based wait-time prediction, SMS/WhatsApp alerts, QR code check-in, push notifications, advanced analytics, Docker-based deployment. Details in [docs/project-roadmap.md](docs/project-roadmap.md).

## Short Summary

SmartQueue is a virtual queue system. Admins create services and manage queues. Users sign in, join a queue, receive a token, and track their turn live — flexible enough for restaurants, hospitals, malls, banks, offices, and anywhere else people wait for service.
