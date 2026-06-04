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

## 2. Supabase Email OTP User Login

Users log in with email OTP instead of a normal password.

### How It Works

1. User enters email.
2. Frontend asks Supabase to send an OTP or magic link.
3. User verifies the OTP.
4. Supabase returns a session/access token.
5. Frontend sends the Supabase token to the Spring Boot backend.
6. Backend validates the token and creates or updates the local `users` record.
7. User can access protected user features.

### Why This Is Used

- Users can log in quickly.
- No user password storage is required in the application backend.
- Login feels real-time and simple.

## 3. Backend-Managed Admin Accounts

Admins must not be created by public signup.

### How It Works

Admin accounts are created from the backend through one of these controlled options:

- Seed script during setup.
- Protected internal backend endpoint.
- Database migration/initialization process.

The public user OTP login flow must always create or sync users with the `USER` role only. Admin role assignment must be restricted to backend-controlled operations.

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

## 10. Notifications

Phase 1 notifications are in-app and WebSocket based.

Examples:

- Your token was created.
- Your token is almost next.
- Your token is being called.
- Your token was skipped.
- Queue was closed.

SMS, WhatsApp, and push notifications are Phase 2.
