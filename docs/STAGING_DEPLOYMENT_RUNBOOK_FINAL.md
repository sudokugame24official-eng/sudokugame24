# STAGING DEPLOYMENT RUNBOOK — FINAL
> **Status:** `LOCAL_PRODUCT_FROZEN` / `STAGING_PREPARED`  
> **Version:** Commit `833ee0e` (docs: certify final pre-staging baseline)  
> **Date:** 2026-08-28  
> **This document is the canonical single-source operational guide for deploying to staging.**

---

## PART 1 — INFRASTRUCTURE OVERVIEW

### Services
| Service | Role | Provider |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 static/SSR | Vercel |
| **Backend API** | NestJS 20 / Docker | Railway |
| **Database** | PostgreSQL 15 | Neon (staging branch, NOT production) |
| **Redis / Pub-Sub** | Socket.IO adapter + cache | Upstash (staging database) |
| **CDN / DNS / SSL** | Global proxy + TLS termination | Cloudflare |
| **Error Monitoring** | Runtime exception capture | Sentry |
| **VPS Fallback** | Alternative self-hosted deployment | Hostinger (portable via Docker Compose) |

---

## PART 2 — EXACT DEPLOYMENT ORDER

> ⚠️ **Follow this order strictly. Never run migrations before the DB is confirmed, never start the API before migrations complete.**

```
Step 1  → Provision Neon staging branch (separate from production)
Step 2  → Provision Upstash Redis staging database
Step 3  → Set Railway environment variables (see Part 3)
Step 4  → Set Vercel environment variables (see Part 3)
Step 5  → Run Prisma migrations on Neon staging (see Part 5)
Step 6  → Deploy API to Railway
Step 7  → Confirm GET /health → { status: 'ok' }
Step 8  → Confirm GET /ready → { status: 'ready', database: 'connected' }
Step 9  → Deploy Frontend to Vercel
Step 10 → Confirm homepage loads with correct locale
Step 11 → Configure Cloudflare DNS (see Part 7)
Step 12 → Confirm SSL/TLS: A-grade via ssllabs.com
Step 13 → Confirm WSS connection from browser
Step 14 → Configure Sentry DSN for API and Web
Step 15 → Run Staging Acceptance Gate (docs/STAGING_ACCEPTANCE_GATE.md)
```

---

## PART 3 — ENVIRONMENT VARIABLES

### 3A — Railway (API)
Copy from `.env.staging.example` and fill real values.

```env
# REQUIRED — FAIL-FAST if missing (server refuses to start)
DATABASE_URL=postgresql://...@ep-staging.neon.tech/sudoku_staging?pgbouncer=true
DIRECT_URL=postgresql://...@ep-staging.neon.tech/sudoku_staging
REDIS_URL=rediss://default:TOKEN@staging-redis.upstash.io:30000
JWT_SECRET=<64-char random string — generate with: openssl rand -hex 32>
JWT_EXPIRATION=1h
FRONTEND_URL=https://staging.YOURDOMAIN.com
NODE_ENV=staging
PORT=3001

# STAGING DEFAULTS — Keep these values until explicit owner decision
ADS_ENABLED=false
LIVE_STRIPE=false

# STRIPE — Test mode keys only. Never use sk_live_ here.
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# OAUTH — Required for Google login to work at runtime
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://api-staging.YOURDOMAIN.com/auth/google/callback

# OBSERVABILITY
NEXT_PUBLIC_SENTRY_DSN=https://...@o0.ingest.sentry.io/...
SENTRY_AUTH_TOKEN=...
```

### 3B — Vercel (Frontend)
```env
NEXT_PUBLIC_API_URL=https://api-staging.YOURDOMAIN.com
NEXT_PUBLIC_WS_URL=wss://api-staging.YOURDOMAIN.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_SENTRY_DSN=https://...@o0.ingest.sentry.io/...
NODE_ENV=production
```

> ⚠️ `STRIPE_SECRET_KEY`, `JWT_SECRET`, `DATABASE_URL`, and `REDIS_URL` must **never** appear in Vercel environment variables — they belong exclusively on the Railway API.

---

## PART 4 — SECRETS SECURITY AUDIT

| Secret | Git-ignored? | Committed? | Safe? |
| :--- | :--- | :--- | :--- |
| `.env` | ✅ Yes (`.gitignore` L7–9) | ❌ Never | ✅ |
| `.env.staging` | ✅ Yes | ❌ Never | ✅ |
| `.env.production` | ✅ Yes | ❌ Never | ✅ |
| `*.example` files | ❌ Tracked (intentional) | ✅ Contains only placeholders | ✅ |
| `JWT_SECRET` in code | ✅ Fail-fast guard in `main.ts` L9–11 | ❌ Never | ✅ |

> **JWT Fail-Fast:** `apps/api/src/main.ts` line 9–11 throws `FATAL ERROR: JWT_SECRET environment variable is missing.` at startup. The API will **refuse to start** without it.

---

## PART 5 — DATABASE MIGRATION PROCEDURE

> ⚠️ NEVER use `prisma db push` in staging or production. Always use `prisma migrate deploy`.

