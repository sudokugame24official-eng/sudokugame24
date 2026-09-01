#!/usr/bin/env bash
# ==============================================================================
# SUDOKUGAME24 — AUTOMATED CRON BACKUP RUNNER
# Schedule in crontab: 0 3 * * * /var/www/sudokugame24/scripts/backup-cron.sh >> /var/log/sudoku-backup.log 2>&1
#
# Concurrency Safety (Layer 2 of 2 — Shell-level flock):
#   Uses flock(1) from util-linux on the same lockfile as backup-db.js.
#   -n  = non-blocking: exits immediately if lock is held.
#   -E 75 = exit code 75 (EX_TEMPFAIL) when lock cannot be acquired.
#   The kernel releases the flock automatically when the process terminates
#   (including SIGKILL), making this robust against crashes.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
LOCK_FILE="${APP_DIR}/backups/backup.lock"
EXIT_CODE_ALREADY_RUNNING=75

echo "--------------------------------------------------"
echo "📅 [$(date -u +"%Y-%m-%d %H:%M:%S UTC")] Starting Scheduled SudokuGame24 Backup"
echo "--------------------------------------------------"

cd "${APP_DIR}"

# Ensure backups directory exists (needed before flock can create the lockfile)
mkdir -p "${APP_DIR}/backups"

# Layer 2: Shell-level exclusive lock via flock(1)
# -n = non-blocking (don't wait, fail immediately)
# -E 75 = exit with EX_TEMPFAIL if lock is already held
# The file descriptor is closed (and flock released) automatically when the
# subshell exits — even on SIGKILL.
(
  flock -n -E "${EXIT_CODE_ALREADY_RUNNING}" 200 || {
    echo "🔒 [$(date -u +"%Y-%m-%d %H:%M:%S UTC")] BACKUP SKIPPED — Another backup process is already running (flock held)."
    echo "   Lock file: ${LOCK_FILE}"
    echo "   Exit code: ${EXIT_CODE_ALREADY_RUNNING} (EX_TEMPFAIL)"
    exit "${EXIT_CODE_ALREADY_RUNNING}"
  }

  echo "🔓 Shell flock acquired. Launching Node.js backup engine via Docker..."

  # Run Node.js Backup Engine inside Docker
  docker compose -f docker-compose.prod.yml run --rm backup

  echo "✅ Backup Cron Runner Completed Successfully."
) 200>"${LOCK_FILE}"

EXIT_CODE=$?
if [ "${EXIT_CODE}" -eq "${EXIT_CODE_ALREADY_RUNNING}" ]; then
  exit "${EXIT_CODE_ALREADY_RUNNING}"
fi
