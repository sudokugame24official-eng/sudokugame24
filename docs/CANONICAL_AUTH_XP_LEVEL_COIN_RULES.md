# 🏛️ RÈGLES CANONIQUES DE L'AUTHENTIFICATION, DE L'EXPÉRIENCE, DES NIVEAUX ET DE L'ÉCONOMIE (CANONICAL SOURCE OF TRUTH)
### VERSION DE VERROUILLAGE DÉFINITIF (CONSISTENCY FREEZE)

**DATE DU VERROUILLAGE** : 29 Août 2026  
**STATUT GLOBAL** : **`FROZEN (RÈGLES FIXÉES ET INTÈGRES)`** 🔒  
**INVARIANTS DE SÉCURITÉ EN VIGUEUR** :
- `ADS = OFF`
- `REWARDED ADS = OFF`
- `STRIPE = OFF`
- `PRODUCTION = LOCKED`
- `NO DEPLOYMENT`

---

## 📋 1. CYCLE DE VIE DE L'INSCRIPTION & ÉTAT INITIAL

### A. Création de Compte (`POST /auth/register`)
À chaque inscription d'un nouvel utilisateur dans l'application (`apps/api/src/auth/auth.service.ts`), les tables `User` et `Profile` sont insérées atomiquement avec les valeurs par défaut garanties par le schéma Prisma (`packages/database/prisma/schema.prisma`) :

| Champ du Profil | Valeur Initiale Définie | Justification Canonique |
| :--- | :---: | :--- |
| **`Profile.coins`** | **`1000 🪙`** | Dotation de bienvenue canonique (`@default(1000)`) |
| **`Profile.xp`** | **`0 XP`** | Expérience de départ (`@default(0)`) |
| **`Profile.level`** | **`1`** | Niveau initial de base (`@default(1)`) |
| **`Profile.rating`** | **`1500.0`** | Cote initiale Glicko-2 (`@default(1500)`) |
| **`Profile.ratingDeviation`** | **`350.0`** | Écart-type de cote Glicko-2 (`@default(350)`) |
| **`Profile.ratingVolatility`** | **`0.06`** | Volatilité Glicko-2 (`@default(0.06)`) |
| **`Profile.hints`** | **`3`** | Indices gratuits offerts (`@default(3)`) |
| **`User.isEmailVerified`** | **`false`** | Statut d'activation e-mail (`@default(false)`) |

*L'acte d'inscription n'entraîne aucun crédit monétaire parasite : le joueur commence strictement avec 1000 🪙 et 0 XP.*

---

## 📧 2. RÈGLES DES E-MAILS TRANSACTIONNELS & CYCLE DE VIE

