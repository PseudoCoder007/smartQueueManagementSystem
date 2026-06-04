# Backend API List

Base URL:

```text
/api
```

## Auth APIs

### POST `/api/auth/user/supabase-sync`

Validates a Supabase Email OTP session/access token and syncs the user into the application database.

Access: authenticated Supabase user.

Request:

```json
{
  "supabaseAccessToken": "string"
}
```

Response:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "USER",
  "appToken": "optional-backend-jwt"
}
```

Notes:

- Synced users receive `USER` role by default.
- This endpoint must never assign `ADMIN`.

### POST `/api/auth/admin/login`

Logs in an admin account managed by the backend.

Access: public endpoint, but validates admin credentials.

Request:

```json
{
  "email": "admin@example.com",
  "password": "string"
}
```

Response:

```json
{
  "token": "jwt",
  "role": "ADMIN",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin"
  }
}
```

### GET `/api/auth/me`

Returns the current authenticated application user.

Access: `USER`, `ADMIN`.

## User Service APIs

### GET `/api/services`

Lists active services visible to users.

Access: `USER`, `ADMIN`.

Response includes service id, name, description, average service minutes, active queue status, current token, queue length, and estimated wait time.

### GET `/api/services/{serviceId}`

Returns details for one active service.

Access: `USER`, `ADMIN`.

## User Token APIs

### POST `/api/tokens`

Creates a virtual token for the selected service.

Access: `USER`.

Request:

```json
{
  "serviceId": "uuid",
  "priorityType": "NORMAL"
}
```

Response:

```json
{
  "id": "uuid",
  "tokenNumber": 12,
  "serviceId": "uuid",
  "serviceName": "Tea Counter",
  "status": "WAITING",
  "position": 5,
  "estimatedWaitMinutes": 20
}
```

### GET `/api/tokens/my`

Lists current user's active and historical tokens.

Access: `USER`.

### GET `/api/tokens/{tokenId}`

Returns token detail.

Access: token owner or `ADMIN`.

### DELETE `/api/tokens/{tokenId}/cancel`

Cancels a waiting token owned by the current user.

Access: token owner.

## Admin Service APIs

### POST `/api/admin/services`

Creates a configurable service queue.

Access: `ADMIN`.

Request:

```json
{
  "name": "OPD Registration",
  "description": "Patient registration queue",
  "averageServiceMinutes": 5,
  "status": "ACTIVE"
}
```

### GET `/api/admin/services`

Lists all services, including inactive services.

Access: `ADMIN`.

### PUT `/api/admin/services/{serviceId}`

Updates service name, description, average service time, or status.

Access: `ADMIN`.

### POST `/api/admin/services/{serviceId}/activate`

Makes a service visible to users.

Access: `ADMIN`.

### POST `/api/admin/services/{serviceId}/deactivate`

Hides a service from users while preserving history.

Access: `ADMIN`.

## Admin Queue APIs

### POST `/api/admin/queues/{serviceId}/open`

Opens a queue session for a service.

Access: `ADMIN`.

### POST `/api/admin/queues/{serviceId}/close`

Closes the active queue session.

Access: `ADMIN`.

### GET `/api/admin/queues/{serviceId}`

Returns complete queue state for admin.

Access: `ADMIN`.

Includes waiting, serving, skipped, completed, cancelled tokens, queue length, and estimated wait details.

### POST `/api/admin/queues/{serviceId}/next`

Calls the next eligible token based on priority and creation order.

Access: `ADMIN`.

## Admin Token APIs

### POST `/api/admin/tokens/{tokenId}/call`

Calls a specific token.

Access: `ADMIN`.

### POST `/api/admin/tokens/{tokenId}/complete`

Marks token as completed.

Access: `ADMIN`.

### POST `/api/admin/tokens/{tokenId}/skip`

Skips token.

Access: `ADMIN`.

### POST `/api/admin/tokens/{tokenId}/recall`

Moves skipped/called token back into active handling.

Access: `ADMIN`.

### POST `/api/admin/tokens/{tokenId}/priority`

Updates token priority.

Access: `ADMIN`.

Request:

```json
{
  "priorityType": "EMERGENCY",
  "reason": "Emergency case approved by front desk"
}
```

## Statistics APIs

### GET `/api/admin/stats/overview`

Returns dashboard-level statistics.

Access: `ADMIN`.

### GET `/api/admin/stats/services/{serviceId}`

Returns service-specific analytics.

Access: `ADMIN`.

### GET `/api/admin/stats/daily`

Returns daily queue volume and performance data.

Access: `ADMIN`.

## WebSocket Topics

### `/topic/queues/{serviceId}`

Queue updates for a service.

Events:

- `QUEUE_UPDATED`
- `TOKEN_CREATED`
- `TOKEN_CALLED`
- `TOKEN_COMPLETED`
- `TOKEN_SKIPPED`
- `WAIT_TIME_UPDATED`

### `/topic/users/{userId}/tokens`

Private user token updates.

Events:

- `TOKEN_CREATED`
- `TOKEN_CALLED`
- `TOKEN_COMPLETED`
- `TOKEN_SKIPPED`
- `TOKEN_CANCELLED`

### `/topic/admin/queues`

Admin-wide queue updates.
