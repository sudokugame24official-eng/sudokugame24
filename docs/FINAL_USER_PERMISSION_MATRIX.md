# FINAL USER PERMISSION & CAPABILITY MATRIX

This matrix defines the absolute permissions and boundary enforcement for all roles across Frontend UI, API controllers/guards, and Database/Business Logic constraints.

---

## 1. Persona Roles Defined in Database Enum (`Role`)
1. **GUEST** (Unauthenticated anonymous visitor)
2. **UNVERIFIED** (Registered account with `isEmailVerified: false`)
3. **MEMBER** (Registered account with `isEmailVerified: true` - standard verified player)
4. **PREMIUM_MEMBER** (Subscribed / VIP member)
5. **MODERATOR** (Assigned moderation privileges for Community, Forum, Chat)
6. **ADMIN** (Business management, CMS, Support, Shop manager)
7. **SUPER_ADMIN** (Owner, System controls, Security, Emergency, Economy)

---

## 2. Global Action & Restriction Matrix

| Action | GUEST | UNVERIFIED | VERIFIED MEMBER | MODERATOR | ADMIN | SUPER_ADMIN | Frontend Restriction | API Restriction | Database / Logic Restriction |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **View Public Pages** (Home, Learn, Academy, FAQ, About) | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public routes | Unprotected endpoint | Public DB read |
| **Play Solo Practice Sudoku** | ✅ Allowed (Local state) | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Direct access | Optional guest submission | Local / Session storage or DB save |
| **Play Daily Challenge (Solve)** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Can view & solve | GET `/daily/today` public | Puzzle generated/cached in DB |
| **Submit Daily Challenge (Coins/Streak)** | 🔒 Auth Required | 🔒 Verification Req | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Auth modal prompted | `@UseGuards(JwtAuthGuard)` + Verified check | 1 submission/day (`DailyRecord` unique index `userId_date`), duplicate yields `HTTP 409` |
| **Queue Ranked Multiplayer Duel** | 🔒 Auth Required | 🔒 Verification Req | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Redirect to `/auth` | WSS JWT Auth + Elo Guard | Wager atomic escrow via `CoinLedgerService` |
| **Play Bot Duel** | 🔒 Auth Required | 🔒 Verification Req | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Redirect to `/auth` | `@UseGuards(JwtAuthGuard)` | Dedicated match instance, single payout |
| **Friend Duel Invite** | 🔒 Auth Required | 🔒 Verification Req | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Redirect to `/auth` | JWT Auth, Block check | Redis TTL Invite key + mutual friendship check |
| **Browse Forum Topics** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public route | GET `/forum/topics` public | Read-only topic & reply query |
| **Create Forum Topic** | 🔒 Auth Required | 🔒 Verification Req | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Hidden/Prompt on click | `@UseGuards(JwtAuthGuard)` | Title slug generation, author relation |
| **Reply / Like Forum Post** | 🔒 Auth Required | 🔒 Verification Req | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Prompt on click | `@UseGuards(JwtAuthGuard)` | Unique index `userId_replyId` / `userId_topicId` on likes |
| **Edit/Delete Own Forum Post** | 🔒 Auth Required | 🔒 Verification Req | ✅ Allowed (Own only) | ✅ Allowed (Any) | ✅ Allowed (Any) | ✅ Allowed (Any) | Edit button if author | Checks `authorId === req.user.id` or role | Soft-delete `isDeleted: true` |
| **Pin / Lock / Moderate Forum** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | ✅ Allowed | ✅ Allowed | Admin action menu | `@Roles(MODERATOR, ADMIN, SUPER_ADMIN)` | DB flags `isPinned`, `isLocked` |
| **Ask / Answer in Q&A** | 🔒 Auth Required | 🔒 Verification Req | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Prompt on click | `@UseGuards(JwtAuthGuard)` | Question/Answer relation |
| **Vote / Accept Answer in Q&A** | 🔒 Auth Required | 🔒 Verification Req | ✅ Allowed (Author for accept) | ✅ Allowed | ✅ Allowed | ✅ Allowed | Action button | Only question author can call `/accept` | Unique vote records |
| **Send / Receive Direct Chat** | 🔒 Auth Required | 🔒 Verification Req | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Redirect to `/auth` | WSS namespace `/chat` JWT auth | Intercepted if blocked (`UserBlock` table) |
| **Send / Accept Friend Request** | 🔒 Auth Required | 🔒 Verification Req | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Redirect to `/auth` | JWT Auth | `Friendship` table unique `(userA, userB)`, status `PENDING/ACCEPTED` |
| **Block / Unblock User** | 🔒 Auth Required | 🔒 Verification Req | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Profile action | `@UseGuards(JwtAuthGuard)` | `UserBlock` table, triggers socket/DM gate |
| **Earn Coins (Solo, Daily, Duel)** | ❌ Blocked | ❌ Blocked | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | UI visual feedback | Server autority only | ACID double-entry `CoinLedgerTransaction` |
| **Spend Coins (Shop)** | 🔒 Auth Required | 🔒 Verification Req | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Auth modal on Buy | `@UseGuards(JwtAuthGuard)` | Atomic debit check (`balance >= price`), rollback on failure |
| **View Admin Overview & KPIs** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | ✅ Allowed | `/admin` 403 / Redirect | `@Roles(ADMIN, SUPER_ADMIN)` | Direct aggregated analytics |
| **Moderate Users (Ban/Unban/Mute)** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | ✅ Allowed | ✅ Allowed | `/admin/moderation` | `@Roles(MODERATOR, ADMIN, SUPER_ADMIN)` | `User.isBanned = true`, creates `AuditLog` |
| **Grant Coins / Debit Ledger** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | `/admin/users/[id]/coins` | `@Roles(SUPER_ADMIN)` | Strict Ledger entry with `reason`, `adminId` |
| **Manage Content / CMS** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | ✅ Allowed | `/admin/content` | `@Roles(ADMIN, SUPER_ADMIN)` | CMS workflow revisions |
| **Modify Game Mode Configs** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | ✅ Allowed | `/admin/modes` | `@Roles(ADMIN, SUPER_ADMIN)` | `SystemSetting` key-value persistence |
| **System Emergency Controls** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed | `/admin/emergency` | `@Roles(SUPER_ADMIN)` | Kill-switches & rate limit tuners |

---

## 3. Defense-in-Depth Architecture
1. **Frontend Gate**: Next.js route middleware + Client-side guards dynamically disable UI actions or redirect unauthenticated guests to `/auth` with return URL.
2. **API Gate**: NestJS `JwtAuthGuard` + `RolesGuard` + `EmailVerificationGuard` enforce token authenticity and required claims.
3. **Database Gate**: Unique constraints, foreign keys, and Prisma interactive transactions (`$transaction`) guarantee data integrity even against direct payload tampering or race conditions.
