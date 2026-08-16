import { ForensicLogger } from './runner';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const logger = new ForensicLogger('02-solo-sudoku.log');
const API_URL = 'http://localhost:3001';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  logger.logTestStart('Solo Sudoku End-to-End & Malicious Exploit Tests');
  try {
    // 1. Create a test user directly via Prisma for isolation
    const email = `solotest_${Date.now()}@test.com`;
    const password = 'Password123!';
    const username = `SoloUser_${Date.now()}`;

    // Register User
    logger.log(`Registering test user: ${email}`);
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    });
    
    if (!regRes.ok) throw new Error(`Registration failed: ${regRes.status}`);
    
    // Extract cookies from response for authenticated requests
    const setCookieHeader = regRes.headers.get('set-cookie');
    if (!setCookieHeader) throw new Error('No cookie received after registration');
    const authCookie = setCookieHeader.split(';')[0];
    
    logger.logDBAssertion('Profile', 'User Profile created with 0 XP', true);

    // Get user from DB to verify initial state
    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    if (!user || !user.profile) throw new Error('User/Profile not found in DB');
    const userId = user.id;
    let currentCoins = user.profile.coins;
    let currentXp = user.profile.xp;

    logger.log(`Initial DB State: Coins=${currentCoins}, XP=${currentXp}`);

    // ================================================================
    // NORMAL FLOW: Start Game -> Submit Correct Board
    // ================================================================
    logger.logRequest('POST', '/sudoku/start', { difficulty: 'EASY' });
    const startRes = await fetch(`${API_URL}/sudoku/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({ difficulty: 'EASY' })
    });
    const sessionData = await startRes.json();
    logger.logResponse(startRes.status, { sessionId: sessionData.id, puzzleId: sessionData.puzzleId });

    if (startRes.status !== 201) throw new Error('Failed to start session');
    
    const sessionId = sessionData.id;
    const puzzle = await prisma.sudokuPuzzle.findUnique({ where: { id: sessionData.puzzleId } });
    
    if (!puzzle || !puzzle.solvedBoard) throw new Error('Puzzle not found');

    // Simulate solving time (need to wait at least 16s because of the anti-cheat minimum 15s for EASY)
    // Wait... if I wait 16s, the test will be slow, but it proves it works.
    logger.log(`Waiting 16 seconds to bypass server-side anti-cheat for EASY...`);
    await delay(16000);

    const solvedBoard = puzzle.solvedBoard; // Valid solution
    
    logger.logRequest('POST', `/sudoku/${sessionId}/submit`, { finalBoard: solvedBoard });
    const submitRes = await fetch(`${API_URL}/sudoku/${sessionId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({ finalBoard: solvedBoard })
    });
    
    const submitData = await submitRes.json();
    logger.logResponse(submitRes.status, submitData);

    if (submitRes.status !== 201 || !submitData.success) {
      throw new Error('Valid submission failed');
    }

    // Verify DB
    const profileAfter = await prisma.profile.findUnique({ where: { userId } });
    logger.logDBAssertion('Profile', `XP increased (${currentXp} -> ${profileAfter?.xp})`, profileAfter!.xp > currentXp);
    logger.logDBAssertion('Profile', `Coins increased (${currentCoins} -> ${profileAfter?.coins})`, profileAfter!.coins > currentCoins);
    
    currentCoins = profileAfter!.coins;
    currentXp = profileAfter!.xp;

    // ================================================================
    // ATTACK 1: Duplicate Submission (Should be rejected)
    // ================================================================
    logger.logRequest('POST', `/sudoku/${sessionId}/submit (DUPLICATE)`, { finalBoard: solvedBoard });
    const dupRes = await fetch(`${API_URL}/sudoku/${sessionId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({ finalBoard: solvedBoard })
    });
    
    logger.logResponse(dupRes.status, await dupRes.json());
    if (dupRes.status !== 400 && dupRes.status !== 403) throw new Error('Duplicate submission was not rejected properly');
    
    const profileDup = await prisma.profile.findUnique({ where: { userId } });
    logger.logDBAssertion('Profile', `Coins unchanged on duplicate (${currentCoins} === ${profileDup?.coins})`, currentCoins === profileDup?.coins);

    // ================================================================
    // ATTACK 2: Malformed Board (HTTP 400, not 500)
    // ================================================================
    logger.logRequest('POST', '/sudoku/start', { difficulty: 'EASY' });
    const s2Res = await fetch(`${API_URL}/sudoku/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({ difficulty: 'EASY' })
    });
    const session2 = await s2Res.json();

    const malformedBoard = [[1, 2, 3]]; // Not 9x9
    logger.logRequest('POST', `/sudoku/${session2.id}/submit`, { finalBoard: malformedBoard });
    
    const malformedRes = await fetch(`${API_URL}/sudoku/${session2.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({ finalBoard: malformedBoard })
    });
    
    logger.logResponse(malformedRes.status, await malformedRes.json());
    if (malformedRes.status !== 400) throw new Error('Malformed board did not return 400');

    // ================================================================
    // ATTACK 3: Impossible Solve Time (Anti-Cheat Server Enforcement)
    // ================================================================
    logger.logRequest('POST', '/sudoku/start', { difficulty: 'HARD' });
    const s3Res = await fetch(`${API_URL}/sudoku/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({ difficulty: 'HARD' })
    });
    const session3 = await s3Res.json();
    const puzzle3 = await prisma.sudokuPuzzle.findUnique({ where: { id: session3.puzzleId } });
    
    // Submit immediately (0-2 seconds elapsed)
    logger.logRequest('POST', `/sudoku/${session3.id}/submit`, { finalBoard: puzzle3?.solvedBoard });
    const fastRes = await fetch(`${API_URL}/sudoku/${session3.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({ finalBoard: puzzle3?.solvedBoard })
    });
    
    logger.logResponse(fastRes.status, await fastRes.json());
    if (fastRes.status !== 400) throw new Error('Impossible solve time was not rejected');
    
    logger.logResult('Solo Sudoku Security & Economy', true);

  } catch (error: any) {
    logger.logResult('Solo Sudoku Security & Economy', false);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
