# 🔬 RAPPORT MÉDICO-LÉGAL D'AUDIT DE COHÉRENCE (FINAL FORENSIC CONSISTENCY AUDIT)
## AUTHENTIFICATION • EMAILS • XP • NIVEAU • ÉCONOMIE DE PIÈCES

**DATE DU RAPPORT** : 29 Août 2026  
**STATUT DU DÉPLOIEMENT** : `AUCUN DÉPLOIEMENT` (Local Host Sandbox)  
**INVARIANTS DE SÉCURITÉ** :
- `GOOGLE ADS = OFF`
- `REWARDED ADS = OFF`
- `STRIPE PAYMENTS = OFF`
- `PRODUCTION = LOCKED`

---

## 📑 1. CYCLE DE VIE RÉEL DES E-MAILS (SECTION A)

### A.1 Analyse du Flux Réel dans le Code Source (`AuthService.register`)
1. **Inscription (`POST /auth/register`)** :
   - Insertion atomique dans la table `User` et `Profile` (avec solde initial de **1000 🪙**, **0 XP**, **Niveau 1**, **Elo 1500**).
   - Déclenchement asynchrone du job d'e-mail `WELCOME_EMAIL` via `this.emailService.sendEmail(user.id, 'WELCOME_EMAIL')`.
   - **Comportement identifié** : L'e-mail de bienvenue est envoyé dès l'inscription pour accueillir immédiatement le joueur (onboarding instantané), sans attendre le clic sur le lien de confirmation d'e-mail.
2. **Vérification d'E-mail (`EMAIL_VERIFICATION`)** :
   - Génération d'un jeton cryptographique HMAC-SHA256 avec durée de vie de 24 heures.
   - Lien de vérification sécurisé transmis au joueur via le template `EMAIL_VERIFICATION`.
   - `User.isEmailVerified` passe de `false` à `true` lors de la validation.
3. **Prévention du Rejeu & Doublons d'E-mails** :
   - File d'attente BullMQ avec identifiant de job déterministe (`jobId: email_${templateName}_${userId}_...`).
