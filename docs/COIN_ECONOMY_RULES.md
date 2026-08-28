# COIN ECONOMY SPECIFICATION & FINANCIAL INVARIANTS

## 1. Overview
The platform operates on a single virtual currency ("Coins") governed by an ACID-compliant double-entry ledger in the backend (`apps/api/src/coin-ledger`). The frontend NEVER determines reward amounts or balances.

---

## 2. Coin Sources & Earning Rules

| Source | Trigger Event | Reward Amount | Daily Cap | Idempotency Key Format | Ledger Type | Reversal / Anti-Cheat Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Solo Sudoku** | Valid puzzle completion | Easy: +10<br>Med: +20<br>Hard: +35<br>Expert: +50 | Max 10 rewards / day | `solo_{userId}_{seed}` | `GAME_REWARD` | Speedhack filter: Minimum solve time per difficulty enforced. |
| **Daily Challenge** | Daily puzzle completion | +100 Coins | 1 per calendar day | `daily_{userId}_{challengeId}` | `DAILY_REWARD` | Duplicate submissions rejected with HTTP 409. |
| **Ranked Duel (Win)**| Defeating human player | +2X Stake (e.g. +100 on 50 bet) | Uncapped | `duel_win_{matchId}_{userId}` | `DUEL_WIN` | Zero-sum transfer: winner takes both staked wagers. |
| **Bot Duel (Win)** | Defeating Bot opponent | Refund Stake (0 net) | Uncapped | `bot_win_{matchId}_{userId}` | `DUEL_WAGER` | House does not mint free coins from bot matches. |
| **Achievements** | Tier reached (1-5) | +25 to +500 Coins | 1 per achievement tier | `ach_{userId}_{achId}_{tier}` | `ACHIEVEMENT_REWARD` | Authoritative progress calculated server-side. |
| **Rewarded Ads** | Full verified video watch | +20 Coins | Max 5 / day | `ad_reward_{userId}_{txId}` | `AD_REWARD` | Disabled by default. Requires server webhook signature. |
| **Admin Adjustment**| Manual grant / deduction | Custom | Super Admin only | `admin_{adminId}_{txId}` | `ADMIN_ADJUSTMENT` | Logged to immutable audit trail. |

---

## 3. Coin Spending Rules

| Category | Item Type | Cost | Conditions | Idempotency Key Format | Ledger Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cosmetics** | Board Theme, Number Font | 500 – 2,500 Coins | Balance $\ge$ Cost | `shop_buy_{userId}_{productId}` | `SHOP_PURCHASE` |
| **Avatars & Badges** | Profile Frame, Title Badge | 200 – 1,000 Coins | Balance $\ge$ Cost | `shop_buy_{userId}_{productId}` | `SHOP_PURCHASE` |
| **Ranked Wager** | Duel Entry Stake | 50 / 200 / 1000 Coins | Balance $\ge$ Stake | `duel_wager_{matchId}_{userId}` | `DUEL_WAGER` |

---

## 4. Financial Invariants
1. **No Negative Balances:** `balance >= 0` is strictly enforced with optimistic database locking.
2. **Double-Entry Trail:** Every balance alteration generates an immutable `CoinTransaction` row.
3. **Refunds on Aborted Games:** Disconnected or cancelled duel lobbies automatically execute ledger credit refunds.
