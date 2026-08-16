import { SudokuSolver } from "../src/solver";
import { SudokuGrid } from "../src/types";

describe("SudokuSolver", () => {
  it("should correctly solve an easy board", () => {
    const board: SudokuGrid = [
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

    const boardCopy = SudokuSolver.cloneBoard(board);
    const solved = SudokuSolver.solve(boardCopy);

    // Check it returned true
    expect(solved).toBe(true);

    // Check no zeros
    const hasZero = boardCopy.some((row) => row.includes(0));
    expect(hasZero).toBe(false);

    // Ensure all cells are valid
    let allValid = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!SudokuSolver.isValid(boardCopy, r, c, boardCopy[r][c])) {
          allValid = false;
        }
      }
    }
    expect(allValid).toBe(true);
  });

  it("should return null for an impossible board", () => {
    const board: SudokuGrid = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [5, 0, 0, 0, 8, 0, 0, 7, 9], // 5 is repeated in first col
    ];

    const boardCopy = SudokuSolver.cloneBoard(board);
    const solved = SudokuSolver.solve(boardCopy);
    expect(solved).toBe(false);
  });
});
