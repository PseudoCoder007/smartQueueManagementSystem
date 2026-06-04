create extension if not exists pgcrypto;

create type user_role as enum ('USER', 'ADMIN');
create type service_status as enum ('ACTIVE', 'INACTIVE');
create type queue_session_status as enum ('OPEN', 'CLOSED');
create type token_status as enum ('WAITING', 'CALLED', 'SERVING', 'SKIPPED', 'COMPLETED', 'CANCELLED');
create type priority_type as enum ('NORMAL', 'SENIOR_CITIZEN', 'EMERGENCY', 'VIP', 'ADMIN_MARKED');
create type queue_event_type as enum (
  'TOKEN_CREATED',
  'TOKEN_CALLED',
  'TOKEN_SERVING',
  'TOKEN_SKIPPED',
  'TOKEN_RECALLED',
  'TOKEN_COMPLETED',
  'TOKEN_CANCELLED',
  'PRIORITY_UPDATED',
  'QUEUE_OPENED',
  'QUEUE_CLOSED'
);

create table users (
  id uuid primary key default gen_random_uuid(),
  supabase_user_id uuid unique,
  email text not null unique,
  name text,
  phone text,
  role user_role not null default 'USER',
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  average_service_minutes integer not null default 5,
  status service_status not null default 'ACTIVE',
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_average_service_minutes_positive check (average_service_minutes > 0)
);

create table queue_sessions (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id),
  status queue_session_status not null default 'OPEN',
  opened_by uuid references users(id),
  closed_by uuid references users(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table tokens (
  id uuid primary key default gen_random_uuid(),
  token_number integer not null,
  user_id uuid not null references users(id),
  service_id uuid not null references services(id),
  queue_session_id uuid not null references queue_sessions(id),
  status token_status not null default 'WAITING',
  priority_type priority_type not null default 'NORMAL',
  priority_reason text,
  position_snapshot integer,
  estimated_wait_minutes integer,
  created_at timestamptz not null default now(),
  called_at timestamptz,
  serving_started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  constraint tokens_token_number_per_session_unique unique (queue_session_id, token_number),
  constraint tokens_estimated_wait_non_negative check (estimated_wait_minutes is null or estimated_wait_minutes >= 0)
);

create table queue_events (
  id uuid primary key default gen_random_uuid(),
  token_id uuid references tokens(id),
  service_id uuid references services(id),
  queue_session_id uuid references queue_sessions(id),
  event_type queue_event_type not null,
  actor_user_id uuid references users(id),
  notes text,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  token_id uuid references tokens(id),
  type text not null,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index queue_sessions_one_open_per_service on queue_sessions (service_id) where status = 'OPEN';
create unique index tokens_one_active_token_per_user_session on tokens (user_id, queue_session_id)
where status in ('WAITING', 'CALLED', 'SERVING');
create index users_email_idx on users (email);
create index users_supabase_user_id_idx on users (supabase_user_id);
create index services_status_idx on services (status);
create index queue_sessions_service_status_idx on queue_sessions (service_id, status);
create index tokens_user_status_idx on tokens (user_id, status);
create index tokens_service_session_status_idx on tokens (service_id, queue_session_id, status);
create index tokens_priority_created_idx on tokens (priority_type, created_at);
create index queue_events_token_idx on queue_events (token_id);
create index queue_events_service_idx on queue_events (service_id);
create index queue_events_session_idx on queue_events (queue_session_id);
create index notifications_user_read_idx on notifications (user_id, read_at);
