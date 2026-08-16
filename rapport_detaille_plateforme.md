# 📘 Documentation Complète - Sudoku Premium SaaS

Ce document représente l'architecture exhaustive et la documentation fonctionnelle de la plateforme Sudoku. Il décrit chaque section, bouton et fonctionnalité développée.

---

## 1. 🏗️ Architecture Globale

La plateforme est construite sur une architecture **Monorepo** moderne (Turborepo) très performante :

- **Front-End (Interface Utilisateur)** : Next.js 14 (React) avec App Router, propulsé par Tailwind CSS et Framer Motion pour des animations fluides et dynamiques (Glassmorphism, thèmes sombres).
- **Back-End (Serveur & API)** : NestJS, robuste et sécurisé, exposant une API REST et gérant les connexions temps réel via WebSockets (`Socket.io`).
- **Base de Données** : PostgreSQL, modélisé via Prisma ORM (Architecture prête pour le Glicko-2 et le graphe social complet).
- **Moteur Logique & IA Coach** : Un package privé (`@repo/sudoku-engine`) intégrant un **Solveur Heuristique** capable d'imiter le raisonnement humain pour fournir des explications logiques aux joueurs (Naked Singles, Hidden Singles).

---

## 2. 🧭 Navigation et Interface Globale (Header)

Le **Header (Barre de navigation supérieure)**, inspiré des sites premium de jeux (ex: Miniclip), reste visible sur toutes les pages.

- **Logo Sudoku** : Renvoie vers la page d'accueil.
- **Liens Principaux** :
  - _Solo_ : Lance une partie classique.
  - _Multiplayer_ : Accès aux Duels.
  - _Leaderboard_ : Classements mondiaux.
  - _Forum_ : Accès à la communauté.
  - _Learn_ : Règles et tutoriels du jeu.
- **Bouton "Live Chat"** : Ouvre un panneau latéral coulissant permettant de discuter instantanément sans quitter la page actuelle.
- **Sélecteur de Langue (🌐 Globe)** : Système **SEO-Friendly (Native i18n)** propulsé par `next-intl`. La plateforme génère l'arborescence complète par langue (`/[lang]/play`), garantissant un référencement Google optimisé dans 5 langues majeures (Fr, En, De, Es, It).
- **Cloche de Notifications (🔔)** : Menu déroulant affichant les alertes (Défis reçus, passage au statut VIP, nouveautés).
- **Icône Profil Utilisateur (👤)** : Redirige vers la page de Connexion ou le Profil du joueur s'il est connecté.

---

## 3. 🔐 Inscription & Sécurité (Authentification)

Système hautement sécurisé géré par JWT (JSON Web Tokens) stockés en cookies inviolables (`httpOnly`).

- **Création de compte classique** : Demande un Pseudo, Email et Mot de passe (Haché par `bcrypt`).
- **Connexion Google (OAuth2)** : Un clic pour s'inscrire ou se connecter avec un compte Google (récupération automatique de l'Avatar).
- **Automatisations** :
  - Lors de la création d'un compte, l'utilisateur reçoit instantanément un **Email de Bienvenue** envoyé par le système (Nodemailer).

---

## 4. 🎮 Les 4 Modes de Jeux

La logique au cœur de la plateforme utilise le composant interactif `SudokuGrid.tsx`.
Ce composant contient un pavé numérique, et les boutons d'actions suivants :

- **Undo (Annuler)** : Restaure la grille au coup précédent grâce à un système d'historique.
- **Erase (Effacer)** : Supprime le chiffre de la case sélectionnée.
- **Notes (Brouillon)** : Active le mode "petits chiffres" pour inscrire des possibilités dans une case.
- **Hint (Indice IA Coach)** : Ne se contente pas de donner une réponse. Le moteur heuristique affiche un encart avec le nom de la technique (_ex: Naked Single_) et l'explication humaine (_ex: La case (3,4) est la seule à pouvoir accueillir un 7_).
- **Logique Anti-Cheat (Server-Authoritative)** : La résolution finale de la grille est intégralement validée par le serveur. Aucune faille de triche (injection client) n'est possible. En cas de 3 erreurs (Game Over).

### A. Mode Solo (Entraînement)

- Le joueur choisit une difficulté (Easy, Medium, Hard, Evil).
- Le chronomètre compte les secondes écoulées.
- En cas de réussite, une fenêtre "Victoire" affiche le temps accompli.

### B. Défi Quotidien (Daily Challenge)

- Une grille identique pour tous les joueurs du monde chaque jour.
- **Time Attack** : Le compte à rebours est fixé à 120 secondes (2 minutes).
- Le joueur gagne **+5 Pièces Virtuelles** pour chaque case correctement placée.
- À la fin du temps, le score est envoyé au serveur et affiché dans le Classement Quotidien (Leaderboard).

### C. Duels 1v1 (Multijoueur & E-Sport)

