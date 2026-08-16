import { LogicalSolver } from "../src/v2/logical-solver.v2";
import { TechniqueName } from "../src/v2/types.v2";

describe("LogicalSolver V2 - Advanced Techniques (X-Wing)", () => {
  it("should find and apply an X-Wing on Rows", () => {
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

    // Clear candidate 1 from row 1 and row 5 entirely first
    for (let c = 0; c < 9; c++) {
      grid[1][c].candidates.delete(1);
      grid[5][c].candidates.delete(1);
    }

    // Add candidate 1 back ONLY to cols 2 and 7 for row 1 and row 5
    grid[1][2].candidates.add(1);
    grid[1][7].candidates.add(1);
    grid[5][2].candidates.add(1);
    grid[5][7].candidates.add(1);

    // So row 1 has '1' exactly at c=2 and c=7
    // So row 5 has '1' exactly at c=2 and c=7
    // This is an X-Wing!
    // It should remove '1' from any other cell in col 2 and col 7.
    // Let's make sure there is a '1' to remove in col 2 and col 7.
    grid[0][2].candidates.add(1);
    grid[3][7].candidates.add(1);

    const step = (LogicalSolver as any).findXWing(grid);

    expect(step).toBeDefined();
    expect(step.technique).toBe(TechniqueName.X_WING);

    expect(
      step.candidatesRemoved.some(
        (r: any) => r.row === 0 && r.col === 2 && r.value === 1,
      ),
    ).toBe(true);
    expect(
      step.candidatesRemoved.some(
        (r: any) => r.row === 3 && r.col === 7 && r.value === 1,
      ),
    ).toBe(true);

    expect(grid[0][2].candidates.has(1)).toBe(false);
    expect(grid[3][7].candidates.has(1)).toBe(false);
  });

  it("should find and apply an XY-Wing", () => {
    // We need an empty grid where we carefully set up the candidates
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

    // Clear all candidates first
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        grid[r][c].candidates.clear();
      }
    }

    // Pivot at (0, 0) with [1, 2]
    grid[0][0].candidates.add(1);
    grid[0][0].candidates.add(2);

    // Pincer 1 at (0, 8) with [1, 3] (sees pivot via row)
    grid[0][8].candidates.add(1);
    grid[0][8].candidates.add(3);

    // Pincer 2 at (8, 0) with [2, 3] (sees pivot via col)
    grid[8][0].candidates.add(2);
    grid[8][0].candidates.add(3);

    // Target cell at (8, 8) which sees both pincers
    // It should have candidate 3 removed
    grid[8][8].candidates.add(3);
    grid[8][8].candidates.add(4);

    const step = (LogicalSolver as any).findXYWing(grid);

    expect(step).toBeDefined();
    expect(step.technique).toBe(TechniqueName.XY_WING);

    expect(
      step.candidatesRemoved.some(
        (r: any) => r.row === 8 && r.col === 8 && r.value === 3,
      ),
    ).toBe(true);
    expect(grid[8][8].candidates.has(3)).toBe(false);
  });

  it("should find and apply a Swordfish on Rows", () => {
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

    // Clear candidate 9 entirely
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        grid[r][c].candidates.delete(9);
      }
    }

    // Row 1, 4, 7 have candidate 9 ONLY in cols 2, 5, 8
    [1, 4, 7].forEach((r) => {
      [2, 5, 8].forEach((c) => {
        grid[r][c].candidates.add(9);
      });
    });

    // Add candidate 9 in other rows but in the same cols, these should be removed
    grid[0][2].candidates.add(9);
    grid[2][5].candidates.add(9);
    grid[8][8].candidates.add(9);

    const step = (LogicalSolver as any).findSwordfish(grid);

    expect(step).toBeDefined();
    expect(step.technique).toBe(TechniqueName.SWORDFISH);

    expect(grid[0][2].candidates.has(9)).toBe(false);
    expect(grid[2][5].candidates.has(9)).toBe(false);
    expect(grid[8][8].candidates.has(9)).toBe(false);
  });
});
