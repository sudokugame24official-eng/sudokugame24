# OWNER FINAL ACCEPTANCE CHECKLIST
> **Target Environment:** Local Verified Baseline (`http://localhost:3000`)  
> **Backend API:** `http://localhost:3001`  
> **Admin Portal:** `http://localhost:3000/en/admin`  
> **Brand Palette Rule:** Navy `#0A192F` / `#0F172A`, Orange `#F97316`, Gold `#EAB308`, Cyan `#06B6D4` (Strictly Unchanged)

---

## Instructions for Human Owner
Please execute each user journey in your browser and check off the items as you verify them. **No items are pre-checked.**

---

## 1. Persona Accounts Reference
- **USER_A (Verified Member):** `test_usera@sudoku.local` / `TestPass_A1!` (750 Coins, Level 8)
- **USER_B (Verified Member):** `test_userb@sudoku.local` / `TestPass_B2!` (200 Coins, Level 3)
- **MODERATOR:** `test_mod@sudoku.local` / `TestPass_M3!` (1500 Coins, Level 20)
- **SUPER_ADMIN (Owner):** `admin@sudoku.com` / `Admin@Sudoku2026!` (10,000 Coins, Level 100)
- **Unverified Persona:** Create a fresh account at `/en/auth` to test unverified restrictions.

---

## 2. Core Human Acceptance Checklist

### [ ] Journey 1: Guest User Journey
- [ ] Visit `/en` in private window. Confirm full landing page renders with CTAs.
- [ ] Visit `/en/play`. Confirm solo Sudoku grid can be played without login.
- [ ] Visit `/en/daily`. Confirm daily puzzle is visible; verify prompt to login on completion.
- [ ] Visit `/en/duel`. Confirm immediate redirect to `/en/auth`.
- [ ] Visit `/en/learn`, `/en/forum`, `/en/questions`, `/en/shop`, `/en/faq`. Confirm public accessibility.

### [ ] Journey 2: Registration & Authentication
- [ ] Register new account at `/en/auth`. Confirm login succeeds and cookie is set.
- [ ] Test duplicate email signup. Confirm user-friendly conflict message.
- [ ] Login with `test_usera@sudoku.local`. Confirm avatar, coin count (750), and profile data render.
- [ ] Test logout. Confirm session is cleared and protected pages redirect to login.

### [ ] Journey 3: Solo Game Loop & Server Authority
- [ ] Start an Easy solo puzzle on `/en/play`.
- [ ] Test cell selection, number input, notes mode, and hint button.
- [ ] Complete the puzzle. Verify completion modal displays correct time, score, XP, and coin delta (+25).
- [ ] Check profile balance. Confirm coins updated to 775.

### [ ] Journey 4: Daily Challenge & Duplicate Protection
- [ ] Open `/en/daily` as `USER_A`. Solve and submit today's puzzle.
- [ ] Confirm victory screen, streak counter increment (+1), and coin reward (+100).
- [ ] Refresh page or attempt a second submission today.
- [ ] Confirm controlled rejection (`HTTP 409 Conflict` / "Already submitted today" notification) without 500 error or duplicate coin reward.

### [ ] Journey 5: Ranked Multiplayer Duel (Two Browser Windows)
- [ ] Window 1 (Chrome): Login as `USER_A`, navigate to `/en/duel`, click "Find Match".
- [ ] Window 2 (Incognito): Login as `USER_B`, navigate to `/en/duel`, click "Find Match".
- [ ] Confirm "Match Found" notification and countdown timer in both windows.
- [ ] Confirm **both windows navigate automatically to `/en/duel/[matchId]` with the exact same match ID**.
- [ ] Enter moves on Window 1; verify board progress reflects on Window 2 in real time.
- [ ] Complete puzzle on Window 1. Confirm Victory screen on Window 1 (+wager payout) and Defeat screen on Window 2.

