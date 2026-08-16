export type SudokuValueV2 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface CellV2 {
  row: number;
  col: number;
  value: SudokuValueV2 | 0;
  candidates: Set<SudokuValueV2>;
  initial: boolean;
}

export type GridV2 = CellV2[][];

export enum TechniqueName {
  NAKED_SINGLE = "NAKED_SINGLE",
  HIDDEN_SINGLE = "HIDDEN_SINGLE",
  NAKED_PAIR = "NAKED_PAIR",
  HIDDEN_PAIR = "HIDDEN_PAIR",
  NAKED_TRIPLE = "NAKED_TRIPLE",
  HIDDEN_TRIPLE = "HIDDEN_TRIPLE",
  POINTING_PAIR_TRIPLE = "POINTING_PAIR_TRIPLE",
  BOX_LINE_REDUCTION = "BOX_LINE_REDUCTION",
  X_WING = "X_WING",
  XY_WING = "XY_WING",
  SWORDFISH = "SWORDFISH",
  GUESSING = "GUESSING", // Used if solver fails logically
}

export interface CandidateRemoval {
  row: number;
  col: number;
  value: SudokuValueV2;
}

export interface PlacedValue {
  row: number;
  col: number;
  value: SudokuValueV2;
}

export interface LogicalStep {
  technique: TechniqueName;
  difficultyWeight: number;
  cellsInvolved: { row: number; col: number }[];
  candidatesRemoved: CandidateRemoval[];
  valuesPlaced: PlacedValue[];
}

export interface SolverResultV2 {
  solved: boolean;
  grid: GridV2;
  steps: LogicalStep[];
  logicalScore: number;
  maxTechnique: TechniqueName;
  requiresGuessing: boolean;
}

export enum DifficultyV2 {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
  EXPERT = "EXPERT",
}

export interface SudokuPuzzleV2 {
  id?: string;
  initialBoard: number[][]; // 0 for empty
  solvedBoard: number[][];
  difficulty: DifficultyV2;
  logicalScore: number;
  engineVersion: "v2";
  seed: string;
}
