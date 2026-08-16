import { DifficultyV2, SudokuPuzzleV2, SudokuValueV2 } from "./types.v2";
import { LogicalSolver } from "./logical-solver.v2";
import { DifficultyEngineV2 } from "./difficulty-engine.v2";
import { RandomV2 } from "./random.v2";
import { SudokuSolver } from "../solver"; // Reuse V1 basic backtracking solver for filling the initial board efficiently

export class GeneratorV2 {
  private static readonly ENGINE_VERSION = "v2";

  /**
   * Deterministically fill an empty board with a valid Sudoku solution.
   */
  private static fillBoardDeterministic(
    board: number[][],
    rng: RandomV2,
  ): boolean {
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

    // Deterministically shuffle 1-9
    const digits = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const num of digits) {
      if (SudokuSolver.isValid(board as any, row, col, num as SudokuValueV2)) {
        board[row][col] = num;
        if (this.fillBoardDeterministic(board, rng)) return true;
        board[row][col] = 0;
      }
    }

    return false;
  }

  /**
   * Generate a puzzle based on seed and desired difficulty.
   */
  public static generate(
    seed: string,
    targetDifficulty: DifficultyV2,
  ): SudokuPuzzleV2 {
    const rng = new RandomV2(
      `${seed}-${targetDifficulty}-${this.ENGINE_VERSION}`,
    );

    // 1. Generate full solved board
    const solvedBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.fillBoardDeterministic(solvedBoard, rng);

    // 2. Clone to create the working board
    const workingBoard = solvedBoard.map((row) => [...row]);

    // 3. Create a list of all 81 positions and shuffle deterministically
    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push({ r, c });
      }
    }
    rng.shuffle(positions);

    let currentDifficulty = DifficultyV2.EASY;
    let currentScore = 0;

    // 4. Digging Phase (remove cells as long as it remains logically solvable)
    for (const pos of positions) {
      const { r, c } = pos;

      if (workingBoard[r][c] === 0) continue;

      const backupVal = workingBoard[r][c];
      workingBoard[r][c] = 0;

      // Check logical solvability
      const result = LogicalSolver.solveLogical(workingBoard);

      if (result.requiresGuessing) {
        // Break uniqueness or requires guessing -> reject this hole
        workingBoard[r][c] = backupVal;
      } else {
        // Valid logical path found!
        const evalDiff = DifficultyEngineV2.evaluateDifficulty(result);

        // If we surpassed the target difficulty by too much, we could revert.
        // But typically, removing cells strictly increases difficulty.
        // For V2 MVP, we just accept the hole if it doesn't break uniqueness.
        // We will stop if we hit the target difficulty and are removing too much.
        currentDifficulty = evalDiff;
        currentScore = result.logicalScore;

        if (
          targetDifficulty === DifficultyV2.EASY &&
          (currentDifficulty === DifficultyV2.MEDIUM ||
            currentDifficulty === DifficultyV2.HARD ||
            currentDifficulty === DifficultyV2.EXPERT)
        ) {
          workingBoard[r][c] = backupVal; // Rollback, it's too hard now
          break;
        }

        if (
          targetDifficulty === DifficultyV2.MEDIUM &&
          (currentDifficulty === DifficultyV2.HARD ||
            currentDifficulty === DifficultyV2.EXPERT)
        ) {
          workingBoard[r][c] = backupVal; // Rollback
          break;
        }

        if (
          targetDifficulty === DifficultyV2.HARD &&
          currentDifficulty === DifficultyV2.EXPERT
        ) {
          workingBoard[r][c] = backupVal; // Rollback
          break;
        }
      }
    }

    // Final evaluation to ensure we return the actual stats of the generated board
    const finalResult = LogicalSolver.solveLogical(workingBoard);
    const finalDiff = DifficultyEngineV2.evaluateDifficulty(finalResult);

    return {
      initialBoard: workingBoard,
      solvedBoard: solvedBoard,
      difficulty: finalDiff,
      logicalScore: finalResult.logicalScore,
      engineVersion: "v2",
      seed,
    };
  }
}
