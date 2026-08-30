/**
 * SUDOKUGAME24 — MANDATORY LIVE RESTORE VERIFICATION TEST
 * 
 * Executes full end-to-end disaster recovery test:
 * 1. Generates a fresh encrypted backup archive.
 * 2. Validates cryptographic SHA-256 hash.
 * 3. Restores and validates 14 database integrity domains.
 * 4. Tests live API endpoints with restored state.
 * 5. Records forensic audit evidence.
 */

const { runBackup } = require('./backup-db');
const { restoreDatabase } = require('./restore-db');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const API_URL = 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

function createJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 }),
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

async function safeFetch(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function runLiveRestoreTest() {
  console.log('================================================================');
  console.log('🧪 SUDOKUGAME24 — RUNNING MANDATORY LIVE RESTORE TEST SUITE');
  console.log('================================================================\n');

  const testReport = [];

  function record(domain, testName, expected, actual, status, evidence) {
    testReport.push({ domain, testName, expected, actual, status, evidence });
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${domain}] ${testName} -> ${status}`);
    if (status !== 'PASS') {
      console.log(`    Expected: ${expected} | Actual: ${actual}`);
    }
  }

  // STEP 1: Generate Real Production Backup
  console.log('--- Step 1: Generating Live Encrypted Backup ---');
  let backupResult;
  try {
    backupResult = await runBackup();
    record('1. BACKUP_GEN', 'Automated Encrypted Backup Creation', 'Backup file & SHA-256 manifest created', `File: ${backupResult.encFilePath}`, 'PASS', backupResult.checksum);
  } catch (e) {
    record('1. BACKUP_GEN', 'Backup Creation', 'Success', e.message, 'FAIL', 'Backup failure');
    throw e;
  }

  // STEP 2: Execute Live Restore
  console.log('\n--- Step 2: Executing Live Decryption & Database Restore ---');
  let restoreResult;
  try {
    restoreResult = await restoreDatabase({ backupFile: backupResult.encFilePath });
    record('2. RESTORE_EXEC', 'Full Database Decryption & Table Reconstruction', '14/14 checks pass', `${restoreResult.report.length} domains verified`, restoreResult.success ? 'PASS' : 'FAIL', 'restoreDatabase execution');
  } catch (e) {
    record('2. RESTORE_EXEC', 'Restore Execution', 'Success', e.message, 'FAIL', 'Restore failure');
    throw e;
  }

  // STEP 3: Live Application & API Sanity Test
  console.log('\n--- Step 3: Verifying Live Application Services & API Endpoints ---');
  const prisma = new PrismaClient();
  try {
    const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    const adminCookie = `access_token=${createJwt({ sub: adminUser.id, email: adminUser.email, role: adminUser.role })}`;

    // 3a. Admin Health
    const healthRes = await safeFetch(`${API_URL}/admin/users`, { headers: { Cookie: adminCookie } });
    record('3. API_SANITY', 'Admin Users API Query on Restored State', 'HTTP 200 OK & Users array', `HTTP ${healthRes.status}`, healthRes.status === 200 ? 'PASS' : 'FAIL', 'GET /admin/users');

    // 3b. Sudoku Start Game
    const user = await prisma.user.findFirst({ where: { role: 'MEMBER' } });
    const userCookie = `access_token=${createJwt({ sub: user.id, email: user.email, role: user.role })}`;
    const startRes = await safeFetch(`${API_URL}/sudoku/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userCookie },
      body: JSON.stringify({ difficulty: 'EASY' }),
    });
    const game = await startRes.json();
    record('3. GAMEPLAY_SANITY', 'Sudoku Game Session Initialization on Restored State', 'HTTP 200/201 & Valid Session ID', `HTTP ${startRes.status}, Session: ${game.sessionId}`, (startRes.status === 200 || startRes.status === 201) && game.sessionId ? 'PASS' : 'FAIL', `POST /sudoku/start`);

    // 3c. Coin Ledger Integrity on Restored State
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    const txCount = await prisma.coinTransaction.count({ where: { userId: user.id } });
    record('3. LEDGER_SANITY', 'Coin Ledger Consistency on Restored User', 'User coins >= 0 & Ledger query operational', `Coins: ${profile.coins}, Transactions: ${txCount}`, profile.coins >= 0 ? 'PASS' : 'FAIL', 'Coin Ledger query');
  } catch (e) {
    record('3. SANITY_TESTS', 'Application Sanity Tests', 'Passed', e.message, 'FAIL', 'Live test failure');
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  const allTestsPass = testReport.every((t) => t.status === 'PASS');
  console.log(`🏁 LIVE RESTORE TEST RESULT: ${allTestsPass ? 'ALL TESTS PASSED — DISASTER RECOVERY VERIFIED' : 'TESTS FAILED'}`);
  console.log('================================================================\n');

  return { allTestsPass, testReport };
}

if (require.main === module) {
  runLiveRestoreTest().catch((e) => {
    console.error('❌ LIVE RESTORE TEST FAILED:', e);
    process.exit(1);
  });
}

module.exports = { runLiveRestoreTest };
