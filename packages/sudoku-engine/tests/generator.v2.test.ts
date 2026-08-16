import { GeneratorV2 } from "../src/v2/generator.v2";
import { DifficultyV2 } from "../src/v2/types.v2";
import { RandomV2 } from "../src/v2/random.v2";
import { LogicalSolver } from "../src/v2/logical-solver.v2";

describe("Generator V2 & Determinism", () => {
  it("RandomV2 should be deterministic", () => {
    const r1 = new RandomV2("test-seed-123");
    const r2 = new RandomV2("test-seed-123");

    expect(r1.next()).toBe(r2.next());
    expect(r1.range(0, 100)).toBe(r2.range(0, 100));

    const arr1 = r1.shuffle([1, 2, 3, 4, 5]);
    const arr2 = r2.shuffle([1, 2, 3, 4, 5]);
    expect(arr1).toEqual(arr2);
  });

  it("should generate a valid puzzle deterministically", () => {
    const seed = "daily-2023-10-25";

    // Generate two puzzles with the exact same seed and parameters
    const puzzle1 = GeneratorV2.generate(seed, DifficultyV2.EASY);
    const puzzle2 = GeneratorV2.generate(seed, DifficultyV2.EASY);

    // They must be absolutely identical
    expect(puzzle1.initialBoard).toEqual(puzzle2.initialBoard);
    expect(puzzle1.solvedBoard).toEqual(puzzle2.solvedBoard);
    expect(puzzle1.engineVersion).toBe("v2");
    expect(puzzle1.difficulty).toBe(DifficultyV2.EASY);
  });

  it("should guarantee exactly 1 logical solution (no guessing)", () => {
    const puzzle = GeneratorV2.generate("test-guarantee", DifficultyV2.MEDIUM);

    const result = LogicalSolver.solveLogical(puzzle.initialBoard);

    expect(result.solved).toBe(true);
    expect(result.requiresGuessing).toBe(false);
  });
});
