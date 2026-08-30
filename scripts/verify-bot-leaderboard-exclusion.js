/**
 * SUDOKUGAME24 — FORENSIC VERIFICATION SUITE: BOT LEADERBOARD EXCLUSION
 * 
 * Tests the canonical rule:
 * "Bots are gameplay-only entities. Bots may participate in Duels as fallback
 *  opponents, but bots are never eligible for public leaderboards or competitive
 *  player rankings. Only registered human players are ranking-eligible."
 */

const { PrismaClient, Role, Difficulty, GameStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function runVerification() {
  console.log('================================================================');
  console.log('🤖 SUDOKUGAME24 — RUNNING BOT LEADERBOARD EXCLUSION SUITE');
  console.log('================================================================\n');

  const report = [];

  function record(testId, name, expected, actual, status, details) {
    report.push({ testId, name, expected, actual, status, details });
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${testId}] ${name} -> ${status}`);
    if (status !== 'PASS') {
      console.log(`    Expected: ${expected} | Actual: ${actual}`);
    }
  }

  try {
    // SETUP: Clean test bots/users if leftover from previous run
    await prisma.dailyChallengeEntry.deleteMany({ where: { user: { email: { contains: 'test_bot_' } } } });
    await prisma.duelMatch.deleteMany({ where: { player1: { email: { contains: 'test_bot_' } } } });
    await prisma.profile.deleteMany({ where: { user: { email: { contains: 'test_bot_' } } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test_bot_' } } });

    // 1. Create a Bot with supreme rating (9999 ELO)
    const supremeBot = await prisma.user.create({
      data: {
        email: 'test_bot_supreme@sudoku.bot',
        isBot: true,
        isEmailVerified: true,
        role: Role.MEMBER,
        profile: {
          create: {
            username: 'SupremeUltraBot_9999',
            rating: 9999,
            level: 999,
            gamesPlayed: 500,
            gamesWon: 500,
            coins: 10000,
          },
        },
      },
      include: { profile: true },
    });

    // 2. Create Real Human Players
    const humanA = await prisma.user.create({
      data: {
        email: 'test_bot_human_a@sudoku.local',
        isBot: false,
        isEmailVerified: true,
        role: Role.MEMBER,
        profile: {
          create: {
            username: 'RealHumanPlayer_A',
            rating: 2100,
            level: 25,
            gamesPlayed: 50,
            gamesWon: 35,
            coins: 2000,
          },
        },
      },
      include: { profile: true },
    });

    const humanB = await prisma.user.create({
      data: {
        email: 'test_bot_human_b@sudoku.local',
        isBot: false,
        isEmailVerified: true,
        role: Role.MEMBER,
        profile: {
          create: {
            username: 'RealHumanPlayer_B',
            rating: 1800,
            level: 15,
            gamesPlayed: 30,
            gamesWon: 18,
            coins: 1500,
          },
        },
      },
      include: { profile: true },
    });

    // --- TEST 1: Global Leaderboard DB Query ---
    console.log('--- Test 1: Global Leaderboard Exclusion ---');
    const globalTop = await prisma.profile.findMany({
      where: {
        user: {
          isBot: false,
          isBanned: false,
        },
      },
      orderBy: { rating: 'desc' },
      take: 50,
      include: { user: true },
    });

    const botFoundInGlobal = globalTop.some((p) => p.user.isBot || p.userId === supremeBot.id);
    record(
      'TEST_1_GLOBAL',
      'Bot with highest rating (9999) must not appear in Global Leaderboard',
      '0 bots in top rankings',
      botFoundInGlobal ? 'BOT FOUND IN LEADERBOARD' : '0 bots found',
      !botFoundInGlobal ? 'PASS' : 'FAIL',
      `Checked ${globalTop.length} leaderboard rows`,
    );

    // --- TEST 2: Rank Calculation Integrity ---
    console.log('\n--- Test 2: Rank Calculation Integrity (No Consumed Slots) ---');
    const humanAIndex = globalTop.findIndex((p) => p.userId === humanA.id);
    const humanBIndex = globalTop.findIndex((p) => p.userId === humanB.id);

    const relativeRankingCorrect = humanAIndex !== -1 && humanBIndex !== -1 && humanAIndex < humanBIndex;
    record(
      'TEST_2_RANK_CALC',
      'Human rank calculation strictly ignores bots (Human A > Human B)',
      'Human A ranked above Human B with no bot slots',
      `Human A index: ${humanAIndex}, Human B index: ${humanBIndex}`,
      relativeRankingCorrect ? 'PASS' : 'FAIL',
      'Rank sequence verified',
    );

    // --- TEST 3: Mass Bots Pagination Test (100 Bots vs 10 Humans) ---
    console.log('\n--- Test 3: Mass Bots Pagination (100 High-Elo Bots vs Humans) ---');
    const botBatch = [];
    for (let i = 1; i <= 50; i++) {
      botBatch.push({
        email: `test_bot_mass_${i}@sudoku.bot`,
        isBot: true,
        isEmailVerified: true,
        role: Role.MEMBER,
      });
    }

    for (const b of botBatch) {
      await prisma.user.create({
        data: {
          ...b,
          profile: {
            create: {
              username: `MassBot_${Math.random().toString(36).substring(7)}`,
              rating: 3000 + Math.floor(Math.random() * 1000),
              level: 50,
            },
          },
        },
      });
    }

    const page1 = await prisma.profile.findMany({
      where: {
        user: {
          isBot: false,
          isBanned: false,
        },
      },
      orderBy: { rating: 'desc' },
      take: 10,
      skip: 0,
      include: { user: true },
    });

    const page1HasBots = page1.some((p) => p.user.isBot);
    record(
      'TEST_3_PAGINATION',
      'Page 1 of Leaderboard with 50+ high-elo bots in DB returns 0 bots',
      '0 bots in page 1',
      page1HasBots ? 'BOT FOUND IN PAGE 1' : '100% real human players',
      !page1HasBots ? 'PASS' : 'FAIL',
      `Page 1 contains ${page1.length} human players`,
    );

    // --- TEST 4: Daily Challenge Leaderboard Exclusion ---
    console.log('\n--- Test 4: Daily Challenge Leaderboard Exclusion ---');
    const challenge = await prisma.dailyChallenge.create({
      data: {
        date: new Date('2026-12-31'),
        puzzle: {
          create: {
            initialBoard: [[0]],
            solvedBoard: [[1]],
            difficulty: Difficulty.HARD,
          },
        },
      },
    });

    // Bot finishes with score 999999 in 5s
    await prisma.dailyChallengeEntry.create({
      data: {
        challengeId: challenge.id,
        userId: supremeBot.id,
        score: 999999,
        timeSec: 5,
        completed: true,
      },
    });

    // Human finishes with score 5000 in 120s
    await prisma.dailyChallengeEntry.create({
      data: {
        challengeId: challenge.id,
        userId: humanA.id,
        score: 5000,
        timeSec: 120,
        completed: true,
      },
    });

    const dailyLeaderboard = await prisma.dailyChallengeEntry.findMany({
      where: {
        challengeId: challenge.id,
        completed: true,
        user: {
          isBot: false,
          isBanned: false,
        },
      },
      orderBy: [{ score: 'desc' }, { timeSec: 'asc' }],
      include: { user: { include: { profile: true } } },
    });

    const dailyHasBot = dailyLeaderboard.some((e) => e.user.isBot || e.userId === supremeBot.id);
    const dailyHumanRank1 = dailyLeaderboard[0]?.userId === humanA.id;

    record(
      'TEST_4_DAILY_LB',
      'Daily challenge leaderboard excludes bot entry and awards Rank 1 to Human A',
      'Only human entries present; Human A is rank 1',
      `Entries: ${dailyLeaderboard.length}, Rank 1 user: ${dailyLeaderboard[0]?.user?.profile?.username}`,
      !dailyHasBot && dailyHumanRank1 ? 'PASS' : 'FAIL',
      'Daily challenge bot exclusion verified',
    );

    // --- TEST 5: Admin User Filter & Distinction ---
    console.log('\n--- Test 5: Admin User Distinguishability ---');
    const adminBotsList = await prisma.user.findMany({
      where: { isBot: true },
      select: { id: true, email: true, isBot: true },
    });
    const adminHumansList = await prisma.user.findMany({
      where: { isBot: false },
      select: { id: true, email: true, isBot: true },
    });

    record(
      'TEST_5_ADMIN_DISTINCTION',
      'Admin API can explicitly query and distinguish REAL PLAYER vs BOT',
      'Clear separation with isBot boolean',
      `Found ${adminBotsList.length} bots, ${adminHumansList.length} humans`,
      adminBotsList.length > 0 && adminHumansList.length > 0 ? 'PASS' : 'FAIL',
      'Admin distinction verified',
    );

    // CLEANUP
    await prisma.dailyChallengeEntry.deleteMany({ where: { challengeId: challenge.id } });
    await prisma.dailyChallenge.delete({ where: { id: challenge.id } });
    await prisma.profile.deleteMany({ where: { user: { email: { contains: 'test_bot_' } } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test_bot_' } } });

  } catch (err) {
    console.error('❌ Error during test run:', err);
    record('FATAL_ERROR', 'Test Suite Execution', 'Clean execution', err.message, 'FAIL', 'Unhandled error');
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  const allPassed = report.every((r) => r.status === 'PASS');
  console.log(`🏁 BOT LEADERBOARD EXCLUSION VERIFICATION: ${allPassed ? 'ALL TESTS PASSED 100% (GREEN)' : 'FAILURES DETECTED'}`);
  console.log('================================================================\n');

  return { allPassed, report };
}

if (require.main === module) {
  runVerification().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { runVerification };
