# PHASE 8 — FIX LOG (ZCODE execution)

Format: Feature / Before / Change / After / Tests / Security / Performance / Status

---

## P0-A — Secret & credential hardening — ✅ DONE

**Secrets purge**
- Before: `.env.backup` (root) + `packages/database/.env.backup` contenaient une DATABASE_URL Neon réelle avec mot de passe + un JWT_SECRET réel. `test-scripts/setup-test-users.ts/.js` et `test-scripts/verify-duel.js` contenaient les mêmes credentials en dur dans le source.
- Change: suppression des 2 `.env.backup` (valeurs préservées uniquement dans `packages/database/.env`, gitignoré). Scripts de test réécrits : `process.env` + dotenv + fail-fast si absent.
- After: scan certification — 0 `npg_`, 0 URL postgres réelle hors compose placeholders (hosts internes `postgres`/`db`).
- Tests: scans grep + vérification booléenne des logs (`build.log`, logs test-results) → négatifs.
- Security: 🔴 CRITIQUE→✅ en code. **⚠️ ROTATION Neon + JWT_SECRET restent à faire par le propriétaire (action console, impossible depuis le code).**

**.gitignore**
- Before: dernière ligne `.env.backup` écrite en UTF-16 (octets NUL) → règle inopérante.
- Change: réécriture UTF-8 complète (`.env*`, `!*.example`, test-results, logs, uploads…).
- After: vérifié — seuls les `.example` sont trackables.

