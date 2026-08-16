import { SudokuGrid, SudokuValue } from "./types";
import { SudokuSolver } from "./solver";

export type CandidateGrid = number[][][];

export interface Hint {
  row: number;
  col: number;
  value: number;
  technique: string;
  explanation: string;
  difficultyScore: number; // For overall puzzle rating
}

export class HeuristicSolver {
  static getCandidates(board: SudokuGrid): CandidateGrid {
    const candidates: CandidateGrid = Array(9)
      .fill(null)
      .map(() => Array(9).fill([]));

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          const possible = [];
          for (let v = 1; v <= 9; v++) {
            if (SudokuSolver.isValid(board, r, c, v as SudokuValue)) {
              possible.push(v);
            }
          }
          candidates[r][c] = possible;
        } else {
          candidates[r][c] = []; // Solved cell has no candidates
        }
      }
    }
    return candidates;
  }

  // 1. Naked Single (Easy)
  static findNakedSingle(
    board: SudokuGrid,
    candidates: CandidateGrid,
  ): Hint | null {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0 && candidates[r][c].length === 1) {
          const val = candidates[r][c][0];
          return {
            row: r,
            col: c,
            value: val,
            technique: "Naked Single",
            explanation: `La case (${r + 1}, ${c + 1}) ne peut contenir que le chiffre ${val} car tous les autres sont bloqués par la ligne, colonne ou le bloc.`,
            difficultyScore: 1.0,
          };
        }
      }
    }
    return null;
  }

  // 2. Hidden Single (Medium)
  static findHiddenSingle(
    board: SudokuGrid,
    candidates: CandidateGrid,
  ): Hint | null {
    // Check rows
    for (let r = 0; r < 9; r++) {
      const counts: Record<number, number[]> = {}; // val -> cols
      for (let c = 0; c < 9; c++) {
        candidates[r][c].forEach((val) => {
          if (!counts[val]) counts[val] = [];
          counts[val].push(c);
        });
      }
      for (let val = 1; val <= 9; val++) {
        if (counts[val] && counts[val].length === 1) {
          const c = counts[val][0];
          return {
            row: r,
            col: c,
            value: val,
            technique: "Hidden Single (Row)",
            explanation: `Dans la ligne ${r + 1}, le chiffre ${val} ne peut aller que dans la case (${r + 1}, ${c + 1}).`,
            difficultyScore: 2.0,
          };
        }
      }
    }
    // Check cols (similar logic)
    for (let c = 0; c < 9; c++) {
      const counts: Record<number, number[]> = {};
      for (let r = 0; r < 9; r++) {
        candidates[r][c].forEach((val) => {
          if (!counts[val]) counts[val] = [];
          counts[val].push(r);
        });
      }
      for (let val = 1; val <= 9; val++) {
        if (counts[val] && counts[val].length === 1) {
          const r = counts[val][0];
          return {
            row: r,
            col: c,
            value: val,
            technique: "Hidden Single (Col)",
            explanation: `Dans la colonne ${c + 1}, le chiffre ${val} ne peut aller que dans la case (${r + 1}, ${c + 1}).`,
            difficultyScore: 2.1,
          };
        }
      }
    }

    // Check Blocks
    for (let bR = 0; bR < 3; bR++) {
      for (let bC = 0; bC < 3; bC++) {
        const counts: Record<number, { r: number; c: number }[]> = {};
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const r = bR * 3 + i;
            const c = bC * 3 + j;
            candidates[r][c].forEach((val) => {
              if (!counts[val]) counts[val] = [];
              counts[val].push({ r, c });
            });
          }
        }
        for (let val = 1; val <= 9; val++) {
          if (counts[val] && counts[val].length === 1) {
            const { r, c } = counts[val][0];
            return {
              row: r,
              col: c,
              value: val,
              technique: "Hidden Single (Block)",
              explanation: `Dans le bloc de 3x3, le chiffre ${val} est forcé dans la case (${r + 1}, ${c + 1}).`,
              difficultyScore: 2.2,
            };
          }
        }
      }
    }
    return null;
  }

  // Get the next hint for the player
  static getHint(board: SudokuGrid): Hint | null {
    const candidates = this.getCandidates(board);

    let hint = this.findNakedSingle(board, candidates);
    if (hint) return hint;

    hint = this.findHiddenSingle(board, candidates);
    if (hint) return hint;

    // Fallback if heuristically too hard (force brute single step)
    // We can just find any empty cell and return its true solved value, but flag it as "Brute Force"
    const solved = SudokuSolver.cloneBoard(board);
    if (SudokuSolver.solve(solved)) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] === 0) {
            return {
              row: r,
              col: c,
              value: solved[r][c],
              technique: "Advanced Logic",
              explanation: `Cette grille requiert une logique très avancée (ex: X-Wing). Le chiffre correct est ${solved[r][c]}.`,
              difficultyScore: 5.0,
            };
          }
        }
      }
    }
    return null;
  }
}
