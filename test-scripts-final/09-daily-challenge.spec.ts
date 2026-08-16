import { ForensicLogger } from './runner';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const logger = new ForensicLogger('09-daily-challenge.log');
const API_URL = 'http://localhost:3001';

async function run() {
  logger.logTestStart('Daily Challenge E2E Verification');
  try {
    const userA = { email: `daily_${Date.now()}@test.com`, password: 'Password123!', username: `Daily_${Date.now()}` };
    const regA = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userA) });
    const cookieA = regA.headers.get('set-cookie')?.split(';')[0];
    const dbUserA = await prisma.user.findUnique({ where: { email: userA.email } });

    // 1. Ensure Daily Challenge exists for TODAY in DB
    // A cron job usually generates it, but we'll manually ensure it exists for the test
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let challenge = await prisma.dailyChallenge.findFirst({ where: { date: today } });
    if (!challenge) {
      logger.log(`No daily challenge found for today. Creating one for testing.`);
      challenge = await prisma.dailyChallenge.create({
        data: {
          date: today,
          difficulty: 'MEDIUM',
          sudokuBoard: { test: 'board' }, // Minimal stub
          solvedBoard: { test: 'solved' },
        }
      });
    }

    // 2. Fetch today's challenge via API
    logger.logRequest('GET', '/daily/today');
    const todayRes = await fetch(`${API_URL}/daily/today`, { headers: { 'Cookie': cookieA! } });
    const todayData = await todayRes.json();
    logger.logResponse(todayRes.status, { id: todayData.id, date: todayData.date });

    logger.logDBAssertion('DailyChallenge', 'API correctly identifies UTC Today', todayData.id === challenge.id);

    // 3. Start challenge (creates entry)
    logger.logRequest('POST', `/daily/${challenge.id}/start`);
    const startRes = await fetch(`${API_URL}/daily/${challenge.id}/start`, { method: 'POST', headers: { 'Cookie': cookieA! } });
    const startData = await startRes.json();
    logger.logResponse(startRes.status, startData);

    logger.logDBAssertion('DailyChallengeEntry', 'Challenge entry created successfully', startRes.status === 201);

    // 4. Duplicate Start (should be prevented)
    logger.logRequest('POST', `/daily/${challenge.id}/start (DUPLICATE)`);
    const dupStartRes = await fetch(`${API_URL}/daily/${challenge.id}/start`, { method: 'POST', headers: { 'Cookie': cookieA! } });
    logger.logDBAssertion('DailyChallengeEntry', 'Duplicate start returns existing entry idempotently', dupStartRes.status === 200 || dupStartRes.status === 201);

    // 5. Submit challenge
    logger.logRequest('POST', `/daily/${challenge.id}/submit`);
    const submitRes = await fetch(`${API_URL}/daily/${challenge.id}/submit`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieA! },
      body: JSON.stringify({ finalBoard: challenge.solvedBoard, timeSec: 120 })
    });
    const submitData = await submitRes.json();
    logger.logResponse(submitRes.status, submitData);

    const entry = await prisma.dailyChallengeEntry.findFirst({ where: { userId: dbUserA!.id, challengeId: challenge.id } });
    logger.logDBAssertion('DailyChallengeEntry', 'Challenge marked as completed', entry?.completed === true);

    // 6. Duplicate Submit (should be prevented)
    logger.logRequest('POST', `/daily/${challenge.id}/submit (DUPLICATE)`);
    const dupSubmitRes = await fetch(`${API_URL}/daily/${challenge.id}/submit`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieA! },
      body: JSON.stringify({ finalBoard: challenge.solvedBoard, timeSec: 120 })
    });
    logger.logResponse(dupSubmitRes.status, await dupSubmitRes.json().catch(()=>{}));
    logger.logDBAssertion('DailyChallengeEntry', 'Duplicate submission blocked', dupSubmitRes.status >= 400);

    logger.logResult('Daily Challenge', true);
  } catch (error: any) {
    logger.logResult('Daily Challenge', false);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
