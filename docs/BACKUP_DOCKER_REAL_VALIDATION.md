# Validation Réelle du Système de Backup Docker

**Avertissement :** Ce document a été généré car le moteur Docker n'est pas disponible sur l'environnement local de développement. Les tests décrits ci-dessous doivent être exécutés manuellement dans un environnement équipé de Docker (par exemple, une machine virtuelle locale, ou un serveur de Staging).

## 1. Prérequis
- Moteur Docker et Docker Compose (`docker compose`) installés.
- Les fichiers `Dockerfile.backup`, `docker-compose.prod.yml`, `scripts/backup-db.js` et `scripts/restore-db.js` à jour.
- Le dossier `backups` existant à la racine : `mkdir -p backups`

## 2. Architecture de Test
L'objectif est d'isoler totalement la validation :
1. Une instance PostgreSQL de test (source).
2. Le service de backup.
3. Une instance PostgreSQL de test secondaire (destination pour la restauration).

## 3. Commandes Exactes & Procédure

### 3.1 Démarrage de la DB Source et Génération du Backup
```bash
# Lancer Postgres de test et le service de build Backup
export POSTGRES_USER=testuser POSTGRES_PASSWORD=testpass POSTGRES_DB=testdb
export BACKUP_ENCRYPTION_KEY=testkey12345678901234567890123456
docker compose -f docker-compose.prod.yml up -d postgres
docker compose -f docker-compose.prod.yml build backup

# Insérer des données (utiliser les scripts de migration Prisma)
docker compose -f docker-compose.prod.yml run --rm api npx prisma db push
docker compose -f docker-compose.prod.yml run --rm api node scripts/seed-canonical-email-templates.js

# Exécuter le Backup
docker compose -f docker-compose.prod.yml run --rm backup node scripts/backup-db.js
```

**Critères PASS/FAIL (Backup) :**
- Le conteneur se termine avec Exit Code 0.
- `ls -lah backups/` montre un fichier `.sql.gz.enc` et un `.sha256`.
- `cat backups/backup-latest-manifest.json` existe et est valide.

### 3.2 Test de Restauration (Restore)
```bash
# Nettoyer ou recréer une base vierge pour prouver la restauration
docker compose -f docker-compose.prod.yml exec postgres psql -U testuser -d testdb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose -f docker-compose.prod.yml run --rm api npx prisma db push

# Exécuter le Restore (les scripts détecteront l'archive la plus récente dans /backups)
docker compose -f docker-compose.prod.yml run --rm backup node scripts/restore-db.js
```

**Critères PASS/FAIL (Restore) :**
- Exit Code 0.
- Les logs indiquent `AES-256-GCM (AEAD) Authenticated Decryption succeeded`.
- Tous les "14 Forensic Post-Restore Integrity Checks" affichent `PASS`.

### 3.3 Tests d'Échec (Failure Tests)

1. **Clé Absente (Test A) :**
   ```bash
   export BACKUP_ENCRYPTION_KEY=""
   docker compose -f docker-compose.prod.yml run --rm backup
   # Doit retourner une erreur immédiate (soit au niveau de Compose via :?error, soit dans le script)
   ```
2. **DATABASE_URL Invalide (Test B) :**
   ```bash
   export POSTGRES_PASSWORD=wrongpassword
   docker compose -f docker-compose.prod.yml run --rm backup
   # Le script Prisma doit crasher (Exit code 1)
   ```
3. **R2 Absent (Test C) :**
   Exécuter normalement (sans exporter de R2_ACCOUNT_ID). 
   Le log de `backup-db.js` affichera : `ℹ️ Cloudflare R2 credentials not set in environment. Saved to local backup storage only.` Le script doit réussir (PASS).

## 4. Test du Mécanisme de Cron et Lock (flock)
```bash
# Simuler deux lancements simultanés
/usr/bin/flock -n /tmp/sudoku_backup.lock docker compose -f docker-compose.prod.yml run --rm backup &
/usr/bin/flock -n /tmp/sudoku_backup.lock docker compose -f docker-compose.prod.yml run --rm backup &
```

**Critères PASS/FAIL (Cron) :**
- Le deuxième script se termine instantanément par l'échec de prise de lock (Exit code 1 de flock).
- Un seul backup est généré au total.
