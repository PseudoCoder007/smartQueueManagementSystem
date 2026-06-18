# Setup Guide

Steps to run SmartQueue locally.

## Requirements

- Java 21
- Maven
- Node.js 18 or newer
- npm
- PostgreSQL, or a Supabase PostgreSQL project

## Backend Setup

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

RESEND_API_KEY=YOUR_RESEND_API_KEY
RESEND_FROM_EMAIL=Smart Queue <no-reply@smart-queue.in>
```

Replace these placeholders before using real Supabase login and email:

- `YOUR_SUPABASE_DATABASE_PASSWORD`
- `YOUR_SUPABASE_ANON_KEY`
- `YOUR_RESEND_API_KEY` (leave blank to disable outbound email — the backend logs and skips sends instead of failing)

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

The backend runs at `http://localhost:8080`. Flyway automatically creates the database tables from `backend/src/main/resources/db/migration/`.

## Frontend Setup

### 1. Open the frontend folder

```bash
cd frontend
npm install
```

### 2. Create or update the frontend env file

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

### 3. Run the frontend

```bash
npm run dev
```

The frontend usually runs at `http://localhost:5173`.

### 4. Production build check

```bash
npm run build
```

## Quick Start (Both Servers)

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

Then open `http://localhost:5173`.

## Auth Provider Setup (Supabase)

The app supports three sign-in methods, all via Supabase Auth: password, email OTP/magic link, and Google OAuth.

- **Site URL / Redirect URLs**: in the Supabase dashboard under Authentication → URL Configuration, set Site URL to your deployed frontend origin (e.g. `https://smart-queue.in`) and add `http://localhost:5173/**` for local development. Both `/otp-callback` and `/reset-password` must be reachable under whatever origins are listed there.
- **Google OAuth**: enabled in Supabase under Authentication → Providers → Google, with the Google Cloud OAuth Client ID/Secret pasted directly into the Supabase dashboard. No client ID/secret lives in this repo — Supabase performs the OAuth code/token exchange itself, and the frontend only calls `supabase.auth.signInWithOAuth({ provider: 'google' })`. The backend's token validation is provider-agnostic, so no backend changes are needed for a new provider.

## Email Setup (Resend)

Transactional email (welcome, sign-in notification, token-created, 5-minute turn reminder) is sent through [Resend](https://resend.com). Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `backend/.env` — the sending domain must be verified in the Resend dashboard. If `RESEND_API_KEY` is left blank, the backend logs and skips the send instead of failing, so local development works without an API key.

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

The backend returns an application JWT. Use that JWT as `Authorization: Bearer YOUR_APP_TOKEN`.

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
