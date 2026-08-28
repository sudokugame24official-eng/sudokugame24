# STAGING ACCEPTANCE GATE
> **Local Baseline:** Commit `833ee0e` (`docs: certify final pre-staging baseline`)  
> **Purpose:** This document defines the exact gate criteria that must be checked and confirmed on the **live staging environment** before any production deployment is approved.  
> **Allowed Statuses:** `READY` | `BLOCKED` | `NOT_VERIFIED`

---

> ⚠️ **IMPORTANT — Do not confuse local verification with staging verification.**  
> All gates below are `NOT_VERIFIED` until manually tested against the live staging URL.  
> `READY` may only be declared when a human has executed the test against the deployed staging environment and observed the correct response.

---

## GATE 1 — DATABASE
| Check | Expected | Status |
| :--- | :--- | :--- |
| Neon staging branch provisioned (separate from production) | Branch exists, not sharing production URL | `NOT_VERIFIED` |
| All 8 migrations applied (`migrate deploy`) | `migrate status` = "up to date" | `NOT_VERIFIED` |
| `GET /ready` returns `200 { status: 'ready', database: 'connected' }` | HTTP 200 | `NOT_VERIFIED` |
| No `prisma db push` used | Only `migrate deploy` | `NOT_VERIFIED` |

---

## GATE 2 — API
| Check | Expected | Status |
| :--- | :--- | :--- |
| Railway deployment succeeds (no crash on startup) | Container running | `NOT_VERIFIED` |
| `GET /health` returns `200 { status: 'ok' }` | HTTP 200 | `NOT_VERIFIED` |
| `GET /ready` returns `200` with database connected | HTTP 200 | `NOT_VERIFIED` |
| `JWT_SECRET` is set (server starts without FATAL ERROR) | No crash | `NOT_VERIFIED` |
| `REDIS_URL` is set (Redis adapter connected) | No crash at boot | `NOT_VERIFIED` |
| `ADS_ENABLED=false` confirmed | No ads served | `NOT_VERIFIED` |
| `LIVE_STRIPE=false` confirmed | No real payments | `NOT_VERIFIED` |

---

## GATE 3 — WEB (FRONTEND)
| Check | Expected | Status |
| :--- | :--- | :--- |
| Vercel deployment succeeds (60 routes compiled) | Build: pass | `NOT_VERIFIED` |
| Homepage loads at `https://staging.YOURDOMAIN.com` | 200, correct content | `NOT_VERIFIED` |
| EN / FR / DE locale switching works | `/en`, `/fr`, `/de` render | `NOT_VERIFIED` |
| No 404 on any primary navigation link | 0 broken links | `NOT_VERIFIED` |
| `NEXT_PUBLIC_API_URL` correctly points to Railway API | API calls succeed | `NOT_VERIFIED` |

---

## GATE 4 — AUTH
| Check | Expected | Status |
| :--- | :--- | :--- |
| Registration flow completes (new account created) | 201 + cookie set | `NOT_VERIFIED` |
| Login flow completes (JWT cookie set, HttpOnly) | 200 + `access_token` cookie | `NOT_VERIFIED` |
| Logout clears cookie | Cookie deleted | `NOT_VERIFIED` |
| Email verification token sent after registration | Email delivered | `NOT_VERIFIED` |
| Clicking verification link sets `isEmailVerified: true` | DB updated | `NOT_VERIFIED` |
| Duplicate email registration rejected | 400/409 error | `NOT_VERIFIED` |
| Protected route `/profile` blocked for unauthenticated | 401 redirect | `NOT_VERIFIED` |
| Google OAuth redirect works (if credentials configured) | Redirect to Google | `NOT_VERIFIED` |

---

## GATE 5 — WEBSOCKET
| Check | Expected | Status |
| :--- | :--- | :--- |
| WSS handshake succeeds from browser (`wss://api-staging...`) | Connected | `NOT_VERIFIED` |
| Cloudflare WebSocket proxying active (not blocked) | No 101 upgrade failure | `NOT_VERIFIED` |
| Socket.IO namespaces: `/`, `/duel`, `/chat`, `/presence` connect | No connection error | `NOT_VERIFIED` |
| Redis pub/sub adapter active (not in-memory fallback) | `REDIS_URL` confirmed set | `NOT_VERIFIED` |
| JWT verification on socket connection (unauthenticated rejected) | 401 on bad token | `NOT_VERIFIED` |

