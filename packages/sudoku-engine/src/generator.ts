import { SudokuGrid, SudokuValue, Difficulty, SudokuPuzzle } from "./types";
import { SudokuSolver } from "./solver";

export class SudokuGenerator {
  private static getEmptyBoard(): SudokuGrid {
    return Array.from({ length: 9 }, () => Array(9).fill(0));
  }

  // Shuffle array using Fisher-Yates
  private static shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length,
      randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
  }

  private static fillBoard(board: SudokuGrid): boolean {
    let row = -1;
    let col = -1;
    let emptyLeft = false;

    for (let i = 0; i < 9; i++) {
      if (emptyLeft) break;
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) {
          row = i;
          col = j;
          emptyLeft = true;
          break;
        }
      }
    }

    if (!emptyLeft) return true;

    // Randomize digits 1-9 to ensure random boards
    const digits = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const num of digits) {
      if (SudokuSolver.isValid(board, row, col, num as SudokuValue)) {
        board[row][col] = num as SudokuValue;
        if (this.fillBoard(board)) return true;
        board[row][col] = 0;
      }
    }

    return false;
  }

  // Number of cells to remove based on difficulty
  private static getHolesCount(difficulty: Difficulty): number {
    switch (difficulty) {
      case Difficulty.EASY:
        return Math.floor(Math.random() * 10) + 30; // 30-39
      case Difficulty.MEDIUM:
        return Math.floor(Math.random() * 10) + 40; // 40-49
      case Difficulty.HARD:
        return Math.floor(Math.random() * 5) + 50; // 50-54
      case Difficulty.EXPERT:
        return Math.floor(Math.random() * 5) + 55; // 55-59
      case Difficulty.MASTER:
        return Math.floor(Math.random() * 4) + 60; // 60-63
      default:
        return 40;
    }
  }

  public static generate(difficulty: Difficulty): SudokuPuzzle {
    const solvedBoard = this.getEmptyBoard();
    this.fillBoard(solvedBoard);

    const initialBoard = SudokuSolver.cloneBoard(solvedBoard);
    const holes = this.getHolesCount(difficulty);
    let attempts = holes;

    while (attempts > 0) {
      let row = Math.floor(Math.random() * 9);
      let col = Math.floor(Math.random() * 9);

      while (initialBoard[row][col] === 0) {
        row = Math.floor(Math.random() * 9);
        col = Math.floor(Math.random() * 9);
      }

      const backup = initialBoard[row][col];
      initialBoard[row][col] = 0;

      const copy = SudokuSolver.cloneBoard(initialBoard);
      const solutions = SudokuSolver.countSolutions(copy);

      if (solutions !== 1) {
        initialBoard[row][col] = backup; // Restore if it breaks uniqueness
        attempts--;
      } else {
        attempts--; // Hole dug successfully
      }
    }

    return {
      initialBoard,
      solvedBoard,
      difficulty,
    };
  }
}
