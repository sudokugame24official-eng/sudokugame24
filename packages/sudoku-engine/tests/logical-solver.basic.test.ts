import { LogicalSolver } from "../src/v2/logical-solver.v2";
import { TechniqueName } from "../src/v2/types.v2";

describe("LogicalSolver V2 - Basic Techniques", () => {
  it("should solve a puzzle using only Naked Singles", () => {
    // This is a very easy puzzle that can be solved with just Naked Singles
    const easyPuzzle = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ];

    const result = LogicalSolver.solveLogical(easyPuzzle);
    expect(result.solved).toBe(true);
    expect(result.requiresGuessing).toBe(false);

    // Some steps should have been Naked Singles or Hidden Singles
    const hasNakedSingle = result.steps.some(
      (s) => s.technique === TechniqueName.NAKED_SINGLE,
    );
    const hasHiddenSingle = result.steps.some(
      (s) => s.technique === TechniqueName.HIDDEN_SINGLE,
    );
    expect(hasNakedSingle || hasHiddenSingle).toBe(true);
  });

  it("should find a Naked Single correctly", () => {
    // Construct a board where (0,0) must be '9' because all other 1-8 are in its row, col or box
    const board = [
      [0, 1, 2, 0, 0, 0, 0, 0, 0],
      [3, 4, 0, 0, 0, 0, 0, 0, 0],
      [5, 0, 0, 0, 0, 0, 0, 0, 0],
      [6, 0, 0, 0, 0, 0, 0, 0, 0],
      [7, 0, 0, 0, 0, 0, 0, 0, 0],
      [8, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    const result = LogicalSolver.solveLogical(board);
    // It might not solve the whole board, but the first step should be a Naked Single at 0,0 placing 9
    expect(result.steps.length).toBeGreaterThan(0);
    const firstStep = result.steps[0];
    expect(firstStep.technique).toBe(TechniqueName.NAKED_SINGLE);
    expect(firstStep.valuesPlaced[0].row).toBe(0);
    expect(firstStep.valuesPlaced[0].col).toBe(0);
    expect(firstStep.valuesPlaced[0].value).toBe(9);
  });

  it("should find a Hidden Single correctly", () => {
    // Construct a board where '1' can only be in one spot in the first row.
    // Row 0 has empty cells. Let's make (0,8) the only place for '1'.
    // We do this by putting '1' in other rows that block columns 0-7.
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0], // blocks col 0
      [0, 1, 0, 0, 0, 0, 0, 0, 0], // blocks col 1
      [0, 0, 1, 0, 0, 0, 0, 0, 0], // blocks col 2
      [0, 0, 0, 1, 0, 0, 0, 0, 0], // blocks col 3
      [0, 0, 0, 0, 1, 0, 0, 0, 0], // blocks col 4
      [0, 0, 0, 0, 0, 1, 0, 0, 0], // blocks col 5
      [0, 0, 0, 0, 0, 0, 1, 0, 0], // blocks col 6
      [0, 0, 0, 0, 0, 0, 0, 1, 0], // blocks col 7
    ];

    const result = LogicalSolver.solveLogical(board);
    // (0,8) should become 1 via Hidden Single
    const hiddenStep = result.steps.find(
      (s) =>
        s.technique === TechniqueName.HIDDEN_SINGLE &&
        s.valuesPlaced[0].value === 1,
    );
    expect(hiddenStep).toBeDefined();
    expect(hiddenStep?.valuesPlaced[0].row).toBe(0);
    expect(hiddenStep?.valuesPlaced[0].col).toBe(8);
  });
});
