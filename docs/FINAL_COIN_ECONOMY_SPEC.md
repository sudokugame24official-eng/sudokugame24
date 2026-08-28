# FINAL COIN ECONOMY SPECIFICATION & FINANCIAL INVARIANTS

## 1. Overview & Golden Rules
The Sudoku platform operates an ACID-compliant virtual currency ledger (`apps/api/src/coin-ledger`).
- **No Client Minting:** The browser UI NEVER computes or decides coin rewards or debits.
- **Strict Idempotency:** Every transaction requires a unique idempotency key or composite reference (e.g. `DAILY_SUBMISSION:userId:YYYY-MM-DD`, `DUEL_WIN:matchId`).
- **No Negative Balance:** Debits are guarded by interactive transactions verifying `balance >= amount`.
- **Double-Entry Ledger:** Every credit or debit writes a permanent `CoinTransaction` record linked to the user's `Profile`.

---

## 2. Coin Earning & Spending Rules Matrix

| Event / Source | Condition / Qualification | Delta (Coins) | Daily Cap | Ledger Type | Idempotency Key Format | Reversal / Rollback |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Solo Puzzle - Easy** | Valid complete board, time >= 30s | `+25` | 10 games/day (250 coins) | `SOLO_REWARD` | `SOLO:userId:gameId` | Not allowed |
| **Solo Puzzle - Medium** | Valid complete board, time >= 45s | `+35` | 10 games/day (350 coins) | `SOLO_REWARD` | `SOLO:userId:gameId` | Not allowed |
| **Solo Puzzle - Hard** | Valid complete board, time >= 60s | `+50` | 10 games/day (500 coins) | `SOLO_REWARD` | `SOLO:userId:gameId` | Not allowed |
| **Solo Puzzle - Expert** | Valid complete board, time >= 90s | `+75` | 5 games/day (375 coins) | `SOLO_REWARD` | `SOLO:userId:gameId` | Not allowed |
| **Daily Challenge** | First valid solve of the day | `+100` | 1/day (100 coins) | `DAILY_CHALLENGE` | `DAILY:userId:YYYY-MM-DD` | HTTP 409 on duplicate |
| **Ranked Duel Wager Entry** | Queueing ranked match with stake | `-Stake` (e.g., 50) | Unlimited (balance check) | `DUEL_ESCROW` | `DUEL_ENTRY:matchId:userId` | Refund if match aborts |
| **Ranked Duel Payout (Win)** | Puzzle solved before opponent | `+2 × Stake` (e.g., 100) | Unlimited | `DUEL_WIN` | `DUEL_WIN:matchId:userId` | Admin audit rollback only |
| **Ranked Duel Payout (Loss)** | Opponent completed first / forfeit | `0` (stake forfeited) | Unlimited | `DUEL_LOSS` | `DUEL_LOSS:matchId:userId` | None |
| **Bot Duel Win** | Victory against AI (Easy/Med/Hard) | `+15` / `+25` / `+40` | 5 wins/day | `BOT_WIN` | `BOT:userId:matchId` | None |
| **Friend Duel (Casual)** | Unranked match victory | `+10` (or agreed friendly pot) | 5/day | `FRIEND_DUEL_WIN` | `FRIEND_DUEL:matchId:userId` | None |
| **Achievement Unlock** | Milestone reached (e.g. 10 wins) | `+100` to `+500` | Once per achievement | `ACHIEVEMENT` | `ACHIEVEMENT:userId:badgeId` | Unique index constraint |
| **Rewarded Video Ad (Future)**| Server-verified ad completion (Disabled) | `+20` | Max 5/day (100 coins) | `AD_REWARD` | `AD_REWARD:userId:adToken` | Token single-use check |
| **Shop Purchase (Avatar/Frame)**| User selects cosmetic item | `-ItemPrice` (e.g. -250) | Bound by inventory | `SHOP_PURCHASE` | `SHOP:userId:itemId:timestamp` | Item revocation on refund |
| **Admin Manual Grant / Fine** | Super Admin adjustment with audit reason | `+Amount` or `-Amount` | N/A | `ADMIN_ADJUSTMENT` | `ADMIN_GRANT:adminId:userId:txId` | Reversible via counter-tx |

---

## 3. Mathematical & Concurrency Invariants
1. **Invariant 1 (Non-negativity):** For any user $u$, $\text{Balance}_u(t) \ge 0$ for all timestamps $t$.
2. **Invariant 2 (Conservation of Payout):** For any two-player duel with stake $S$, $\text{Escrow}(P_1) + \text{Escrow}(P_2) = 2S = \text{Payout}(P_{\text{winner}})$.
3. **Invariant 3 (Concurrency Isolation):** All balance modifications execute under `SERIALIZABLE` or interactive transaction row-locking (`SELECT ... FOR UPDATE` via Prisma `$transaction`).
4. **Invariant 4 (Auditability):** $\text{Balance}_u(T) = \text{InitialBalance} + \sum_{i=1}^{N} \text{Delta}_i$.
