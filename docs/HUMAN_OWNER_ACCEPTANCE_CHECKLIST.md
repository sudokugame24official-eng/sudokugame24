# HUMAN OWNER ACCEPTANCE CHECKLIST
> **Status:** `LOCAL_PRODUCT_FROZEN` / `STAGING_PREPARED` / `PUBLIC_DEPLOYMENT_DISABLED`  
> **Environment:** Local development servers (no cloud)  
> **Date prepared:** 2026-08-28  
> **Product frozen at:** Commit `833ee0e`

---

> [!IMPORTANT]
> **DO NOT mark any checkbox as PASS until you personally observe the expected result.**  
> These are not automated test claims. Every row requires a human click, read, and decision.

---

## LOCAL ENVIRONMENT STATUS

| Service | URL | Status |
| :--- | :--- | :--- |
| **Web (Frontend)** | http://localhost:3000 | ✅ Running |
| **API (Backend)** | http://localhost:3001 | ✅ Running |
| **Admin Panel** | http://localhost:3000/en/admin | ✅ Running |
| **Database** | Neon (cloud PostgreSQL) | ✅ Connected |
| **Redis** | Not set locally — in-memory fallback | ⚠️ Local mode |
| **Email / SMTP** | Not configured locally | ⚠️ PARTIAL |
| **Google OAuth** | Not configured locally | ⚠️ INFRA PENDING |
| **Stripe** | Test keys not set | ⚠️ DISABLED |
| **Rewarded Ads** | Disabled by design | ⛔ OFF |

---

## TEST PERSONAS

| Persona | Email | Password | Role | Coins | Level | Email Verified |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **USER_A** | test_usera@sudoku.local | `TestPass_A1!` | MEMBER | 750 | 8 | ✅ Yes |
| **USER_B** | test_userb@sudoku.local | `TestPass_B2!` | MEMBER | 200 | 3 | ✅ Yes |
| **MODERATOR** | test_mod@sudoku.local | `TestPass_M3!` | MODERATOR | 1500 | 20 | ✅ Yes |
| **SUPER_ADMIN** | admin@sudoku.com | `Admin@Sudoku2026!` | SUPER_ADMIN | 10000 | 100 | ✅ Yes |
| **Unverified** | *(Register fresh at /auth)* | *(your choice)* | MEMBER | 1000 | 1 | ❌ No |

> To test the **email-unverified** state: register a brand new account at http://localhost:3000/en/auth

---

## SECTION 1 — GUEST ACCESS MAP

> Open a **fresh browser window / incognito** with no cookies, no localStorage, no prior login.

| Route | Expected Access | Login Required? | Expected Redirect / Fallback |
| :--- | :--- | :--- | :--- |
| `/en` (Homepage) | ✅ CAN VIEW | No | — |
| `/en/play` | ✅ CAN VIEW (start solo as guest) | No | — |
| `/en/daily` | ✅ CAN VIEW puzzle | Login to submit | Prompt to login on submit |
| `/en/duel` | 🔒 LOGIN REQUIRED | Yes | Redirect to `/en/auth` |
| `/en/leaderboard` | ✅ CAN VIEW (read-only) | No | — |
| `/en/learn` | ✅ CAN VIEW | No | — |
| `/en/learn/[article]` | ✅ CAN VIEW article | No | — |
| `/en/forum` | ✅ CAN VIEW | No | — |
| `/en/forum/topic/[slug]` | ✅ CAN VIEW topic | Login to reply/like | Prompt on action |
| `/en/questions` (Q&A) | ✅ CAN VIEW | No | — |
| `/en/help` | ✅ CAN VIEW | No | — |
| `/en/faq` | ✅ CAN VIEW | No | — |
| `/en/chat` | 🔒 LOGIN REQUIRED | Yes | Redirect to `/en/auth` |
| `/en/friends` | 🔒 LOGIN REQUIRED | Yes | Redirect to `/en/auth` |
| `/en/messages` | 🔒 LOGIN REQUIRED | Yes | Redirect to `/en/auth` |
| `/en/profile` | 🔒 LOGIN REQUIRED | Yes | Redirect to `/en/auth` |
| `/en/shop` | ✅ CAN VIEW catalogue | Login to purchase | Prompt on purchase click |
| `/en/admin` | 🔒 LOGIN + ROLE REQUIRED | Yes | Redirect to `/en/auth` or 403 |
| `/en/auth` | ✅ CAN VIEW | No | — |
| `/en/about` | ✅ CAN VIEW | No | — |
| `/en/privacy` | ✅ CAN VIEW | No | — |
| `/en/terms` | ✅ CAN VIEW | No | — |
| `/en/contact` | ✅ CAN VIEW | No | — |