- Système de file d'attente (Matchmaking).
- Le serveur trouve deux joueurs de niveau similaire et génère une grille identique via WebSockets.
- Les classements sont gérés par l'algorithme compétitif **Glicko-2** (prenant en compte le Rating, la Déviation et la Volatilité) pour assurer des matchs parfaitement équilibrés et immunisés contre l'inflation des points.

### D. Mode TikTok Live (Pharaoh Sudoku)

- Mode conçu pour les Streamers sur TikTok.
- Le serveur écoute les commentaires en direct du flux TikTok du Streamer.
- Si un spectateur tape "A5 9" dans le tchat TikTok, le système le traduit par "Placer le chiffre 9 dans la colonne A, ligne 5" et met à jour la grille visuelle du live.

---

## 5. 💰 Monétisation & Boutique (Shop)

La plateforme intègre une économie virtuelle complète.

- **Packs de Pièces (Coins)** : Achat de pièces virtuelles avec de l'argent réel (Intégration Stripe via Webhooks de paiement).
- **Reward Video (Publicité Récompensée)** : Un joueur à court d'indices (Hints) voit apparaître une icône vidéo. En la visionnant, une interface immersive charge la vidéo puis crédite **1 Indice Gratuit** en base de données, permettant de monétiser le temps de jeu gratuitement.
- **Boutique d'Avantages (Perks)** : Les pièces servent à acheter des bonus :
  - Recharges d'Indices (Hints).
  - Vies supplémentaires (Ignorer une erreur).
  - Thèmes VIP (Couleurs de grille exclusives).

---

## 6. 💬 Aspects Sociaux et Communautaires

### A. Le Forum (SEO-Friendly)

- Construit pour être lu par Google (Server-Side Rendering) afin de booster le référencement.
- Catégories de discussions (Stratégies, Support, Général).
- Chaque sujet (Topic) permet des commentaires interactifs.
- Affichage des badges VIP et du rang ("Elo") des membres sous leur nom.

### B. Tchat en Temps Réel (ChatPanel)

- Propulsé par WebSockets, s'affiche en superposition sur le côté de l'écran.
- **Salons Globaux** : Discuter avec tous les membres connectés.
- **Messages Privés (Onglets)** : Chaque conversation privée s'ouvre dans un nouvel onglet dynamique au sein du Tchat.
- Fonctionnalité pour bloquer les joueurs abusifs.
- Animation VIP : Les noms des utilisateurs VIP sont affichés avec des dégradés de couleurs animés.

---

## 7. 👑 Panneau d'Administration (SaaS Dashboard)

Accessible uniquement aux utilisateurs ayant le rôle `ADMIN`. Sécurisé par un garde cryptographique (RolesGuard).

### A. Dashboard Analytique (Real-Time Data)

- Graphiques dynamiques (courbes `recharts`) traçant en temps réel les **Nouveaux Utilisateurs**, les **Sessions Actives**, et les **Revenus**.
- Les données sont directement extraites et agrégées par des **requêtes Prisma complexes**, reflétant l'état financier instantané de la base de données.
- Filtres temporels pour analyser la courbe sur : 7 jours, 30 jours, 6 mois, 1 an.

### B. Gestion des Utilisateurs (Modération)

- Tableau listant les membres inscrits.
- Boutons pour **Bannir** (bloque la connexion du membre) ou **Dé-bannir**.
- Bouton pour accorder le statut d'Administrateur à un membre.

### C. Modération Forum & Support

- Permet de supprimer définitivement les sujets de forum inappropriés.
- Système de gestion de tickets de Support (SAV). L'administrateur peut lire le problème d'un joueur, y répondre, et fermer le ticket.

### D. Emails & Marketing Automatisé

- **Gestion des Pixels** : L'administrateur peut coller ses identifiants (Google Analytics 4, Pixel Facebook, Pixel TikTok) dans un formulaire. Le code est instantanément injecté sur le site entier _sans avoir besoin de demander au développeur de toucher au code_.
- **Éditeur de Templates d'Emails** : Modification en direct du texte et du code HTML des emails générés par le système avec des variables dynamiques (`{{username}}`, `{{rank}}`).
- **Tâches Automatisées (Cron Jobs)** : Le serveur tourne en fond de tâche pour envoyer automatiquement :
  - Un email d'inactivité ("Tu nous manques !") aux joueurs inactifs depuis 7 jours.
  - Un email de rapport hebdomadaire ("Classement de la semaine") avec la progression des points Elo du joueur.

---

## 8. 🛠️ Robustesse et Prêt pour la Production (QA)

- Tous les liens d'API locaux (`localhost`) sont reliés à des **Variables d'Environnement**, rendant le système déployable instantanément sur n'importe quel hébergeur (Vercel, AWS, VPS).
- Une politique de sécurité (Content-Security-Policy) avancée mais souple, qui protège des attaques XSS tout en laissant fonctionner les scripts analytiques de marketing et Google Traduction.
- Docker-ready : L'infrastructure peut être conteneurisée et lancée d'une seule traite.

_**La plateforme est un produit fini, combinant Gameplay intense, système communautaire addictif, monétisation intelligente, et un suivi marketing chirurgical.**_
