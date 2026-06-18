# Feature Documentation

## 1. Configurable Service Queues

A service queue is a queue category created and managed by an admin. The app must not be hardcoded for only one business type. The same system should work for a tea cafe, hospital, bank, college office, government office, or service center.

### How It Works

Admin creates services from the admin panel. Each service represents one queue that users can join.

Tea cafe example:

- Tea Counter
- Coffee Counter
- Snacks Pickup
- Billing

Hospital example:

- OPD Registration
- Doctor Consultation
- Pharmacy
- Lab Test
- Billing

Each service has its own token sequence, current serving token, waiting list, average service duration, estimated wait time, and history.

### Admin Actions

- Create a new service.
- Rename an existing service.
- Update description.
- Update average service time.
- Activate or deactivate service.
- View service queue and history.

### User Experience

- Users see only active services.
- Users choose one service before generating a token.
- If the admin renames a service, users and historical screens show the updated service name.

### Important Rule

Services with token history should not be hard-deleted. They should be deactivated so old reports and queue events remain correct.

## 2. User Sign-In And Sign-Up

Users can reach the dashboard through three independent sign-in methods, all backed by Supabase Auth. Whichever method is used, the frontend ends up with a Supabase access token, which it exchanges for an application JWT at `/api/auth/user/supabase-sync`. That endpoint creates the local `users` row on first sign-in (role `USER`) and updates it on every later sign-in.

### Password Sign-In And Sign-Up

- The login page has a "Sign in" / "Create account" switch under the Password tab.
- Creating an account calls `supabase.auth.signUp`. If Supabase is configured to require email confirmation, the user gets a verification email instead of an immediate session.
- Signing in calls `supabase.auth.signInWithPassword`.
- If sign-in fails because no account exists for that email, the page shows an inline "Don't have an account yet? Create one" hint instead of just a generic error, so the user isn't stuck guessing why password sign-in failed.

### Email Verification (First-Time Signup)

- After signup, Supabase emails a verification link pointing at `/otp-callback`.
- Clicking the link signs the user straight into the dashboard — it does not bounce back to the login page. This works because `OtpCallbackPage` polls `supabase.auth.getSession()` for a short window after load instead of checking once: Supabase's implicit-flow links deliver the session through the URL hash, which the client SDK parses asynchronously, so a single immediate check can race that parsing and find nothing yet.

### Email OTP / Magic Link Sign-In

- The OTP tab calls `supabase.auth.signInWithOtp`, which emails either a one-time code or a magic link (Supabase project setting controls which).
- Clicking the magic link goes through the same `/otp-callback` polling logic above, so it logs the user in directly rather than landing back on the login page.

### Forgot Password

- A small left-aligned "Forgot password?" link sits under the password field (a plain link-styled button, not a full-width button, to avoid competing visually with the main sign-in action).
- It calls `supabase.auth.resetPasswordForEmail`, which emails a recovery link pointing at `/reset-password`.
- `ResetPasswordPage` waits for the recovery session (same hash-polling approach as `/otp-callback`), then lets the user set a new password via `supabase.auth.updateUser({ password })`, syncs the session to the backend, and redirects to the dashboard.

### Google OAuth Sign-In

- A "Continue with Google" button sits above the Password/OTP tabs, with an "or" divider beneath it.
- It calls `supabase.auth.signInWithOAuth({ provider: 'google' })`, redirecting to Google and back through `/otp-callback`.
- The Google OAuth Client ID and Secret are configured entirely in the Supabase dashboard (Authentication → Providers → Google) — neither value lives in this codebase. Supabase performs the OAuth code/token exchange on its own backend.
- No backend changes were needed to support this: `SupabaseAuthService.validate()` validates any Supabase access token against Supabase's `/auth/v1/user` endpoint regardless of which provider issued it.

## 3. Backend-Managed Admin Accounts

Admins must not be created by public signup.

### How It Works

Admin accounts are created from the backend through one of these controlled options:

- Seed script during setup.
- Protected internal backend endpoint.
- Database migration/initialization process.

The public user sign-in flows (password, OTP, Google) must always create or sync users with the `USER` role only. Admin role assignment must be restricted to backend-controlled operations.