### My Results
| Route | MY RESULT | PASS/FAIL | COMMENTS |
| :--- | :--- | :--- | :--- |
| `/en` | | `[ ]` | |
| `/en/play` | | `[ ]` | |
| `/en/daily` | | `[ ]` | |
| `/en/duel` | | `[ ]` | |
| `/en/leaderboard` | | `[ ]` | |
| `/en/learn` | | `[ ]` | |
| `/en/forum` | | `[ ]` | |
| `/en/questions` | | `[ ]` | |
| `/en/chat` | | `[ ]` | |
| `/en/friends` | | `[ ]` | |
| `/en/profile` | | `[ ]` | |
| `/en/shop` | | `[ ]` | |
| `/en/admin` | | `[ ]` | |

---

## SECTION 2 — NAVIGATION CHECKLIST

> Use a logged-in account for this section. Log in as **USER_A**.

### Header Navigation
| Element | Destination | Expected Result | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- | :--- |
| Logo / Wordmark | `/en` | Homepage loads | | `[ ]` |
| Play | `/en/play` | Difficulty picker or game | | `[ ]` |
| Daily | `/en/daily` | Today's puzzle | | `[ ]` |
| Duel | `/en/duel` | Matchmaking UI | | `[ ]` |
| Leaderboard | `/en/leaderboard` | Rankings table | | `[ ]` |
| Learn | `/en/learn` | Academy index | | `[ ]` |
| Forum | `/en/forum` | Forum category list | | `[ ]` |
| Q&A | `/en/questions` | Q&A list | | `[ ]` |
| Shop | `/en/shop` | Product catalogue | | `[ ]` |
| Profile avatar | `/en/profile` | My profile page | | `[ ]` |
| Notifications bell | Notification panel | Panel opens | | `[ ]` |
| Language switcher EN | `/en/...` | English pages | | `[ ]` |
| Language switcher FR | `/fr/...` | French pages | | `[ ]` |
| Language switcher DE | `/de/...` | German pages | | `[ ]` |

### Footer Navigation
| Element | Destination | Expected Result | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- | :--- |
| About | `/en/about` | About page | | `[ ]` |
| Help | `/en/help` | Help center | | `[ ]` |
| FAQ | `/en/faq` | FAQ page | | `[ ]` |
| Privacy | `/en/privacy` | Privacy policy | | `[ ]` |
| Terms | `/en/terms` | Terms of service | | `[ ]` |
| Contact | `/en/contact` | Contact form | | `[ ]` |
| Guidelines | `/en/guidelines` | Community rules | | `[ ]` |
| Disclaimer | `/en/disclaimer` | Disclaimer page | | `[ ]` |

---

## SECTION 3 — AUTHENTICATION

### 3A — Registration (Unverified State)
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Open `/en/auth` | Registration form visible | | `[ ]` |
| Register with new email | Account created, logged in | | `[ ]` |
| Email already in use | Error: "Email already exists" (409) | | `[ ]` |
| Username already taken | Error: "Username already taken" (409) | | `[ ]` |
| Password < 8 chars | Error: "Password must be 8+ characters" | | `[ ]` |
| Verification email | Email sent (SMTP PARTIAL locally) | | `[ ]` |
| Access `/en/profile` while unverified | Accessible (or limited) | | `[ ]` |
| Access `/en/duel` while unverified | Redirect to auth or blocked | | `[ ]` |
| Access `/en/daily` while unverified | Can view, blocked on submit | | `[ ]` |

### 3B — Login
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Login as USER_A | Success, JWT cookie set (HttpOnly) | | `[ ]` |
| Wrong password | Error: "Identifiants invalides" (401) | | `[ ]` |
| Wrong email | Error: 401 | | `[ ]` |
| More than 5 attempts / min | Rate limited (429) | | `[ ]` |

