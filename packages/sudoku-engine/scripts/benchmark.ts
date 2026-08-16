import { GeneratorV2 } from "../src/v2/generator.v2";
import { DifficultyV2 } from "../src/v2/types.v2";

async function runBenchmark(difficulty: DifficultyV2, count: number) {
  console.log(`\n--- Benchmarking ${difficulty} (${count} puzzles) ---`);

  let totalGenerationTime = 0;
  let totalLogicalScore = 0;
  let maxTechniquesCount: Record<string, number> = {};

  for (let i = 0; i < count; i++) {
    const start = performance.now();
    const puzzle = GeneratorV2.generate(`bench-${difficulty}-${i}`, difficulty);
    const end = performance.now();

    totalGenerationTime += end - start;
    totalLogicalScore += puzzle.logicalScore;

    const puzzleMaxTech = puzzle.difficulty; // We could get the max technique, but for now let's just log
  }

  console.log(
    `Average Generation Time: ${(totalGenerationTime / count).toFixed(2)} ms`,
  );
  console.log(
    `Average Logical Score: ${(totalLogicalScore / count).toFixed(2)}`,
  );
}

async function runAll() {
  console.log("STARTING V2 ENGINE BENCHMARK...");
  const count = 100; // As requested: 100 per difficulty

  await runBenchmark(DifficultyV2.EASY, count);
  await runBenchmark(DifficultyV2.MEDIUM, count);
  await runBenchmark(DifficultyV2.HARD, count);
  await runBenchmark(DifficultyV2.EXPERT, count);

  console.log("\nBENCHMARK COMPLETE.");
}

runAll().catch(console.error);
