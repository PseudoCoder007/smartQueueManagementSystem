# User Guide

How to actually use SmartQueue, step by step, for both customers and admins.

## Signing In As A Customer

Open `/login`. There are three ways in — pick any one, they all lead to the same dashboard:

### Option A: Continue with Google

1. Click **Continue with Google** at the top of the login panel.
2. Pick a Google account and approve access.
3. You're returned to the app and signed in automatically — no further steps.

### Option B: Email + Password

1. Switch to the **Password** tab.
2. First time here? Click **Create account**, enter your email and a password (6+ characters), and submit.
   - If your Supabase project requires email confirmation, you'll get a verification email — click the link in it and you'll be signed in directly, no need to come back and log in manually.
3. Already have an account? Stay on **Sign in**, enter your email and password, and submit.
   - Entered the wrong email, or no account exists yet for it? The page tells you and offers a one-click "Create one" link instead of leaving you guessing.
4. Forgot your password? Click the small **Forgot password?** link under the password field, check your email for the reset link, set a new password on the page it opens, and you'll land signed in on the dashboard.

### Option C: Email OTP / Magic Link

1. Switch to the **OTP / Link** tab.
2. Enter your email and submit.
3. Check your inbox for a one-time code or magic link (depends on Supabase project settings).
4. Clicking the link signs you in directly.

## Using The Queue (Customer)

1. From the dashboard, open **Services**.
2. Browse the list of active services (e.g. "Tea Counter", "OPD Registration") — inactive ones are hidden.
3. Open a service and click **Generate Token**.
4. You'll see your token number, current position, and estimated wait time, and you'll get a confirmation email with the same details.
5. Keep the token page open (or come back to it from **My Tokens**) — your position and wait time update live as the admin calls, skips, or completes tokens ahead of you, no refresh needed.
6. When your estimated wait drops to about 5 minutes, you'll get a reminder email to head to the counter.
7. No longer need the token? Click **Cancel** while it's still in `WAITING` status.
   - Cancelling 3 times in 24 hours for the same service temporarily blocks rejoining that service's queue for an hour, to discourage queue spam.
8. **My Tokens** lists your full token history across all services.

## Admin: Signing In

1. Open `/admin/login`.
2. Sign in with the admin email/password configured on the backend (seeded via `ADMIN_EMAIL` / `ADMIN_PASSWORD`, or created through a protected backend endpoint). Admin accounts are never created through the public signup form.

## Admin: Managing Services

1. Open **Services** in the admin area.
2. Click **New Service**, give it a name, description, and average service time in minutes.
3. Activate it once ready — only active services are visible to customers.
4. Deactivate a service instead of deleting it once it has token history, so past reports and queue events stay accurate.

## Admin: Running A Queue

1. Open the queue page for a service.
2. Click **Open Queue** to start accepting tokens for the day; **Close Queue** when done.
3. From the live queue board you can:
   - **Call Next** — calls the next waiting token (priority tokens are pulled ahead automatically).
   - **Call Specific** — jump to a specific token number.
   - **Complete** — mark the currently serving token as done.
   - **Skip** — mark a no-show token as skipped.
   - **Recall** — bring a skipped token back into the waiting list.
   - **Mark Priority** — flag a token as senior/emergency/VIP with a reason, moving it ahead of normal tokens.
4. All of the above broadcast instantly to every customer's open token page via WebSockets.

## Admin: Statistics

Open the **Stats** page to see today's totals: tokens created, completed, skipped, cancelled, average wait time, average service time, and a per-service breakdown.

## Troubleshooting

- **A magic link or verification link sends me back to the login page** — this should not happen; if it does, the link likely expired (links are time-limited by Supabase). Request a new one.
- **Password sign-in says invalid credentials but I'm sure the account exists** — double-check the email; Supabase treats password sign-in for an unconfirmed account the same as invalid credentials in some configurations.
- **No emails arriving** — confirm `RESEND_API_KEY` is set on the backend and the sending domain is verified in the Resend dashboard. Without an API key, the backend intentionally skips sending instead of failing the request.
