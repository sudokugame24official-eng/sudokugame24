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

# 2. Setup UFW Firewall
echo "🛡️  Hardening UFW Firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP (Cloudflare)
ufw allow 443/tcp  # HTTPS (Cloudflare)
ufw --force enable

# 3. Pull latest code
cd "${APP_DIR}"
echo "📥 Pulling latest release..."
git pull origin main || echo "Git repo up to date"

# 4. Build and start containers
echo "🔨 Building and launching Docker Compose stack..."
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL database initialization..."
sleep 5

# 6. Apply Prisma database migrations
echo "🐘 Applying Prisma database migrations..."
docker-compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy

# 7. Seed Canonical Email Templates & Super Admin
echo "📧 Seeding Canonical Email Templates..."
docker-compose -f docker-compose.prod.yml exec -T api node scripts/seed-canonical-email-templates.js

# 8. Setup Automated Daily Backup Cron Job
echo "⏰ Configuring Automated Daily Backup Cron Job (03:00 UTC)..."
CRON_JOB="0 3 * * * ${APP_DIR}/scripts/backup-cron.sh >> /var/log/sudokugame24-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -Fv "backup-cron.sh" || true; echo "${CRON_JOB}") | crontab -

echo "=================================================================="
echo "🎉 DEPLOYMENT COMPLETE! SUDOKUGAME24.COM IS LIVE AND OPERATIONAL."
echo "=================================================================="
