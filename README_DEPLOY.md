# Deployment Guide — AWS EC2 + Docker + Caddy + GHCR + GitHub Actions

This document describes how SmartQueue is deployed in production, replacing the previous
Vercel (frontend) + Railway (backend) setup. Supabase remains the database/auth provider,
unchanged.

## Architecture

```
GitHub (push to main)
        |
        v
GitHub Actions
  - build backend image  -> push to GHCR
  - build frontend image -> push to GHCR
  - SCP docker-compose.yml + Caddyfile to the box
  - SSH in: docker compose pull && docker compose up -d
        |
        v
AWS EC2 (Ubuntu 24.04, t3.micro, Elastic IP)
        |
        v
Docker Compose
  - caddy            (ports 80/443, HTTPS via Let's Encrypt, reverse proxy + static files)
  - backend           (Spring Boot jar, port 8080 internal only)
  - frontend-assets    (one-shot: copies the built dist/ into a shared volume, then exits)
        |
        v
Supabase (Postgres + Auth) — external, unchanged
```

Routing (handled by Caddy):
- `https://smart-queue.in/` → static frontend assets (SPA, falls back to `index.html`)
- `https://smart-queue.in/api/*` → `backend:8080`
- `https://smart-queue.in/ws*` → `backend:8080` (STOMP/SockJS WebSocket)

## Folder structure (deployment-relevant files)

```
.
├── .github/workflows/deploy.yml   # CI: build images, push to GHCR, deploy over SSH
├── Caddyfile                      # reverse proxy + HTTPS config
├── docker-compose.yml             # service definitions (backend, frontend-assets, caddy)
├── .env.example                   # template for the server's combined .env
├── backend/
│   ├── Dockerfile                 # multi-stage Maven build -> JRE runtime
│   └── .env.example               # template for local dev backend/.env
└── frontend/
    └── Dockerfile                 # multi-stage Node build -> static dist export
```

## Docker images

