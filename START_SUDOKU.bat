@echo off
color 0B
echo ===================================================
echo     LANCEMENT DU SITE SUDOKU PREMIUM (1-CLIC)
echo ===================================================
echo.

:: 1. Copier le .env s'il n'existe pas
if not exist ".env" (
    echo [INFO] Création du fichier .env par défaut...
    copy .env.example .env >nul
)

if not exist "packages\database\.env" (
    echo [INFO] Configuration du .env pour Prisma...
    copy .env.example packages\database\.env >nul
)

:: 2. Démarrer Docker
echo [INFO] Démarrage de la base de données (Docker)...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERREUR] Impossible de lancer Docker. Assurez-vous que Docker Desktop est ouvert.
    pause
    exit /b %errorlevel%
)
echo [OK] Base de données prête.
echo.

:: 3. Installer les dépendances
if not exist "node_modules" (
    echo [INFO] Installation des dépendances NPM (cela peut prendre quelques minutes)...
    call npm install
) else (
    echo [OK] Dépendances NPM déjà installées.
)

:: 4. Mettre à jour la Base de données (Prisma)
echo [INFO] Synchronisation de la base de données...
call npm run db:push
echo.

:: 5. Lancer l'application
echo ===================================================
echo [SUCCES] Tout est prêt ! Lancement de l'application...
echo ===================================================
call npm run dev
pause
