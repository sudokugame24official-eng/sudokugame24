# FINAL CONTRADICTION & GAP RECONCILIATION AUDIT

This document reconciles all discrepancies discovered between historical documentation artifacts and the active runtime code base.

---

## 1. Contradictions Identified & Reconciled

| # | Topic / Area | Document Rule (Previous Drafts) | Active Code Rule (`apps/api`) | Actual Runtime / Test Behavior | Reconciled Canonical Rule | Remediation Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C-01** | **Solo Game Rewards** | Docs listed Easy `+25`, Medium `+35`, Hard `+50`, Expert `+75` | Code in `sudoku.service.ts` awards: Easy `+50`, Medium `+100`, Hard `+200`, Expert `+400`, Master `+800` | Code awards 50/100/200/400/800; tests assert against active code values | **Code is Canonical** (`50/100/200/400/800`). Gives meaningful progression for cosmetic shop purchases. | Updated [docs/FINAL_CANONICAL_COIN_TABLE.md](file:///c:/Users/21650/.gemini/antigravity/scratch/website%20sudoku/docs/FINAL_CANONICAL_COIN_TABLE.md) to match active source code. |
| **C-02** | **Daily Challenge Reward** | Docs listed flat `+100 coins` | Code in `daily.service.ts` awards `coinRewardPerCell * correctCells` (Default `5 coins * ~40 cells = ~200 coins`) | Dynamic based on solved cells; owner can adjust `coinRewardPerCell` in Admin | **Code is Canonical** (Dynamic per cell, default 5 coins/cell). | Reconciled in canonical coin table and admin daily documentation. |
| **C-03** | **Bot Duel Victory Payout** | Some early design notes suggested 2× pot payout on bot win | Code in `duel.service.ts` lines 1407-1418 refunds human stake on win, and sinks stake to house on loss | Real PVP pays 2× pot; Bot matches refund stake (prevents infinite bot coin farming) | **Code is Canonical** (Stake refund on human win; stake sunk on bot win). Prevents inflation. | Reconciled in canonical coin table and duel economy rules. |
| **C-04** | **Prisma Role Enum** | Older test scripts used string `"USER"` | Database schema defines `enum Role { GUEST, MEMBER, PREMIUM_MEMBER, SUPPORT_AGENT, CONTENT_MANAGER, ANALYST, MODERATOR, ADMIN, SUPER_ADMIN }` | User creation requires valid enum value `MEMBER` | **Database Schema is Canonical** (Standard user role is `MEMBER`). | Updated `scripts/seed-uat-personas.js` and permission matrix. |

---

## 2. Infrastructure & Service Status Clarifications

| Feature / Service | Exact Status | Operational Notes |
| :--- | :--- | :--- |
| **User Registration & Login** | ✅ **LOCAL_VERIFIED** | Session JWT tokens and HttpOnly cookies fully functional in local environment. |
| **Email Verification Flow** | ⚠️ **PARTIAL / CODE_READY** | Token generation and URL logic in database is fully working. Real SMTP delivery requires cloud provider credentials. |
| **Welcome Email Trigger** | ⚠️ **PARTIAL / CMS_READY** | CMS templates stored in database. Async dispatch invoked on signup; SMTP provider required for delivery. |
| **Google OAuth Login** | ⚠️ **INFRASTRUCTURE_PENDING / CODE_READY** | Strategy and callback controllers fully implemented. `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` required for runtime authorization. |
| **Stripe Payments** | ⛔ **DISABLED_BY_DESIGN** | Live keys locked. Webhook handler and DB subscription architecture ready. |
| **Rewarded Ads** | ⛔ **DISABLED_BY_DESIGN** | UI opt-in architecture ready; disabled until commercial rollout. |
| **Redis Multiplayer Scaling** | ⚠️ **LOCAL_IN_MEMORY / PROD_READY** | Single-instance socket adapter runs locally; `RedisIoAdapter` connects automatically when `REDIS_URL` is provided. |

---

## 3. Reconciled Guest vs. Unverified vs. Verified Member Policy

- **Anonymous Guest:** Browsing of all public content (Home, Play Solo Practice, Daily puzzle preview, Learn/Academy, Forum read-only, Q&A read-only, Shop catalogue, Legal/Help/FAQ). No ranking, no coin accrual, no chat, no multi-client duels.
- **Unverified Member (`isEmailVerified = false`):** Can solve practice puzzles and customize local profile. Blocked from ranked multiplayer queues, forum topic creation, and public friend challenges until email verification token is validated.
- **Verified Member (`isEmailVerified = true`):** Full access to competitive duels, daily reward ledger credits, chat, forum authoring, and shop purchases.
