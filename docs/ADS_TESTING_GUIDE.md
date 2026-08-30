# 🧪 GUIDE DE TEST PUBLICITAIRE (ADS TESTING GUIDE)

Ce guide détaille les procédures de vérification et de test automatisé et manuel pour la régie publicitaire et les vidéos sponsorisées.

---

## 🚫 RÈGLE FONDAMENTALE DE TEST : NE JAMAIS CLIQUER SUR DES VRAIES PUBS
* **Interdiction stricte de cliquer sur des annonces Google réelles** : Cela constitue un motif immédiat de suspension par Google AdSense pour trafic artificiel.
* **Toujours utiliser le simulateur intégré** dans `admin/ads` qui émule l'affichage visuel sans émettre de requêtes réseau vers les serveurs publicitaires.

---

## 🧪 SCÉNARIOS DE TEST AUTOMATISÉS COUVERTS PAR LA SUITE DE TESTS

1. **Publicités globalement DÉSACTIVÉES (OFF)** : Vérifie qu'aucun script ni conteneur n'est injecté.
2. **Publicités globalement ACTIVÉES (ON)** avec identifiant éditeur valide.
3. **Rejet des identifiants invalides**.
4. **Rejet des emplacements interdits** (`grid`, `numpad`, `timer`, `duel_controls`).
5. **Vérification du consentement RGPD** : Blocage en l'absence de consentement si requis.
6. **Exclusion des utilisateurs Premium** : Les joueurs abonnés ne voient aucune publicité.
7. **Exclusion des routes de jeu actif** (`/duel/*`, `/auth`, `/checkout`).
8. **Vidéos sponsorisées (Rewarded) - Opt-in** : Initialisation d'une session avec jeton signé.
9. **Validation de récompense** : Inscription d'une transaction `AD_REWARD` dans le Coin Ledger.
10. **Rejet des attaques par rejeu (Replay Attack)** : Le même jeton ne peut pas être validé 2 fois.
11. **Plafond quotidien (Daily Cap)** : Rejet de la 6ème tentative si le plafond est de 5.
12. **Délai d'attente (Cooldown)** : Rejet des demandes rapprochées (< 60 secondes).
13. **Rollback de configuration** : Restauration d'un état antérieur via le journal d'audit.

---

## 💻 EXÉCUTER LA SUITE DE TESTS
Dans le terminal :
```bash
npm test apps/api/src/monetization/ads-and-rewarded.spec.ts
```
