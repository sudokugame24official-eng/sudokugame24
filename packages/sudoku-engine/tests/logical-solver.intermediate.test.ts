import { LogicalSolver } from "../src/v2/logical-solver.v2";
import { TechniqueName } from "../src/v2/types.v2";

describe("LogicalSolver V2 - Intermediate Techniques", () => {
  it("should find and apply a Naked Pair", () => {
    // Naked pair on row 0: (0,0) and (0,1) can only be 1 or 2
    // We will place values in other cells to force (0,0) and (0,1) to only have candidates 1 and 2
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [3, 4, 0, 0, 0, 0, 0, 0, 0],
      [5, 6, 0, 0, 0, 0, 0, 0, 0],
      [7, 8, 0, 0, 0, 0, 0, 0, 0],
      [9, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 9, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    // Wait, setting board like this will just trigger Naked Singles everywhere.
    // Instead of full solve, we can inject candidates manually or just carefully craft it.
    // Actually, let's just initialize the grid and manually set candidates to test the isolated method.
    const grid = LogicalSolver.initGrid(board);

    // Force Naked Pair on Row 0, cols 0 and 1
    grid[0][0].candidates = new Set([1, 2]);
    grid[0][1].candidates = new Set([1, 2]);

    // Col 2 has 1, 2, 3 as candidates
    grid[0][2].candidates = new Set([1, 2, 3]);

    // Access the private method for testing purposes (casting to any)
    const step = (LogicalSolver as any).findNakedPair(grid);

    expect(step).toBeDefined();
    expect(step.technique).toBe(TechniqueName.NAKED_PAIR);
    expect(step.candidatesRemoved.length).toBeGreaterThan(0);
    // 1 and 2 should be removed from grid[0][2]
    expect(
      step.candidatesRemoved.some(
        (r: any) => r.row === 0 && r.col === 2 && r.value === 1,
      ),
    ).toBe(true);
    expect(
      step.candidatesRemoved.some(
        (r: any) => r.row === 0 && r.col === 2 && r.value === 2,
      ),
    ).toBe(true);
  });

  it("should find and apply a Hidden Pair", () => {
    const grid = LogicalSolver.initGrid([
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]);

    // Force candidates such that 1 and 2 only appear in (0,0) and (0,1) for row 0
    // But they have other candidates too (so they are hidden)
    for (let c = 0; c < 9; c++) {
      grid[0][c].candidates = new Set([3, 4, 5, 6, 7, 8, 9]); // Remove 1 and 2 everywhere
    }

    // Add 1 and 2 only to (0,0) and (0,1)
    grid[0][0].candidates.add(1);
    grid[0][0].candidates.add(2);
    grid[0][1].candidates.add(1);
    grid[0][1].candidates.add(2);

    const step = (LogicalSolver as any).findHiddenPair(grid);

    expect(step).toBeDefined();
    expect(step.technique).toBe(TechniqueName.HIDDEN_PAIR);

    // 3,4,5,6,7,8,9 should be removed from (0,0) and (0,1)
    expect(step.candidatesRemoved.length).toBeGreaterThan(0);
    expect(grid[0][0].candidates.has(3)).toBe(false);
    expect(grid[0][0].candidates.has(1)).toBe(true);
    expect(grid[0][0].candidates.has(2)).toBe(true);
  });
});