**Backend** (`backend/Dockerfile`): multi-stage build. Stage 1 compiles the jar with
Maven + JDK 21 (dependency layer cached separately from source for faster CI rebuilds).
Stage 2 copies only the jar into a slim `eclipse-temurin:21-jre-jammy` runtime, runs as a
non-root `spring` user, and installs `wget` solely so the container's own `HEALTHCHECK`
(and Compose's healthcheck) can hit `/actuator/health`. JVM flags
(`-Xms192m -Xmx320m -XX:MaxMetaspaceSize=96m -XX:+UseSerialGC`) are sized for a 1GB-RAM box
shared with Caddy and the OS — `UseSerialGC` keeps GC bookkeeping overhead low below ~1-2GB
heaps.

**Frontend** (`frontend/Dockerfile`): multi-stage build. Stage 1 runs `npm ci && npm run build`
with the four `VITE_*` variables passed in as Docker build args (Vite inlines these into the
JS bundle at *build* time, so they must be build args, not runtime env vars). Stage 2 is a
bare `busybox` image whose only job is to hold the built `/dist` so the `frontend-assets`
service in Compose can copy it out into a shared volume that Caddy serves from directly —
there is no Node/Nginx process running in production for the frontend.

## docker-compose.yml

Three services, no local Postgres, no load balancer:
- `backend` — pulls from GHCR, reads all app config from `.env` via `env_file`, healthchecked
  against `/actuator/health`.
- `frontend-assets` — pulls from GHCR, runs once (`restart: "no"`) to populate the
  `frontend_dist` named volume, then exits successfully.
- `caddy` — only starts once `backend` is `service_healthy` and `frontend-assets` has
  `service_completed_successfully`, so it never proxies to a backend that isn't ready yet or
  serves an empty asset volume.

No secrets live in `docker-compose.yml` — image tags use `${GHCR_OWNER}` and the backend's
config comes entirely from the server's `.env` file (see `.env.example`).

## GitHub Actions (`.github/workflows/deploy.yml`)

On every push to `main`:
1. **build-and-push**: builds both Docker images with Buildx (GHA layer caching enabled),
   tags them `ghcr.io/<lowercased-owner>/smartqueue-{backend,frontend}:latest`, pushes using
   the automatic `GITHUB_TOKEN` (no extra registry account needed).
2. **deploy** (runs after build-and-push succeeds): SCPs the repo's `docker-compose.yml` and
   `Caddyfile` to `~/smartqueue-deploy` on the box, then SSHes in and runs
   `docker compose pull && docker compose up -d && docker image prune -f`.

If either job fails (build error, SSH failure, non-zero exit from the deploy script), the
workflow run is marked failed — there's no swallowing of errors.

## Server layout (on the EC2 box)

```
~/smartqueue-deploy/
├── docker-compose.yml   # synced by CI on every deploy
├── Caddyfile             # synced by CI on every deploy
└── .env                  # created once manually, never touched by CI, never committed
```

Docker volumes (managed by Docker, not on the host filesystem directly):
- `frontend_dist` — shared between `frontend-assets` and `caddy`
- `caddy_data` / `caddy_config` — Let's Encrypt certs and Caddy state, persisted across deploys

## Troubleshooting

- **`docker compose ps` shows backend unhealthy**: check `docker compose logs backend` — most
  likely a bad `DATABASE_URL`/Supabase credential in `.env`, or the JVM OOM-killed (check
  `dmesg | grep -i oom`); the 1GB box has 2GB swap as a safety net but sustained memory
  pressure still means something is misconfigured upstream (e.g. a runaway query).
- **Caddy never gets a TLS cert**: DNS for `smart-queue.in`/`www` must point at the box's
  Elastic IP *before* Caddy can complete the ACME HTTP-01 challenge; check
  `docker compose logs caddy` for ACME errors, and confirm port 80 is open in the EC2 security
  group (required for the challenge even though the site is served over 443).
- **`docker compose pull` fails on the box**: GHCR packages are public by design (no
  `docker login` needed) — if this fails, check the package visibility under the repo's
  GitHub Packages settings.
- **Frontend builds but API calls 404/CORS-fail**: `VITE_API_BASE_URL`/`VITE_WS_BASE_URL` are
  baked in at build time — a stale GitHub Actions Variable means the *next* push picks up the
  fix, not the current deployment. Also check `APP_CORS_ORIGINS` in the server `.env` includes
  the exact scheme+host being browsed from.
- **WebSocket doesn't connect**: confirm the Caddyfile's `/ws*` handle block is reachable
  (`curl -i https://smart-queue.in/ws/info` should return a SockJS response, not a 404).

## Checklist

**Files created**
- `backend/Dockerfile`, `frontend/Dockerfile`
- `docker-compose.yml`, `Caddyfile`
- `.github/workflows/deploy.yml`
- `backend/.dockerignore`, `frontend/.dockerignore`
- `backend/.env.example`, `.env.example`
- `README_DEPLOY.md`

**Files modified**
- `backend/pom.xml` (added `spring-boot-starter-actuator`)
- `backend/src/main/resources/application.yml` (exposed `/actuator/health`)
- `backend/Dockerfile` (added `wget` + `HEALTHCHECK`)
- `docker-compose.yml` (`caddy` now depends on `backend: service_healthy`)
- `Caddyfile` (added `zstd` encoding + ACME contact email)
- `.github/workflows/deploy.yml` (added SCP sync step before deploy)

**Files removed**
- `frontend/vercel.json` (Vercel-only SPA rewrite rule; Caddy's `try_files` replaces it)

**GitHub Secrets required** (Settings → Secrets and variables → Actions → Secrets)
- `EC2_HOST` — the box's Elastic IP
- `EC2_USER` — `ubuntu`
- `EC2_SSH_KEY` — full contents of the private key used to SSH into the box
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (build-time, treated as a secret out of caution)

**GitHub Variables required** (Settings → Secrets and variables → Actions → Variables)
- `VITE_API_BASE_URL` — `https://smart-queue.in/api`
- `VITE_WS_BASE_URL` — `https://smart-queue.in/ws`
- `VITE_SUPABASE_URL` — the Supabase project URL

**Server files required** (on the EC2 box, `~/smartqueue-deploy/`)
- `docker-compose.yml`, `Caddyfile` (synced automatically by CI after the first manual copy)
- `.env` (created once manually — see `.env.example` for the variable list)

**Environment variables required** (server `.env`, all already used by `application.yml` —
none invented for this migration)
- `GHCR_OWNER`, `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `APP_JWT_SECRET`,
  `APP_JWT_TTL_MINUTES`, `APP_CORS_ORIGINS`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD`, `DEV_AUTH_ENABLED`, `RESEND_API_KEY`,
  `RESEND_FROM_EMAIL`, `FRONTEND_URL`, `TOMCAT_MAX_THREADS`, `TOMCAT_MIN_SPARE_THREADS`,
  `HIKARI_MAX_POOL_SIZE`, `HIKARI_MIN_IDLE`
