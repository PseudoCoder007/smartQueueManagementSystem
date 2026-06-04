# Database Model

## 1. Overview

The application uses Supabase PostgreSQL as the database. Spring Boot connects to Supabase through JDBC and maps tables using Hibernate/JPA.

Supabase Auth is used for user Email OTP login. Application roles, admin users, queue data, and business rules are stored in application tables.

## 2. Core Entities

## users

Stores application user profiles and roles.

Fields:

- `id`
- `supabase_user_id`
- `email`
- `name`
- `phone`
- `role`
- `password_hash`
- `created_at`
- `updated_at`

Notes:

- Normal users come from Supabase Email OTP and have `role = USER`.
- Admins are created from backend-controlled flows.
- Admins may use `password_hash` for backend credential login.
- Public user sync must never create `ADMIN`.

## services

Stores configurable service queues.

Fields:

- `id`
- `name`
- `description`
- `average_service_minutes`
- `status`
- `created_by`
- `created_at`
- `updated_at`

Notes:

- Users see only active services.
- Services should be deactivated, not deleted, when history exists.
- Service name can change based on business use case.

## queue_sessions

Represents a service queue opening period.

Fields:

- `id`
- `service_id`
- `status`
- `opened_by`
- `closed_by`
- `opened_at`
- `closed_at`

Notes:

- A service can have many sessions over time.
- Usually only one open session should exist per service.

## tokens

Stores virtual queue tokens.

Fields:

- `id`
- `token_number`
- `user_id`
- `service_id`
- `queue_session_id`
- `status`
- `priority_type`
- `priority_reason`
- `position_snapshot`
- `estimated_wait_minutes`
- `created_at`
- `called_at`
- `serving_started_at`
- `completed_at`
- `cancelled_at`

Notes:

- Token number is unique within a queue session.
- Token status changes are recorded in `queue_events`.
- Users should not have duplicate active tokens for the same open queue session unless future requirements allow it.

## queue_events

Audit trail of queue and token actions.

Fields:

- `id`
- `token_id`
- `service_id`
- `queue_session_id`
- `event_type`
- `actor_user_id`
- `notes`
- `created_at`

Notes:

- Admin actions are recorded through `actor_user_id`.
- User actions like cancellation are also recorded.

## notifications

Stores in-app notification records.

Fields:

- `id`
- `user_id`
- `token_id`
- `type`
- `title`
- `message`
- `read_at`
- `created_at`

Notes:

- Phase 1 notifications are in-app/WebSocket based.
- SMS, WhatsApp, and push notifications are Phase 2.

## 3. Enums

### user_role

- `USER`
- `ADMIN`

### service_status

- `ACTIVE`
- `INACTIVE`

### queue_session_status

- `OPEN`
- `CLOSED`

### token_status

- `WAITING`
- `CALLED`
- `SERVING`
- `SKIPPED`
- `COMPLETED`
- `CANCELLED`

### priority_type

- `NORMAL`
- `SENIOR_CITIZEN`
- `EMERGENCY`
- `VIP`
- `ADMIN_MARKED`

### queue_event_type

- `TOKEN_CREATED`
- `TOKEN_CALLED`
- `TOKEN_SERVING`
- `TOKEN_SKIPPED`
- `TOKEN_RECALLED`
- `TOKEN_COMPLETED`
- `TOKEN_CANCELLED`
- `PRIORITY_UPDATED`
- `QUEUE_OPENED`
- `QUEUE_CLOSED`

## 4. Relationships

- One user can have many tokens.
- One service can have many queue sessions.
- One service can have many tokens.
- One queue session can have many tokens.
- One token can have many queue events.
- One user/admin can create many queue events as actor.

## 5. Business Rules

- Public Supabase OTP user sync creates `USER` role only.
- Admins are created only from backend-controlled flows.
- Users see active services only.
- Admins can view active and inactive services.
- Services with queue history should be deactivated instead of deleted.
- Token number must be unique per queue session.
- A service should not have more than one open queue session at the same time.
- WebSocket updates should be emitted after every queue-changing transaction.
