# 🗺️ CARTE DES EMPLACEMENTS PUBLICITAIRES (ADS PLACEMENT MAP)

Ce document répertorie tous les emplacements publicitaires autorisés et interdits sur la plateforme Sudoku pour garantir une expérience utilisateur haut de gamme et respecter les règles de Google AdSense.

---

## 🟢 1. EMPLACEMENTS ÉDITORIAUX AUTORISÉS (SAFE PLACEMENTS)

| Page | Emplacement Exact | Formats Recommandés | Desktop | Tablet | Mobile | Justification UX / SEO |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Accueil (`/`)** | Entre les sections éditoriales / communauté | Leaderboard (970x90) / Responsive | ✅ | ✅ | ✅ | Ne perturbe pas le bouton principal "Jouer" |
| **Académie (`/learn/*`)** | Entre deux paragraphes de guide didactique | Horizontal (728x90) / Auto | ✅ | ✅ | ✅ | Lecture aérée sans masquer les schémas |
| **Forum Index (`/forum`)** | Entre les blocs de sujets (après le 5ème sujet) | Horizontal (728x90) | ✅ | ✅ | ✅ | Intégration fluide dans le flux de discussions |
| **Classement (`/leaderboard`)** | Sous le podium des champions | Leaderboard (970x90) | ✅ | ✅ | ✅ | Respecte la visibilité du Top 3 mondial |
| **Fin de Partie (`/play` Post-Game)** | **Après** l'affichage des résultats et stats | Pavé Rectangle (336x280 / 300x250) | ✅ | ✅ | ✅ | Partie terminée, ne coupe pas la réflexion |

---

## 🔴 2. ZONES STRICTEMENT INTERDITES (FORBIDDEN PLACEMENTS)

Le code source et le panneau d'administration bloquent automatiquement toute tentative de placement publicitaire sur ces zones :

* ❌ **Grille de Sudoku active** (Interdiction absolue de recouvrir les 81 cases).
* ❌ **Pavé numérique (Numpad 1-9)** (Empêcherait la saisie des chiffres).
* ❌ **Chronomètre & Compteur d'erreurs**.
* ❌ **Bouton Pause & Bouton Indice**.
* ❌ **Arène de Duel 1v1 & Barre de Domination** (Le jeu en direct nécessite une concentration maximale).
* ❌ **Formulaires d'authentification (`/auth`)**.
* ❌ **Tunnel de Paiement & Checkout (`/shop/checkout`, `/payment`)**.
* ❌ **Saisie du Tchat en direct**.
* ❌ **Barre de navigation principale & Sélecteur de langue**.

---

## 🛡️ 3. RÈGLE DE FLUIDITÉ DU JEU (FLOW STRATEGY)
* **EN COURS DE JEU SOLO OU DUEL** : `0 PUBLICITÉ AFFICHÉE`.
* **APRÈS VICTOIRE OU DÉFAITE** : `RÉSULTATS → AD → REJOUER`.
