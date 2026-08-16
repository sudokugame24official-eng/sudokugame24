import { LogicalSolver } from "../src/v2/logical-solver.v2";

describe("LogicalSolver V2 - E2E Grid Solving", () => {
  it("should solve a complete Easy grid without Guessing", () => {
    const easyGrid = [
      [0, 0, 0, 2, 6, 0, 7, 0, 1],
      [6, 8, 0, 0, 7, 0, 0, 9, 0],
      [1, 9, 0, 0, 0, 4, 5, 0, 0],
      [8, 2, 0, 1, 0, 0, 0, 4, 0],
      [0, 0, 4, 6, 0, 2, 9, 0, 0],
      [0, 5, 0, 0, 0, 3, 0, 2, 8],
      [0, 0, 9, 3, 0, 0, 0, 7, 4],
      [0, 4, 0, 0, 5, 0, 0, 3, 6],
      [7, 0, 3, 0, 1, 8, 0, 0, 0],
    ];

    const result = LogicalSolver.solveLogical(easyGrid);

    expect(result.solved).toBe(true);
    expect(result.requiresGuessing).toBe(false);
    expect(result.steps.length).toBeGreaterThan(0);
    // Easy grids should theoretically only require Naked Singles and Hidden Singles
    // or very simple intermediate techniques at most.
    expect(result.logicalScore).toBeGreaterThan(0);
  });
});
