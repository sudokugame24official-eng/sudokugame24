# OWNER FINAL MANUAL ACCEPTANCE CHECKLIST (V2)

> **Environment URL:** `http://localhost:3000`  
> **API URL:** `http://localhost:3001`  
> **Admin Portal:** `http://localhost:3000/en/admin`  
> **Brand Palette Constraint:** Navy `#0A192F` / `#0F172A`, Orange `#F97316`, Gold `#EAB308`, Cyan `#06B6D4` (Strictly Preserved)

---

## Instructions
Please execute each step manually in your browser. Fill in the empty fields and mark the checkbox when complete.

---

## 1. Test Personas

| Persona | Email | Password | Role | Expected Balance | Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **USER_A** | `test_usera@sudoku.local` | `TestPass_A1!` | MEMBER | 750 Coins | Level 8 |
| **USER_B** | `test_userb@sudoku.local` | `TestPass_B2!` | MEMBER | 200 Coins | Level 3 |
| **MODERATOR** | `test_mod@sudoku.local` | `TestPass_M3!` | MODERATOR | 1500 Coins | Level 20 |
| **SUPER_ADMIN** | `admin@sudoku.com` | `Admin@Sudoku2026!` | SUPER_ADMIN | 10,000 Coins | Level 100 |

---

## 2. Manual Test Execution Items

### [ ] Test 1: Anonymous Guest Experience
- **Action:** Open an incognito window with no cookies. Visit `/en`, `/en/play`, `/en/daily`, `/en/learn`, `/en/forum`, `/en/shop`.
- **Expected:** All pages load smoothly without authentication. Attempting to enter `/en/duel` redirects to `/en/auth`.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 2: User Registration & Authentication
- **Action:** Go to `/en/auth` and register a new user account. Then log out and log back in.
- **Expected:** Registration succeeds, session cookie is set, and user profile loads.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 3: Solo Sudoku Game Loop
- **Action:** Log in as `USER_A` (`test_usera@sudoku.local`), navigate to `/en/play`, choose Easy difficulty, and solve the puzzle.
- **Expected:** Cell input, notes, and hints work. Upon completion, Victory modal appears showing time, score, XP, and **+50 coins**. Profile coin balance increases from 750 to 800.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 4: Daily Challenge & Duplicate Submission (HTTP 409)
- **Action:** Go to `/en/daily`, solve today's challenge. Then refresh and attempt a second submission.
- **Expected:** First submission awards coins (~150-250) and updates streak. Second submission returns a controlled rejection notification (`HTTP 409 Conflict`) without duplicate coin reward.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 5: Ranked Multiplayer Duel (Two Browser Windows)
- **Action:**
  1. Window 1 (Chrome): Login as `USER_A`, go to `/en/duel`, click "Find Match".
  2. Window 2 (Incognito): Login as `USER_B`, go to `/en/duel`, click "Find Match".
- **Expected:** Matchmaking pairs both players. Countdown appears, and **both windows navigate to the exact same URL: `/en/duel/[matchId]`**. Real-time move sync occurs, and the winner receives the full 2× pot payout.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 6: Bot Duel
- **Action:** As `USER_A`, go to `/en/duel` and start a match against the AI Bot.
- **Expected:** Match starts immediately, bot makes moves at difficulty-based intervals. Winning refunds stake to player.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 7: Friends System & Friend Challenge
- **Action:** As `USER_A`, search for `PlayerBeta` at `/en/friends` and send a friend request. As `USER_B`, accept the request, then have `USER_A` challenge `USER_B` to a duel.
- **Expected:** Request appears in `USER_B`'s inbox; accepting confirms friendship. Challenge invite opens shared duel.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 8: Real-Time Chat & Block Feature
- **Action:** Open `/en/chat` in both windows. Exchange messages. Then have `USER_A` block `USER_B`.
- **Expected:** Messages transmit instantaneously. After blocking, `USER_B` cannot send DMs to `USER_A`.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 9: Forum Topic Navigation (Slug Verification)
- **Action:** Go to `/en/forum`. Click on category cards and click into individual topic titles.
- **Expected:** Topics open immediately at `/en/forum/topic/[slug]` with title, author, content, and replies. **Zero 404s or blank screens**.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 10: Community Q&A
- **Action:** Go to `/en/questions`. Browse questions, open a question, post an answer, and vote.
- **Expected:** Questions and answers render cleanly with live vote tallying.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 11: Academy / Learn Strategy Guides
- **Action:** Go to `/en/learn`. Open Beginner, Intermediate, and Advanced technique guides (e.g. X-Wing).
- **Expected:** Strategy breakdowns, interactive board diagrams, practice CTAs, and breadcrumbs render with no dead cards.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 12: Profile Management
- **Action:** Go to `/en/profile`. Change avatar, bio, or preferred language. Refresh and re-login.
- **Expected:** All profile modifications persist across sessions.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 13: Shop & Cosmetic Purchases
- **Action:** As `USER_A`, go to `/en/shop`. Purchase an avatar cosmetic item with coins.
- **Expected:** Coins are debited correctly, cosmetic is unlocked in Profile. Real payment processing is OFF.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 14: Multi-Locale Translation (EN / FR / DE)
- **Action:** Switch language via the header switcher to French (`/fr`) and German (`/de`).
- **Expected:** UI elements, game controls, and routes update with complete translations and zero raw fallback keys.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 15: Super Admin Control Center
- **Action:** Login as `admin@sudoku.com` / `Admin@Sudoku2026!`. Visit `/en/admin`, `/en/admin/users`, `/en/admin/daily`, `/en/admin/modes`, `/en/admin/shop`, `/en/admin/content`, `/en/admin/theme`.
- **Expected:** KPI dashboards display live data. User management, daily rewards, game modes, and CMS articles are manageable via UI without writing code. Brand palette (Navy/Orange/Gold/Cyan) is preserved.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

### [ ] Test 16: Mobile & Responsive Layout
- **Action:** Open DevTools and test screen widths: 375px (Mobile), 768px (Tablet), and 1440px (Desktop).
- **Expected:** Sudoku grid, numpad, navigation menus, and forum topics adapt cleanly without horizontal overflow or broken controls.
- **Actual:**
- **PASS / FAIL:**
- **Notes:**

---

## 3. Final Sign-Off

```
[  ] ALL 16 TESTS PASSED PERSONALLY BY OWNER
[  ] ZERO BLOCKING DEFECTS FOUND

Owner Signature: ___________________________    Date: ______________
Decision:        [  ] ACCEPTED FOR STAGING      [  ] DEFECTS REPORTED
```