### 3C — Logout
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Click logout | Cookie cleared, redirect to homepage | | `[ ]` |
| After logout, visit `/en/profile` | Redirected to auth | | `[ ]` |

### 3D — Google OAuth
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Click "Login with Google" | Redirect to Google OAuth page | ⚠️ INFRA PENDING | `[ ]` |

> ⚠️ Google OAuth requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`. Not configured locally. The button should appear; the actual OAuth flow will fail with a Google error.

---

## SECTION 4 — SOLO GAME

> Log in as **USER_A**. Go to http://localhost:3000/en/play

| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Difficulty selector visible (Easy/Medium/Hard/Expert) | 4 options shown | | `[ ]` |
| Click Easy → game starts | Sudoku grid renders | | `[ ]` |
| Click a cell | Cell highlights | | `[ ]` |
| Enter a correct number | Number appears in cell | | `[ ]` |
| Enter an incorrect number | Mistake counter increments | | `[ ]` |
| Toggle Notes mode | Note digits appear in cell | | `[ ]` |
| Timer runs | Timer counting up | | `[ ]` |
| Use Hint button | One cell reveals correct digit | | `[ ]` |
| Complete puzzle | Victory / completion screen shown | | `[ ]` |
| Completion screen shows: time taken | Correct time displayed | | `[ ]` |
| Completion screen shows: mistakes | Correct mistake count | | `[ ]` |
| Completion screen shows: coins earned | Correct coin amount | | `[ ]` |
| Completion screen shows: XP earned | Correct XP amount | | `[ ]` |
| Click "Play Again" | New game starts | | `[ ]` |
| Click "Exit" / "Menu" | Returns to play page or home | | `[ ]` |
| Profile coins updated after game | New balance = old + delta | | `[ ]` |

---

## SECTION 5 — DAILY CHALLENGE

> Log in as **USER_A**. Go to http://localhost:3000/en/daily

| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Daily puzzle loads | Grid rendered with today's puzzle | | `[ ]` |
| Difficulty shown | Easy / Medium / Hard visible | | `[ ]` |
| Timer counts | Timer runs while playing | | `[ ]` |
| Submit completed puzzle | 200 OK — success screen | | `[ ]` |
| Coins awarded on success | Balance increases | | `[ ]` |
| Current streak shown | Correct streak count | | `[ ]` |
| Submit AGAIN (second attempt) | **HTTP 409 — already submitted today** | | `[ ]` |
| Second-attempt UX message | "Already submitted" — not a blank crash | | `[ ]` |
| Leaderboard link → `/en/leaderboard` | Rankings table loads | | `[ ]` |

---

## SECTION 6 — RANKED DUEL

> **Requires two browser windows.** Open Chrome (USER_A) and an Incognito window (USER_B).

### Step-by-step
| Step | Browser | Action | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Chrome (A) | Login as USER_A, go to `/en/duel` | Matchmaking UI | | `[ ]` |
| 2 | Incognito (B) | Login as USER_B, go to `/en/duel` | Matchmaking UI | | `[ ]` |
| 3 | Chrome (A) | Click "Ranked Match" / "Find Opponent" | Queue searching... | | `[ ]` |
| 4 | Incognito (B) | Click "Ranked Match" | Match found message | | `[ ]` |
| 5 | Both | Match found screen + countdown | Both see countdown | | `[ ]` |
| 6 | Both | Navigate to `/en/duel/[matchId]` | **Same matchId in both URLs** | | `[ ]` |
| 7 | Both | Sudoku board renders | Grid visible for both | | `[ ]` |
| 8 | Both | Opponent name/avatar visible | Both see each other | | `[ ]` |
| 9 | Chrome (A) | Enter a correct number | Progress syncs to B | | `[ ]` |
| 10 | Both | Timer runs in sync | Same time visible | | `[ ]` |
| 11 | Chrome (A) | Complete puzzle first | WIN screen for A | | `[ ]` |
| 12 | Incognito (B) | After A completes | LOSS screen for B | | `[ ]` |
| 13 | Both | Rating delta shown | Glicko-2 update visible | | `[ ]` |
| 14 | Both | Coin payout shown | Winner gets 2× pot | | `[ ]` |
| 15 | Both | Profile stats updated | gamesPlayed +1 | | `[ ]` |

> ⚠️ **CRITICAL:** Previous bug — match page failed to navigate after match creation. Pay special attention to Step 6.

---

## SECTION 7 — BOT DUEL

> Log in as **USER_A**. Go to `/en/duel`.

| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Select "Bot Duel" | Bot difficulty selector shown | | `[ ]` |
| Select Easy bot | Match created | | `[ ]` |
| Navigate to `/en/duel/[matchId]` | Board renders | | `[ ]` |
| Bot makes moves (visible on board) | Bot progress visible | | `[ ]` |
| Complete puzzle (beat the bot) | WIN screen | | `[ ]` |
| Lose to bot | LOSS screen | | `[ ]` |
| Coins and XP updated | Balance changes as expected | | `[ ]` |

---

## SECTION 8 — FRIEND DUEL

> Login USER_A in Chrome. Login USER_B in Incognito.

| Step | Who | Action | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | USER_A | Go to `/en/friends`, search "PlayerBeta" | USER_B found | | `[ ]` |
| 2 | USER_A | Send friend request | Pending state | | `[ ]` |
| 3 | USER_B | Accept friend request | Friends confirmed | | `[ ]` |
| 4 | USER_A | Click Challenge on USER_B's profile | Invite created (Redis TTL) | | `[ ]` |
| 5 | USER_B | Receives invite notification | Accept button visible | | `[ ]` |
| 6 | USER_B | Accept invite | Match created | | `[ ]` |
| 7 | Both | Navigate to same `/en/duel/[matchId]` | Same matchId in URL | | `[ ]` |
| 8 | Both | Board renders | Game starts | | `[ ]` |
| 9 | Winner | Complete puzzle | WIN screen | | `[ ]` |
| 10 | Loser | Sees result | LOSS screen | | `[ ]` |

---

## SECTION 9 — FRIENDS SYSTEM

> Log in as USER_A. Go to `/en/friends`.

| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Friends page loads | List visible (empty or existing) | | `[ ]` |
| Search for "PlayerBeta" | USER_B appears | | `[ ]` |
| Send friend request | "Pending" status shown | | `[ ]` |
| As USER_B: see incoming request | Accept button visible | | `[ ]` |
| As USER_B: accept request | Friends status set | | `[ ]` |
| Friends list shows both | Mutual friends visible | | `[ ]` |
| Click USER_B's profile from friends | Profile page opens | | `[ ]` |
| Click "Message" on USER_B's profile | Opens DM or chat | | `[ ]` |
| Click "Challenge" on USER_B | Duel invite sent | | `[ ]` |
| Remove friend | Friend removed, status clears | | `[ ]` |
| Block USER_B | USER_B blocked | | `[ ]` |
| Unblock USER_B | USER_B unblocked | | `[ ]` |

---

## SECTION 10 — CHAT

> Open Chrome (USER_A) and Incognito (USER_B). Log both in.

| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Open `/en/chat` in both browsers | Chat UI visible | | `[ ]` |
| Presence: USER_B shown online in A's view | Online indicator visible | | `[ ]` |
| USER_A sends a message | Message appears for A | | `[ ]` |
| USER_B sees message in real-time | Message appears for B without refresh | | `[ ]` |
| USER_B replies | Reply visible in A's window | | `[ ]` |
| USER_A closes and reopens chat | Previous messages still visible | | `[ ]` |
| Disconnect (close tab) and reconnect | Rejoins room, sees history | | `[ ]` |
| Block USER_B from friends list | USER_B cannot send DM to A | | `[ ]` |
| Blocked user DM rejected | Error / 403 shown | | `[ ]` |

---

## SECTION 11 — FORUM

> **Critical section** — previous bug: topic detail page failed to navigate.

### 11A — Category and Topic List
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| `/en/forum` loads | Category list visible | | `[ ]` |
| Click any category | Topic list for that category shows | | `[ ]` |
| Topics have titles with valid slugs | No `undefined` or `null` in URL | | `[ ]` |

### 11B — Topic Detail (CRITICAL)
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Click topic title | Navigates to `/en/forum/topic/[slug]` | | `[ ]` |
| Slug is human-readable | e.g. `/forum/topic/how-to-solve-x-wing` | | `[ ]` |
| Topic detail page: title visible | Correct topic title shown | | `[ ]` |
| Topic detail page: author visible | Correct author name shown | | `[ ]` |
| Topic detail page: content visible | Full body text rendered | | `[ ]` |
| Topic detail page: replies listed | All replies visible | | `[ ]` |
| Topic detail page: like button | Like registers + count updates | | `[ ]` |
| Topic detail page: reply form | Can type and submit reply | | `[ ]` |
| After reply: reply appears | Newly posted reply visible | | `[ ]` |
| As author: edit topic | Edit saves | | `[ ]` |
| As author: delete reply | Reply removed | | `[ ]` |
| As any user: report post | Report submitted | | `[ ]` |
| NO 404 on any topic | Zero blank pages | | `[ ]` |
| NO blank page on any topic | Full content always renders | | `[ ]` |

---

## SECTION 12 — Q&A

> Go to `/en/questions`. Log in as USER_A.

| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Q&A page loads | Question list visible | | `[ ]` |
| Click a question | Question detail page opens | | `[ ]` |
| Vote up on a question | Vote count increases | | `[ ]` |
| Submit an answer | Answer appears | | `[ ]` |
| Mark answer as accepted (as question author) | Accepted badge shown | | `[ ]` |
| Follow a question | Subscription saved | | `[ ]` |
| Search for a term | Filtered results shown | | `[ ]` |

---

## SECTION 13 — ACADEMY / LEARN

> Go to `/en/learn`.

| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Academy index loads | Beginner / Intermediate / Advanced sections | | `[ ]` |
| Click a Beginner article | Article content fully visible | | `[ ]` |
| Click an Intermediate article | Article content fully visible | | `[ ]` |
| Click an Advanced article | Article content fully visible | | `[ ]` |
| Breadcrumbs shown | Home > Learn > Article | | `[ ]` |
| Related articles shown | At least 1 related article link | | `[ ]` |
| Practice CTA visible | "Play Now" or similar button | | `[ ]` |
| NO dead article cards (links to 404) | Every article opens with content | | `[ ]` |
| Language correct per locale | FR content in FR, DE content in DE | | `[ ]` |

---

## SECTION 14 — PROFILE

> Log in as USER_A. Go to `/en/profile`.

| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Profile page loads | Username, avatar, coins visible | | `[ ]` |
| Edit username | Save → username updates | | `[ ]` |
| Edit avatar | Select avatar → save → avatar changes | | `[ ]` |
| Edit bio (if available) | Save → bio text persists | | `[ ]` |
| Change language preference | Language saved to profile | | `[ ]` |
| Logout and login again | All changes persisted | | `[ ]` |
| Stats visible: gamesPlayed | 42 for USER_A | | `[ ]` |
| Stats visible: gamesWon | 28 for USER_A | | `[ ]` |
| Stats visible: level | 8 for USER_A | | `[ ]` |
| Stats visible: coins | 750 for USER_A | | `[ ]` |
| Stats visible: currentStreak | 3 for USER_A | | `[ ]` |
| Rating shown | 1350 for USER_A | | `[ ]` |

---

## SECTION 15 — SHOP

> Monetization is **DISABLED**. No payments will occur.

| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| `/en/shop` loads | Catalogue visible | | `[ ]` |
| Coin balance visible | USER_A: 750 coins | | `[ ]` |
| Badges section | Badge items listed with prices | | `[ ]` |
| Avatars section | Avatar items listed | | `[ ]` |
| Frames section | Frame items listed | | `[ ]` |
| Themes section | Theme items listed | | `[ ]` |
| Click any item | Item detail / preview shown | | `[ ]` |
| Click "Purchase" (affordable item) | Coin deducted from balance | | `[ ]` |
| Click "Purchase" (unaffordable item) | "Insufficient coins" error | | `[ ]` |
| Stripe / Payment gateway | NOT triggered (local mode) | | `[ ]` |

---

## SECTION 16 — COIN ECONOMY TABLE

> Verify the coin flow manually. Record actual values.

| Action | Account | Coins Before | Expected Delta | Coins After | Actual After | PASS/FAIL |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Solo Easy complete | USER_A | | +25 | | | `[ ]` |
| Solo Hard complete | USER_A | | +50 | | | `[ ]` |
| Daily challenge complete | USER_A | | +100 | | | `[ ]` |
| Ranked Duel WIN | USER_A | | +Win payout | | | `[ ]` |
| Ranked Duel LOSS | USER_A | | 0 (entry fee kept) | | | `[ ]` |
| Bot Duel WIN | USER_A | | +reward | | | `[ ]` |
| Admin grant coins | USER_A | | +admin amount | | | `[ ]` |
| Shop purchase | USER_A | | −item price | | | `[ ]` |

> ⚠️ No unexplained coin creation is acceptable. Every delta must match a defined rule.

---

## SECTION 17 — REWARDED ADS

> DISABLED. Visual architecture check only.

| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Rewarded Ads UI element visible in game | "Watch Ad for coins" visible | | `[ ]` |
| Click "Watch Ad" | Button disabled or placeholder shown (ads are OFF) | | `[ ]` |
| NO coin reward triggered without real ad | 0 coins from ad in local mode | | `[ ]` |

---

## SECTION 18 — ADMIN PANEL (SUPER_ADMIN)

> Log in as admin@sudoku.com. Go to http://localhost:3000/en/admin

### 18A — Access Gate
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Admin URL opens | Admin dashboard visible | | `[ ]` |
| Non-admin user tries `/en/admin` | Redirect / 403 | | `[ ]` |
| MODERATOR user tries `/en/admin` | Limited access or redirect | | `[ ]` |

### 18B — Overview
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Admin dashboard loads | KPI cards visible | | `[ ]` |
| Online users shown | Real number (not 0 always) | | `[ ]` |
| Registrations shown | Matches seeded users | | `[ ]` |
| Game stats visible | Non-zero after playing | | `[ ]` |

### 18C — Users Module (`/en/admin/users`)
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| User list loads | All seeded users visible | | `[ ]` |
| Search for "PlayerAlpha" | USER_A found | | `[ ]` |
| Open USER_A detail | Profile data correct | | `[ ]` |
| Filter by role | MEMBER filter works | | `[ ]` |
| Grant coins to USER_A | Coin balance updates | | `[ ]` |
| Ban USER_B | USER_B status = banned | | `[ ]` |
| Unban USER_B | Status restored | | `[ ]` |
| Change USER_B role | Role saved | | `[ ]` |
| Audit log entry created | Ban action logged | | `[ ]` |

### 18D — Game Control (`/en/admin/modes`)
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Game modes list loads | Solo, Daily, Duel, etc. | | `[ ]` |
| Disable one non-critical mode | Mode toggled OFF | | `[ ]` |
| Check public UI — disabled mode | Disabled message shown to user | | `[ ]` |
| Re-enable the mode | Mode toggled ON | | `[ ]` |
| Public UI restored | Normal access restored | | `[ ]` |

### 18E — Daily Config (`/en/admin/daily`)
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Daily admin page loads | Config form visible | | `[ ]` |
| Change reward amount | Save → value persists | | `[ ]` |
| Change difficulty | Save → persists | | `[ ]` |
| Public daily reflects change | New difficulty visible to user | | `[ ]` |

### 18F — Shop Admin (`/en/admin/shop`)
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Shop admin page loads | Product list visible | | `[ ]` |
| Create test product | Product created | | `[ ]` |
| Edit product name | Name updated | | `[ ]` |
| Change price | Price saved | | `[ ]` |
| Disable product | Product hidden in public shop | | `[ ]` |
| Re-enable product | Product visible again | | `[ ]` |
| Set max-per-user | Limit saved | | `[ ]` |
| Delete test product | Product removed | | `[ ]` |

### 18G — Content Admin (`/en/admin/content`)
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Content list loads | Articles listed | | `[ ]` |
| Create draft article | Article in DRAFT state | | `[ ]` |
| Edit article | Content saves | | `[ ]` |
| Preview article | Preview renders correctly | | `[ ]` |
| Publish article | Status = PUBLISHED | | `[ ]` |
| Unpublish article | Status = DRAFT | | `[ ]` |
| Revision history visible | Previous versions listed | | `[ ]` |
| Rollback to prior version | Content reverted | | `[ ]` |

### 18H — Homepage Admin (`/en/admin/homepage`)
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Homepage admin loads | Sections editable | | `[ ]` |
| Edit hero section text | Text saved | | `[ ]` |
| Reorder sections | Order persists | | `[ ]` |
| Disable a section | Section hidden on public home | | `[ ]` |
| Re-enable section | Restored | | `[ ]` |
| Preview | Preview reflects changes | | `[ ]` |
| Publish | Public homepage updates | | `[ ]` |

### 18I — Theme Admin (`/en/admin/theme`)
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Theme page loads | Color token editor visible | | `[ ]` |
| View current brand palette | Navy / Orange / Gold / Cyan present | | `[ ]` |
| Make a harmless draft change | Preview shows change (only in preview) | | `[ ]` |
| **DO NOT SAVE** brand palette changes | Original unchanged | | `[ ]` |
| Rollback / cancel | Original palette confirmed | | `[ ]` |
| Public site still shows original brand | Navy / Orange / Gold / Cyan | | `[ ]` |

> ⚠️ **CAUTION:** Do NOT save any change to the brand palette. Navy / Orange / Gold / Cyan must remain the live palette.

### 18J — SEO Admin (`/en/admin/seo`)
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| SEO admin loads | Title / Description / OG fields | | `[ ]` |
| Edit homepage title | Save | | `[ ]` |
| View public `/en` page source | `<title>` updated | | `[ ]` |
| Edit meta description | Save | | `[ ]` |
| View page source | `<meta name="description">` updated | | `[ ]` |
| Edit canonical URL | Save | | `[ ]` |
| Edit robots directive | Save | | `[ ]` |
| Edit OG image | Save | | `[ ]` |

### 18K — Email Admin (`/en/admin`)
| Check | Status |
| :--- | :--- |
| Verification email template exists | ✅ VERIFIED (template in DB/CMS) |
| Welcome email template exists | ⚠️ PARTIAL — CMS template present, SMTP not configured locally |
| Actual email delivery locally | ⚠️ INFRA PENDING — requires real SMTP provider |
| Admin can preview email templates | Check in `/en/admin` |

### 18L — Analytics (`/en/admin/analytics`)
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Analytics page loads | Metrics panels visible | | `[ ]` |
| Today view | Shows activity from current session | | `[ ]` |
| 7-day view | Historical data visible | | `[ ]` |
| 30-day view | Historical data visible | | `[ ]` |
| Online users counter | Real-time number | | `[ ]` |
| Games count | Matches games played in session | | `[ ]` |
| Duels count | Matches duels played | | `[ ]` |
| Registrations | Matches seeded accounts + any new | | `[ ]` |
| Coin economy stats | Total issued / spent | | `[ ]` |
| NO hardcoded/fake metrics | Data changes after actual play | | `[ ]` |

### 18M — System Safety (`/en/admin/system`)
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| System page loads | Safety controls visible | | `[ ]` |
| Dangerous operation requires confirmation | Modal / confirmation dialog | | `[ ]` |
| Dangerous operation creates audit log | Entry in `/en/admin/audit` | | `[ ]` |
| JWT_SECRET NOT visible in UI | Not exposed anywhere in admin panel | | `[ ]` |
| DATABASE_URL NOT visible in UI | Not exposed | | `[ ]` |
| Stripe secret NOT visible in UI | Not exposed | | `[ ]` |
| Redis token NOT visible in UI | Not exposed | | `[ ]` |

### 18N — Audit Log (`/en/admin/audit`)
| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| Audit log loads | Entries listed | | `[ ]` |
| Ban action appears | USER_B ban logged | | `[ ]` |
| Coin grant appears | Coin grant logged | | `[ ]` |
| Role change appears | Role change logged | | `[ ]` |
| Each entry has: actor, target, action, timestamp | All fields present | | `[ ]` |

---

## SECTION 19 — LOCALIZATION

| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| `/en/*` — English pages | All text in English | | `[ ]` |
| `/fr/*` — French pages | All text in French | | `[ ]` |
| `/de/*` — German pages | All text in German | | `[ ]` |
| Language switcher works from any page | Switches locale, stays on same page | | `[ ]` |
| Numbers/dates formatted per locale | FR: "28 août", DE: "28. August" | | `[ ]` |
| No untranslated keys visible (e.g. `common.play`) | All strings translated | | `[ ]` |

---

## SECTION 20 — MOBILE RESPONSIVENESS

> Resize browser or use DevTools device emulation.

| Check | Device Width | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- | :--- |
| Homepage | 375px (iPhone SE) | No overflow, no clipping | | `[ ]` |
| Sudoku grid | 375px | Grid fits on screen | | `[ ]` |
| Numpad | 375px | Numpad reachable by thumb | | `[ ]` |
| Navigation | 375px | Hamburger menu opens | | `[ ]` |
| Forum topic | 375px | Full content readable | | `[ ]` |
| Admin dashboard | 768px (iPad) | Layout usable | | `[ ]` |
| Admin dashboard | 375px | Accessible (may be limited) | | `[ ]` |

---

## SECTION 21 — SEO & TECHNICAL

| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| `GET /robots.txt` | 200, valid directives | | `[ ]` |
| `GET /sitemap.xml` | 200, valid XML with routes | | `[ ]` |
| Homepage `<title>` tag | Non-empty, descriptive | | `[ ]` |
| Homepage `<meta description>` | Non-empty | | `[ ]` |
| `hreflang` tags: EN/FR/DE | All three alternates present | | `[ ]` |
| No `<h1>` duplicate on any page | Single H1 per page | | `[ ]` |
| Open Graph tags present | `og:title`, `og:description`, `og:image` | | `[ ]` |

---

## SECTION 22 — SECURITY SPOT-CHECKS

| Check | Expected | MY RESULT | PASS/FAIL |
| :--- | :--- | :--- | :--- |
| `access_token` cookie: HttpOnly | Cannot be read by JS (`document.cookie`) | | `[ ]` |
| `access_token` cookie: Secure in production | Confirmed (dev may omit Secure flag) | | `[ ]` |
| API rejects unauthenticated POST to `/coin-ledger` | 401 | | `[ ]` |
| Accessing another user's data rejected | 403 | | `[ ]` |
| Admin endpoint blocked for MEMBER role | 403 | | `[ ]` |
| `Content-Security-Policy` header present | Helmet sets it | | `[ ]` |
| `X-Content-Type-Options: nosniff` present | Helmet sets it | | `[ ]` |

---

## DEFECT LOG

> Record every defect discovered during human acceptance testing here.

| # | Section | Route | Persona | Action Taken | Expected | Actual | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | | | | |

> Severity levels: `BLOCKER` | `CRITICAL` | `MAJOR` | `MINOR` | `COSMETIC`

---

## FINAL ACCEPTANCE DECISION

| Gate | MY DECISION |
| :--- | :--- |
| All BLOCKER defects resolved | `[ ] YES / [ ] NO` |
| All CRITICAL defects resolved | `[ ] YES / [ ] NO` |
| Core game loop (solo, daily, duel) working | `[ ] YES / [ ] NO` |
| Auth (register, login, logout, verify) working | `[ ] YES / [ ] NO` |
| Admin panel fully functional | `[ ] YES / [ ] NO` |
| 0 unexplained coin creation events | `[ ] YES / [ ] NO` |
| Forum topic navigation working | `[ ] YES / [ ] NO` |
| All locales (EN/FR/DE) rendering correctly | `[ ] YES / [ ] NO` |

```
HUMAN ACCEPTANCE STATUS: [ ] PASS  [ ] CONDITIONAL PASS  [ ] FAIL
Owner signature: _______________________  Date: ___________
```

---

## KNOWN LIMITATIONS (Local Environment)

These are **by design** and do **not** constitute bugs:

| Item | Status | Reason |
| :--- | :--- | :--- |
| Email delivery (SMTP) | ⚠️ PARTIAL | No SMTP provider configured locally |
| Google OAuth redirect | ⚠️ INFRA PENDING | No Google credentials in local `.env` |
| Stripe payment processing | ⛔ DISABLED | Test keys not set; by design |
| Rewarded Ads | ⛔ DISABLED | By owner decision |
| Redis pub/sub (multi-instance) | ⚠️ In-memory | REDIS_URL empty locally; Socket.IO uses in-process adapter |
| Cloud CDN / Cloudflare | N/A | No public deployment |
| Production SSL | N/A | Local HTTP only |
