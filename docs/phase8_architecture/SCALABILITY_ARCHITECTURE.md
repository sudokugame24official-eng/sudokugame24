# SCALABILITY & PERFORMANCE ARCHITECTURE

## 1. High-Concurrency Design Patterns
- **Stateless API Instances:** NestJS instances share no local memory state. Presence, active duel match locks, and chat rooms are distributed across Redis.
- **WebSocket Scaling:** `Socket.IO` Redis adapter distributes room broadcasts across multiple Node.js worker processes.
- **Optimistic Locking:** Duel moves and Coin transactions use Redis `WATCH/MULTI` and PostgreSQL row versioning rather than heavy database pessimistic table locks.
- **ZSET Leaderboards:** Redis Sorted Sets (`leaderboard:global:rating`) provide `O(log(N))` rank lookups and range queries for millions of active players.

## 2. Database Optimization & Indexing
- Foreign keys (`userId`, `authorId`, `questionId`, `puzzleId`) and ordering columns (`createdAt`, `lastActivityAt`, `score`, `rating`) are explicitly indexed in Prisma.
- High-volume endpoints use cursor-based pagination or bounded limits (`take: 50`) to prevent unbound memory consumption.
- Nightly cron aggregations pre-compute analytics rollups into `AnalyticsDaily` tables to eliminate heavy ad-hoc SQL aggregation queries on the operational database.