### A. Flux Réel d'Émission
$$\text{INSCRIPTION (POST /auth/register)} \longrightarrow \text{WELCOME EMAIL (Envoi Immédiat BullMQ)} \longrightarrow \text{VÉRIFICATION D'EMAIL}$$

### B. Spécification des 4 Modèles Transactionnels Canoniques
1. **`WELCOME_EMAIL`** :
   * **Déclencheur** : Inscription réussie (`AuthService.register`).
   * **Objet par défaut (EN)** : `"Welcome to {{siteName}}, {{username}}!"`
   * **Contenu** : Message d'accueil, présentation des modes de jeu, bouton CTA d'accès direct au jeu et coordonnées du support.
   * **Idempotence** : `jobId: email_WELCOME_EMAIL_${userId}` dans BullMQ.
2. **`EMAIL_VERIFICATION`** :
   * **Déclencheur** : Inscription ou demande de renvoi (`POST /auth/resend-verification`).
   * **Objet par défaut (EN)** : `"Verify your email address - {{siteName}}"`
   * **Contrat du Jeton** : Jeton cryptographique HMAC-SHA256 avec durée de validité de **24 heures**.
   * **Action** : Le clic sur le lien valide `User.isEmailVerified = true`.
3. **`PASSWORD_RESET`** :
   * **Déclencheur** : Demande de réinitialisation (`POST /auth/forgot-password`).
   * **Objet par défaut (EN)** : `"Reset your password - {{siteName}}"`
   * **Contrat du Jeton** : Jeton cryptographique avec durée d'expiration stricte de **1 heure**.
4. **`DUEL_INVITATION`** :
   * **Déclencheur** : Invitation directe à un duel 1v1 (`DuelGateway`).
   * **Objet par défaut (EN)** : `"Sudoku 1v1 Duel Challenge from {{username}}"`
   * **Contenu** : Pseudo de l'adversaire, cote Elo, mise en pièces et lien direct vers l'arène.

### C. Variables Dynamiques Autorisées
* `{{username}}` : Nom d'utilisateur du joueur (ou fallback *"Player"*).
* `{{siteName}}` : Nom de la plateforme (*"Sudoku Premium"*).
* `{{verificationLink}}` : URL absolue de vérification de compte.
* `{{resetLink}}` : URL absolue de réinitialisation de mot de passe.
* `{{supportEmail}}` : Adresse e-mail d'assistance (*"support@sudokupremium.com"*).

### D. Contrôle d'Accès & Statut Réseau
* **RBAC** : Seul le `SUPER_ADMIN` est autorisé à lire/éditer les modèles (`/admin/email-templates`). Les membres (`MEMBER`) reçoivent une erreur **HTTP 403 Forbidden**.
* **Statut de Livraison Réseau** : **`EMAIL REAL DELIVERY = BLOCKED UNTIL SMTP TEST`** *(Transport local mock en environnement de bac à sable afin de préserver l'étanchéité extérieure).*

---

## 🔐 3. CYCLE DE VIE DE L'AUTHENTIFICATION & DES SESSIONS

1. **Connexion (`POST /auth/login`)** :
   * Validation du mot de passe via `bcrypt.compare` contre `User.passwordHash`.
   * Émission d'un cookie HTTP-Only sécurisé `access_token` signé JWT (validité : 7 jours).
2. **Déconnexion (`POST /auth/logout`)** :
   * Invalidation et suppression immédiate du cookie `access_token` (`res.clearCookie`).
3. **Google OAuth2** :
   * Route d'initiation `/auth/google` et callback `/auth/google/callback`.
   * **Statut Actuel** : **`GOOGLE OAUTH = PENDING EXTERNAL CREDENTIALS`** *(Code et contrôleurs prêts, en attente des identifiants Google Client ID / Secret en production).*

---

## 📈 4. FORMULE DE PROGRESSION & D'EXPÉRIENCE (XP)

### A. Formule d'Attribution en Partie Solo (`ProgressionService.awardXP`)
* **XP de Base** : $\text{Base XP} = 50 \times \text{Multiplicateur}(\text{Difficulté})$
  * **EASY** (1.0) : **50 XP**
  * **MEDIUM** (1.5) : **75 XP**
  * **HARD** (2.5) : **125 XP**
  * **EXPERT** (4.0) : **200 XP**
  * **MASTER** (6.0) : **300 XP**
* **Bonus de Vitesse (Speed Bonus)** :
  * Si $\text{timeSec} < \text{expectedTime}$ et $\text{timeSec} > 30\text{s}$ :
    $$\text{speedFactor} = 1 + 0.5 \times \frac{\text{expectedTime} - \text{timeSec}}{\text{expectedTime}}$$
    $$\text{XP Attribué} = \lfloor \text{Base XP} \times \text{speedFactor} \rfloor$$
  * *Temps attendus canoniques* : EASY = 300s, MEDIUM = 600s, HARD = 1200s, EXPERT = 2400s, MASTER = 3600s.
  * *Exemple validé par test* : Facile résolu en 180s ➔ $50 \times (1 + 0.5 \times \frac{120}{300}) = 50 \times 1.2 = \mathbf{+60\text{ XP}}$.

### B. Formule d'Attribution en Duel (`ProgressionService.processDuelProgression`)
* **Victoire Humaine** : $50 \times \text{Multiplicateur}$ (ajusté selon l'écart Elo).
* **Défaite Humaine** : $10 \times \text{Multiplicateur}$.
* **Égalité** : $25 \times \text{Multiplicateur}$.
* **Pénalité Anti-Farming contre Bot** : Réduction de **-70 %** d'XP lors des parties contre l'ordinateur ($\lfloor \text{XP} \times 0.3 \rfloor$).

---

## 🏆 5. FORMULE DES NIVEAUX & PALIERS RPG (`level-config.ts`)

### A. Formule Mathématique
$$\text{XP Cumulé Requis pour le Niveau } N = \sum_{i=1}^{N-1} \lfloor 100 \times i^{1.5} \rfloor$$

### B. Table des Paliers de Niveau Officiels
| Niveau Cible | XP Cumulé Requis | Intervalle d'XP du Niveau |
| :---: | :---: | :---: |
| **Niveau 1** | **0 XP** | 0 à 99 XP |
| **Niveau 2** | **100 XP** | 100 à 381 XP |
| **Niveau 3** | **382 XP** | 382 à 900 XP |
| **Niveau 4** | **901 XP** | 901 à 1700 XP |
| **Niveau 5** | **1701 XP** | 1701 à 2818 XP |
| **Niveau 6** | **2819 XP** | 2819 à 4287 XP |
| **Niveau 7** | **4288 XP** | 4288 à 6139 XP |
| **Niveau 8** | **6140 XP** | 6140 à 8401 XP |
| **Niveau 9** | **8402 XP** | 8402 à 11101 XP |
| **Niveau 10** | **11102 XP** | 11102+ XP |

---

## 🪙 6. TABLE DES GAINS DE PIÈCES & RÈGLES ÉCONOMIQUES

| Mode / Événement | Gain / Coût | Type de Transaction | Clé d'Idempotence | Règle Économique Canonique |
| :--- | :---: | :--- | :--- | :--- |
| **Solo Facile** | `+50 🪙` | `REWARD` | `solo_${sessionId}` | Contrôle anti-triche : temps $\ge 15\text{s}$ |
| **Solo Moyen** | `+100 🪙` | `REWARD` | `solo_${sessionId}` | Contrôle anti-triche : temps $\ge 30\text{s}$ |
| **Solo Difficile** | `+200 🪙` | `REWARD` | `solo_${sessionId}` | Contrôle anti-triche : temps $\ge 60\text{s}$ |
| **Solo Expert** | `+400 🪙` | `REWARD` | `solo_${sessionId}` | Contrôle anti-triche : temps $\ge 120\text{s}$ |
| **Solo Master** | `+800 🪙` | `REWARD` | `solo_${sessionId}` | Contrôle anti-triche : temps $\ge 300\text{s}$ |
| **Défi Quotidien** | `Score du jour` | `DAILY_REWARD` | `daily_${challengeId}_${userId}` | 1 seule tentative créditée par jour |
| **Duel contre Bot** | `0 ou -Mise` | `DUEL_WAGER` | `duel_bot_stake_${duelId}` | Victoire = mise remboursée. Défaite = mise perdue. **Zéro création monétaire artificielle**. |
| **Duel Classé 1v1** | `+Mise * 2` | `DUEL_WAGER` | `duel_win_${duelId}_${winnerId}` | Transfert direct joueur à joueur à somme nulle. |
| **Vidéo Sponsorisée** | `+20 🪙` | `AD_REWARD` | Jeton HMAC session | Plafond : max 5 récompenses / jour, cooldown 120s. |
| **Achat Boutique** | `-Prix Produit` | `SHOP_PURCHASE` | `$transaction` atomique | Débit vérifié avec verrouillage de solde (pas de solde négatif). |

---

## 🏛️ 7. INVARIANTS COMPTABLES DU GRAND LIVRE (`CoinLedgerService`)

### A. Équation Fondamentale d'Intégrité
$$\text{Profile.coins} = 1000 + \sum \text{CoinTransactions (Crédits)} - \sum \text{CoinTransactions (Débits)}$$

### B. Propriétés Garanties
1. **Atomicité & Isolation** : Chaque opération financière s'exécute dans une transaction PostgreSQL sérialisée.
2. **Immuabilité** : La table `CoinTransaction` est un journal d'écriture seule (append-only ledger).
3. **Plancher de Solde** : Aucune transaction ne peut faire passer `Profile.coins` en dessous de 0.

---

## 🛡️ 8. SÉCURITÉ ANTI-REJEU, CONCURRENCE & ANTI-TRICHE

1. **Réclamation Atomique de Session de Jeu** :
   ```ts
   const claimed = await prisma.gameSession.updateMany({
     where: { id: sessionId, status: GameStatus.IN_PROGRESS },
     data: { status: GameStatus.COMPLETED, endTime: new Date(), durationSec: finalTimeSec },
   });
   if (claimed.count === 0) {
     throw new BadRequestException('Session already completed or conflict');
   }
   ```
2. **Résistance à la Concurrence Extrême** : 25 requêtes simultanées de soumission sur la même session donnent rigoureusement **1 succès et 24 rejets**.
3. **Étanchéité Inter-Utilisateurs** : Toute tentative de soumettre la session d'un tiers est rejetée (**HTTP 400/404**). L'attaquant reçoit **0 XP** et **0 🪙**.
4. **Anti-Triche Temps Minimal** : Rejet immédiat de toute soumission résolue en dessous des seuils minimaux de plausibilité humaine (EASY: 15s, MEDIUM: 30s, HARD: 60s, EXPERT: 120s, MASTER: 300s).

---

---

## 🤖 10. RÈGLE CANONIQUE DES BOTS & EXCLUSION DES CLASSEMENTS PUBLICS

### A. Règle Métier Fondamentale
> **"Bots are gameplay-only entities. Bots may participate in Duels as fallback opponents, but bots are never eligible for public leaderboards or competitive player rankings. Only registered human players are ranking-eligible."**

### B. Spécification Technique & Étanchéité
1. **Identification de Niveau Base de Données** : Chaque compte porte l'attribut booléen indexé `User.isBot`. Les bots et comptes de simulation portent obligatoirement `isBot = true`. Tout joueur humain enregistré porte `isBot = false`.
2. **Exclusion Systématique Côté Requête (Backend / SQL)** :
   * Tous les classements (Global, Quotidien, Hebdomadaire, Mensuel, Annuel, Défi Quotidien) filtrent à la source avec `WHERE user.isBot = false AND user.isBanned = false`.
   * L'exclusion est appliquée **avant** les clauses `ORDER BY`, `LIMIT`, `OFFSET` et le calcul du rang.
   * Les bots ne consomment aucune place dans la pagination et ne créent aucun décalage dans les rangs des vrais joueurs.
3. **Fonctionnement du Mode Duel Préservé** :
   * Les bots continuent de servir d'adversaires de secours réactifs après 10s d'attente en file.
   * Les duels contre bots fonctionnent normalement (matchmaking, grille, timer, score, WebSockets, remboursement de mise).
   * Les statistiques et résultats des bots ne sont jamais enregistrés dans les classements compétitifs ELO / Glicko-2.
4. **Visibilité Administrative** : Les administrateurs peuvent distinguer et filtrer explicitement `isBot: true` vs `isBot: false` dans l'interface de gestion sans masquer les bots de l'administration.

---

## 🔒 11. ÉTAT GLOBAL DE VERROUILLAGE (FREEZE MATRIX)

```text
====================================================
               STATUT DE VERROUILLAGE
====================================================
AUTH                      = FROZEN
EMAIL LOGIC               = FROZEN
XP                        = FROZEN
LEVEL                     = FROZEN
COINS                     = FROZEN
BOT RANKING EXCLUSION     = ENFORCED & CERTIFIED (100% DB-LEVEL)

EMAIL DELIVERY            = BLOCKED UNTIL SMTP TEST
GOOGLE OAUTH              = PENDING EXTERNAL CREDENTIALS

GOOGLE ADS                = OFF
REWARDED ADS              = OFF
STRIPE PAYMENTS           = OFF
PRODUCTION                = LOCKED
DEPLOYMENT                = NONE
====================================================
```

