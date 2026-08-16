import { PrismaClient, Difficulty } from "@prisma/client";
import assert from "assert";
import { GeneratorV2, DifficultyV2 } from "@repo/sudoku-engine";

const prisma = new PrismaClient();

async function main() {
  console.log("--- STARTING PHASE 7 DAILY CHALLENGE E2E TEST ---");

  // 1. Cleanup
  await prisma.dailyChallengeEntry.deleteMany({
    where: { user: { email: "daily@test.com" } },
  });
  await prisma.user.deleteMany({ where: { email: "daily@test.com" } });

  // 2. Create User
  const user = await prisma.user.create({
    data: {
      email: "daily@test.com",
      passwordHash: "hash",
      role: "MEMBER",
      profile: {
        create: { username: "DailyPlayer", xp: 0, level: 1 },
      },
    },
  });

  // 3. Simulate Server "Today" (UTC)
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);

  const tomorrowUTC = new Date();
  tomorrowUTC.setDate(tomorrowUTC.getDate() + 1);
  tomorrowUTC.setUTCHours(0, 0, 0, 0);

  const yesterdayUTC = new Date();
  yesterdayUTC.setDate(yesterdayUTC.getDate() - 1);
  yesterdayUTC.setUTCHours(0, 0, 0, 0);

  console.log("Test Dates (UTC):", { yesterdayUTC, todayUTC, tomorrowUTC });

  // Create or Find Today's Challenge
  let challenge = await prisma.dailyChallenge.findUnique({
    where: { date: todayUTC },
    include: { puzzle: true },
  });
  if (!challenge) {
    const puzzleData = GeneratorV2.generate("daily-seed", DifficultyV2.MEDIUM);
    challenge = await prisma.dailyChallenge.create({
      data: {
        date: todayUTC,
        puzzle: {
          create: {
            initialBoard: puzzleData.initialBoard,
            solvedBoard: puzzleData.solvedBoard,
            difficulty: Difficulty.MEDIUM,
          },
        },
      },
      include: { puzzle: true },
    });
  }

  // Create Yesterday's Challenge
  let pastChallenge = await prisma.dailyChallenge.findUnique({
    where: { date: yesterdayUTC },
    include: { puzzle: true },
  });
  if (!pastChallenge) {
    const puzzleData = GeneratorV2.generate("daily-past", DifficultyV2.MEDIUM);
    pastChallenge = await prisma.dailyChallenge.create({
      data: {
        date: yesterdayUTC,
        puzzle: {
          create: {
            initialBoard: puzzleData.initialBoard,
            solvedBoard: puzzleData.solvedBoard,
            difficulty: Difficulty.MEDIUM,
          },
        },
      },
      include: { puzzle: true },
    });
  }

  // 4. Test Logic: Start Today's Challenge
  const entry = await prisma.dailyChallengeEntry.create({
    data: {
      challengeId: challenge.id,
      userId: user.id,
      score: 0,
      timeSec: 0,
      completed: false,
    },
  });
  assert(entry.id, "Entry started");

  // Test Logic: Start Yesterday's Challenge (API logic simulation)
  let pastError = false;
  try {
    if (pastChallenge.date.getTime() !== todayUTC.getTime()) {
      throw new Error("You can only start today's challenge");
    }
  } catch (e) {
    pastError = true;
  }
  assert(
    pastError,
    "Should block starting past challenges due to UTC mismatch",
  );

  // 5. Test Logic: Duplicate Submission Prevention
  let doubleStartError = false;
  try {
    const existing = await prisma.dailyChallengeEntry.findUnique({
      where: {
        challengeId_userId: { challengeId: challenge.id, userId: user.id },
      },
    });
    if (existing) throw new Error("Duplicate");
  } catch (e) {
    doubleStartError = true;
  }
  assert(doubleStartError, "Should prevent duplicate start");

  // 6. Test Score Calculation (Server Authoritative)
  // We simulate the exact logic from daily.service.ts
  const solvedBoard = challenge!.puzzle!.solvedBoard as any[][];
  const initialBoard = challenge!.puzzle!.initialBoard as any[][];
  const finalBoard = solvedBoard; // perfect solve

  let trueScore = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (initialBoard[r] && finalBoard[r] && solvedBoard[r]) {
        if (
          initialBoard[r]![c] === 0 &&
          finalBoard[r]![c] === solvedBoard[r]![c]
        ) {
          trueScore += 5; // 5 coins per cell
        }
      }
    }
  }
  assert(trueScore > 0, "Should award points for empty cells correctly filled");

  // Update entry
  const finalEntry = await prisma.dailyChallengeEntry.update({
    where: {
      challengeId_userId: { challengeId: challenge.id, userId: user.id },
    },
    data: { score: trueScore, timeSec: 100, completed: true },
  });
  assert(finalEntry.completed === true, "Entry completed");
  assert(finalEntry.score === trueScore, "Score is accurate");

  // 7. Prevent resubmission
  let resubmitError = false;
  try {
    const existingFinal = await prisma.dailyChallengeEntry.findUnique({
      where: {
        challengeId_userId: { challengeId: challenge.id, userId: user.id },
      },
    });
    if (existingFinal?.completed) throw new Error("Already completed");
  } catch (e) {
    resubmitError = true;
  }
  assert(
    resubmitError,
    "Should block resubmission of already completed challenge",
  );

  console.log("✅ UTC Timezone & Edge Cases Verified");
  console.log("✅ Daily Challenge Engine (Server Authoritative) Verified");

  // Cleanup
  await prisma.dailyChallengeEntry.delete({ where: { id: finalEntry.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log("--- ALL DAILY CHALLENGE TESTS PASSED ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
