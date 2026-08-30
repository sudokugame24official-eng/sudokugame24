# 🛡️ RÈGLES DE SÉCURITÉ & DE CONFIDENTIALITÉ (ADS SECURITY RULES)

Ce document établit les règles de sécurité et de conformité applicables à la monétisation et aux flux publicitaires de la plateforme Sudoku.

---

## 1. PROTECTION DES DONNÉES PERSONNELLES & RGPD / TCF
* **Consentement Préalable Obligatoire** : Aucun cookie publicitaire ni script tiers n'est déclenché avant l'accord explicite de l'utilisateur via la bannière de consentement RGPD (`hasConsent`).
* **Respect du Droit à l'Oubli & Non-Profilage** : Prise en charge des requêtes sans personnalisation publicitaire lorsque le consentement n'est pas accordé.

---

## 2. ISOLATION ET SÉPARATION DU REGISTRE DES PIÈCES (COIN LEDGER)
* **Aucune manipulation directe côté client** : Le frontend ne peut jamais envoyer `{ coins: 20 }` au backend.
* **Signature Cryptographique HMAC-SHA256** : Toutes les opportunités de récompenses utilisent un jeton signé avec la clé secrète serveur `JWT_SECRET`.
* **Idempotence & Anti-Replay** : Chaque session de vidéo récompensée porte un identifiant unique `sessionId` à usage unique. Toute tentative de rejouer le même jeton est rejetée avec un code HTTP 409 Conflict.
* **Transactions Immuables** : Chaque gain est inscrit dans la table `CoinTransaction` avec le type `CoinTransactionType.AD_REWARD`.

---

## 3. ABSENCE DE SECRETS CÔTÉ NAVIGATEUR
* Seuls les identifiants publics autorisés (tels que le `Publisher ID` AdSense public) sont accessibles au navigateur.
* Les clés secrètes Stripe, les clés d'API internes et les secrets de signature de jetons restent strictement cantonnés au backend NestJS.