## 4. Virtual Token Generation

After login, a user selects an active service and generates a token.

### Token Creation Flow

1. User opens the service list.
2. User selects an active service.
3. Backend checks if the service has an open queue session.
4. Backend generates the next token number for that session.
5. Backend stores the token as `WAITING`.
6. Backend calculates queue position and estimated wait time.
7. Backend broadcasts queue updates through WebSockets.
8. Backend emails the user a "you're in the queue" confirmation (see Email Notifications).

### Token Information Shown To User

- Token number
- Service name
- Current status
- Current position
- Current serving token
- Estimated waiting time
- Queue length

## 5. Real-Time Queue Tracking

Queue screens update through WebSockets.

### Events That Trigger Updates

- New token created.
- Admin calls next token.
- Admin skips a token.
- Admin completes a token.
- Admin recalls a token.
- Admin changes service average time.
- Admin opens or closes a queue.

### User Benefit

Users do not need to refresh the browser. Their token status, position, and wait time update live.

## 6. Admin Queue Control

Admins manage active queue sessions from the admin dashboard.

### Queue Session Controls

- Open queue for a service.
- Close queue for a service.
- View waiting tokens.
- View called/serving token.
- View skipped and completed tokens.

### Token Controls

- Call next token.
- Call a specific token.
- Mark token as completed.
- Skip token.
- Recall skipped token.
- Mark token as priority.
- Add notes/reason for important actions.

## 7. Estimated Waiting Time

Estimated wait time is based on:

- Number of active tokens ahead.
- Service average service duration.
- Priority ordering.
- Current serving state.

Basic formula:

```text
estimated_wait_minutes = tokens_ahead * service.average_service_minutes
```

This is Phase 1 logic. AI/ML wait-time prediction is reserved for Phase 2.

## 8. Priority Queue

Priority handling allows urgent users to be served earlier.

### Supported Priority Types

- Normal
- Senior citizen
- Emergency
- VIP
- Admin marked

### Rules

- Priority tokens move ahead of normal waiting tokens.
- Existing serving token should not be interrupted.
- Admin must provide a reason when manually changing priority.
- Priority changes should be recorded in queue events.

## 9. Queue Statistics

Admins can view operational performance.

### Statistics To Show

- Total tokens today.
- Active queues.
- Completed tokens.
- Skipped tokens.
- Cancelled tokens.
- Average wait time.
- Average service time.
- Service-wise token count.

## 10. Email Notifications

Transactional email is sent through [Resend](https://resend.com) via `EmailService`, using a raw `HttpClient` call to the Resend API on a dedicated background thread so sending never blocks a request. If `RESEND_API_KEY` is not configured, the service logs and skips the send instead of failing — local development works without an API key.

### Emails Sent

- **Welcome email** — sent the first time a user's Supabase identity is synced to the backend (`AuthService.syncSupabaseUser`, when no local user existed yet).
- **Sign-in notification** — sent on every later sign-in (password, OTP, or Google), and on every admin password login, as a lightweight "new sign-in to your account" alert.
- **Token created** — sent immediately after a token is generated, confirming the token number, service, queue position, and estimated wait.
- **Token cancelled** — sent when a user cancels their own waiting token.
- **Turn reminder** — sent once per token, the moment its estimated wait drops to 5 minutes or less, asking the user to come and take their item or complete billing. A `five_min_reminder_sent_at` timestamp on the `tokens` table (added in `V2__add_token_reminder_sent_at.sql`) guarantees this fires only once per token even though wait time is recalculated repeatedly as the queue moves.
- **Token skipped** — sent when an admin skips a called/serving token, letting the user know they can try again.
- **Token completed** — sent when an admin marks a token as completed, thanking the user and inviting them to come back again.

### Why This Is Used

- Users do not need to keep the tab open to know their turn is close.
- No third-party SMS cost — email covers the same "come back now" need for an MVP.
- Reminder logic lives in the same `recalculate()` pass that already updates positions, so it stays consistent with what the UI shows.

SMS, WhatsApp, and push notifications remain Phase 2 ideas (see `docs/project-roadmap.md`).
