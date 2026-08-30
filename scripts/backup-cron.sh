#!/usr/bin/env bash
# ==============================================================================
# SUDOKUGAME24 — AUTOMATED CRON BACKUP RUNNER
# Schedule in crontab: 0 3 * * * /var/www/sudokugame24/scripts/backup-cron.sh >> /var/log/sudoku-backup.log 2>&1
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "--------------------------------------------------"
echo "📅 [$(date -u +"%Y-%m-%d %H:%M:%S UTC")] Starting Scheduled SudokuGame24 Backup"
echo "--------------------------------------------------"

cd "${APP_DIR}"

# Run Node.js Backup Engine
node "${SCRIPT_DIR}/backup-db.js"

echo "✅ Backup Cron Runner Completed Successfully."
