# FINAL CANONICAL COIN TABLE (SINGLE SOURCE OF TRUTH)

> **Integrity Rule:** All values in this document reflect the exact, authoritative execution in the active NestJS backend source code (`apps/api/src/sudoku/sudoku.service.ts`, `apps/api/src/daily/daily.service.ts`, `apps/api/src/duel/duel.service.ts`, `apps/api/src/coin-ledger/coin-ledger.service.ts`).

---

## 1. Complete Canonical Coin Matrix

| EVENT | DIFFICULTY / MODE | CONDITION | DELTA / REWARD | LIMIT / CAP | LEDGER TYPE (`CoinTransactionType`) | IDEMPOTENCY KEY FORMAT | WHO MAY RECEIVE | ADMIN CONFIGURABLE? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Solo Sudoku** | EASY | Valid complete board, time >= 30s | `+50 coins` | Unlimited solves | `REWARD` | `ClassicSudoku:<sessionId>` | Verified & Unverified (Member+) | No (Hardcoded in `sudoku.service.ts`) |
| **Solo Sudoku** | MEDIUM | Valid complete board, time >= 45s | `+100 coins` | Unlimited solves | `REWARD` | `ClassicSudoku:<sessionId>` | Verified & Unverified (Member+) | No (Hardcoded in `sudoku.service.ts`) |
| **Solo Sudoku** | HARD | Valid complete board, time >= 60s | `+200 coins` | Unlimited solves | `REWARD` | `ClassicSudoku:<sessionId>` | Verified & Unverified (Member+) | No (Hardcoded in `sudoku.service.ts`) |
| **Solo Sudoku** | EXPERT | Valid complete board, time >= 90s | `+400 coins` | Unlimited solves | `REWARD` | `ClassicSudoku:<sessionId>` | Verified & Unverified (Member+) | No (Hardcoded in `sudoku.service.ts`) |
| **Solo Sudoku** | MASTER | Valid complete board, time >= 120s | `+800 coins` | Unlimited solves | `REWARD` | `ClassicSudoku:<sessionId>` | Verified & Unverified (Member+) | No (Hardcoded in `sudoku.service.ts`) |
| **Daily Challenge** | Configured (Default: MEDIUM) | First valid submission of today | `+5 coins / correct cell` (Default ~150-250 coins total) | Exactly 1 valid solve / day | `DAILY_REWARD` | `daily_<challengeId>_<userId>` | Verified Member+ | ✅ **Yes** (`coinRewardPerCell` in `/admin/daily`) |
| **Ranked Duel Wager Entry** | Any | Queueing or creating duel with stake | `-betAmount` (e.g., -50) | Bound by player coin balance | `DUEL_WAGER` (Escrow) | `duel_escrow_<duelId>_<userId>` | Verified Member+ | ✅ **Yes** (Creator/Lobby sets stake) |
| **Ranked Duel Victory (PVP)** | Any | Real match completed first | `+2 × betAmount` (Entire Pot) | Unlimited matches | `DUEL_WAGER` | `duel_win_<duelId>_<p1\|p2>` | Winner | No (Strict 2× Pot Transfer) |
| **Ranked Duel Draw (PVP)** | Any | Match timeout / mutual draw | `+betAmount` (Stake Refund) | Unlimited matches | `DUEL_WAGER` | `duel_draw_<duelId>_<p1\|p2>` | Both players | No (100% Refund) |
| **Ranked Duel Defeat (PVP)** | Any | Opponent solves first or forfeit | `0` (Escrow retained by pot) | Unlimited matches | None | N/A | Loser | No |
| **Bot Duel Win (Human beats Bot)** | Any (EASY, MEDIUM, HARD) | Human solves before Bot | `+betAmount` (Stake Refund) | Unlimited matches | `DUEL_WAGER` | `duel_bot_stake_<duelId>` | Human Player | No (Zero-Sum: House does not mint 2× pot) |
| **Bot Duel Loss (Bot beats Human)** | Any | Bot solves before Human | `0` (Stake sunk to house) | Unlimited matches | None (Sunk) | N/A | House Sink | No |
| **Bot Duel Draw** | Any | Timeout / simultaneous solve | `+betAmount` (Stake Refund) | Unlimited matches | `DUEL_WAGER` | `duel_bot_stake_<duelId>` | Human Player | No (100% Refund) |
| **Friend Duel (Casual/Wager)** | Custom | Custom stake agreed by friends | Winner takes pot (`2 × betAmount`) | Unlimited matches | `DUEL_WAGER` | `duel_win_<duelId>_<p1\|p2>` | Winner | ✅ **Yes** (Challenger sets wager) |
| **Shop Cosmetic Purchase** | N/A | User purchases Avatar/Frame/Badge | `-ItemPrice` (e.g. -250, -500) | Bound by balance & inventory | `SHOP_PURCHASE` | `shop_<userId>_<itemId>_<timestamp>` | Verified Member+ | ✅ **Yes** (Product price in `/admin/shop`) |
| **Admin Manual Adjustment** | N/A | Super Admin grant or penalty | `+Amount` or `-Amount` | Super Admin discretion | `ADMIN_ADJUSTMENT` | `admin_adjust_<adminId>_<userId>_<txId>` | Any User | ✅ **Yes** (Set by Super Admin with audit reason) |
| **Rewarded Video Ad (Future)** | N/A | Server-verified ad completion | `+20 coins` (Disabled by default) | Max 5 / day | `AD_REWARD` | `ad_<userId>_<token>` | Member+ | ✅ **Yes** (Enabled in `/admin/features`) |

---

## 2. Zero-Sum & Financial Invariants Guaranteed in Code
1. **PVP Conservation:** Total Coins Before = Total Coins After. The winner receives exactly what player 1 staked plus what player 2 staked (`betAmount * 2`).
2. **Bot Sinks / Anti-Minting:** When a human plays against a bot, the bot does not hold coins. If the human wins, they get their stake back (`duel_bot_stake_<id>`). The server never mints free coins on bot matches.
3. **Daily Challenge Idempotency:** Guarded by composite database index and transaction key `daily_<challengeId>_<userId>`. Re-submission returns `HTTP 409 Conflict`.