4. **Statut du Transport SMTP Réseau** :
   - **`EMAIL_DELIVERY = BLOCKED / INFRASTRUCTURE_BLOCKED`**  
     *(Conformément aux règles d'audit local sans passerelle SMTP externe configurée, Nodemailer utilise le fallback local/mock).*

---

## 🛠️ 2. GESTION DES MODÈLES D'E-MAILS PAR LE SUPER_ADMIN (SECTION B)

1. **Modèles Présents & Modifiables Sans Code** :
   - `WELCOME_EMAIL` : Bienvenue et bouton CTA d'accès direct au jeu.
   - `EMAIL_VERIFICATION` : Message de vérification avec lien à expiration 24h.
   - `PASSWORD_RESET` : Lien de réinitialisation avec expiration 1h.
   - `DUEL_INVITATION` : Défi 1v1 avec cote Elo et lien vers l'arène.
2. **Variables Dynamiques Supportées** :
   - `{{username}}` : Nom d'utilisateur ou fallback *"Joueur"*.
   - `{{siteName}}` : Nom de la plateforme (*"Sudoku Premium"*).
   - `{{verificationLink}}` : URL de confirmation d'adresse e-mail.
   - `{{resetLink}}` : URL de réinitialisation de mot de passe.
   - `{{supportEmail}}` : Adresse d'assistance (*"support@sudokupremium.com"*).
3. **Résilience & Isolation RBAC** :
   - Les variables inconnues sont préservées de manière sécurisée sans crash regex.
   - Les membres (`MEMBER`) sont refoulés de `/admin/email-templates` avec **HTTP 403 Forbidden**.

---

## 💰 3. ÉCONOMIE DU NOUVEL UTILISATEUR & INITIALISATION (SECTION C)

État initial garanti à la création du compte (`packages/database/prisma/schema.prisma`) :
* **Pièces Initiales** : `1000 🪙` (`Profile.coins` @default(1000))
* **XP Initial** : `0 XP` (`Profile.xp` @default(0))
* **Niveau Initial** : `Niveau 1` (`Profile.level` @default(1))
* **Cote Initiale (Glicko-2)** : `1500.0` (`rating: 1500`, `ratingDeviation: 350`, `ratingVolatility: 0.06`)
* **Indices Gratuits** : `3 indices` (`hints: 3`)

*L'acte d'inscription ne crédite aucun gain monétaire parasite : le joueur démarre exactement avec la dotation canonique de 1000 🪙.*

---

## 📈 4. ANALYSE FORENSIQUE DU CALCUL DE L'XP ET DU NIVEAU (SECTION D)

### D.1 Formule Canonique du Niveau (`@repo/database/level-config.ts`)
La formule de progression utilise une courbe RPG exponentielle :
$$\text{XP Requis pour le Niveau } N = \sum_{i=1}^{N-1} \lfloor 100 \times i^{1.5} \rfloor$$

### D.2 Matrice des Paliers de Niveau Vérifiée par Exécution
| Valeur d'XP | Niveau Calculé | Progression dans le Niveau | Statut de Validation |
| :---: | :---: | :---: | :---: |
| **0 XP** | **Niveau 1** | 0 / 100 XP (0.0 %) | **CONFORME** |
| **50 XP** | **Niveau 1** | 50 / 100 XP (50.0 %) | **CONFORME** |
| **99 XP** | **Niveau 1** | 99 / 100 XP (99.0 %) | **CONFORME** |
| **100 XP** | **Niveau 2** | 0 / 282 XP (0.0 %) | **CONFORME** |
| **381 XP** | **Niveau 2** | 281 / 282 XP (99.6 %) | **CONFORME** |
| **382 XP** | **Niveau 3** | 0 / 519 XP (0.0 %) | **CONFORME** |
| **400 XP** | **Niveau 3** | 18 / 519 XP (3.5 %) | **CONFORME** |
| **900 XP** | **Niveau 3** | 518 / 519 XP (99.8 %) | **CONFORME** |
| **901 XP** | **Niveau 4** | 0 / 800 XP (0.0 %) | **CONFORME** |
| **1600 XP** | **Niveau 4** | 699 / 800 XP (87.4 %) | **CONFORME** |
| **1700 XP** | **Niveau 4** | 799 / 800 XP (99.9 %) | **CONFORME** |
| **1701 XP** | **Niveau 5** | 0 / 1118 XP (0.0 %) | **CONFORME** |
| **2500 XP** | **Niveau 5** | 799 / 1118 XP (71.5 %) | **CONFORME** |
| **2819 XP** | **Niveau 6** | 0 / 1469 XP (0.0 %) | **CONFORME** |

### D.3 Attribution d'XP en Partie Solo
* Base Facile : 50 XP (Multiplicateur : 1.0)
* Bonus de rapidité : si temps < 300s, jusqu'à +50 % de bonus.
  * Exemple résolu en 180s : $50 \times (1 + 0.5 \times \frac{300-180}{300}) = 50 \times 1.2 = \mathbf{+60\text{ XP}}$.

---

## 🪙 5. RÈGLES COMPTABLES & RECONCILIATION DU GRAND LIVRE (SECTION E)

| Événement Économique | Débit / Crédit | Delta Pièces | Type de Transaction | Clé d'Idempotence / Protection |
| :--- | :---: | :---: | :--- | :--- |
| **Solo Facile** | Crédit | `+50 🪙` | `REWARD` / `SOLO_WIN` | Anti-triche durée minimale (>15s) |
| **Solo Moyen** | Crédit | `+100 🪙` | `REWARD` / `SOLO_WIN` | Anti-triche durée minimale (>30s) |
| **Solo Difficile** | Crédit | `+200 🪙` | `REWARD` / `SOLO_WIN` | Anti-triche durée minimale (>60s) |
| **Solo Expert** | Crédit | `+400 🪙` | `REWARD` / `SOLO_WIN` | Anti-triche durée minimale (>120s) |
| **Défi Quotidien** | Crédit | `Score du jour` | `DAILY_REWARD` | `daily_${challengeId}_${userId}` |
| **Duel contre Bot** | Neutre / Sink | `0 ou -Mise` | `DUEL_WAGER` | Mise remboursée si victoire, 0 création de monnaie |
| **Duel Classé 1v1** | Transfert | `+Mise * 2` | `DUEL_WAGER` | `duel_win_${matchId}_${winnerId}` (Transfert Joueur à Joueur) |
| **Vidéo Sponsorisée** | Crédit | `+20 🪙` | `AD_REWARD` | Jeton signé HMAC, anti-rejeu, max 5/jour |
| **Boutique Cosmétique** | Débit | `-Prix Produit` | `SHOP_PURCHASE` | `$transaction` atomique avec verrouillage de solde |

### Équation Fondamentale du Solde :
$$\text{Solde Actuel} = \text{Solde Initial (1000)} + \sum \text{Crédits} - \sum \text{Débits}$$
*Vérifiée à 100 % par l'audit : aucune divergence constatée.*

---

## 🛡️ 6. SÉCURITÉ ANTI-REJEU, CONCURRENCE & ÉTANCHÉITÉ (SECTIONS F & G)

1. **Rejeu de session de jeu solo** : Rejet immédiat avec **HTTP 400 Bad Request** (*"Session already completed"*).
2. **Rejeu de soumission du défi quotidien** : Rejet immédiat avec **HTTP 409 Conflict** (*"Challenge already completed"*).
3. **Détournement de session croisée** : Rejet immédiat avec **HTTP 400/404** (*"Session userId mismatch"*). L'attaquant ne reçoit 0 XP et 0 pièce.

---

## 💾 7. PERSISTENCE DES DONNÉES (SECTION H)

Après reconnexion et rechargement de session :
* Solde de pièces, XP cumulé, niveau, historique de parties et cote Elo sont strictement identiques en base de données.

---

## 🔍 8. RAPPORT DES NUANCES & CONTRADICTIONS DÉTECTÉES (SECTION I)

1. **Timing de l'E-mail de Bienvenue** :
   - *Observation* : `WELCOME_EMAIL` est émis dès la fin de `POST /auth/register` (onboarding immédiat) au lieu d'attendre la validation du lien d'e-mail.
   - *Statut* : Choix de design d'acquisition joueur courant, cohérent avec l'architecture.
2. **Paliers de Niveaux** :
   - *Observation* : La progression utilise $100 \times i^{1.5}$ (100 XP pour Niv 2, 382 XP pour Niv 3, 901 XP pour Niv 4) et non une progression linéaire par tranche fixe de 500 XP.
   - *Statut* : Formule RPG officielle documentée dans `@repo/database`.
3. **Dotations de Pièces des Personas UAT vs Inscription Normale** :
   - *Observation* : Les comptes de test pré-générés (UAT) possédaient des soldes personnalisés (750 pour PlayerAlpha, 200 pour PlayerBeta, 1500 pour ModeratorMax) afin de tester différentes strates de la boutique. Les nouveaux comptes réels démarrent rigoureusement avec les 1000 🪙 par défaut du schéma Prisma.

---

## 🏁 9. CLASSIFICATION FINALE (SECTION J)

* **AUTH** : **`PASS`** 🟢
* **EMAIL LOGIC** : **`PASS`** 🟢
* **EMAIL DELIVERY** : **`BLOCKED`** ⚠️ *(INFRASTRUCTURE_BLOCKED en local)*
* **XP** : **`PASS`** 🟢
* **LEVEL** : **`PASS`** 🟢
* **COINS** : **`PASS`** 🟢
* **PERSISTENCE** : **`PASS`** 🟢
* **SECURITY** : **`PASS`** 🟢

### **VERDICT GLOBAL DE COHÉRENCE FORENSIQUE : `100 % VALIDE & AUDITÉ`** 🟢