### [ ] Journey 6: Bot Duel & Friend Duel
- [ ] As `USER_A`, start a Bot Duel. Confirm AI moves progress on board and game completes cleanly.
- [ ] As `USER_A`, go to `/en/friends`, search `PlayerBeta`, send a friend request.
- [ ] As `USER_B`, accept friend request. Confirm friendship status in both profiles.
- [ ] As `USER_A`, click "Challenge" on `PlayerBeta`. Confirm `USER_B` receives invitation and accepting opens the shared match.

### [ ] Journey 7: Real-Time Chat & Block Enforcement
- [ ] Open `/en/chat` in both windows. Send messages between `USER_A` and `USER_B`.
- [ ] Confirm instantaneous delivery and presence indicator.
- [ ] As `USER_A`, block `USER_B` from friends/profile menu.
- [ ] As `USER_B`, attempt to send a DM or challenge to `USER_A`. Confirm action is blocked with error message.

### [ ] Journey 8: Forum & Community Q&A
- [ ] Open `/en/forum`. Click on category and topic titles.
- [ ] Confirm **topic detail page opens immediately with human-readable slug (NO 404 or blank page)**.
- [ ] Post a reply as `USER_A`. Confirm reply appears under topic.
- [ ] Like a topic. Confirm like counter increments atomically.
- [ ] Open `/en/questions`. Post a question, submit an answer, and mark answer as accepted.

### [ ] Journey 9: Academy & SEO Verification
- [ ] Open `/en/learn`. Click Beginner, Intermediate, and Advanced technique guides (e.g. X-Wing).
- [ ] Verify rich strategy explanations, interactive grid examples, breadcrumbs, and practice CTAs.
- [ ] Inspect page source / elements: confirm descriptive `<title>`, `<meta name="description">`, `hreflang` tags (EN/FR/DE), and JSON-LD schema.

### [ ] Journey 10: Shop & Coin Economy Audit
- [ ] Open `/en/shop` as `USER_A` (750 coins).
- [ ] Purchase an available avatar cosmetic item for 250 coins.
- [ ] Confirm balance decrements to 500 coins and item is unlocked in Profile.
- [ ] Attempt to purchase an item costing more coins than current balance. Confirm "Insufficient coins" rejection.
- [ ] Confirm real payment gateway (Stripe) is OFF and no external billing is requested.

### [ ] Journey 11: Multi-Locale Translation (EN / FR / DE)
- [ ] Switch language to French (`/fr`). Confirm headers, buttons, game controls, and notifications display in French.
- [ ] Switch language to German (`/de`). Confirm full German localization.
- [ ] Switch back to English (`/en`). Confirm clean translation with zero untranslated fallback keys.

### [ ] Journey 12: Super Admin Control Center
- [ ] Login as `admin@sudoku.com` / `Admin@Sudoku2026!` and navigate to `/en/admin`.
- [ ] Confirm overview metrics and KPI charts render with live database data.
- [ ] Visit `/en/admin/users`. Search `PlayerBeta`, inspect ledger, test temporary ban and unban.
- [ ] Visit `/en/admin/modes`. Toggle a game mode switch; verify public UI reflects change.
- [ ] Visit `/en/admin/daily`. Adjust reward parameters; verify persistence.
- [ ] Visit `/en/admin/content`. Create/edit CMS article and verify preview mode.
- [ ] Visit `/en/admin/theme`. Verify brand palette tokens (Navy/Orange/Gold/Cyan); ensure no unauthorized palette override is saved.
- [ ] Visit `/en/admin/audit`. Confirm all administrative actions (bans, grants, setting changes) are permanently logged.

---

## 3. Human Acceptance Sign-Off

- [ ] All 12 core journeys tested and approved.
- [ ] Forum topic resolution verified (No 404s).
- [ ] Ranked Duel dual-client navigation verified.
- [ ] Coin ledger invariants and idempotency verified.
- [ ] Zero unhandled errors, blank pages, or broken core links.

**Human Owner Signature:** `_____________________________`  
**Date:** `_____________________________`  
**Verdict:** `[  ] ACCEPTED FOR STAGING   /   [  ] REVISE`
