# OWNER HANDOVER & OPERATIONS GUIDE
**Platform:** Global World-Class Sudoku Platform  
**Target Audience:** Non-technical Platform Owner, Lead Operator, System Administrator, Future Buyer  
**Last Updated:** August 2026

---

## 1. Executive Summary & Architecture Overview

The platform is an international, SEO-first, real-time multiplayer and solo Sudoku community platform engineered for performance, security, and effortless owner operation.

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLOUDFLARE EDGE CDN                       │
│             (SSL/TLS, DDoS Protection, Caching, WAF)            │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
   ┌───────────────────────────┐   ┌───────────────────────────┐
   │    FRONTEND (Next.js 16)  │   │     BACKEND (NestJS 11)   │
   │  - App Router & SSR/SSG   │   │  - REST API & WebSockets  │
   │  - i18n (en, fr, de)      │   │  - Authoritative Engine   │
   │  - Admin Control Center   │   │  - RBAC & ValidationPipe  │
   │  - Hosted on Vercel/Node  │   │  - Hosted on Railway/Node │
   └─────────────┬─────────────┘   └─────────────┬─────────────┘
                 │                               │
                 └───────────────┬───────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
   ┌───────────────────────────┐   ┌───────────────────────────┐
   │    POSTGRESQL DATABASE    │   │      REDIS (Upstash/IO)   │
   │  - Neon / Managed Postgres│   │  - Multi-instance rooms   │
   │  - 34 tables, 43+ indexes │   │  - Presence TTL heartbeat │
   │  - Strict Prisma ORM      │   │  - ZSET Leaderboards      │
   └───────────────────────────┘   └───────────────────────────┘
```

---

## 2. Infrastructure & Service Inventory

| Service | Role | Environment Variables Needed | Recommended Provider |
|---|---|---|---|
| **Web Application** | Next.js Frontend | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` | Vercel / Railway / Docker |
| **API Application** | NestJS Backend | `PORT`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` | Railway / Render / AWS ECS |
| **Database** | Primary Data Store | `DATABASE_URL` (Connection string) | Neon / AWS RDS / Supabase |
| **Redis** | WebSockets, TTL, Cache | `REDIS_URL` (`rediss://...`) | Upstash / Redis Cloud |
| **Payment Gateway** | Monetization & Coins | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard |
| **Advertising** | AdSense Banners & Rewards| Configured via `/admin/monetization` in DB | Google AdSense |
| **Error Monitoring** | Crash Reporting | `SENTRY_DSN` | Sentry.io |

> **IMPORTANT:** Never commit `.env` files or credentials into the Git repository. All secrets must be configured directly in your hosting dashboard.

---

## 3. Owner Control Center Guide

As the owner, you can manage the entire platform without touching any code from the `/admin` portal:

### A. Theme Studio (`/admin/theme`)
- **Brand Identity:** Update brand name, logo URL, favicon URL, and color palette (Primary, Accent, Background, Surface, Border, Text).
- **CSS Variable Engine:** All themes compile into `:root` CSS variables. No code modification or rebuild required.
- **Safety:** Built-in Draft, Live Preview, Publish, and instant **1-Click Rollback** to the previous version.

### B. Homepage Builder (`/admin/homepage`)
- **Visual Section Manager:** Toggle sections on/off (Hero, Daily Challenge, Duel Arena, Leaderboard, Academy, Forum, Q&A, Stats, CTA).
- **Reordering:** Move sections up or down to adjust user conversion flow.
- **Content Editing:** Edit section titles, descriptions, CTA buttons, and internal destination links.

### C. SEO & SERP Control (`/admin/seo`)
- **Live Google Preview:** See real-time Google search result snippets as you type.
- **Character Metrics:** Real-time feedback ensuring Titles (30–60 chars) and Descriptions (120–160 chars) meet Google SEO guidelines.
- **Robots & Sitemaps:** Toggle dynamic XML sitemaps and global noindex flags.

### D. Analytics & Insights (`/admin/analytics`)
- **Real-Time Counters:** Measured online presence, active duels, and daily engagement (zero fake data).
- **Plain-Language Insights:** Automated weekly comparisons (e.g., *"Daily active players increased 14% compared with last week"*).
- **KPI Metrics:** DAU, WAU, MAU, game completions, coin velocity, and revenue.

### E. User & Moderation Management (`/admin/users`, `/admin/moderation`)
- **Search & Filters:** Search users by username, email, rank, or status.
- **Ban Enforcement:** Banned users are instantly blocked at both REST API and WebSocket gateway levels with mandatory audit reason logging.
- **Coin Adjustments:** Safely credit or debit coins with an immutable ledger audit trail.

### F. Shop & Economy (`/admin/shop`, `/admin/monetization`)
- **Products:** Add, edit, activate, or archive cosmetics, boosters, and VIP memberships.
- **Caps & Limits:** Set global stock limits and max purchases per user directly enforced by the backend.

---

## 4. Operational Runbooks

### A. Deploying Updates
1. Push changes to the `main` branch on GitHub.
2. Vercel automatically deploys the frontend web app.
3. Railway / Docker automatically builds and deploys the API service.
4. Database migrations run automatically via `prisma migrate deploy` in the deployment pipeline.

### B. Database Migrations Runbook
- **Rule:** Never run `prisma db push` against staging or production.
- **Applying Migrations:** Run `npx prisma migrate deploy` in `packages/database`.
- **First-Time Staging Setup:** If migrating an existing database for the first time, mark the baseline as resolved:
  ```bash
  npx prisma migrate resolve --applied 0_init
  npx prisma migrate deploy
  ```

### C. Secret Rotation Procedure
If credentials need rotation (e.g. database password or JWT secret):
1. **Neon / Database:** Generate a new password in the Neon Console. Update `DATABASE_URL` in the hosting dashboard.
2. **JWT Secret:** Generate a new 64-character random string (`openssl rand -hex 32`). Update `JWT_SECRET` in the backend hosting dashboard and trigger a restart.
3. **Stripe:** Create a new webhook signing secret in the Stripe Dashboard, update `STRIPE_WEBHOOK_SECRET`, and redeploy.

### D. Backup & Disaster Recovery
- **Neon Point-in-Time Restore:** Neon automatically takes continuous WAL snapshots. Use the Neon console to branch or restore to any minute in the last 7 to 30 days.
- **Manual CLI Backup:**
  ```bash
  pg_dump -d "$DATABASE_URL" -Fc > backup_$(date +%Y%m%d_%H%M%S).dump
  ```
- **Restore:**
  ```bash
  pg_restore -d "$DATABASE_URL" -c backup_YYYYMMDD_HHMMSS.dump
  ```

---

## 5. Security & Anti-Cheat Summary

1. **Anti-Cheat Validation:** The solved board is never transmitted to the player's browser during solo games or duels. The backend validates board completion authoritatively upon submission.
2. **Duel Concurrency:** Multiplayer moves are guarded with optimistic Redis WATCH/MULTI transactions and TTL expiration to prevent race conditions.
3. **Input Sanitization:** All incoming requests pass through NestJS `ValidationPipe` with strict DTO whitelisting. HTML/script injection is blocked across CMS, Theme, and Homepage modules.
4. **Rate Limiting:** IP and user-based throttling protect against DDoS and brute-force attacks.
