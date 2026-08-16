import { SudokuGrid, SudokuValue } from "./types";

export class SudokuSolver {
  // Clone the board to avoid mutations
  static cloneBoard(board: SudokuGrid): SudokuGrid {
    return board.map((row) => [...row]);
  }

  // Check if a value can be placed at (row, col)
  static isValid(
    board: SudokuGrid,
    row: number,
    col: number,
    num: SudokuValue,
  ): boolean {
    for (let i = 0; i < 9; i++) {
      // Check row & col
      if (board[row][i] === num && i !== col) return false;
      if (board[i][col] === num && i !== row) return false;
    }

    // Check 3x3 block
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = startRow; i < startRow + 3; i++) {
      for (let j = startCol; j < startCol + 3; j++) {
        if (board[i][j] === num && (i !== row || j !== col)) return false;
      }
    }
    return true;
  }

  // Solve the board using backtracking (returns true if solved, mutates the board)
  static solve(board: SudokuGrid): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (this.isValid(board, row, col, num as SudokuValue)) {
              board[row][col] = num as SudokuValue;
              if (this.solve(board)) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  // Count the number of solutions to ensure a generated puzzle has exactly 1 solution
  static countSolutions(board: SudokuGrid, count = 0): number {
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
    if (!emptyLeft) return count + 1;

    let totalSolutions = count;
    for (let num = 1; num <= 9; num++) {
      if (this.isValid(board, row, col, num as SudokuValue)) {
        board[row][col] = num as SudokuValue;
        totalSolutions = this.countSolutions(board, totalSolutions);
        board[row][col] = 0; // backtrack
        if (totalSolutions > 1) return totalSolutions; // Stop early if > 1 solution found
      }
    }
    return totalSolutions;
  }
}
