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


---

# VAGUE P1 — STATUT (session du 2026-08-16, suite)

| ID | Item | Status | Preuve |
|---|---|---|---|
| P1-A | ValidationPipe global + DTOs 13 domaines | ✅ | 13 tests exécutés (malformed/unknown/enum/UUID/négatif/board 10x10/oversized) ; tsc clean |
| P1-B | Guard admin frontend + identité réelle | ✅ | layout rewrité ; 0 Bearer-null restant ; tsc web clean |
| P1-B | Vraies données audit (endpoint + page) | ✅ | GET /admin/audit fusionne AdminActionLog+AuditLog |
| P1-C | Menu admin = pages fonctionnelles uniquement | ✅ | menu élagué ; règle respectée |
| P1-D | Users: search/filtres/pagination/détail | ✅ | API paginée (cap 50) + UI complète ; ban avec raison audité |
| P1-E | Shop admin 100% DB-driven (UI CRUD) | ✅ | /admin/shop complet ; contraintes stock/maxPerUser/fenêtres enforced serveur |
| P1-H | Stripe server-authoritative | ✅ (unit) | webhook forgé client supprimé ; verify serveur ; signature toujours vérifiée ; fail-closed secrets ; 11/11 tests. E2E live Stripe = BLOCKED (clés owner) |
| P1-F/G | Monetization flags/Ads | ⏳ PARTIAL | UI flags+ad-slots existe ; rendu AdSense réel non câblé |
| P1-I+ | CMS, Media, Q&A, Forum+, Chat multi-instance, Friends challenge, Daily admin, Game modes, Leaderboard+, SEO core, i18n ES/IT, Analytics, Insights, Themes, Homepage builder, SEO admin, Handover, Perf/index, Load tests | ⬛ NON DÉMARRÉ (ordonnancement P1 respecté : A→B→C→D→E→H effectués d'abord) |

## Corrections apportées pendant P1 (honnêteté d'exécution)
- enableImplicitConversion retiré (option supprimée de Nest 11) — la coercion de chaînes n'était pas nécessaire.
- GrantCoins: montants strictement positifs (le retrait = futur flux dédié permissionné).
- updateMarketingSettings: payload frontend adapté à { settings: {...} } (contrat vérifié avant cassure).

## Vérifications de fin de session
- API : suite complète VERTE (7 suites / 40 tests) — exécution réelle
- Web : tsc 0 erreur + build production exit 0 — exécution réelle
- Aucune donnée staging/production touchée ; aucune migration appliquée hors génération locale

## BLOCKED_BY_OWNER (rappel)
1. Rotation secrets Neon + JWT_SECRET  2. Backup + migrate resolve staging  3. Purge données bots (optionnel)


---

# VAGUE P1 (suite 2) — session du 2026-08-16

| ID | Item | Status | Preuve |
|---|---|---|---|
| P1-F/G | Architecture Ads DB-driven complète | ✅ VERIFIED (archi+unit 5/5) | migration 20260816200000 + composant AdSense réel + admin UI; livraison réelle = BLOCKED (credentials AdSense owner) |
| P1-I | CMS workflow complet + révisions | ✅ VERIFIED (9/9) | migration 20260816210000; fix sécurité fuite REVIEW; UI admin complète |
| P1-J | Media library + abstraction storage | ✅ VERIFIED (4/4, FS réel) | migration 20260816220000; S3 = NOT CONFIGURED (fail-fast, runbook) |
| P1-M | Chat multi-instance + présence TTL | ✅ VERIFIED (unit 9/9) | map locale supprimée, rooms Redis, handshake auth, ZSET+TTL+sweep; E2E 2-process = pending staging |
| — | Suite API complète | ✅ 67/67 tests, tsc api+web clean | exécution réelle |

## Reste P1 (ordre directive)
P1-K (Q&A), P1-L (Forum+), P1-N (challenge ami), P1-O (Daily admin), P1-P (modes), P1-Q (leaderboard), P1-R/S/T/U (SEO — priorité business), P1-V/W (analytics), P1-X/Y/Z (thèmes/homepage/SEO admin), P1-AA→AG (handover, perf, load, tests, docs, cleanup, audit final).

## Migrations en attente d'application staging (owner, après backup)
- 0_init (baseline resolve) → 20260816200000 → 20260816210000 → 20260816220000
