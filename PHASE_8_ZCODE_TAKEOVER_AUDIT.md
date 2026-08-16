# PHASE 8 — AUDIT DE REPRISE DE PROJET (ZCODE TAKEOVER)

**Date :** 2026-08-16
**Auditeur :** ZCode (CTO / Principal Architect / Security Engineer / Product Owner)
**Périmètre :** Repository complet — `apps/api`, `apps/web`, `packages/*`, infra, CI/CD, docs, artefacts de test.
**Méthode :** Audit statique (lecture exhaustive du code via 4 agents d'exploration + vérifications manuelles ciblées) + forensique des artefacts (logs de build, logs de tests, scripts). Contre-vérification personnelle des 6 découvertes les plus critiques (fichiers relus ligne par ligne).

> **Statut de vérification global :**
> - Les affirmations de ce rapport sont **VERIFIED STATICALLY** (lues dans le code, avec référence fichier:ligne) sauf mention contraire.
> - Rien n'a été **VERIFIED BY EXECUTION** dans cette session : l'application n'a pas été démarrée (aucun Docker/DB lancé). Les logs de tests précédents ont été analysés en tant qu'artefacts, pas rejoués.
> - Les affirmations des rapports précédents (Antigravity) ont été **contre-vérifiées : plusieurs sont fausses ou gonflées** (voir §18).
> - Déploiement production / Sentry / Cloudflare : **BLOCKED BY INFRASTRUCTURE** (non câblés).

---

## 1. EXECUTIVE SUMMARY

La plateforme est un monorepo Turborepo réel et substantiel : **Next.js 16.2** (App Router, next-intl 5 locales), **NestJS 11** (22 modules), **Prisma/PostgreSQL** (34 modèles), **Socket.IO + Redis adapter**, **BullMQ** pour les emails. Le cœur métier est souvent bien écrit : le ledger de coins (`CoinLedgerService`) est réellement protégé contre le double-spend (transaction + verrou optimiste + clé d'idempotency, prouvé par un test d'intégration à 100 débits concurrents), le matchmaking duel utilise un verrou distribué Redis correct (`SET NX PX` + Lua release), et le RBAC côté API repose sur un vrai système de permissions en base (`RolePermission` + `PermissionGuard`).

**Mais le projet n'est pas prêt pour la production, et plusieurs affirmations des phases précédentes sont fausses :**

1. **Des secrets réels sont exposés dans le repo** : `.env.backup` (URL Neon avec mot de passe + JWT_SECRET réel) et `test-scripts/setup-test-users.ts:4` (URL Neon de production avec mot de de passe en dur). **Rotation immédiate requise.**
2. **Aucune migration Prisma n'existe** (0 migration) alors que le CI exécute `prisma migrate deploy` — le schéma est géré à coups de `db push` et de SQL lancés à la main à la racine.
3. **Le déploiement CI/CD est un décor** : les étapes Railway/Vercel/smoke-tests de `deploy.yml` sont des `echo` ; le "manual approval" production est un `echo`.
4. **L'anti-cheat du Sudoku solo est cassé** : l'API renvoie `solvedBoard` au client (`sudoku.service.ts:52`), rendant la triche triviale — alors que le module Daily, lui, le neutralise correctement.
5. **Un module fabrique de la fausse activité** : `simulation.service.ts` crée toutes les heures de vrais utilisateurs et de vrais posts de forum bidon en base.
6. **Le panneau admin est une façade partielle** : 17 pages réelles (souvent incomplètes, boutons morts, données fictives) pour ~35 entrées de menu ; **aucun contrôle d'accès frontend** ; plusieurs pages appellent l'API avec `Bearer null`.
7. **La documentation "Phase 8" est un échafaudage vide** : les 14 fichiers de `docs/phase8_architecture/` sont des templates de 350 octets générés par script, sans contenu.
8. **Le repo n'est pas sous git** : aucune historique, aucun rollback possible — risque existentiel pour un projet destiné à être vendu.

**Verdict global : FONDATIONS RÉELLES + DETTE CRITIQUE. Ne pas déployer en production en l'état. Une remise en ordre ciblée (2–3 semaines) est nécessaire avant tout lancement public.**

---

## 2. CURRENT ARCHITECTURE

```
Monorepo Turborepo (npm workspaces)
├── apps/web      Next.js 16.2 (App Router, Turbopack, next-intl, Tailwind, shadcn-style)
├── apps/api      NestJS 11 (22 modules, Socket.IO 3 gateways, BullMQ, Prisma)
├── packages/database   Prisma schema (34 modèles, PostgreSQL) + seeds (5 scripts rivaux)
├── packages/sudoku-engine  Générateur/solveur v1+v2, 10 fichiers de tests Jest réels
├── packages/ui         Boilerplate Turborepo (inutilisé : bouton alert() de démo)
├── packages/eslint-config, typescript-config
├── .github/workflows/deploy.yml  (CI réel, CD factice)
├── docker-compose{,.prod,.production,.staging,.test}.yml  (2 stacks prod divergentes)
├── nginx/nginx.conf  (orphelin : aucun service ne l'utilise)
└── scripts/ racine : fix-*.js, patch.js, expand-*.js (9 codemods jetables, effets en dur dans le code)
```

- **Auth :** JWT en cookie httpOnly (7 jours), Google OAuth (avec creds factices de fallback), PAS de refresh token, PAS de révocation serveur.
- **Temps réel :** 3 namespaces Socket.IO (`/duel`, `/chat`, `/presence`) + Redis adapter (fallback silencieux `ioredis-mock` si `REDIS_URL` absent).
- **Jobs :** BullMQ (`email-queue`) + crons NestJS (leaderboard 10 min, marketing, simulation).
- **BDD :** Neon (staging réel, `ep-crimson-credit-...neon.tech`), gérée exclusivement par `db push` — **0 migration**.
- **Infra prévue mais non câblée :** Vercel/Railway (echo), Sentry (déps installées, zéro `Sentry.init`), Cloudflare (aucune trace).

---

## 3. EXISTING FEATURES (audit par fonctionnalité)

Légende : ✅ EXISTING (fonctionnel, vérifié statiquement) · 🟡 PARTIAL · 🔴 BROKEN · ⬛ MISSING · ❓ UNVERIFIED (runtime non testé)

| Fonctionnalité | Statut | Détail / Preuve |
|---|---|---|
| Sudoku solo (génération, session, soumission serveur) | 🟡 | Flux complet MAIS `solvedBoard` fuit au client (`sudoku.service.ts:52`) → anti-cheat cassé |
| Daily Challenge | ✅ | Génération quotidienne, scoring serveur, leaderboard, `solvedBoard` correctement neutralisé (`daily.service.ts:40-43`) |
| Duel temps réel | 🟡 | Queue, lobby, invites, bots, spectateurs — mais race condition sur les coups (§6-S8) et économie faussée (§8) |
| Matchmaking | ✅ | Verou distribué Redis correct (`duel.service.ts:747-825`), critères difficulté/mise/rating, fallback bot après 10 s |
| Chat privé (DM) | 🟡 | REST + gateway `/chat` — livraison cassée en multi-instance (map mémoire `chat.gateway.ts:27`) |
| Chat global | 🟡 | Widget sur toutes les pages — mais alimenté par des messages SIMULÉS (§6-S9) |
| Forum | ✅ | Catégories, posts, commentaires, likes, modération basique ; like en double possible (NULL en unique, §15) |
| Amis / blocage | 🟡 | Requêtes, acceptation, blocage — le feature flag `FRIENDS_ENABLED` est du code mort (`await` manquant, `friends.service.ts:15`) |
| Profils / stats publiques | ✅ | XP, niveaux, streaks, rating Glicko-2 (champs), stats winrate |
| Progression / succès | ✅ | Achievements + UserAchievement, XP duel avec pénalité bot 70 % |
| Leaderboard | ✅ | Redis ZSET reconstruit par cron 10 min + fallback PG |
| Shop (produits coins) | 🟡 | CRUD admin DB-driven MAIS `maxPerUser`/`stock`/fenêtres de dates jamais vérifiés à l'achat |
| Achat de coins (Stripe) | 🔴 | Checkout serveur existe, mais la page succès envoie un **webhook forgé côté client** (`checkout/page.tsx:13-25`) ; en prod la signature échouerait → coins jamais crédités par cette voie |
| Rewarded ads | 🔴 | Simulacre (setTimeout 2 s côté client), farmable (§8) |
| Coins / Ledger | ✅ | Double-spend réellement protégé, test d'intégration à l'appui (le point le plus solide du repo) |
| Email (transactionnel + crons marketing) | ✅ | Nodemailer + BullMQ + templates éditables admin ❓(envoi réel non vérifié) |
| CMS articles | 🟡 | Modèle riche (SEO fields), listing public, création admin — PAS d'édition UI, route `/article/[slug]` dupliquée et cassée |
| Knowledge base (techniques sudoku) | ✅ | Modèle dédié + pages SEO + admin CRUD |
| Support tickets | ✅ | Tickets, messages, workflow admin complet-ish |
| Blog / Q&A | ⬛ | Pas de modèle distinct (uniquement ContentArticle) ; Q&A absent |
| i18n | 🟡 | EN/FR/DE complets (713 lignes) ; **ES/IT = stubs vides de 5 lignes** alors qu'ils sont annoncés (hreflang, sitemap, switcher) |
| Admin Panel | 🟡 | Voir §7 — 17 pages partielles, ~22 stubs |
| Feature flags | 🟡 | Système DB + cache 60 s + rollout % — mais clés dupliquées legacy/modern (§7) |
| Analytics | ⬛ | Aucun modèle, aucune table d'événements ; dashboard admin = compteurs live + graphes JS sur `findMany` |
| Tournaments / Clans | ⬛ | Flag `TOURNAMENTS_ENABLED=false`, aucun modèle |
| Multijoueur "multiplayer" page | 🔴 | Clone legacy du duel, namespace socket incohérent, users aléatoires factices |
| Thèmes / apparence | ⬛ | Uniquement dark (pas de toggle, pas de `.light`), page admin "Themes" = stub ; couleurs inline en dur partout |

---

## 4. MISSING FEATURES (vs vision "plateforme mondiale")

1. **Analytics/BI** : aucune table d'événements, aucune agrégation SQL, aucune rétention/cohortes, aucune explication auto ("+18 % cette semaine"). `ANALYTICS_ARCHITECTURE.md` = template vide.
2. **Contrôle d'accès admin frontend** : aucun guard/middleware côté web ; n'importe qui charge l'UI admin (l'API refuse, mais l'UX expose tout).
3. **Gestion complète du CMS** : édition/suppression/planification/médiathèque absentes ; uploads écrits dans `../web/public/uploads` (couplage FS API↔web, cassé en containers séparés).
4. **Gestion Stripe admin** : coin packs **hardcodés** (`COIN_PACKS`, `shop.service.ts:13-17`) — aucune UI, aucune séparation test/prod réelle.
5. **Gestion Google Ads admin** : `AdSlotConfig` existe + UI ad-slots, mais `AdSlot.tsx` n'affiche qu'un placeholder (`[AdSlot: X]`) — AdSense commenté.
6. **Refresh tokens / révocation / 2FA / vérification email effective** : absents.
7. **Tests** : pas de tests frontend unitaires, pas de tests API auth/admin/shop/webhook.
8. **SEO programmatique** : landing pages `/sudoku/[difficulty]` = stubs placeholder ; pas de `generateStaticParams` ; pas de FAQ/Organization schema.
9. **File d'attente générique / jobs admin UI** : BullMQ utilisé uniquement pour l'email.
10. **Documentation de transfert** : OWNER_HANDOVER réel, runbooks, inventaire tiers — inexistants (stubs vides).
11. **Sauvegarde/restauration** : `DISASTER_RECOVERY_PLAN.md` vide ; aucun script de backup.
12. **Modération réelle** : mots interdits, anti-spam forum/chat, rate-limits configurables admin — absents (throttle WS fixe par env seulement).

---

## 5. BROKEN FEATURES (cassées ou mensongères)

1. **`GET /sudoku/[difficulty]` (web)** : affiche `"[Interactive {X} Sudoku Grid Component Mounts Here]"` — placeholder en production (`sudoku/[difficulty]/page.tsx:55`), avec liens `/en/...` codés en dur.
2. **`/article/[slug]` (web)** : `generateMetadata` n'attend pas `params` (obligatoire en Next 16) → requête `/content/articles/undefined` ; route absente du sitemap, dupliquée de `/learn/[slug]`.
3. **Pages admin avec `Bearer null`** : `admin/users`, `admin/community/forum`, `admin/system/health`, `RewardVideoModal` lisent `localStorage.getItem("token")` que **rien n'écrit jamais** → 401 garantis.
4. **`MarketingPixels.tsx`** : fetch `/admin/marketing-settings` (endpoint admin-guardé) depuis chaque visiteur — les pixels ne se chargeront jamais (aveu dans le commentaire du fichier, lignes 21-26).
5. **Boutons admin morts** : `admin/moderation` (Avertir/Supprimer sans onClick), `admin/content` (Edit/Eye/Archive inertes), recherche utilisateurs sans handler.
6. **`admin/audit`** : données entièrement fictives, commentaire admis ligne 13 ("Fake fetch for MVP").
7. **Duel : handlers lobby morts** : `requestLobbyState/updateLobbySettings/leaveLobby/handleLobbyChat` (`duel.service.ts:536-725`) ne sont reliés à aucun `@SubscribeMessage` — inatteignables.
8. **Presence disconnect** : `client.data.user` jamais peuplé à la connexion → `markUserOffline` est du code mort, utilisateurs fantômes dans le set Redis online.
9. **OAuth Google en déploiement** : `callbackURL: 'http://localhost:3001/...'` codé en dur (`google.strategy.ts:11`) + creds fallback `dummy-*` → cassé hors local.
10. **`checkout` Stripe** : flux succès forgé (voir §3) ; chemin d'erreur du webhook **retourne COMPLETED→PENDING** (`shop.service.ts:154-160`) → un webhook rejoué peut re-créditer.
11. **ES/IT** : locales annoncées mais fichiers de traduction vides → pages ESP/ITA sans texte.
12. **Build web** : `build.log` (12/08) = échec avec 38 erreurs ; réparé à la hache par `fix-use-client.js`/`fix.js`. Dernier run Playwright : **5 échecs** (auth) ; dernier `api#test` pre-staging (15/08) : **échec**.

---

## 6. SECURITY FINDINGS

### 🔴 S1 — SECRETS RÉELS EXPOSÉS DANS LE REPO (CRITIQUE — ACTION IMMÉDIATE)
- **`.env.backup` (racine)** : contient une `DATABASE_URL` Neon **réelle avec mot de passe intégré** (host `ep-crimson-credit-b10di2ub.c-5.eu-central-1.aws.neon.tech`) et un `JWT_SECRET` réel de 33 caractères. Valeurs NON reproduites ici.
- **`test-scripts/setup-test-users.ts:4` (+ `.js` compilé)** : **la même URL Neon avec mot de passe en dur dans le source**, + un JWT secret en dur.
- **`.gitignore` cassé** : la ligne `.env.backup` a été ajoutée en **UTF-16** (octets NUL, artefact PowerShell `echo >>`) → la règle ne matche jamais.
- **Risque :** quiconque obtient le repo (ou un futur push git) a le contrôle total de la base staging et peut forger des JWT valides.
- **Action :** (1) **rotation immédiate** du mot de passe Neon et du JWT_SECRET ; (2) supprimer `.env.backup` et purger les secrets de `test-scripts/` (lire depuis env) ; (3) corriger `.gitignore` ; (4) init git APRÈS purge.

### 🔴 S2 — ENDPOINT D'EXÉCUTION DE COMMANDES SANS AUTH (`apps/web/app/api/audit/route.ts`)
Route API Next **publique** qui exécute `child_process.exec` (`npx tsc`, `npm run lint`) avec des **chemins Windows absolus codés en dur**, et une action `seo-check` qui fetch une **URL arbitraire (SSRF)**. Outil de dev laissé en production. → Supprimer.

### 🔴 S3 — ANTI-CHEAT SOLO CASSÉ (fuite de solution)
`GET /sudoku/start` renvoie `solvedBoard` au client (`sudoku.service.ts:48-53`). Le module Daily prouve que l'équipe savait (`daily.service.ts:40-43` le neutralise). Triviale à exploiter (solve instantané → farm de coins/récompenses).

### 🔴 S4 — BAN NON APPLIQUÉ
`jwt.strategy.ts:25-37` et `ws-jwt.guard.ts:44-53` ne vérifient jamais `isBanned` : un utilisateur banni garde un accès complet (REST + WS) jusqu'à 7 jours (durée du cookie). Aucune révocation de token.

### 🟠 S5 — AUCUNE COUCHE DE VALIDATION D'ENTRÉES
`class-validator` absent du `package.json`, aucun `ValidationPipe`, `@Body() any` quasi partout. Validation ad-hoc partielle (mdp ≥ 8, board shape, message ≤ 2000). Surface d'attaque injection/typage large.

### 🟠 S6 — BYPASS SIGNATURE STRIPE EN TEST
`shop.controller.ts:90-94` : si `NODE_ENV === 'test'`, le body du webhook est cru sans vérification de signature. Un env mal configuré en prod accepterait des webhooks forgés (mitigé par le claim `updateMany` PENDING→COMPLETED).

### 🟠 S7 — RACE CONDITION SUR LES COUPS DE DUEL
`fallbackHandleMove` (`duel.service.ts:1003-1037`) : GET→mutate→SET Redis sans verrou ; pertes d'écritures possibles ; le SET écrase aussi le TTL 3600. Le fichier racine `patch.js` prouve qu'un **hot-patch regex a remplacé** une implémentation Lua atomique (le test `duel.service.spec.ts:36-51` moque encore un `eval` Lua qui n'existe plus). Régression camouflée.

### 🟠 S8 — ÉCONOMIE EXPLOITABLE (détail §8)
Bot-duel = machine à frapper des coins ; rewarded ads farmable ; clés d'idempotency contenant `Date.now()` (jamais dédupliquantes).

### 🟠 S9 — MODULE DE FAUSSE ACTIVITÉ EN PRODUCTION
`simulation.service.ts` : messages de chat globaux factices toutes les 5 min + **création horaire de vrais users** (`passwordHash: 'bot_password'`, lignes 58-71) **et de vrais posts de forum**. Pollution de données, fake engagement, risque légal (contenu trompeur).

### 🟡 S10 — DIVERS
- `GET /ready` leak `error.message` brut (`app.controller.ts:26`).
- `AuditLogInterceptor` stocke `req.body` complet dans les logs (mots de passe si endpoint futur) (`audit-log.interceptor.ts:31`).
- `/auth/register` sans throttle dédié (global 100/min seulement).
- 3 systèmes RBAC parallèles (RolesGuard, PermissionGuard, checks inline) ; `content.controller.ts:38,47` **exclut SUPER_ADMIN** de son propre check.
- CORS socket `origin: '*'` déclaré (mort — écrasé par l'adapter — mais ordure).
- Fallbacks de secrets sales : Stripe `sk_test_mock` (`shop.service.ts:29`), webhook `whsec_test` (:123), SMTP `test/test` (`email.service.ts:18-19`), Google `dummy-*`.
- Pas de CSRF protection (cookie `sameSite:'lax'` seul).
- IDOR : rien de trouvé — ownership vérifié sur sudoku/forum/chat (positif).

---

## 7. ADMIN PANEL GAP ANALYSIS

**Cible (vision) :** CMS + Control Center + Analytics + Modération complets, gérables par un non-technicien.
**Réalité :** sidebar de ~35 entrées ; **17 pages réelles** (la plupart partielles) ; **~22 entrées = stub** "Module en cours d'intégration" (`admin/[...slug]/page.tsx`) ; **0 garde frontend** + carte d'identité "Admin User / SUPER_ADMIN" **hardcodée** (`admin/layout.tsx:249-255`).

| Domaine | Existant | Manquant/cassé |
|---|---|---|
| Users | Liste (capée `take:100`), rôle, ban/unban, delete | Recherche/filtre/pagination inopérants, mute/avertissements absents, historique par user absent, `Bearer null` |
| Games/Duel config | Rien (stub) | Tout : activation modes, difficultés, rewards, matchmaking, mises |
| Shop produits | CRUD API existe (`/shop/admin/products`) | **Aucune UI** (page admin shop = stub) |
| Coin packs Stripe | Rien | Hardcodé côté API — ni UI ni DB |
| Coins/Économie | Grant + reconciliation API + audit | Pas d'UI dashboards (générés/dépensés/inflation/top produits/anomalies) |
| Ads | UI ad-slots CRUD (correcte) | Rendu réel AdSense absent (placeholder) |
| CMS | Création + liste | Édition/suppression/planification/médiathèque/catégories/tagging UI |
| Forum admin | Liste + delete posts | Épingler/fermer/mots interdits/signalements workflow |
| Chat admin | Rien | Rooms, modération, mute, rate-limits configurables |
| Themes | `appearance` (hero images seulement) | Logo/couleurs/dark-light/branding = stub ; architecture CSS variables non exploitée |
| Feature flags | UI toggle complète (correcte) | Unifier avec le doublon `/monetization/flags` (non audité, RolesGuard) ; clés legacy `ENABLE_*` vs modernes `*_ENABLED` (4 clés pour 2 concepts) |
| Analytics | Dashboard live (recharts, polling 30 s) + chartes 7j/30j/1j | Calculs en JS sur `findMany` (pas d'agrégation SQL) ; pas de DAU/WAU/MAU/rétention/pays/devices ; pas d'insights auto |
| Audit | Page **fictive** | Brancher sur `AdminActionLog` ; corriger le bug `actorId = rôle` (`admin.service.ts:66,95,349`) |
| Emergency | Kill-switch MAINTENANCE_MODE (correct) | — |
| Support | Tickets complets-ish | — |

**Bugs transverses :** deux tables d'audit redondantes (`AuditLog` + `AdminActionLog`) sans FK ; admin analytics non scalable ; `activeDuels: 0` codé en dur dans health (`admin.service.ts:455`).

---

## 8. SHOP / ECONOMY GAP ANALYSIS

**Points solides (à préserver) :** `CoinTransaction` = vrai ledger (signé, `balanceBefore/After`, `idempotencyKey @unique`, `referenceId`) ; `CoinLedgerService` transactionnel avec verrou optimiste + invariant `balanceAfter ≥ 0` ; **test d'intégration prouvant 1 seul succès sur 100 débits concurrents** ; webhook Stripe protégé par claim `updateMany` + idempotency sur `stripeEventId` ; grant admin audité.

**Failles exploitables :**
1. **Duel vs bot = minage de coins** : le gagnant reçoit `betAmount*2` que le virement vienne du perdant réel **ou de nulle part** (bot) (`duel.service.ts:1146-1156` — le ternaire `isBotMatch ? x2 : x2` est même un no-op). XP pénalisé 70 % mais pas les coins.
2. **Rewarded ads farmable** : `ad_${userId}_${Date.now()}` n'est jamais un doublon → +10 coins illimités (seul throttle 5/min) ; aucune preuve de visionnage ; coins+hints écrits en 2 writes non transactionnels (`shop.service.ts:229-233`).
3. **Idempotency shop cassée** : `buy_prod_..._${Date.now()}` (`shop.service.ts:185`) — les retries ne sont jamais dédupliqués.
4. **Contraintes produit mortes** : `maxPerUser`, `stock`, `startDate/endDate` déclarés en schema, **jamais vérifiés** dans `buyProduct` (163-221).
5. **`Purchase.amount` en `Float`** pour de l'argent réel (schema:306) → arrondis ; devrait être cents/Decimal.
6. **Coin packs hardcodés** (`COIN_PACKS`) — non gérables admin, contraires à l'objectif "tout configurable".
7. **Chemin d'erreur webhook** COMPLETED→PENDING (`shop.service.ts:154-160`) → replay = double crédit potentiel.
8. **Invariant ledger contournable** : `Profile.coins` mutable directement (fait par `seed-test-coins.sql`, scripts e2e) ; `CoinTransaction` en `Cascade` sur User (l'histoire financière meurt avec l'utilisateur — inacceptable pour un SaaS).

---

## 9. CMS GAP ANALYSIS

- **Existant :** `ContentArticle` (slug unique, locale, meta/OG/canonical/noIndex, tags, statut/type en texte libre), pages publiques `/learn` (SSR, revalidate 3600) et `/knowledge` (techniques sudoku, riche), création admin, templates email éditables, `SiteSettings` key/value JSON.
- **Manquant :** édition/suppression/duplication d'articles, workflow brouillon→programmé→publié (champs inexistants), médiathèque (upload écrit dans le FS du web — cassé en archi conteneurs), catégories/blog dédié, Q&A, pagination, prévisualisation, révisions, canonicals corrects par page (actuellement hérités faux, §10), route `/article/[slug]` dupliquée et cassée, statut/type non énumérés (texte libre).
- **i18n contenu :** `locale` présent mais pas de fallback ni de matrice de traduction admin.

---

## 10. SEO GAP ANALYSIS

**Architecture en place :** middleware i18n 5 locales, `sitemap.ts` dynamique (articles+forum+hreflang), `robots.ts`, JSON-LD WebSite (layout) + Article/Breadcrumb (`learn/[slug]`), ISR sur pages CMS, metadata server sur forum/learn/knowledge.

**Failles majeures (factuelles) :**
1. **Homepage 100 % client** (`'use client'` + `return null` avant mount, `page.tsx:49`) → HTML serveur VIDE sur la page la plus stratégique. Idem daily, duel, shop, play, about, faq, help, terms…
2. **Canonicals faux hérités** : le layout pose `canonical: /${locale}` ; ~14 pages client n'ont pas de `generateMetadata` → `/en/about` se canonicalise vers `/en` (duplicate content auto-infligé).
3. **Landing pages programmatiques `/sudoku/[difficulty]` = stubs** placeholder non indexées (pas dans le sitemap) — le principal levier "machine SEO" n'existe pas.
4. **ES/IT vides** mais annoncés (hreflang/sitemap/switcher) → pages squelettiques potentiellement considérées comme thin content.
5. Sitemap : **`/shop` et `/sudoku/*` absents** ; route `/article/[slug]` orpheline.
6. Domaine codé en dur `https://sudokupremium.com/` dans JSON-LD (ignore l'env) ; métadonnées forum **en français pour toutes les locales** ; hreflang forum limité à en/fr/de.
7. Pas de FAQPage/Organization schema ; pas d'`error.tsx`/`not-found.tsx`/`loading.tsx` nulle part ; `generateStaticParams` jamais utilisé.
8. Deux configs Next conflictuelles (`next.config.mjs` vs `next.config.js`) — une seule chargée, l'autre (CSP/transpile) potentiellement morte silencieusement ; CSP avec `unsafe-eval unsafe-inline`.
9. Texture hero hotlinkée vers transparenttextures.com (rendu + fiabilité).

---

## 11. MONETIZATION GAP ANALYSIS

- **Stripe :** checkout coins OK côté serveur (session créée, URL renvoyée) ; **mais** : coin packs hardcodés, webhook réel non vérifié en exécution, succès client = webhook forgé (cassé en prod), bypass signature en `NODE_ENV==='test'`, pas d'admin ventes/revenus/remboursements/conversion, pas de `Purchase.userId` index, pas de séparation test/prod structurée (tout repose sur les clés env).
- **Google Ads :** `AdSlotConfig` + UI admin CRUD + flag — mais **aucun rendu réel** (placeholder, code AdSense commenté) ; `ADS_ENABLED` vs `ENABLE_ADS` (deux clés pour un concept) ; aucun lien AdSense API.
- **Feature flags :** bon moteur (DB, cache 60 s, rollout %, fail-closed) mais **deux nomenclatures** (`ENABLE_SHOP`/`SHOP_ENABLED`…), deux endpoints admin concurrents (dont un non audité), seed triple source de vérité (schema default off / seed on / seed-flags.sql les deux).
- **Rewarded ads :** simulation client, farmable (§8).
- **Abonnements :** modèle `Subscription` présent, aucune logique (plan mensuel, gated features) — à concevoir.

---

## 12. ANALYTICS GAP ANALYSIS

**Cible :** BI temps réel + historique 7j→12m + insights auto compréhensibles par un amateur.
**Réalité :** dashboard admin live (users online via Redis, counts DB, revenue) + 2 graphes (7j/30j/1an) **calculés en JS sur des `findMany` complets** — hors de question à l'échelle. Aucune table d'événements, aucun DAU/WAU/MAU, aucune rétention, aucune donnée pays/langue/device, aucun suivi de page, aucun insight textuel. `ANALYTICS_ARCHITECTURE.md` = template vide de 363 octets.

---

## 13. COMMUNITY / SOCIAL GAP ANALYSIS

- **Forum :** solide de base (catégories/posts/commentaires/likes/modération minimale) ; manquent épinglage, fermeture de threads, signalements workflow, mots interdits, anti-spam, full-text search (pas d'index), tri par `createdAt` (pas d'index → scans).
- **Chat :** DM OK mono-instance ; **cassé en multi-instance** (map mémoire) ; pas de rooms/chat public persistant ; pas de modèle pour le chat de spectateurs duel.
- **Social :** amis OK (flag mort), blocage OK, notifications présentes, **pas de profil public riche / mur / activité récente**.
- **Compétitif :** leaderboard OK, Daily OK, rating Glicko-2 stocké mais **pas d'ELO visible ni de matchmaking rating-based vérifié en exécution** ; pas de tournois, pas de clans, pas de partage de grilles, pas de replay, pas de défis entre amis (présence gateway seulement).
- **Fake engagement :** la simulation (S9) **contamine exactement cette dimension** — à supprimer avant tout lancement communautaire (confiance + légal).

---

## 14. SCALABILITY GAP ANALYSIS

**Déjà scalable (bien fait) :** Redis adapter Socket.IO, verou matchmaking distribué, état duel en Redis (TTL), ledger transactionnel, flags cachés 60 s, leaderboard Redis, emails en queue BullMQ.

**Goulots identifiés :**
1. **Chat DM multi-instance cassé** (map locale `userId→socketId`) — silent drop cross-instance.
2. **Bot loop duel en `setTimeout` récursif par instance** — dupliqué au restart, meurt avec l'instance.
3. **Fallback silencieux `ioredis-mock`** si `REDIS_URL` absent (`redis.service.ts:15-18`, `redis.adapter.ts:10-13`) — une prod mal configurée se croit distribuée.
4. **Admin analytics en JS sur `findMany`** — O(n) mémoire/temps.
5. **Zéro index `createdAt` dans tout le schema** (26 index, tous FK/statut) — chaque "derniers N" = sort non indexé.
6. **Index manquants** : `PrivateMessage(receiverId, read)`, `CoinTransaction(type, createdAt)`, `GameSession(status, createdAt)`, `ForumPost(createdAt)`, `Purchase(userId)`, `Subscription(userId)`, `SupportTicket/TicketMessage/Report` (aucun), `Profile.rating`.
7. **Listes non paginées** / cap `take:100` admin users.
8. **N+1 potentiels** non audités en exécution (aucun profiling) ; `sitemap.ts` fetch l'API à chaque hit (pas de cache/ISR).
9. **Uploads FS local** (`../web/public/uploads`) — incompatible multi-instance/containers.
10. **Presence :** set Redis OK mais cleanup mort (utilisants fantômes) ; pas de sharding Socket.IO documenté.

---

## 15. TECHNICAL DEBT

1. **9 codemods jetables à la racine** (`fix-*.js`, `patch.js`, `expand-*.js`, `migrate-i18n.js`) dont les effets vivent dans le code ; `patch.js` a **remplacé par regex** la logique atomique de `handleMove` (régression S7) ; `expand-content.js` a généré du **contenu FAQ de remplissage** ("Generic FAQ Question N") dans les fichiers de traduction.
2. **Deux configs Next concurrentes** ; deux stacks docker prod divergentes (ports 3001 vs 4000, domaines sudoku.com vs sudokupremium.com) ; `Dockerfile.api` racine orphelin (les compose référencent `apps/api/Dockerfile` node:18) ; `nginx.conf` orphelin.
3. **3 systèmes RBAC parallèles** ; 2 tables d'audit redondantes sans FK ; 2 nomenclatures de flags.
4. **5 scripts de seed rivaux** créant 4 admins différents (sans mot de passe / dummy / hash invalide) — pas de bootstrap canonique.
5. **Code mort :** `CoinLedgerService.refund/reverse/grantAdmin`, 4 handlers lobby duel, `GoogleTranslate.tsx`, `AdBanner.tsx`, `multiplayer/page.tsx`, `tests/example.spec.ts`, dossier `src/` vide web, `scripts/validate-ci.ps1` (0 octet).
6. **Schéma :** `Like.@@unique` avec NULLs (inefficace en PG), cascades incohérentes (ledger/Purchase en Cascade sur User !), enums en texte libre (statuts, types shop, friendship), `indexable` déprécié coexistant avec `noIndex`.
7. **Console.logs ~25 fichiers web** ; UI shop/forum admin en français codé en dur malgré l'i18n.
8. **Pas de git.**

---

## 16. INFRASTRUCTURE STATUS

| Composant | Statut | Preuve |
|---|---|---|
| Neon PostgreSQL staging | ✅ réel | URL réelle dans `.env.backup` / test-scripts |
| Redis (dev docker / prod?) | 🟡 | compose OK ; `REDIS_URL` prod NON VÉRIFIÉ ; fallback mock silencieux |
| CI (lint/tsc/prisma validate/test/build) | ✅ réel | `deploy.yml` job validate-and-build |
| **CD staging/prod** | 🔴 **factice** | étapes deploy = `echo` ; seuls les `prisma migrate deploy` sont réels — **et il n'y a aucune migration à déployer** |
| Gate manuelle prod | 🔴 faux | `echo "Require Manual Approval"` |
| Vercel / Railway | ⬛ non câblés | tokens en commentaires |
| Sentry | ⬛ deps installées (`@sentry/node@10`), **zéro init** | grep: aucun import dans src |
| Cloudflare | ⬛ absent | aucune référence source/docs |
| Docker prod | 🟡 dupliqué/conflictuel | 2 stacks, 1 Dockerfile orphelin, nginx orphelin |
| Sécurité env locale | 🔴 | mots de passe faibles dev, pgAdmin admin/admin exposé port 5050 (staging) |
| **Versioning** | 🔴 **PAS DE GIT** | confirmé (`test-results/phase-8-secret-handling-audit.log:1`) |

---

## 17. TESTING STATUS

- **API (Jest) : 5 fichiers.** 1 excellent (concurrence ledger, vrai test d'intégration DB) ; 1 valide (math XP) ; 1 faible (duel — moque un chemin Lua qui n'existe plus) ; 2 stubs (hello world e2e). **Aucun test : auth, guards, admin, shop, webhook Stripe, chat, forum.**
- **Web (Playwright) : 3 specs.** `auth.spec.ts` réel ; `economy.spec.ts` 1 smoke avec assertion qui avale les échecs (`.catch(()=>{})`) ; `example.spec.ts` teste playwright.dev (mort).
- **Derniers runs :** Playwright 14/08 → **15 passed, 5 FAILED** (auth register timeout ×5 navigateurs) ; `api#test` pre-staging 15/08 → **FAILED (1 failed/10 passed)** ; build web 12/08 → **38 erreurs**.
- **"ForensicLogger" (`test-scripts-final/run-all.ts`) : verdicts NON FIABLES** — la plupart des tests appellent `logger.logResult(name, true)` **inconditionnellement** ; un 500 sur Daily a été compté "PASS".
- **Conclusion :** l'infrastructure de test existe à l'état de germe ; la couverture réelle du métier est < 10 % ; les "🟢 PASS" des rapports précédents ne prouvent rien.

---

## 18. DOCUMENTATION STATUS (contre-vérification des affirmations Antigravity)

| Document | Contenu réel | Écart avec ses prétentions |
|---|---|---|
| `docs/phase8_architecture/*.md` (14 fichiers) | **Templates vides de ~350 octets** générés par `generate_docs.js` (15/08 08:59) — titre + légende + sections vides | L'"architecture documentation Phase 8" n'existe pas |
| `OWNER_HANDOVER.md`, `implementation_plan.md` | **Introuvables** (recherche repo entier) | Promis dans le brief, jamais écrits |
| `rapport_detaille_plateforme.md` | Affirme "produit fini", Next 14 (réel : 16.2), TikTok Live mode, Stripe OK, CSP | **Faux/exagéré** : TikTok absent du code, Stripe cassé côté succès, CSP peut-être non chargée (config dupliquée) |
| `PHASE_6_7_FINAL_AUDIT.md` | 12 sections "VERIFIED", verdict "🟢 GO — Phase 7 Ready" | **Contrée par les artefacts** : 5 échecs Playwright et échec api#test datés après/pendant |
| `test-results/phase-8-secret-handling-audit.log` | 394 octets, note manuelle (pas une sortie machine) : "no secrets exposed in logs", admet que `.env.backup` "contains credentials" | **Contradictoire** : `.env.backup` et test-scripts contiennent des secrets réels |
| `README.md` (racine) | Correct, sobre | OK ; README web = boilerplate create-next-app |

**Règle absolue respectée :** aucun ancien "VERIFIED" n'a été cru ; tout a été re-vérifié statiquement. Classification : code = VERIFIED STATICALLY ; runtime = UNVERIFIED ; deploy/Vercel/Railway/Sentry/Cloudflare = BLOCKED BY INFRASTRUCTURE.

---

## 19. RECOMMENDED ARCHITECTURE (cible, incrémentale — ne rien jeter)

Conserver la stack actuelle (elle est saine) et la durcir :

1. **Versioning & migrations d'abord :** init git → baseline `prisma migrate` (générer la migration initiale depuis le schema, la déployer sur Neon staging via `migrate deploy`) → interdire `db push` hors dev local (guard basé sur l'URL cible, pas sur NODE_ENV).
2. **Sécurité plateforme :** supprimer `/api/audit` (web), DTO + `ValidationPipe` global (API), vérifier `isBanned` dans `jwt.strategy` + `WsJwtGuard`, throttles dédiés register,统一iser RBAC sur `PermissionGuard` (+ corriger l'exclusion SUPER_ADMIN de content).
3. **Économie :** clés d'idempotency stables (uuid client ou clé métier), exécution des contraintes produit (`maxPerUser`/`stock`/fenêtres), économie bot (la maison ne double plus : crédit = mise réelle ou récompense fixe), rewarded ads avec preuve serveur + plafond journalier, `Purchase.amount` en cents, chemin d'erreur webhook = FAILED (pas retour PENDING), coin packs en DB.
4. **Temps réel :** restaurer l'atomicité de `handleMove` (Lua ou WATCH multi-instance-safe), conserver le TTL, présence : peupler `client.data.user` à la connexion via middleware handshake, chat : routage Redis (room par userId) au lieu de la map locale, bot-loop → BullMQ delayed jobs.
5. **Admin :** layout guard (check `/auth/me` + rôle, redirect), identité réelle, unifier les surfaces fragmentées sous `/admin/*` avec `AuditLogInterceptor` partout, corriger le bug `actorId`, compléter par ordre de valeur : Users (recherche/pagination/historique) → Shop UI → Économie dashboards → CMS édition → Audit réel → Analytics v1.
6. **Analytics v1 (pragmatique) :** table `AnalyticsEvent` (ou PostHog self-hosted plus tard) + agrégations SQL matérialisées daily + endpoints admin paginés ; insights auto = deltas simples en langage clair.
7. **SEO :** basculer les pages stratégiques en server components (home/play/shop/daily), `generateMetadata` canonique par page, vraies pages `/sudoku/[difficulty]` (SSG via `generateStaticParams`) + sitemap complet, trancher ES/IT (compléter ou retirer), FAQPage/Organization JSON-LD, fichiers error/not-found/loading, une seule config Next (domaine depuis env).
8. **Infra :** UNE stack docker prod, brancher réellement Vercel (web) + Railway/Fly (api) via les tokens GitHub Secrets, Sentry init API+web, backups Neon (PITR) + runbook restore, environnement GitHub `production` avec approveurs réels.
9. **Docs de transfert :** OWNER_HANDOVER.md réel (accès, rotation secrets, runbooks), inventaire tiers, topologie, "comment éteindre/allumer".

---

## 20. PRIORITIZED ROADMAP

Format : CURRENT → TARGET / RISK / FIX / DEPS / PRIORITY / VERIFY.

### P0 — Critique (sécurité, intégrité, beta blockers)

| # | Item | CURRENT | TARGET | GAP/RISK | SOLUTION | DEPS | VERIFICATION |
|---|---|---|---|---|---|---|---|
| 1 | **Secrets** | Neon pwd + JWT_SECRET réels dans `.env.backup` + `test-scripts/setup-test-users.ts` | Zéro secret dans le repo | Prise de contrôle BDD + forgery JWT | **Rotation Neon + JWT_SECRET** ; purge fichiers ; `.gitignore` corrigé ; lecture env uniquement | Aucun | Scan repo (gitleaks) ; connexion ancien pwd refusée |
| 2 | **Git + migrations** | Pas de git ; 0 migration ; CI lance `migrate deploy` dans le vide ; `db push` manuel + SQL racine | Repo versionné ; baseline migration appliquée via `migrate deploy` | Aucun rollback, drift garanti | `git init` + commit baseline ; `prisma migrate diff` → migration initiale ; guard basé sur l'URL | #1 (purge secrets d'abord) | `migrate deploy` sur staging ; table `_prisma_migrations` |
| 3 | **Anti-cheat solo** | `solvedBoard` envoyé au client | Solution jamais envoyée (comme Daily) | Triche massive, économie polluée | Retirer le champ de la réponse start | Aucun | Test API : réponse sans `solvedBoard` ; soumission valide toujours acceptée |
| 4 | **Module simulation** | Faux users/posts horaires en DB | Supprimé (ou flag OFF par défaut) | Données_polluées, fake engagement | Supprimer `SimulationModule` + purge data bots | Aucun | Cron absent ; count users `@bot.com` stable |
| 5 | **`/api/audit` web** | exec + SSRF sans auth | Route supprimée | RCE/SSRF | Supprimer le fichier | Aucun | 404 sur la route |
| 6 | **Ban enforcement** | `isBanned` jamais vérifié (HTTP+WS) | Vérifié à chaque requête/connexion | Bannis actifs 7 jours | Check dans `jwt.strategy.validate` + `WsJwtGuard` (+ logout forcé) | Aucun | Test : ban → 401 immédiat |
| 7 | **Économie bots/ads** | Bot-duel x2 from nothing ; ads farmables ; idempotency `Date.now()` | Pas de création monétaire ; ads plafonnées ; idempotency réelle | Inflation, exploitation | Crédit bot = mise réelle ou fixe ; plafond journalier ads + clé stable ; contraintes `maxPerUser`/`stock`/dates | Aucun | Tests unitaires + test concurrence rejoué |
| 8 | **Duel handleMove** | GET→SET sans verrou, TTL perdu (régression `patch.js`) | Atomicité Lua/WATCH restaurée | Scores perdus/corrompus, états incohérents | Restaurer implémentation atomique + TTL + tests | Aucun | Test concurrence 2 joueurs simultanés |

### P1 — Avant lancement public

| # | Item | CURRENT | TARGET | GAP/RISK | SOLUTION | DEPS | VERIFICATION |
|---|---|---|---|---|---|---|---|
| 9 | **Validation d'entées** | `@Body() any`, pas de ValidationPipe | DTO class-validator global | Injections/typage/crash | ValidationPipe + DTO sur tous les endpoints write | Aucun | Requêtes malformées → 400 |
| 10 | **Admin frontend guard + fixes** | 0 contrôle UI, `Bearer null` ×4, boutons morts, audit fictif | Layout guard réel, pages réparées | UX mensongère, 401 | Guard layout + identité réelle + réparer les 4 pages + brancher audit | #6 | Navigation non-auth → redirect ; pages fonctionnelles |
| 11 | **Shop admin UI + packs DB** | CRUD API sans UI ; packs hardcodés | UI CRUD complète + packs en DB | Objectif owner inatteignable | Page admin shop + migration `CoinPack` | #2, #7 | Créer/modifier produit depuis l'UI sans code |
| 12 | **Stripe réel** | Succès = webhook forgé client ; erreur → PENDING (replay) ; bypass test | Succès vérifié côté serveur (`retrieve session`) ; erreur → FAILED ; packs DB | Paiements cassés en prod, double crédit | Endpoint verify + fix webhook paths + secrets requis (pas de fallback) | #7, #11 | E2E Stripe en mode test (clés test) |
| 13 | **SEO structurel** | Home client vide, canonicals faux, stubs `/sudoku/*`, ES/IT vides, sitemap incomplet | Pages stratégiques SSR, canonicals par page, landing pages réelles SSG | Visibilité ~nulle | Refactor server components + metadata + SSG difficulty | Aucun | Crawl (Lighthouse/screaming frog) : HTML complet, canonicals OK |
| 14 | **Multi-instance réel** | Chat map locale, presence morte, bot-loop setTimeout, fallback mock silencieux | Routage Redis, cleanup OK, jobs BullMQ, fail-fast si REDIS_URL absent | Cassé dès 2 instances | Rooms Redis par userId ; handshake auth ; BullMQ ; retirer ioredis-mock | Aucun | Test 2 instances API locales |
| 15 | **CD réel** | echo Railway/Vercel ; gate echo | Deploys réels + environment approval GitHub | Impossible de livrer | Brancher tokens + supprimer étapes mortes ; Sentry init | #2 | Déploy staging automatisé vert |
| 16 | **Index BDD** | 0 index createdAt ; FK non indexés ; Purchase/Subscription/Report nus | Index sur patterns réels | Perf effondrées à l'échelle | Migration d'index ciblée | #2 | `EXPLAIN` sur requêtes chaudes |

### P2 — Croissance

17. **Analytics v1** : table événements + agrégats SQL + dashboards + insights auto (CURRENT: rien / VERIFY: dashboards < 500 ms).
18. **CMS complet** : édition/planification/médiathèque (S3-compatible) / statuts enum (CURRENT: création seule).
19. **Thèmes** : CSS variables pilotées DB, light/dark, branding admin (CURRENT: dark seul).
20. **Forum/Chat modération** : épingler/fermer/mots interdits/signalements workflow (CURRENT: delete posts seul).
21. **Communauté** : tournois (modèle+bracket), ELO public, défis amis, partage de grilles (CURRENT: rien / évaluer intégrations extérieures selon grille valeur/coût/risque du brief).
22. **Tests de montée en charge** : k6 sur duel/chat (plan existant = template vide).

### P3 — Nice-to-have
23. Refresh tokens/2FA ; 24. Clans ; 25. Replay de parties ; 26. Marketplace puzzles communautaires ; 27. PostHog/BI avancé.

---

## ANNEXE — Preuves clés (références)

- Secrets : `.env.backup` (racine) ; `test-scripts/setup-test-users.ts:4-5` ; `.gitignore` dernière ligne (UTF-16, `od -c` vérifié).
- Anti-cheat : `apps/api/src/sudoku/sudoku.service.ts:48-53` vs `apps/api/src/daily/daily.service.ts:40-43`.
- Simulation : `apps/api/src/simulation/simulation.service.ts:30-87`.
- Webhook forgé : `apps/web/app/[locale]/shop/checkout/page.tsx:13-25`.
- exec/SSRF : `apps/web/app/api/audit/route.ts:2,14-16,56-60`.
- Race duel : `apps/api/src/duel/duel.service.ts:1003-1037` ; régression prouvée par `patch.js` (racine) + mock obsolète `duel.service.spec.ts:36-51`.
- Économie bot : `apps/api/src/duel/duel.service.ts:1146-1156` ; ads/idempotency : `shop.service.ts:185,229-233`.
- Ban : `apps/api/src/auth/jwt.strategy.ts:25-37`, `ws-jwt.guard.ts:44-53`.
- Admin façade : `admin/layout.tsx:249-255` ; stubs : `admin/[...slug]/page.tsx` ; `Bearer null` : `admin/users/page.tsx`, `admin/community/forum/page.tsx`, `admin/system/health/page.tsx`, `components/RewardVideoModal.tsx`.
- Docs vides : `docs/phase8_architecture/` (14 fichiers 350-366 octets, générés par `generate_docs.js`).
- CI factice : `.github/workflows/deploy.yml` (étapes echo) ; 0 migration : `find -name migrations` (vide) ; `prisma migrate deploy` lignes 69/112.
- Tests : `test-results/.last-run.json` (`"status":"failed"`, 5 failed) ; `test-results/phase-8-pre-staging.log` (api#test FAILED) ; PASS inconditionnels : `test-scripts-final/run-all.ts`.
