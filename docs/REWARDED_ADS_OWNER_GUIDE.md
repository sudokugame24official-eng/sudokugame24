# 🎁 GUIDE DU PROPRIÉTAIRE : VIDÉOS SPONSORISÉES (REWARDED ADS)

Ce guide explique le fonctionnement des **Vidéos Sponsorisées Récompensées (Rewarded Ads)**. 

Ce système est **totalement séparé** des bannières Google AdSense classiques et dispose d'une sécurité cryptographique avec validation côté serveur.

---

## 🎯 DIFFÉRENCE CRUCIALE
| Type de Publicité | Récompense en Pièces ? | Validation Côté Serveur ? |
| :--- | :---: | :---: |
| **Bannières Google AdSense** | ❌ **JAMAIS** (Interdit par Google) | Non (Affichage passif) |
| **Vidéos Sponsorisées (Rewarded)** | ✅ **OUI** (Strictement interne) | ✅ **OUI** (Jeton cryptographique sécurisé) |

---

## 🔒 NATURE DE LA RÉCOMPENSE
Les récompenses distribuées sont :
* **Strictement internes à la plateforme** (Pièces de jeu pour acheter des thèmes visuels, des indices ou participer à des tournois).
* **Non échangeables contre de l'argent réel** (Pas de cash, pas de crypto, pas de cartes cadeaux).
* **Non transférables** entre joueurs.

---

## ⚙️ CONFIGURATION NO-CODE DEPUIS L'ADMIN
Dans votre panneau d'administration (`admin/ads` &gt; Onglet **Vidéos Sponsorisées**) :

1. **Interrupteur Maître** : Active ou désactive le système de vidéos sponsorisées.
2. **Pièces par vidéo vue** : Définissez le gain par vidéo (par exemple : `20` pièces).
3. **Plafond Quotidien (Daily Cap)** : Définissez le nombre maximum de vidéos qu'un joueur peut regarder par jour (par exemple : `5` vidéos par 24h). Cela évite le spam et protège l'économie du jeu.
4. **Délai d'attente (Cooldown)** : Définissez le temps d'attente obligatoire entre deux vidéos (par exemple : `60` secondes).

---

## 🛡️ SÉCURITÉ ANTI-FRAUDE & REGISTRE DES PIÈCES (COIN LEDGER)
* **Jeton à Usage Unique (Single-Use Token)** : Chaque session de vidéo génère un jeton signé cryptographiquement expirant au bout de 5 minutes.
* **Protection contre les Replays** : Un jeton ne peut être réclamé qu'une seule fois.
* **Registre Comptable Officiel** : Chaque crédit de pièces crée une transaction immuable de type `AD_REWARD` dans la base de données. Il est impossible de falsifier son solde de pièces côté navigateur.
