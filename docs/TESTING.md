# Testing Guide

## Backend Tests

From the backend folder:

```bash
cd backend
mvn test
```

If your terminal shows `mvn: command not found`, use:

```bash
PATH="$PWD/../.tools/apache-maven-3.9.9/bin:$PATH" JAVA_HOME="$PWD/../.tools/jdk-21.0.11+10/Contents/Home" mvn test
```

The backend test setup uses H2 in place of Postgres and covers queue priority ordering.

## Frontend Tests

From the frontend folder:

```bash
cd frontend
npm test
```

The frontend tests use Vitest and Testing Library.

## Frontend Build Check

```bash
cd frontend
npm run build
```

Confirms the React app compiles and type-checks correctly.

## Manual End-To-End Test

1. Start PostgreSQL or configure Supabase PostgreSQL.
2. Start the backend with admin seed variables set.
3. Start the frontend.
4. Log in as admin.
5. Create a service named "Coffee Counter".
6. Open the queue for that service.
7. Log in as a user (password, OTP, or Google).
8. Generate a token for "Coffee Counter" — confirm a "you're in the queue" email is sent if `RESEND_API_KEY` is set.
9. Return to the admin queue page and call the next token.
10. Confirm the user's token page updates live with the new status.
11. Complete the token as admin.
12. Check the admin statistics page.

## Auth Flow Checks

Because Supabase's implicit OAuth/magic-link flow delivers the session in the URL hash (parsed asynchronously by the client SDK), these flows are worth testing manually after any auth-related change, not just unit-tested:

- Password sign-in with a wrong/non-existent account shows the "create an account" hint.
- "Forgot password" email arrives and the reset link logs the user in after setting a new password.
- Email OTP / magic link signs the user straight into the dashboard, not back to the login page.
- First-time signup verification email signs the user in directly after verifying.
- "Continue with Google" completes a full round trip back to the dashboard.
