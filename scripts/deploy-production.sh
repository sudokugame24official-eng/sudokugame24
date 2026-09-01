#!/usr/bin/env bash
# ==============================================================================
# SUDOKUGAME24.COM — ONE-COMMAND PRODUCTION DEPLOYMENT SCRIPT
# Hostinger KVM 4 VPS Deployment Automation
# ==============================================================================

set -euo pipefail

echo "=================================================================="
echo "🚀 DEPLOYING SUDOKUGAME24.COM TO PRODUCTION (HOSTINGER VPS)"
echo "=================================================================="

APP_DIR="/var/www/sudokugame24"

# 1. Verify Docker & Compose
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker & Docker Compose..."
    apt-get update
    apt-get install -y docker.io docker-compose git curl ufw
    systemctl enable --now docker
fi

# 2. Setup UFW Firewall Safely
echo "🔍 Detecting active SSH port..."
SSH_PORT=""
if [ -n "${SSH_CONNECTION:-}" ]; then
    SSH_PORT=$(echo "$SSH_CONNECTION" | awk '{print $4}')
fi
if [ -z "$SSH_PORT" ]; then
    SSH_PORT=$(ss -tlnp 2>/dev/null | grep -i sshd | head -n 1 | awk '{print $4}' | sed 's/.*://' || true)
fi
if [ -z "$SSH_PORT" ]; then
    SSH_PORT=$(grep -E '^Port\s+[0-9]+' /etc/ssh/sshd_config | awk '{print $2}' | head -n 1 || true)
fi
if [ -z "$SSH_PORT" ]; then
    SSH_PORT=22
fi

if ! [[ "$SSH_PORT" =~ ^[0-9]+$ ]]; then
    echo "❌ CRITICAL: Could not definitively determine a valid SSH port (got '$SSH_PORT')."
    echo "Aborting UFW configuration to prevent permanent lockout."
    exit 1
fi
echo "✅ Active SSH port resolved to: $SSH_PORT"

echo "🛡️  Hardening UFW Firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ${SSH_PORT}/tcp   # Dynamic SSH
ufw allow 80/tcp   # HTTP (Cloudflare)
ufw allow 443/tcp  # HTTPS (Cloudflare)
ufw --force enable

# 3. Backup Database Before Deployment
echo "💾 Triggering pre-deployment backup..."
if [ -f "${APP_DIR}/scripts/backup-db.js" ]; then
    if ! node "${APP_DIR}/scripts/backup-db.js"; then
        echo "❌ CRITICAL: Pre-deploy backup failed!"
        echo "Deployment aborted to protect existing data."
        exit 1
    fi
else
    echo "ℹ️  First deployment detected (no backup script found). Skipping backup."
fi

# 4. Pull latest code
cd "${APP_DIR}"
echo "📥 Pulling latest release..."
git pull origin main || echo "Git repo up to date"

# 5. Build images and start persistence tier
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🛢️ Starting database and cache tier..."
docker-compose -f docker-compose.prod.yml up -d postgres redis

echo "⏳ Waiting for PostgreSQL database initialization..."
sleep 10 # Initial wait for boot
# Wait until postgres is healthy
TIMEOUT=120
ELAPSED=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' sudoku_postgres 2>/dev/null)" == "healthy" ]; do
    if [ $ELAPSED -ge $TIMEOUT ]; then
        echo "❌ CRITICAL: PostgreSQL failed to become healthy within ${TIMEOUT}s."
        echo "--- PostgreSQL Logs ---"
        docker-compose -f docker-compose.prod.yml logs postgres | tail -n 20
        exit 1
    fi
    sleep 2
    ELAPSED=$((ELAPSED+2))
    echo "   ...waiting for postgres healthcheck (${ELAPSED}s/${TIMEOUT}s)..."
done
echo "✅ PostgreSQL is healthy."

# 6. Apply Prisma database migrations (Before API handles traffic)
echo "🐘 Applying Prisma database migrations..."
docker-compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# 7. Start Application Tier
echo "🚀 Starting application tier (API & Web)..."
docker-compose -f docker-compose.prod.yml up -d api web

echo "⏳ Waiting for API to be healthy..."
TIMEOUT=120
ELAPSED=0
until [ "$(curl -sS --connect-timeout 2 --max-time 5 -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/health || true)" = "200" ]; do
    if [ $ELAPSED -ge $TIMEOUT ]; then
        echo "❌ CRITICAL: API failed to return HTTP 200 within ${TIMEOUT}s."
        echo "--- API Logs ---"
        docker-compose -f docker-compose.prod.yml logs api | tail -n 20
        exit 1
    fi
    sleep 2
    ELAPSED=$((ELAPSED+2))
    echo "   ...waiting for API to return HTTP 200 (${ELAPSED}s/${TIMEOUT}s)..."
done
echo "✅ API is healthy."

# 8. Seed Canonical Email Templates & Super Admin
echo "📧 Seeding Canonical Email Templates..."
docker-compose -f docker-compose.prod.yml exec -T api node scripts/seed-canonical-email-templates.js

# 9. Setup Automated Daily Backup Cron Job
echo "⏰ Configuring Automated Daily Backup Cron Job (03:00 UTC)..."
CRON_JOB="0 3 * * * ${APP_DIR}/scripts/backup-cron.sh >> /var/log/sudokugame24-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -Fv "backup-cron.sh" || true; echo "${CRON_JOB}") | crontab -

echo "=================================================================="
echo "🎉 DEPLOYMENT COMPLETE! SUDOKUGAME24.COM IS LIVE AND OPERATIONAL."
echo "=================================================================="
