#!/bin/bash
echo "==================================================="
echo "    LANCEMENT DU SITE SUDOKU PREMIUM (1-CLIC)"
echo "==================================================="
echo ""

# 1. Copier le .env s'il n'existe pas
if [ ! -f ".env" ]; then
    echo "[INFO] Création du fichier .env par défaut..."
    cp .env.example .env
fi

if [ ! -f "packages/database/.env" ]; then
    echo "[INFO] Configuration du .env pour Prisma..."
    cp .env.example packages/database/.env
fi

# 2. Démarrer Docker
echo "[INFO] Démarrage de la base de données (Docker)..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "[ERREUR] Impossible de lancer Docker. Assurez-vous que Docker Desktop ou le daemon Docker est lancé."
    exit 1
fi
echo "[OK] Base de données prête."
echo ""

# 3. Installer les dépendances
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installation des dépendances NPM (cela peut prendre quelques minutes)..."
    npm install
else
    echo "[OK] Dépendances NPM déjà installées."
fi

# 4. Mettre à jour la Base de données (Prisma)
echo "[INFO] Synchronisation de la base de données..."
npm run db:push
echo ""

# 5. Lancer l'application
echo "==================================================="
echo "[SUCCES] Tout est prêt ! Lancement de l'application..."
echo "==================================================="
npm run dev
