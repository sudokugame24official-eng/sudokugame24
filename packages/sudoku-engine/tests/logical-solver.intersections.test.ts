import { LogicalSolver } from "../src/v2/logical-solver.v2";
import { TechniqueName } from "../src/v2/types.v2";

describe("LogicalSolver V2 - Advanced Intersections", () => {
  it("should find and apply Pointing Pair", () => {
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

    // Force candidate 9 to only appear in row 0 within the top-left box (box 0)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r > 0) grid[r][c].candidates.delete(9);
      }
    }

    // Now candidate 9 in box 0 is only in (0,0), (0,1), (0,2)
    // We should be able to delete 9 from the rest of row 0
    // Let's make sure 9 is present in the rest of row 0
    grid[0][5].candidates.add(9);
    grid[0][8].candidates.add(9);

    const step = (LogicalSolver as any).findPointingPairTriple(grid);

    expect(step).toBeDefined();
    expect(step.technique).toBe(TechniqueName.POINTING_PAIR_TRIPLE);
    expect(
      step.candidatesRemoved.some(
        (r: any) => r.row === 0 && r.col === 5 && r.value === 9,
      ),
    ).toBe(true);
    expect(
      step.candidatesRemoved.some(
        (r: any) => r.row === 0 && r.col === 8 && r.value === 9,
      ),
    ).toBe(true);

    expect(grid[0][5].candidates.has(9)).toBe(false);
  });

  it("should find and apply Box-Line Reduction", () => {
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

    // Force candidate 5 in column 2 to ONLY appear in the top-left box (box 0, i.e., rows 0,1,2)
    for (let r = 3; r < 9; r++) {
      grid[r][2].candidates.delete(5);
    }

    // Now candidate 5 in col 2 is restricted to box 0.
    // It should be removed from the rest of box 0 (which are cols 0 and 1)
    grid[1][0].candidates.add(5);
    grid[2][1].candidates.add(5);

    const step = (LogicalSolver as any).findBoxLineReduction(grid);

    expect(step).toBeDefined();
    expect(step.technique).toBe(TechniqueName.BOX_LINE_REDUCTION);

    expect(
      step.candidatesRemoved.some(
        (r: any) => r.row === 1 && r.col === 0 && r.value === 5,
      ),
    ).toBe(true);
    expect(
      step.candidatesRemoved.some(
        (r: any) => r.row === 2 && r.col === 1 && r.value === 5,
      ),
    ).toBe(true);

    expect(grid[1][0].candidates.has(5)).toBe(false);
  });
});