---

## GATE 6 — REDIS
| Check | Expected | Status |
| :--- | :--- | :--- |
| Upstash staging database provisioned | Connection string valid | `NOT_VERIFIED` |
| `rediss://` (TLS) connection string used | Not `redis://` (plaintext) | `NOT_VERIFIED` |
| API boot log shows Redis connected (no fallback warning) | No adapter fallback | `NOT_VERIFIED` |
| Duel game state writes/reads via Redis | Match state persists | `NOT_VERIFIED` |

---

## GATE 7 — FORUM
| Check | Expected | Status |
| :--- | :--- | :--- |
| Forum category list loads | Topics visible | `NOT_VERIFIED` |
| Clicking a topic navigates to `/forum/topic/[slug]` | Correct detail page | `NOT_VERIFIED` |
| Fallback `/forum/[id]` redirects to slug | No 404 | `NOT_VERIFIED` |
| Topic content, author, and replies visible | Full content | `NOT_VERIFIED` |
| Creating a new topic (authenticated) works | Topic saved + visible | `NOT_VERIFIED` |
| Replying to a topic works | Reply appears | `NOT_VERIFIED` |

---

## GATE 8 — DUEL
| Check | Expected | Status |
| :--- | :--- | :--- |
| Ranked matchmaking queue works | Match created | `NOT_VERIFIED` |
| Both players navigate to `/duel/[matchId]` | Board renders for both | `NOT_VERIFIED` |
| `join_match` event syncs board state on reconnect | No blank screen | `NOT_VERIFIED` |
| Winner receives correct coin payout (2X pot) | Ledger credited | `NOT_VERIFIED` |
| Disconnect player forfeits correctly | Loser result persisted | `NOT_VERIFIED` |
| Bot duel works (EASY / MEDIUM / HARD) | Bot moves visible | `NOT_VERIFIED` |

---

## GATE 9 — DAILY CHALLENGE
| Check | Expected | Status |
| :--- | :--- | :--- |
| Daily challenge puzzle loads for today | Puzzle grid visible | `NOT_VERIFIED` |
| First submission succeeds (verified user) | 200 + coins rewarded | `NOT_VERIFIED` |
| Second submission returns `409 Conflict` (not 500) | HTTP 409 | `NOT_VERIFIED` |
| Streak counter increments | Profile updated | `NOT_VERIFIED` |
| Daily leaderboard at `/daily/leaderboard` loads | Rankings visible | `NOT_VERIFIED` |

---

## GATE 10 — FRIENDS
| Check | Expected | Status |
| :--- | :--- | :--- |
| Friend search by username works | Results returned | `NOT_VERIFIED` |
| Send friend request | Pending state set | `NOT_VERIFIED` |
| Accept friend request | Friends status confirmed | `NOT_VERIFIED` |
| Block user prevents DM | DM rejected | `NOT_VERIFIED` |
| Friend challenge invite created | Redis TTL key set | `NOT_VERIFIED` |

---

## GATE 11 — CHAT
| Check | Expected | Status |
| :--- | :--- | :--- |
| Global chat room joins on `/chat` | Connected, presence visible | `NOT_VERIFIED` |
| Message send + receive in real-time | Both users see message | `NOT_VERIFIED` |
| Blocked user cannot DM target user | DM rejected with 403 | `NOT_VERIFIED` |
| Reconnecting socket rejoins rooms | No message loss | `NOT_VERIFIED` |

---

## GATE 12 — ADMIN
| Check | Expected | Status |
| :--- | :--- | :--- |
| `/admin` redirects non-admin users | 401/403 or login redirect | `NOT_VERIFIED` |
| Super Admin can login and access all 22 modules | All admin pages load | `NOT_VERIFIED` |
| Daily challenge config is editable from admin panel | Save persists | `NOT_VERIFIED` |
| User list and role assignment works | User role updated | `NOT_VERIFIED` |
| Feature flag toggle works | Flag saved to DB | `NOT_VERIFIED` |
| SEO metadata editable from admin | Saved to DB | `NOT_VERIFIED` |

