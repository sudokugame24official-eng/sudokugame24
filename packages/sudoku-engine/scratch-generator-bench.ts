import { GeneratorV2 } from "./src/v2/generator.v2";
import { DifficultyV2 } from "./src/v2/types.v2";
import { LogicalSolver } from "./src/v2/logical-solver.v2";

const samples = 10; // reduce to 10 for speed since generator might take time
const difficulties = [
  DifficultyV2.EASY,
  DifficultyV2.MEDIUM,
  DifficultyV2.HARD,
  DifficultyV2.EXPERT,
];

const stats = {};

for (const diff of difficulties) {
  let logical = 0;
  let guessing = 0;
  let start = Date.now();

  for (let i = 0; i < samples; i++) {
    const puzzle = GeneratorV2.generate(`test-seed-${diff}-${i}`, diff);
    const result = LogicalSolver.solveLogical(puzzle.initialBoard);

    if (!result.requiresGuessing) {
      logical++;
    } else {
      guessing++;
    }
  }
  const end = Date.now();
  stats[diff] = { logical, guessing, total: samples, timeMs: end - start };
}

console.log(JSON.stringify(stats, null, 2));