### Migration Chain (8 migrations, must apply in order)
```
0_init
20260816200000_ad_slot_fields
20260816210000_cms_workflow
20260816220000_media_library
20260817000000_qa_community
20260817010000_forum_moderation
20260817020000_daily_admin
20260817030000_analytics
```

### Command
```bash
# From monorepo root — run this ONCE against the staging Neon branch
DATABASE_URL="postgresql://..." \
DIRECT_URL="postgresql://..." \
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
```

### Verification After Migration
```bash
npx prisma migrate status --schema=packages/database/prisma/schema.prisma
# Expected: "Database schema is up to date!"
```

---

## PART 6 — REDIS CONFIGURATION

- **Provider:** Upstash Redis (TLS-enabled `rediss://` connection string required)
- **Staging DB:** Separate from production. Create a new Upstash database named `sudoku-staging`.
- **Fail-Fast:** `apps/api/src/redis/redis.adapter.ts` L10–15: if `NODE_ENV=staging` and `REDIS_URL` is missing, the API throws and refuses to start.
- **Purpose:** Socket.IO multi-instance pub/sub adapter for WebSocket broadcast. Required for Duel, Chat, Presence.

---

## PART 7 — DNS & CLOUDFLARE CONFIGURATION

### DNS Records (replace `YOURDOMAIN.com`)
```
Type   Name             Target                              Proxy
A      staging          <Vercel IP>                         ✅ Orange cloud
CNAME  api-staging      <Railway domain>.railway.app        ✅ Orange cloud
```

### Cloudflare Settings
- SSL/TLS Mode: **Full (Strict)**
- Always Use HTTPS: **ON**
- WebSocket support: **ON** (required for Socket.IO WSS)
- Minimum TLS Version: **1.2**

---

## PART 8 — WEBSOCKET (WSS) CONFIGURATION

- Socket.IO is configured in `apps/api/src/redis/redis.adapter.ts`
- CORS origin is set from `FRONTEND_URL` environment variable
- WebSocket namespaces: `/`, `/duel`, `/chat`, `/presence`
- All WebSocket connections require a valid JWT cookie (`access_token`)
- Cloudflare proxy is WebSocket-compatible when using Full (Strict) SSL mode

---

## PART 9 — DOCKER / VPS PORTABILITY (HOSTINGER)

The API includes a production-grade multi-stage Dockerfile (`Dockerfile.api`):
- Stage 1: Turborepo prune
- Stage 2: Install & Build (NestJS + Prisma Client generation)
- Stage 3: Production-only dependencies
- Stage 4: Non-root runner (`nestjs` user, UID 1001)

To deploy to Hostinger VPS:
```bash
docker build -f Dockerfile.api -t sudoku-api:latest .
docker run -d \
  --env-file .env.staging \
  -p 3001:3001 \
  --name sudoku-api \
  sudoku-api:latest
```

Docker Compose variant: `docker-compose.prod.yml` (includes Nginx reverse proxy).

---

## PART 10 — HEALTH ENDPOINTS

Both endpoints are unauthenticated and must respond before accepting traffic.

| Endpoint | Method | Expected Response | Purpose |
| :--- | :--- | :--- | :--- |
| `GET /health` | GET | `200 { status: 'ok', timestamp: '...' }` | Liveness probe (Railway / load balancer) |
| `GET /ready` | GET | `200 { status: 'ready', database: 'connected' }` | Readiness probe (DB connectivity) |
| `GET /ready` (DB down) | GET | `503 { status: 'not_ready', database: 'disconnected' }` | Fail-safe signal |

---

## PART 11 — SENTRY CONFIGURATION

- DSN configured via `NEXT_PUBLIC_SENTRY_DSN` (frontend) and `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` (API)
- Source maps are uploaded during CI build
- Staging environment tag: `environment: staging`
- Alert on: error rate spikes, unhandled exceptions, P95 latency > 2s

---

## PART 12 — STRIPE TEST MODE

- Only `sk_test_...` and `pk_test_...` keys are permitted in staging
- `ADS_ENABLED=false` and `LIVE_STRIPE=false` must be confirmed before any real user traffic
- Webhook endpoint: `POST /shop/webhook` — must be configured in Stripe dashboard for staging domain

---

## PART 13 — ROLLBACK PROCEDURE

### API Rollback
```bash
# Railway: redeploy previous image from dashboard
# OR via CLI:
railway rollback
```

### Database Rollback
> ⚠️ Prisma does not support automatic migration rollback. Rollback requires a manual SQL undo script or a Neon branch restore.
```bash
# Neon: restore from branch snapshot (Neon dashboard → Branch → Restore)
```

### Frontend Rollback
```bash
# Vercel: Instant rollback via dashboard → Deployments → Promote previous
```

---

## PART 14 — BACKUP PROCEDURE

- **Database:** Neon provides continuous WAL-based backups per branch. Point-in-time restore available from Neon dashboard.
- **Redis:** Upstash provides daily snapshots. Session/duel state is ephemeral by design.
- **Static Assets:** Vercel deployment history retains all previous builds indefinitely.
