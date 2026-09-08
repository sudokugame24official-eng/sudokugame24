/**
 * PRE-MIGRATION BACKUP — Neon Production Database
 * Non-destructive: read-only Prisma queries, writes JSON dump locally.
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BACKUP_DIR = path.resolve(__dirname, '../backups');

async function run() {
  const prisma = new PrismaClient();
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dumpFile = path.join(BACKUP_DIR, `pre-migration-backup-${ts}.json`);
  const shaFile = `${dumpFile}.sha256`;

  const tables = [
    'user', 'profile', 'rolePermission', 'sudokuPuzzle', 'gameSession',
    'dailyChallenge', 'dailyChallengeEntry', 'duelMatch', 'coinTransaction',
    'purchase', 'shopProduct', 'userPerk', 'subscription', 'friendship',
    'privateMessage', 'block', 'notification', 'report', 'forumCategory',
    'forumPost', 'forumComment', 'like', 'question', 'answer',
    'questionVote', 'answerVote', 'questionFollow', 'contentArticle',
    'contentRevision', 'mediaAsset', 'supportTicket', 'ticketMessage',
    'emailTemplate', 'siteSettings', 'auditLog', 'featureFlag', 'adSlotConfig',
    'achievement', 'userAchievement', 'analyticsEvent', 'analyticsDaily',
    'adminActionLog', 'sudokuTechnique',
  ];

  const dump = { meta: { timestamp: new Date().toISOString(), database: 'neon-production', type: 'pre-migration-backup' }, tables: {}, rowCounts: {} };
  let totalRows = 0;

  for (const t of tables) {
    if (prisma[t]) {
      try {
        const rows = await prisma[t].findMany();
        dump.tables[t] = rows;
        dump.rowCounts[t] = rows.length;
        totalRows += rows.length;
      } catch (e) {
        dump.rowCounts[t] = `ERROR: ${e.message}`;
      }
    }
  }

  dump.meta.totalRows = totalRows;
  dump.meta.tableCount = Object.keys(dump.rowCounts).length;

  const json = JSON.stringify(dump, null, 2);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.writeFileSync(dumpFile, json);

  const sha = crypto.createHash('sha256').update(json).digest('hex');
  fs.writeFileSync(shaFile, sha);

  await prisma.$disconnect();

  console.log(`\n=== PRE-MIGRATION BACKUP COMPLETE ===`);
  console.log(`File: ${dumpFile}`);
  console.log(`Size: ${(json.length / 1024).toFixed(1)} KB`);
  console.log(`SHA-256: ${sha}`);
  console.log(`Tables: ${dump.meta.tableCount}`);
  console.log(`Total rows: ${totalRows}`);
  console.log(`Row counts:`);
  for (const [t, c] of Object.entries(dump.rowCounts)) {
    console.log(`  ${t}: ${c}`);
  }
  console.log(`======================================`);
}

run().catch(e => { console.error('BACKUP FAILED:', e); process.exit(1); });
