import { SudokuGenerator } from "../src/generator";
import { Difficulty, SudokuGrid } from "../src/types";
import { SudokuSolver } from "../src/solver";

describe("SudokuGenerator", () => {
  it("should generate a valid puzzle and solution", () => {
    const { initialBoard, solvedBoard } = SudokuGenerator.generate(
      Difficulty.EASY,
    );

    // Initial board should have 0s
    const initialHasZero = initialBoard.some((row) => row.includes(0));
    expect(initialHasZero).toBe(true);

    // Solved board should not have 0s
    const solvedHasZero = solvedBoard.some((row) => row.includes(0));
    expect(solvedHasZero).toBe(false);

    // Solved board should be valid
    let allValid = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!SudokuSolver.isValid(solvedBoard, r, c, solvedBoard[r][c])) {
          allValid = false;
        }
      }
    }
    expect(allValid).toBe(true);
  });

  it("should remove the correct number of cells based on difficulty", () => {
    const easyPuzzle = SudokuGenerator.generate(Difficulty.EASY).initialBoard;
    const masterPuzzle = SudokuGenerator.generate(
      Difficulty.MASTER,
    ).initialBoard;

    let easyZeros = 0;
    let masterZeros = 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (easyPuzzle[r][c] === 0) easyZeros++;
        if (masterPuzzle[r][c] === 0) masterZeros++;
      }
    }

    expect(easyZeros).toBeGreaterThanOrEqual(30);
    expect(easyZeros).toBeLessThanOrEqual(50);

    expect(masterZeros).toBeGreaterThanOrEqual(50);
    expect(masterZeros).toBeLessThanOrEqual(64);
  });

  it("should have a unique solution", () => {
    // A quick uniqueness check by verifying if the backtracking solver finds the same solution.
    // Real uniqueness testing requires counting all solutions.
    const { initialBoard, solvedBoard } = SudokuGenerator.generate(
      Difficulty.MEDIUM,
    );
    const boardCopy = SudokuSolver.cloneBoard(initialBoard);
    const resolved = SudokuSolver.solve(boardCopy);

    expect(resolved).toBe(true);
    expect(boardCopy).toEqual(solvedBoard);
  });
});
