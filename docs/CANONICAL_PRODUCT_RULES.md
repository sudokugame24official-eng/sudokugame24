# CANONICAL PRODUCT RULEBOOK

## 1. Persona Hierarchy & Access Control Matrix

| Persona | Authentication | Email Verified | Capabilities & Access | Prohibited Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Guest** | Anonymous | N/A | Browse public pages, play solo practice (local timer/grid), play bot practice (local), read Academy techniques, read Help & FAQ, browse forum topics and Q&A, view public leaderboards, browse cosmetic catalog. | Cannot save progress, claim daily rewards, post/reply in forum, ask/vote in Q&A, chat in global/DM rooms, initiate ranked duel wagers, buy shop items, or access `/admin/*`. |
| **Registered (Unverified)** | Authenticated | ❌ Unverified | Play solo games, play bot matches, preview daily challenge, view profile, manage basic local settings, read community content. | Restricted from competitive ranked wagering, social chat broadcasting, and creating public forum posts until email verification is confirmed. |
| **Registered (Verified)** | Authenticated | ✅ Verified | Full participation in all game modes (Solo, Daily Challenge, Ranked Duel, Friend Duel, Bot Duel), submit official daily challenge entries, create/reply/like in Forum, ask/answer/vote in Q&A, buy & equip shop cosmetics, global & direct messaging, friend requests. | No access to administrative routes (`/admin/*`) or moderator tooling. |
| **Moderator** | Authenticated | ✅ Verified | All Verified User capabilities + pin/lock/delete forum topics, moderate chat rooms, view user reports, enforce temporary mutes. | Cannot access system infrastructure settings, financial ledgers, or database configuration. |
| **Super Admin (Owner)** | Authenticated | ✅ Verified | Unrestricted access to all 22 administrative modules (`/admin/*`), live CMS editing, game mode toggles, coin grants, SEO metadata management, theme editor, and analytics. | None. |

---

## 2. Authentication & Verification Lifecycles

### A. Standard Registration Flow
1. **Registration:** User submits email, username, and password $\rightarrow$ Account created in database with `isEmailVerified: false`.
2. **Verification Token:** Cryptographically secure token generated with 24-hour TTL and sent via transactional email.
3. **Verification Confirmation:** Clicking verification link updates `isEmailVerified: true` and activates full social/competitive privileges.
4. **Token Resend:** Users can request token resend with a 60-second rate-limit cooldown.
5. **Welcome Email:** *Status: PARTIAL* — Default localized transactional email sent upon verification; visual CMS customization in Admin UI is pending external SMTP transport configuration.

### B. Google OAuth Flow
- **Status:** *INFRASTRUCTURE_PENDING* (Architecture & session mapping implemented; requires Google Cloud Console Client ID & Secret in Staging/Production environment).

---

## 3. Game Modes & Rules

### A. Solo Sudoku
- **Access:** Guests & Authenticated players.
- **Difficulties:** Easy, Medium, Hard, Expert, Master.
- **Economy:** First-time completion of a puzzle seed awards +10 to +50 coins (server-enforced daily cap of 10 completions).
- **Anti-Cheat:** Minimum completion duration enforced server-side to reject speedhacks.

### B. Daily Challenge
- **Access:** Preview available to Guests; official submission requires Authenticated Verified account.
- **Frequency:** Strictly 1 official puzzle per UTC calendar day.
- **Duplicate Prevention:** Second submission attempts return strict **HTTP 409 Conflict** (no HTTP 500).
- **Reward:** +100 Coins, Daily Streak progression, and placement on the Daily Leaderboard.

### C. Ranked Duel
- **Access:** Authenticated Verified players.
- **Match Pot & Wager:** Player A stakes $X$ coins, Player B stakes $X$ coins ($2X$ total pot). Winner receives the entire $2X$ pot (Zero-sum transfer; zero inflation).
- **Disconnect / Abandon:** Disconnecting player forfeits; remaining player is awarded the victory and match pot.
- **Draw:** Both players receive exact stake refunds.

### D. Bot Duel
- **Access:** Guests (practice) & Authenticated players.
- **Economy:** Zero-sum — defeating a bot refunds the entry stake; the house does not mint free coins from bot matches.
- **Difficulty Levels:** Easy (800–1100 Elo), Medium (1200–1500 Elo), Hard (1600–1900 Elo).

### E. Friend Duel
- **Access:** Authenticated Verified friends.
- **Lifecycle:** Friend A sends invite $\rightarrow$ Redis key created with 60s TTL $\rightarrow$ Friend B accepts $\rightarrow$ Match room created $\rightarrow$ Both clients navigate to `/duel/[matchId]` and auto-dispatch `join_match`.

---

## 4. Virtual Economy & Financial Invariants

```
┌────────────────────────┬────────────────────────────────────────────┬─────────────────────┐
│ Source / Event         │ Reward / Cost                              │ Idempotency Key     │
├────────────────────────┼────────────────────────────────────────────┼─────────────────────┤
│ Solo Sudoku (Solved)   │ Easy +10, Med +20, Hard +35, Expert +50    │ solo_{userId}_{seed}│
│ Daily Challenge        │ +100 Coins                                 │ daily_{uid}_{date}  │
│ Ranked Duel (Win)      │ +2X Match Pot                              │ duel_win_{matchId}  │
│ Bot Duel (Win)         │ Refund Entry Stake                         │ bot_win_{matchId}   │
│ Achievement Tier       │ +25 to +500 Coins                          │ ach_{uid}_{id}_{tier}│
│ Rewarded Ad (Verified) │ +20 Coins (Max 5/day, currently OFF)       │ ad_reward_{txId}    │
│ Shop Cosmetic Purchase │ -200 to -2500 Coins                        │ shop_buy_{orderId}  │
└────────────────────────┴────────────────────────────────────────────┴─────────────────────┘
```

- **Invariant 1 (Server Authority):** Frontend NEVER determines coin deltas or balances.
- **Invariant 2 (No Negative Balance):** `balance >= 0` enforced with atomic database transactions.
- **Invariant 3 (Double-Entry Audit):** Every transaction logged to immutable `CoinLedger`.

---

## 5. Monetization & Ad Standards
- **Current State:** **DISABLED BY DEFAULT** (`adsEnabled = false`, `liveStripe = false`).
- **Placement Restrictions:** Ads are strictly forbidden on the active Sudoku grid, numpad, timer, duel arenas, auth forms, and checkout screens.
- **Zero Pay-to-Win:** Shop items are strictly cosmetic (Themes, Number Fonts, Avatars, Badges, Frames). No gameplay advantages or hints can be purchased.

---

## 6. Owner Zero-Code Administration
- 22 modules organized under 10 Owner Control Groups (`/admin/*`).
- Non-technical owners can update themes, CMS articles, game mode availability, daily puzzles, and user permissions directly through the browser interface.
- Zero reliance on raw SQL or CLI terminal commands for standard administrative duties.
