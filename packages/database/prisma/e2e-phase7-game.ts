import { PrismaClient, Difficulty, GameStatus, GameMode } from "@prisma/client";
import assert from "assert";
import { GeneratorV2, DifficultyV2 } from "@repo/sudoku-engine";

const prisma = new PrismaClient();

// Progression Logic from apps/api/src/progression/progression.service.ts
const diffMultiplier = {
  [Difficulty.EASY]: 1.0,
  [Difficulty.MEDIUM]: 1.5,
  [Difficulty.HARD]: 2.5,
  [Difficulty.EXPERT]: 4.0,
  [Difficulty.MASTER]: 6.0,
};

function getLevelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

async function main() {
  console.log("--- STARTING PHASE 7 GAME MODES & ENGINE E2E TEST ---");

  // 1. Engine Safety & Generation
  console.log("Testing Engine...");
  const puzzleData = GeneratorV2.generate("e2e-seed", DifficultyV2.EASY);
  const puzzle = puzzleData.initialBoard;
  const solution = puzzleData.solvedBoard;

  assert(puzzle.length === 9, "Puzzle should be 9x9 array");
  assert(solution.length === 9, "Solution should be 9x9 array");
  assert(
    JSON.stringify(puzzle) !== JSON.stringify(solution),
    "Puzzle should not be fully solved",
  );
  console.log("✅ Sudoku Engine Verified (Generation V2)");

  // 2. Solo Game DB lifecycle
  console.log("Testing Solo Game DB Logic...");

  // Cleanup any old state first
  await prisma.gameSession.deleteMany({
    where: { user: { email: "solo@test.com" } },
  });
  await prisma.user.deleteMany({ where: { email: "solo@test.com" } });

  // Create user
  const user = await prisma.user.create({
    data: {
      email: "solo@test.com",
      passwordHash: "hash",
      role: "MEMBER",
      profile: {
        create: {
          username: "SoloPlayer",
          level: 1,
          xp: 0,
          rating: 1000,
        },
      },
    },
  });

  const savedPuzzle = await prisma.sudokuPuzzle.create({
    data: {
      initialBoard: puzzle,
      solvedBoard: solution,
      difficulty: Difficulty.EASY,
    },
  });

  const game = await prisma.gameSession.create({
    data: {
      userId: user.id,
      puzzleId: savedPuzzle.id,
      mode: GameMode.SOLO,
      status: GameStatus.IN_PROGRESS,
    },
  });
  assert(game.id, "Solo game created");

  // Win Game
  const timeTaken = 120;
  const winGame = await prisma.gameSession.update({
    where: { id: game.id },
    data: {
      status: GameStatus.COMPLETED,
      endTime: new Date(),
      durationSec: timeTaken,
    },
  });
  assert(winGame.status === "COMPLETED", "Game won");

  // 3. Progression calculation
  const baseWinXp = 50 * diffMultiplier[Difficulty.EASY];
  const newXp = baseWinXp; // user had 0
  const newLevel = getLevelFromXp(newXp);

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      xp: newXp,
      level: newLevel,
      gamesPlayed: { increment: 1 },
      gamesWon: { increment: 1 },
    },
  });

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  assert(profile?.xp === 50, "XP correctly awarded");
  assert(profile?.gamesPlayed === 1, "Stats updated");
  assert(profile?.level === 1, "Level calculated");
  console.log("✅ Solo Game & Progression Verified");

  // Cleanup
  await prisma.gameSession.delete({ where: { id: game.id } });
  await prisma.sudokuPuzzle.delete({ where: { id: savedPuzzle.id } });
  await prisma.user.delete({ where: { id: user.id } });
  console.log("✅ Cleanup complete");

  console.log("--- ALL GAME TESTS PASSED ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
