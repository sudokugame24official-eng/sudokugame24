# Database Migrations — Policy & Runbook

## Policy

| Environment | Allowed command | Forbidden |
|---|---|---|
| DEV (local docker postgres) | `prisma db push` (rapid prototyping) or `migrate dev` | — |
| STAGING (Neon) | `prisma migrate deploy` ONLY | `db push` (blocked by `scripts/prisma-guard.js`) |
| PRODUCTION | `prisma migrate deploy` ONLY | `db push` (blocked by guard + CI) |

The guard (`scripts/prisma-guard.js`) blocks `db push` when **either**:
- `NODE_ENV` is `production`/`staging`, **or**
- the effective `DATABASE_URL` host is not localhost/docker-internal
  (a forgotten `NODE_ENV` no longer bypasses it — the URL target is checked).

## Baseline migration

`packages/database/prisma/migrations/0_init/migration.sql` was generated from the
current `schema.prisma` (`prisma migrate diff --from-empty --to-schema-datamodel`).
It creates the full schema (34 tables, 43 indexes).

## Applying to an EXISTING database (staging on Neon)

The staging database was previously synced with `db push`, so its schema already
matches `0_init`. It must be marked as already-applied, exactly once:

```bash
# 1. BACKUP FIRST (Neon console → branch backup, or pg_dump)
# 2. Mark baseline as applied (does NOT execute the SQL):
DATABASE_URL="<staging-url>" npx prisma migrate resolve --applied 0_init --schema prisma/schema.prisma
# 3. From now on, deploy real migrations:
DATABASE_URL="<staging-url>" npx prisma migrate deploy --schema prisma/schema.prisma
```

Status: **BLOCKED BY INFRASTRUCTURE** — to be executed by the owner (requires
Neon console access + backup). No `db push` has been run against staging by this
workstream.

## Applying to a FRESH database (e.g. new prod)

```bash
DATABASE_URL="<fresh-url>" npx prisma migrate deploy --schema prisma/schema.prisma
```

## Creating a new migration (development only)

```bash
# edit prisma/schema.prisma, then:
npx prisma migrate dev --name <descriptive_name>
# review the generated SQL in prisma/migrations/<timestamp>_<name>/migration.sql
# commit it — CI runs `migrate deploy` on staging
```

## Why this matters

- Audit trail of every schema change (git history of migration files).
- Rollback path: revert deploy by restoring DB backup + reverting commits.
- Buyer handover: schema evolution is documented, not implicit.