**Fail-fast Redis**
- Before: `REDIS_URL` absent en prod/staging → fallback silencieux `ioredis-mock` (pub/sub, locks, état duel cassés sans signal).
- Change: throw au boot en production/staging ; mock conservé pour dev/test uniquement.
- Status: VERIFIED STATICALLY (le throw est sur le chemin d'init).

## P0-B — Git + migrations — ✅ DONE

**Git**
- Before: pas de repo git (aucun historique, aucun rollback).
- Change: `git init` (branche `main`), commit baseline post-purge (`1ba8d55`), puis 1 commit par fix P0. 345 fichiers trackés, 0 fichier env réel.
- After: historique complet des corrections P0.

**Migration baseline Prisma**
- Before: 0 migration ; CI exécutant `migrate deploy` dans le vide ; schéma géré par `db push` + SQL manuels à la racine.
- Change: `0_init` générée par `migrate diff --from-empty --to-schema-datamodel` (34 tables, 43 index) + `migration_lock.toml`. Runbook `docs/DATABASE_MIGRATIONS.md` (policy dev/staging/prod + procédure `migrate resolve` pour le staging existant).
- After: `migrate deploy` fonctionnel pour toute base neuve.
- Status: VERIFIED STATICALLY + generation executed ; application au staging = **BLOCKED BY INFRASTRUCTURE** (nécessite backup Neon + accès console owner).

**Prisma guard**
- Before: bloquait `db push` uniquement sur NODE_ENV — une URL prod avec NODE_ENV oublié passait.
- Change: vérifie l'hôte de la DATABASE_URL effective (env ou packages/database/.env) ; non-localhost → blocage.
- Tests: 4 scénarios exécutés (Neon bloqué / localhost OK / NODE_ENV=production bloqué / URL absente bloqué).
- Status: VERIFIED BY EXECUTION (4/4).
- Note comportementale: le flux local historique (`START_SUDOKU.bat` → db:push vers Neon) est désormais bloqué volontoirement → passer par migrations.

## P0-C — Suppression fausse activité — ✅ DONE

- Before: `simulation.service.ts` (faux messages chat globaux + création horaire de vrais users `@bot.com` avec `passwordHash: 'bot_password'` + vrais posts de forum).
- **Correction d'audit**: SimulationModule n'était PAS enregistré dans AppModule — code mort inerte (l'audit initial surévaluait: "crons actifs"). Danger réel en cas de réenregistrement.
- Change: dossier `simulation/` supprimé ; `tools/migrations/purge-simulation-data.ts` (dry-run par défaut, EXECUTE=1) pour nettoyer tout historique.
- Status: VERIFIED STATICALLY (0 référence restante).

## P0-D — Anti-cheat solo — ✅ DONE

- Before: `GET /sudoku/start` renvoyait `solvedBoard` (triche triviale). Bug caché: le mode DAILY jouait une grille locale aléatoire (le null de solvedBoard faisait retomber SudokuGrid sur génération locale).
- Change: réponse sans `solvedBoard` ; SudokuGrid dérive la solution via `SudokuSolver.solve` pour l'UX uniquement ; le serveur valide authoritativement à la submission.
- Tests: `sudoku.anti-cheat.spec.ts` — réponse sans solvedBoard (échouait avant le fix) + solution toujours persistée côté serveur.
- Status: VERIFIED BY EXECUTION (2/2).

## P0-E — Atomicité duel — ✅ DONE

- Before: `fallbackHandleMove` = GET→mutate→SET sans verrou (régression d'un hot-patch regex `patch.js`), TTL perdu, test unitaire obsolète moquant un chemin Lua disparu.
- Change: `atomicHandleMove` — transaction optimiste WATCH/MULTI sur connexion dédiée, TTL préservé, retry 10× avec backoff jitteré.
- Tests: spec réécrit — même cellule concurrente (exactement 1 appliqué), 10 cellules distinctes (0 update perdu), rejet replay, TTL préservé, spectateur rejeté, mauvaise valeur pénalisée.
- Status: VERIFIED BY EXECUTION sur ioredis-mock (6/6) ; sémantique Redis réelle à re-vérifier au déploiement staging.

## P0-F — Ban enforcement + audit — ✅ DONE

- Before: `isBanned` jamais vérifié (accès complet 7 jours post-ban, REST+WS) ; AuditLog.actorId stockait le RÔLE au lieu de l'id admin ; unban non audité.
- Change: rejet dans `JwtStrategy.validate` (banni → 401 ; via OptionalJwtAuthGuard → anonyme sur pages publiques) et `WsJwtGuard` ; actorId réel ; entrée UNBAN_USER.
- Tests: `ban-enforcement.spec.ts` (4/4).
- Status: VERIFIED BY EXECUTION.

## P0-G — Intégrité économie — ✅ DONE

- Before: ads récompensées = faucet illimité (clé `Date.now()`, pas de plafond, 2 écritures non transactionnelles) ; duel bot ne payait rien (bloc dans `!isBotMatch`) avec ternaire mort `isBotMatch ? x2 : x2` ; pas de clé d'idempotency sur les payouts ; erreur webhook → retour PENDING (double crédit possible au replay).
- Change: cap quotidien ads (env `AD_REWARD_DAILY_CAP`, défaut 5) + transaction unique ; payouts duel restructurés (match réel = transfert zéro-sum ×2 ; bot = remboursement exact de la mise, jamais de monnaie créée) ; claim atomique de finalisation (DEL count) contre les double-payouts concurrents ; clés stables `duel_win_/draw_/bot_stake_` ; webhook erreur → FAILED terminal.
- Tests: `shop.economy.spec.ts` (4/4).
- Status: VERIFIED BY EXECUTION (unitaire) ; à re-vérifier en E2E sur staging avec Redis réel.

## P0-H — Suppression RCE/SSRF — ✅ DONE

- Before: `apps/web/app/api/audit/route.ts` — route publique exécutant `child_process.exec` (tsc/npm) avec chemins Windows codés en dur + SSRF (`fetch(target)` arbitraire).
- Change: route supprimée. Cache `.next` nettoyé (résidus de types).
- Status: VERIFIED STATICALLY (fichier absent, 0 référence source).

---

## Vérifications globales (fin de vague P0)

| Vérification | Résultat |
|---|---|
| API — suite Jest complète (hors test DB-bound) | **6 suites / 20 tests PASS** |
| API — `tsc --noEmit` | **0 erreur** |
| Web — `tsc --noEmit` (après purge .next) | **0 erreur** |
| Web — `next build` production | **SUCCÈS** (exit 0, manifeste routes complet) |
| Test concurrence ledger (DB réelle) | NON EXÉCUTÉ — écrit dans la DB du `.env` (= Neon staging) ; bloqué volontairement sans backup owner |
| Scan secrets post-fix | 0 secret réel hors env gitignorés |

## Reste à faire (hors P0, non démarré)

- P1: ValidationPipe + DTO globaux ; guard frontend admin ; UI shop admin ; Stripe server-verify (checkout succès client = webhook forgé — toujours présent) ; SEO core ; chat multi-instance ; CD réel ; index BDD.
- Rotation des secrets (action OWNER côté console Neon).
- `migrate resolve` staging (action OWNER, après backup).


---

# VAGUE P1 — FIX LOG (extrait)

## P1-A Validation — ✅
Before: @Body() any généralisé, aucune couche de validation (class-validator absent).
Change: ValidationPipe global (whitelist/forbidNonWhitelisted/transform/forbidUnknownValues) + DTOs typés sur auth, sudoku (validateur 9x9), daily, shop (+CRUD admin), forum, friends, users, admin (12 DTOs), content, knowledge, monetization. Fix au passage: content.controller excluait SUPER_ADMIN/CONTENT_MANAGER du CMS.
Tests: 13 cas exécutés dont mass-assignment isAdmin rejeté → 400.

## P1-B Admin security — ✅
Before: 0 contrôle d'accès frontend, carte "Admin User/SUPER_ADMIN" codée en dur, 4 pages Bearer null (401 garantis), page audit fictive.
Change: guard par session (redirect/denied), identité réelle, logout réel, menu limité aux pages fonctionnelles, credentials:"include" partout, GET /admin/audit réel (fusion des 2 tables, cap 500).

## P1-D Users — ✅
Before: take:100 sans recherche ni détail.
Change: GET /admin/users paginé+filtrable, GET /admin/users/:id (agrégats, achats, transactions, signalements, audit lié, passwordHash strippé), UI avec modales d'action (ban à raison obligatoire).

## P1-E Shop — ✅
Before: colonnes stock/maxPerUser/dates mortes ; aucune UI produits.
Change: enforcement serveur (fenêtre, stock, maxPerUser compté depuis le ledger) + décrément atomique du stock dans la transaction d'achat ; UI CRUD complète /admin/shop.

## P1-H Stripe — ✅ (unit)
Before: page succès forgant un webhook depuis le navigateur ; bypass signature en NODE_ENV=test ; fallbacks sk_test_mock/whsec_test ; sessions mock.
Change: GET /shop/purchase/status (vérifie AUPRÈS de Stripe, ownership, idempotent) ; signature toujours vérifiée ; secrets requis fail-closed ; sessions toujours réelles. Webhook = source de vérité principale, verify = rattrapage.
Tests: 11/11 (cross-user rejeté, double-crédit impossible, fail-closed).
LIMITS: E2E avec vraies clés Stripe NON exécuté (BLOCKED: clés propriétaire).
