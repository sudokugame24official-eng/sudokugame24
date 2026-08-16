# 🎮 Sudoku Premium SaaS

Bienvenue dans le code source de **Sudoku Premium**, la plateforme SaaS complète de Sudoku compétitif, multi-joueurs et communautaire.

---

## 🚀 Démarrage Rapide (Lancement 1-Clic)

Ce projet a été conçu pour être **extrêmement facile à lancer**, même si vous n'avez pas de grandes connaissances techniques.

### Pré-requis :

1. Avoir **Node.js** d'installé (version 18 ou supérieure).
2. Avoir **Docker** d'installé et démarré (Docker Desktop sur Windows/Mac).

### Comment Lancer :

- **Sur Windows** :
  Double-cliquez simplement sur le fichier **`START_SUDOKU.bat`**. Le script s'occupera d'installer toutes les dépendances, démarrer la base de données PostgreSQL, appliquer les migrations et lancer les serveurs.

- **Sur Mac / Linux** :
  Ouvrez un terminal dans ce dossier et lancez la commande suivante :
  ```bash
  bash start-sudoku.sh
  ```

Une fois le lancement terminé, l'application est accessible à ces adresses :

- 🌐 **Site Web (Joueur)** : [http://localhost:3000](http://localhost:3000)
- 🔌 **API / Serveur de Jeu** : [http://localhost:3001](http://localhost:3001)

---

## 🛠️ Configuration Personnalisée (Avancé)

Si vous ne souhaitez pas utiliser le script 1-Clic, voici les étapes manuelles :

### 1. Variables d'environnement

Copiez le fichier `.env.example` à la racine et renommez-le en `.env`.
Copiez-le également dans `packages/database/.env`.

### 2. Démarrer la base de données

```bash
docker-compose up -d
```

### 3. Installer et Synchroniser

```bash
npm install
npm run db:push
```

### 4. Démarrer le projet

```bash
npm run dev
```

---

## 🧩 Structure du Projet (Monorepo Turborepo)

Ce projet est un Monorepo utilisant **Turbo**. Il est séparé en plusieurs briques logiques pour garantir la stabilité et faciliter le développement.

### Applications (`apps/`)

- `web` : Le Frontend en **Next.js 16** (React, TailwindCSS, Lucide Icons). Contient l'interface joueur, le forum, la messagerie et l'Admin Panel.
- `api` : Le Backend en **NestJS 11**. Le serveur faisant autorité qui contient l'Anti-Cheat, la sécurité WebSockets, le matchmaking et l'API REST.

### Packages Partagés (`packages/`)

- `database` : Contient tout le code **Prisma** et le Schéma de la base de données (modèles utilisateurs, parties, forum, chat).
- `sudoku-engine` : Le moteur de jeu agnostique pour générer les grilles et valider la logique métier du Sudoku.

---

## 🔒 Sécurité et Anti-Cheat

La plateforme utilise une architecture Client/Serveur robuste :

- Le client (React) ne calcule pas les scores.
- Les validations de grilles, le chronomètre et les "coins" sont strictement gérés par le serveur (`NestJS`).
- Les WebSockets (`Socket.io`) sont sécurisés par des JWT Tokens stricts.

---

_Développé avec passion pour devenir la plateforme de Sudoku #1._