---

## GATE 13 — SEO
| Check | Expected | Status |
| :--- | :--- | :--- |
| `GET /robots.txt` returns 200 | Correct directives | `NOT_VERIFIED` |
| `GET /sitemap.xml` returns 200 with routes | Valid XML | `NOT_VERIFIED` |
| Homepage `<title>` and `<meta description>` are set | Not empty | `NOT_VERIFIED` |
| `hreflang` tags present for EN/FR/DE | Correct alternate links | `NOT_VERIFIED` |
| JSON-LD structured data on key pages | Valid schema | `NOT_VERIFIED` |

---

## GATE 14 — MOBILE
| Check | Expected | Status |
| :--- | :--- | :--- |
| 375px (iPhone SE): no clipping or overflow | Layout correct | `NOT_VERIFIED` |
| 390px (iPhone 14): no clipping or overflow | Layout correct | `NOT_VERIFIED` |
| 768px (iPad): responsive layout | Layout correct | `NOT_VERIFIED` |
| Sudoku numpad accessible on mobile | Numpad visible | `NOT_VERIFIED` |
| Admin panel usable on tablet (768px) | No broken layout | `NOT_VERIFIED` |

---

## GATE 15 — SECURITY
| Check | Expected | Status |
| :--- | :--- | :--- |
| `access_token` cookie is `HttpOnly=true` | Cannot be read by JS | `NOT_VERIFIED` |
| `Secure` flag set in staging (HTTPS) | Confirmed in DevTools | `NOT_VERIFIED` |
| CORS rejects requests from unlisted origins | 403 | `NOT_VERIFIED` |
| SQL injection attempt on search returns 400 | Validation rejects it | `NOT_VERIFIED` |
| Unauthenticated WebSocket connection rejected | 401 | `NOT_VERIFIED` |
| Admin routes blocked for non-admin users | 403 | `NOT_VERIFIED` |
| Helmet headers present (`X-Content-Type-Options`, etc.) | Headers present | `NOT_VERIFIED` |

---

## GATE 16 — ANALYTICS
| Check | Expected | Status |
| :--- | :--- | :--- |
| Admin analytics page loads without crash | 200, data visible | `NOT_VERIFIED` |
| DAU / WAU / MAU counters visible | Non-zero after test activity | `NOT_VERIFIED` |
| Game event tracking (solo, duel, daily) fires correctly | Events recorded | `NOT_VERIFIED` |
| No fabricated or hardcoded metrics | Data matches real DB | `NOT_VERIFIED` |

---

## FINAL GATE SUMMARY

| Gate | Gate Name | Status |
| :--- | :--- | :--- |
| 1 | DATABASE | `NOT_VERIFIED` |
| 2 | API | `NOT_VERIFIED` |
| 3 | WEB | `NOT_VERIFIED` |
| 4 | AUTH | `NOT_VERIFIED` |
| 5 | WEBSOCKET | `NOT_VERIFIED` |
| 6 | REDIS | `NOT_VERIFIED` |
| 7 | FORUM | `NOT_VERIFIED` |
| 8 | DUEL | `NOT_VERIFIED` |
| 9 | DAILY | `NOT_VERIFIED` |
| 10 | FRIENDS | `NOT_VERIFIED` |
| 11 | CHAT | `NOT_VERIFIED` |
| 12 | ADMIN | `NOT_VERIFIED` |
| 13 | SEO | `NOT_VERIFIED` |
| 14 | MOBILE | `NOT_VERIFIED` |
| 15 | SECURITY | `NOT_VERIFIED` |
| 16 | ANALYTICS | `NOT_VERIFIED` |

> **Staging approval decision:** All gates must show `READY` before any production deployment is considered.  
> Update each row from `NOT_VERIFIED` to `READY` or `BLOCKED` as each gate is tested on the live staging URL.

```
CURRENT STATUS: LOCAL_PRODUCT_FROZEN / STAGING_PREPARED / STAGING_NOT_YET_TESTED
```
