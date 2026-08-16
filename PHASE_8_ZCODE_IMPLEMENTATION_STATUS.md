# PHASE 8 — ZCODE IMPLEMENTATION STATUS

Dernière mise à jour : 2026-08-16 (fin de la vague P0)

## Vue d'ensemble

Légende : ✅ VERIFIED_BY_EXECUTION · 🔎 VERIFIED_STATICALLY · ⏳ PARTIAL · ❌ BROKEN · ⬛ MISSING · 🚫 BLOCKED BY INFRASTRUCTURE

| ID | Item | Status | Preuve |
|---|---|---|---|
| P0-A | Purge secrets (env backups, test-scripts) | ✅ + action owner | scans négatifs ; rotation Neon/JWT 🚫 (console) |
| P0-A | .gitignore propre | 🔎 | UTF-8, `.env*` ignorés, exemples trackables |
| P0-A | Fail-fast REDIS_URL prod/staging | 🔎 | redis.service.ts / redis.adapter.ts |
| P0-B | git init + commits atomiques | ✅ | 8 commits sur `main` |
| P0-B | Migration baseline 0_init | 🔎+🚫 | générée+validée ; resolve staging = owner |
| P0-B | Guard db push URL-aware | ✅ | 4/4 scénarios exécutés |
| P0-C | Suppression SimulationService | 🔎 | 0 référence ; runbook purge fourni |
| P0-D | Anti-cheat solo (pas de solvedBoard) | ✅ | 2/2 tests (échouaient avant fix) |
| P0-D | Fix mode DAILY (grille locale → vraie grille) | 🔎 | SudokuGrid dérive via solveur |
| P0-E | Atomicité moves duel (WATCH/MULTI+TTL) | ✅ (mock) | 6/6 tests concurrence ; Redis réel à confirmer |
| P0-F | Ban enforcement REST+WS | ✅ | 4/4 tests |
| P0-F | Audit actorId réel + audit unban | 🔎 | typecheck OK (E2E admin à faire P1) |
| P0-G | Cap quotidien rewarded ads | ✅ | test cap 4/4 |
| P0-G | Payouts duel honnêtes + claim atomique + idempotency | ✅ (unit) | E2E staging à faire |
| P0-G | Webhook erreur → FAILED | ✅ | test 4/4 |
| P0-H | Route /api/audit (RCE/SSRF) supprimée | 🔎 | fichier absent, tsc web 0 erreur |
| Vérif | API: 6 suites / 20 tests | ✅ | sortie jest |
| Vérif | tsc api + web : 0 erreur | ✅ | sorties tsc |
| Vérif | Web — build production (`next build`) | ✅ | exit 0, manifeste routes complet |

## Corrections d'audit (honnêteté)

1. SimulationModule n'était **pas enregistré** dans AppModule (code mort inerte, pas des crons actifs comme écrit dans l'audit initial).
2. Le duel bot **ne mintait pas** `x2` (le ternaire était du code mort DANS un bloc `!isBotMatch` jamais atteint) — le vrai bug était l'inverse : les matchs bot ne payaient **rien du tout**. Corrigé dans les deux sens.

## Dette connue acceptée (P0 scope)

- Stripe: la page succès client forge toujours un webhook (signature rejetée en prod → pas de crédit) — reprise en P1-D avec verify serveur.
- `Purchase.amount` Float, coin packs hardcodés → P1-C.
- Pas de refresh tokens/2FA → P3.
- Test concurrence ledger non rejoué (écrit en DB staging) → à rejouer sur DB locale.

## Actions OWNER requises (impossible depuis le code)

1. **Rotation immédiate** du mot de passe Neon et du JWT_SECRET (les anciens valeurs étaient exposées dans le repo).
2. Backup Neon puis `prisma migrate resolve --applied 0_init` sur staging (runbook: docs/DATABASE_MIGRATIONS.md).
3. Optionnel: exécuter `tools/migrations/purge-simulation-data.ts` (dry-run d'abord).

## Prochaines vagues (ordre)

P1-A validation DTO → P1-B admin frontend security → P1-C shop admin + packs DB → P1-D Stripe server-authoritative → P1-E SEO core → P1-F chat multi-instance → P1-G CD réel → P1-H index BDD → P2…
