# SHOP & VIRTUAL ECONOMY ARCHITECTURE

## 1. Core Principles
- **Immutable Ledger:** All coin transactions (`CoinTransaction`) are append-only and record the exact source (`DUEL_WIN`, `DAILY_REWARD`, `AD_REWARD`, `PURCHASE`, `ADMIN_GRANT`), previous balance, delta, new balance, and idempotency key.
- **Concurrency Protection:** Double-spending is prevented using optimistic concurrency locks (`version` / row-level transactions) in `CoinLedgerService`.

## 2. Server-Authoritative Products & Inventory
- Products (`ShopProduct`) are 100% database-driven.
- Server verifies time windows (`startDate`, `endDate`), remaining global stock (`stock > 0` with atomic decrement), and maximum purchases allowed per user (`maxPerUser`) calculated directly from previous transactions.

## 3. Fair Duel Economy
- Real PvP matches operate on a strict zero-sum payout model: Winner receives `2x stake` transferred directly from Player 1 and Player 2. No currency is artificially generated.
- Bot / AI matches refund the exact player stake upon victory without generating synthetic coins.
- Payout transactions use deterministic idempotency keys (`duel_win_<matchId>_<userId>`) preventing replay attacks.
