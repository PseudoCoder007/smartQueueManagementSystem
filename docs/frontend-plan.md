# Frontend Plan

## 1. Frontend Stack

- React.js
- React Router
- Supabase JavaScript client for user Email OTP login
- REST API client for backend communication
- WebSocket/STOMP client for real-time queue updates
- Form validation library as needed

## 2. Authentication Flow

### User Email OTP Login

Pages:

- Login
- OTP verification or magic-link callback

Flow:

1. User enters email.
2. Frontend calls Supabase OTP login.
3. User verifies OTP.
4. Frontend receives Supabase session.
5. Frontend sends Supabase access token to `POST /api/auth/user/supabase-sync`.
6. Backend returns application user profile and optional backend JWT.
7. Frontend stores session data.
8. User is redirected to user dashboard.

### Admin Login

Admin login is separate from user OTP login.

Flow:

1. Admin opens admin login page.
2. Admin submits backend-managed email/password.
3. Frontend calls `POST /api/auth/admin/login`.
4. Backend returns admin JWT and profile.
5. Frontend stores admin session.
6. Admin is redirected to admin dashboard.

## 3. Routes

Public routes:

- `/login`
- `/otp-callback`
- `/admin/login`

User routes:

- `/dashboard`
- `/services`
- `/services/:serviceId`
- `/tokens/:tokenId`
- `/my-tokens`

Admin routes:

- `/admin`
- `/admin/services`
- `/admin/queues/:serviceId`
- `/admin/stats`

## 4. Pages

### Login Page

- Email input.
- Send OTP button.
- Loading state while OTP is sent.
- Success message after OTP is sent.
- Error state for invalid email or Supabase failure.

### OTP Callback Page

- Reads Supabase session after OTP verification.
- Calls backend sync endpoint.
- Redirects user based on role.

### User Dashboard

- Shows active token if user has one.
- Shows shortcut to service selection.
- Shows recent token history.

### Service Selection Page

- Lists active services.
- Shows service name, description, queue status, queue length, and approximate wait time.
- Lets user open service details.

### Service Detail Page

- Shows service queue state.
- Has generate token button.
- Shows warning if queue is closed.

### Token Live Tracking Page

- Shows token number, status, queue position, current serving token, estimated wait time.
- Subscribes to WebSocket updates.
- Allows cancellation only if token is still waiting.

### My Tokens Page

- Lists active and previous tokens.
- Shows service name, token status, created time, completed/cancelled time.

### Admin Dashboard

- Shows active queues, total tokens today, completed tokens, skipped tokens, average wait time.
- Links to service management and queue control.

### Admin Service Management Page

- Lists all services, including inactive.
- Create service form.
- Edit service name, description, and average service minutes.
- Activate/deactivate controls.

### Admin Queue Control Page

- Shows queue state for selected service.
- Open/close queue controls.
- Waiting token table.
- Serving token panel.
- Skipped/completed token lists.
- Buttons for call next, call, skip, recall, complete, and priority update.

### Admin Statistics Page

- Overview cards.
- Service-wise performance.
- Daily token volume.

## 5. Shared Components

- Auth layout
- User layout
- Admin layout
- Protected route wrapper
- Role-based navigation
- Service card
- Service form
- Token card
- Queue status panel
- Wait-time display
- Admin queue table
- Token action buttons
- Priority selector
- Statistics cards
- WebSocket connection indicator
- Toast/notification messages
- Empty state
- Error state
- Loading state

## 6. State Management

Store:

- Auth session
- User profile
- Role
- Active services
- Current token
- Admin services
- Admin queue state
- WebSocket connection status

The frontend can begin with React Context or a lightweight state library. Server data should be refreshed after mutations and updated by WebSocket events.

## 7. WebSocket Behavior

User token pages subscribe to:

- `/topic/queues/{serviceId}`
- `/topic/users/{userId}/tokens`

Admin queue pages subscribe to:

- `/topic/queues/{serviceId}`
- `/topic/admin/queues`

On receiving events, the frontend updates queue state, token status, position, and wait time without requiring refresh.

## 8. Required UI States

Every page that loads data must support:

- Loading
- Empty
- Error
- Unauthorized
- Forbidden
- WebSocket disconnected
- Mutation in progress
- Success confirmation

## 9. Frontend Acceptance Criteria

- User can log in with Supabase Email OTP.
- User is synced with backend before seeing protected pages.
- Admin login is separate from user login.
- Users see active services only.
- Users can generate and track tokens.
- Admin can manage service queues and token flow.
- Real-time updates display without page refresh.
