export type SudokuValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type SudokuGrid = SudokuValue[][];

export enum Difficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
  EXPERT = "EXPERT",
  MASTER = "MASTER",
}

export interface SudokuPuzzle {
  initialBoard: SudokuGrid;
  solvedBoard: SudokuGrid;
  difficulty: Difficulty;
}
