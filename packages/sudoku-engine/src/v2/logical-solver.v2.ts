import {
  GridV2,
  CellV2,
  SudokuValueV2,
  LogicalStep,
  TechniqueName,
  SolverResultV2,
  CandidateRemoval,
} from "./types.v2";

export class LogicalSolver {
  private static readonly WEIGHTS: Record<TechniqueName, number> = {
    [TechniqueName.NAKED_SINGLE]: 1,
    [TechniqueName.HIDDEN_SINGLE]: 2,
    [TechniqueName.NAKED_PAIR]: 10,
    [TechniqueName.HIDDEN_PAIR]: 12,
    [TechniqueName.POINTING_PAIR_TRIPLE]: 15,
    [TechniqueName.BOX_LINE_REDUCTION]: 15,
    [TechniqueName.NAKED_TRIPLE]: 20,
    [TechniqueName.HIDDEN_TRIPLE]: 25,
    [TechniqueName.X_WING]: 50,
    [TechniqueName.XY_WING]: 60,
    [TechniqueName.SWORDFISH]: 80,
    [TechniqueName.GUESSING]: 10000,
  };

  /**
   * Initialize a V2 grid from a number[][] (0 = empty)
   */
  public static initGrid(board: number[][]): GridV2 {
    const grid: GridV2 = [];
    for (let r = 0; r < 9; r++) {
      const row: CellV2[] = [];
      for (let c = 0; c < 9; c++) {
        const value = board[r][c] as SudokuValueV2 | 0;
        row.push({
          row: r,
          col: c,
          value,
          candidates: new Set(
            value === 0 ? ([1, 2, 3, 4, 5, 6, 7, 8, 9] as SudokuValueV2[]) : [],
          ),
          initial: value !== 0,
        });
      }
      grid.push(row);
    }
    this.refreshAllCandidates(grid);
    return grid;
  }

  /**
   * Clone a V2 grid (useful for speculative backtracking if logical fails)
   */
  public static cloneGrid(grid: GridV2): GridV2 {
    return grid.map((r) =>
      r.map((c) => ({
        ...c,
        candidates: new Set(c.candidates),
      })),
    );
  }

  /**
   * Convert V2 grid to simple number[][]
   */
  public static toNumberGrid(grid: GridV2): number[][] {
    return grid.map((r) => r.map((c) => c.value));
  }

  /**
   * Calculate all candidates across the board by applying basic Sudoku rules
   */
  public static refreshAllCandidates(grid: GridV2) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value !== 0) {
          this.removeCandidateFromPeers(
            grid,
            r,
            c,
            grid[r][c].value as SudokuValueV2,
          );
        }
      }
    }
  }

  /**
   * Remove a value from candidates of all peers of (row, col)
   */
  private static removeCandidateFromPeers(
    grid: GridV2,
    row: number,
    col: number,
    value: SudokuValueV2,
  ): { r: number; c: number }[] {
    const removedFrom: { r: number; c: number }[] = [];

    // Remove from row and col
    for (let i = 0; i < 9; i++) {
      if (grid[row][i].candidates.has(value)) {
        grid[row][i].candidates.delete(value);
        removedFrom.push({ r: row, c: i });
      }
      if (grid[i][col].candidates.has(value)) {
        grid[i][col].candidates.delete(value);
        removedFrom.push({ r: i, c: col });
      }
    }

    // Remove from 3x3 box
    const startR = Math.floor(row / 3) * 3;
    const startC = Math.floor(col / 3) * 3;
    for (let r = startR; r < startR + 3; r++) {
      for (let c = startC; c < startC + 3; c++) {
        if (grid[r][c].candidates.has(value)) {
          grid[r][c].candidates.delete(value);
          removedFrom.push({ r, c });
        }
      }
    }

    return removedFrom;
  }

  /**
   * Check if the grid is completely filled and valid
   */
  public static isSolved(grid: GridV2): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value === 0) return false;
      }
    }
    return true;
  }

  /**
   * Core logical solver loop
   */
  public static solveLogical(initialBoard: number[][]): SolverResultV2 {
    const grid = this.initGrid(initialBoard);
    const steps: LogicalStep[] = [];
    let progress = true;

    while (progress && !this.isSolved(grid)) {
      progress = false;

      // 1. NAKED SINGLE
      const nakedSingleStep = this.findNakedSingle(grid);
      if (nakedSingleStep) {
        steps.push(nakedSingleStep);
        progress = true;
        continue;
      }

      // 2. HIDDEN SINGLE
      const hiddenSingleStep = this.findHiddenSingle(grid);
      if (hiddenSingleStep) {
        steps.push(hiddenSingleStep);
        progress = true;
        continue;
      }

      // 3. NAKED PAIR
      const nakedPairStep = this.findNakedPair(grid);
      if (nakedPairStep) {
        steps.push(nakedPairStep);
        progress = true;
        continue;
      }

      // 4. HIDDEN PAIR
      const hiddenPairStep = this.findHiddenPair(grid);
      if (hiddenPairStep) {
        steps.push(hiddenPairStep);
        progress = true;
        continue;
      }

      // 5. POINTING PAIR/TRIPLE
      const pointingStep = this.findPointingPairTriple(grid);
      if (pointingStep) {
        steps.push(pointingStep);
        progress = true;
        continue;
      }

      // 6. BOX-LINE REDUCTION
      const boxLineStep = this.findBoxLineReduction(grid);
      if (boxLineStep) {
        steps.push(boxLineStep);
        progress = true;
        continue;
      }

      // 7. X-WING
      const xWingStep = this.findXWing(grid);
      if (xWingStep) {
        steps.push(xWingStep);
        progress = true;
        continue;
      }

      // 8. XY-WING
      const xyWingStep = this.findXYWing(grid);
      if (xyWingStep) {
        steps.push(xyWingStep);
        progress = true;
        continue;
      }

      // 9. SWORDFISH
      const swordfishStep = this.findSwordfish(grid);
      if (swordfishStep) {
        steps.push(swordfishStep);
        progress = true;
        continue;
      }

      // TODO: Add Advanced techniques here
    }

    const solved = this.isSolved(grid);
    let maxWeight = 0;
    let maxTechnique = TechniqueName.NAKED_SINGLE;
    let logicalScore = 0;

    for (const step of steps) {
      logicalScore += step.difficultyWeight;
      if (step.difficultyWeight > maxWeight) {
        maxWeight = step.difficultyWeight;
        maxTechnique = step.technique;
      }
    }

    if (!solved) {
      maxTechnique = TechniqueName.GUESSING;
      logicalScore += this.WEIGHTS[TechniqueName.GUESSING];
    }

    return {
      solved,
      grid,
      steps,
      logicalScore,
      maxTechnique,
      requiresGuessing: !solved,
    };
  }

  // --- TECHNIQUES ---

  /**
   * Basic: Naked Single - A cell has only one possible candidate.
   */
  private static findNakedSingle(grid: GridV2): LogicalStep | null {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = grid[r][c];
        if (cell.value === 0 && cell.candidates.size === 1) {
          const value = Array.from(cell.candidates)[0] as SudokuValueV2;

          // Apply changes
          cell.value = value;
          cell.candidates.clear();
          this.removeCandidateFromPeers(grid, r, c, value);

          return {
            technique: TechniqueName.NAKED_SINGLE,
            difficultyWeight: this.WEIGHTS[TechniqueName.NAKED_SINGLE],
            cellsInvolved: [{ row: r, col: c }],
            candidatesRemoved: [],
            valuesPlaced: [{ row: r, col: c, value }],
          };
        }
      }
    }
    return null;
  }

  /**
   * Basic: Hidden Single - A candidate appears only once in a row, col, or box.
   */
  private static findHiddenSingle(grid: GridV2): LogicalStep | null {
    // Check Rows
    for (let r = 0; r < 9; r++) {
      for (let val = 1; val <= 9; val++) {
        let possibleCols: number[] = [];
        for (let c = 0; c < 9; c++) {
          if (
            grid[r][c].value === 0 &&
            grid[r][c].candidates.has(val as SudokuValueV2)
          ) {
            possibleCols.push(c);
          }
        }
        if (possibleCols.length === 1) {
          return this.applyHiddenSingle(
            grid,
            r,
            possibleCols[0],
            val as SudokuValueV2,
          );
        }
      }
    }

    // Check Cols
    for (let c = 0; c < 9; c++) {
      for (let val = 1; val <= 9; val++) {
        let possibleRows: number[] = [];
        for (let r = 0; r < 9; r++) {
          if (
            grid[r][c].value === 0 &&
            grid[r][c].candidates.has(val as SudokuValueV2)
          ) {
            possibleRows.push(r);
          }
        }
        if (possibleRows.length === 1) {
          return this.applyHiddenSingle(
            grid,
            possibleRows[0],
            c,
            val as SudokuValueV2,
          );
        }
      }
    }

    // Check Boxes
    for (let boxR = 0; boxR < 3; boxR++) {
      for (let boxC = 0; boxC < 3; boxC++) {
        for (let val = 1; val <= 9; val++) {
          let possibleCells: { r: number; c: number }[] = [];
          for (let r = boxR * 3; r < boxR * 3 + 3; r++) {
            for (let c = boxC * 3; c < boxC * 3 + 3; c++) {
              if (
                grid[r][c].value === 0 &&
                grid[r][c].candidates.has(val as SudokuValueV2)
              ) {
                possibleCells.push({ r, c });
              }
            }
          }
          if (possibleCells.length === 1) {
            return this.applyHiddenSingle(
              grid,
              possibleCells[0].r,
              possibleCells[0].c,
              val as SudokuValueV2,
            );
          }
        }
      }
    }

    return null;
  }

  private static applyHiddenSingle(
    grid: GridV2,
    r: number,
    c: number,
    value: SudokuValueV2,
  ): LogicalStep {
    const cell = grid[r][c];
    cell.value = value;
    cell.candidates.clear();
    this.removeCandidateFromPeers(grid, r, c, value);

    return {
      technique: TechniqueName.HIDDEN_SINGLE,
      difficultyWeight: this.WEIGHTS[TechniqueName.HIDDEN_SINGLE],
      cellsInvolved: [{ row: r, col: c }],
      candidatesRemoved: [],
      valuesPlaced: [{ row: r, col: c, value }],
    };
  }

  /**
   * Intermediate: Naked Pair
   * If two cells in a group (row, col, box) have exactly the same 2 candidates,
   * remove these 2 candidates from all other cells in the group.
   */
  private static findNakedPair(grid: GridV2): LogicalStep | null {
    // We can abstract checking a "group" of 9 cells
    // Generate groups
    const groups: { r: number; c: number }[][] = [];
    for (let i = 0; i < 9; i++) {
      const rowGroup = [];
      const colGroup = [];
      for (let j = 0; j < 9; j++) {
        rowGroup.push({ r: i, c: j });
        colGroup.push({ r: j, c: i });
      }
      groups.push(rowGroup);
      groups.push(colGroup);
    }
    for (let boxR = 0; boxR < 3; boxR++) {
      for (let boxC = 0; boxC < 3; boxC++) {
        const boxGroup = [];
        for (let r = boxR * 3; r < boxR * 3 + 3; r++) {
          for (let c = boxC * 3; c < boxC * 3 + 3; c++) {
            boxGroup.push({ r, c });
          }
        }
        groups.push(boxGroup);
      }
    }

    for (const group of groups) {
      // Find cells with exactly 2 candidates
      const biCells = group.filter(
        ({ r, c }) =>
          grid[r][c].value === 0 && grid[r][c].candidates.size === 2,
      );

      for (let i = 0; i < biCells.length; i++) {
        for (let j = i + 1; j < biCells.length; j++) {
          const cell1 = grid[biCells[i].r][biCells[i].c];
          const cell2 = grid[biCells[j].r][biCells[j].c];

          const c1Array = Array.from(cell1.candidates);
          const c2Array = Array.from(cell2.candidates);

          if (c1Array[0] === c2Array[0] && c1Array[1] === c2Array[1]) {
            // Naked Pair found! Now remove these candidates from other cells in the group
            const removed: CandidateRemoval[] = [];

            for (const { r, c } of group) {
              if (
                (r === biCells[i].r && c === biCells[i].c) ||
                (r === biCells[j].r && c === biCells[j].c)
              )
                continue;

              const targetCell = grid[r][c];
              if (targetCell.value === 0) {
                if (targetCell.candidates.has(c1Array[0])) {
                  targetCell.candidates.delete(c1Array[0]);
                  removed.push({ row: r, col: c, value: c1Array[0] });
                }
                if (targetCell.candidates.has(c1Array[1])) {
                  targetCell.candidates.delete(c1Array[1]);
                  removed.push({ row: r, col: c, value: c1Array[1] });
                }
              }
            }

            if (removed.length > 0) {
              return {
                technique: TechniqueName.NAKED_PAIR,
                difficultyWeight: this.WEIGHTS[TechniqueName.NAKED_PAIR],
                cellsInvolved: [
                  { row: biCells[i].r, col: biCells[i].c },
                  { row: biCells[j].r, col: biCells[j].c },
                ],
                candidatesRemoved: removed,
                valuesPlaced: [],
              };
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Intermediate: Hidden Pair
   * If two candidates appear in exactly the same 2 cells in a group,
   * remove all other candidates from those 2 cells.
   */
  private static findHiddenPair(grid: GridV2): LogicalStep | null {
    // Generate same groups as Naked Pair
    const groups: { r: number; c: number }[][] = [];
    for (let i = 0; i < 9; i++) {
      const rowGroup = [];
      const colGroup = [];
      for (let j = 0; j < 9; j++) {
        rowGroup.push({ r: i, c: j });
        colGroup.push({ r: j, c: i });
      }
      groups.push(rowGroup);
      groups.push(colGroup);
    }
    for (let boxR = 0; boxR < 3; boxR++) {
      for (let boxC = 0; boxC < 3; boxC++) {
        const boxGroup = [];
        for (let r = boxR * 3; r < boxR * 3 + 3; r++) {
          for (let c = boxC * 3; c < boxC * 3 + 3; c++) {
            boxGroup.push({ r, c });
          }
        }
        groups.push(boxGroup);
      }
    }

    for (const group of groups) {
      // Find cells containing each candidate 1-9
      const candidateCells: Map<SudokuValueV2, { r: number; c: number }[]> =
        new Map();
      for (let val = 1; val <= 9; val++) {
        const cellsForVal = group.filter(
          ({ r, c }) =>
            grid[r][c].value === 0 &&
            grid[r][c].candidates.has(val as SudokuValueV2),
        );
        if (cellsForVal.length === 2) {
          candidateCells.set(val as SudokuValueV2, cellsForVal);
        }
      }

      // Check all pairs of candidates that appear in exactly 2 cells
      const candidates = Array.from(candidateCells.keys());
      for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          const val1 = candidates[i];
          const val2 = candidates[j];
          const cells1 = candidateCells.get(val1)!;
          const cells2 = candidateCells.get(val2)!;

          // Check if they are the exact same 2 cells
          if (
            (cells1[0].r === cells2[0].r &&
              cells1[0].c === cells2[0].c &&
              cells1[1].r === cells2[1].r &&
              cells1[1].c === cells2[1].c) ||
            (cells1[0].r === cells2[1].r &&
              cells1[0].c === cells2[1].c &&
              cells1[1].r === cells2[0].r &&
              cells1[1].c === cells2[0].c)
          ) {
            // Hidden Pair found! Remove all OTHER candidates from these 2 cells
            const removed: CandidateRemoval[] = [];
            for (const { r, c } of cells1) {
              const cell = grid[r][c];
              for (const cand of Array.from(cell.candidates)) {
                if (cand !== val1 && cand !== val2) {
                  cell.candidates.delete(cand);
                  removed.push({ row: r, col: c, value: cand });
                }
              }
            }

            if (removed.length > 0) {
              return {
                technique: TechniqueName.HIDDEN_PAIR,
                difficultyWeight: this.WEIGHTS[TechniqueName.HIDDEN_PAIR],
                cellsInvolved: cells1.map(({ r, c }) => ({ row: r, col: c })),
                candidatesRemoved: removed,
                valuesPlaced: [],
              };
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Intermediate: Pointing Pair / Triple
   * If a candidate in a 3x3 box is restricted to a single row or col,
   * remove it from the rest of that row or col outside the box.
   */
  private static findPointingPairTriple(grid: GridV2): LogicalStep | null {
    for (let boxR = 0; boxR < 3; boxR++) {
      for (let boxC = 0; boxC < 3; boxC++) {
        for (let val = 1; val <= 9; val++) {
          const cellsWithVal: { r: number; c: number }[] = [];
          for (let r = boxR * 3; r < boxR * 3 + 3; r++) {
            for (let c = boxC * 3; c < boxC * 3 + 3; c++) {
              if (
                grid[r][c].value === 0 &&
                grid[r][c].candidates.has(val as SudokuValueV2)
              ) {
                cellsWithVal.push({ r, c });
              }
            }
          }

          if (cellsWithVal.length === 2 || cellsWithVal.length === 3) {
            // Check if all in same row
            const sameRow = cellsWithVal.every(
              (cell) => cell.r === cellsWithVal[0].r,
            );
            if (sameRow) {
              const r = cellsWithVal[0].r;
              const removed: CandidateRemoval[] = [];
              for (let c = 0; c < 9; c++) {
                // If in same row but outside this box
                if (Math.floor(c / 3) !== boxC) {
                  if (
                    grid[r][c].value === 0 &&
                    grid[r][c].candidates.has(val as SudokuValueV2)
                  ) {
                    grid[r][c].candidates.delete(val as SudokuValueV2);
                    removed.push({
                      row: r,
                      col: c,
                      value: val as SudokuValueV2,
                    });
                  }
                }
              }
              if (removed.length > 0) {
                return {
                  technique: TechniqueName.POINTING_PAIR_TRIPLE,
                  difficultyWeight:
                    this.WEIGHTS[TechniqueName.POINTING_PAIR_TRIPLE],
                  cellsInvolved: cellsWithVal.map(({ r, c }) => ({
                    row: r,
                    col: c,
                  })),
                  candidatesRemoved: removed,
                  valuesPlaced: [],
                };
              }
            }

            // Check if all in same col
            const sameCol = cellsWithVal.every(
              (cell) => cell.c === cellsWithVal[0].c,
            );
            if (sameCol) {
              const c = cellsWithVal[0].c;
              const removed: CandidateRemoval[] = [];
              for (let r = 0; r < 9; r++) {
                // If in same col but outside this box
                if (Math.floor(r / 3) !== boxR) {
                  if (
                    grid[r][c].value === 0 &&
                    grid[r][c].candidates.has(val as SudokuValueV2)
                  ) {
                    grid[r][c].candidates.delete(val as SudokuValueV2);
                    removed.push({
                      row: r,
                      col: c,
                      value: val as SudokuValueV2,
                    });
                  }
                }
              }
              if (removed.length > 0) {
                return {
                  technique: TechniqueName.POINTING_PAIR_TRIPLE,
                  difficultyWeight:
                    this.WEIGHTS[TechniqueName.POINTING_PAIR_TRIPLE],
                  cellsInvolved: cellsWithVal.map(({ r, c }) => ({
                    row: r,
                    col: c,
                  })),
                  candidatesRemoved: removed,
                  valuesPlaced: [],
                };
              }
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Intermediate: Box-Line Reduction
   * If a candidate in a row/col is restricted to a single 3x3 box,
   * remove it from the rest of that box.
   */
  private static findBoxLineReduction(grid: GridV2): LogicalStep | null {
    // Check rows
    for (let r = 0; r < 9; r++) {
      for (let val = 1; val <= 9; val++) {
        const cellsWithVal: { r: number; c: number }[] = [];
        for (let c = 0; c < 9; c++) {
          if (
            grid[r][c].value === 0 &&
            grid[r][c].candidates.has(val as SudokuValueV2)
          ) {
            cellsWithVal.push({ r, c });
          }
        }

        if (cellsWithVal.length >= 2 && cellsWithVal.length <= 3) {
          const sameBox = cellsWithVal.every(
            (cell) =>
              Math.floor(cell.c / 3) === Math.floor(cellsWithVal[0].c / 3),
          );
          if (sameBox) {
            const boxC = Math.floor(cellsWithVal[0].c / 3);
            const boxR = Math.floor(r / 3);
            const removed: CandidateRemoval[] = [];

            for (let br = boxR * 3; br < boxR * 3 + 3; br++) {
              for (let bc = boxC * 3; bc < boxC * 3 + 3; bc++) {
                if (br !== r) {
                  if (
                    grid[br][bc].value === 0 &&
                    grid[br][bc].candidates.has(val as SudokuValueV2)
                  ) {
                    grid[br][bc].candidates.delete(val as SudokuValueV2);
                    removed.push({
                      row: br,
                      col: bc,
                      value: val as SudokuValueV2,
                    });
                  }
                }
              }
            }
            if (removed.length > 0) {
              return {
                technique: TechniqueName.BOX_LINE_REDUCTION,
                difficultyWeight:
                  this.WEIGHTS[TechniqueName.BOX_LINE_REDUCTION],
                cellsInvolved: cellsWithVal.map(({ r, c }) => ({
                  row: r,
                  col: c,
                })),
                candidatesRemoved: removed,
                valuesPlaced: [],
              };
            }
          }
        }
      }
    }

    // Check cols
    for (let c = 0; c < 9; c++) {
      for (let val = 1; val <= 9; val++) {
        const cellsWithVal: { r: number; c: number }[] = [];
        for (let r = 0; r < 9; r++) {
          if (
            grid[r][c].value === 0 &&
            grid[r][c].candidates.has(val as SudokuValueV2)
          ) {
            cellsWithVal.push({ r, c });
          }
        }

        if (cellsWithVal.length >= 2 && cellsWithVal.length <= 3) {
          const sameBox = cellsWithVal.every(
            (cell) =>
              Math.floor(cell.r / 3) === Math.floor(cellsWithVal[0].r / 3),
          );
          if (sameBox) {
            const boxR = Math.floor(cellsWithVal[0].r / 3);
            const boxC = Math.floor(c / 3);
            const removed: CandidateRemoval[] = [];

            for (let br = boxR * 3; br < boxR * 3 + 3; br++) {
              for (let bc = boxC * 3; bc < boxC * 3 + 3; bc++) {
                if (bc !== c) {
                  if (
                    grid[br][bc].value === 0 &&
                    grid[br][bc].candidates.has(val as SudokuValueV2)
                  ) {
                    grid[br][bc].candidates.delete(val as SudokuValueV2);
                    removed.push({
                      row: br,
                      col: bc,
                      value: val as SudokuValueV2,
                    });
                  }
                }
              }
            }
            if (removed.length > 0) {
              return {
                technique: TechniqueName.BOX_LINE_REDUCTION,
                difficultyWeight:
                  this.WEIGHTS[TechniqueName.BOX_LINE_REDUCTION],
                cellsInvolved: cellsWithVal.map(({ r, c }) => ({
                  row: r,
                  col: c,
                })),
                candidatesRemoved: removed,
                valuesPlaced: [],
              };
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Advanced: X-Wing
   * Check rows for X-Wing, then check cols for X-Wing.
   */
  private static findXWing(grid: GridV2): LogicalStep | null {
    // 1. Check Rows for X-Wing (removes candidates from columns)
    for (let val = 1; val <= 9; val++) {
      // Find rows where `val` appears in exactly 2 columns
      const rowsWithVal: { r: number; cols: number[] }[] = [];
      for (let r = 0; r < 9; r++) {
        const cols = [];
        for (let c = 0; c < 9; c++) {
          if (
            grid[r][c].value === 0 &&
            grid[r][c].candidates.has(val as SudokuValueV2)
          ) {
            cols.push(c);
          }
        }
        if (cols.length === 2) {
          rowsWithVal.push({ r, cols });
        }
      }

      // Find pairs of rows with the exact same two columns
      for (let i = 0; i < rowsWithVal.length; i++) {
        for (let j = i + 1; j < rowsWithVal.length; j++) {
          const row1 = rowsWithVal[i];
          const row2 = rowsWithVal[j];

          if (row1.cols[0] === row2.cols[0] && row1.cols[1] === row2.cols[1]) {
            // X-Wing found! Remove `val` from cols[0] and cols[1] in all OTHER rows
            const c1 = row1.cols[0];
            const c2 = row1.cols[1];
            const removed: CandidateRemoval[] = [];

            for (let r = 0; r < 9; r++) {
              if (r !== row1.r && r !== row2.r) {
                if (
                  grid[r][c1].value === 0 &&
                  grid[r][c1].candidates.has(val as SudokuValueV2)
                ) {
                  grid[r][c1].candidates.delete(val as SudokuValueV2);
                  removed.push({
                    row: r,
                    col: c1,
                    value: val as SudokuValueV2,
                  });
                }
                if (
                  grid[r][c2].value === 0 &&
                  grid[r][c2].candidates.has(val as SudokuValueV2)
                ) {
                  grid[r][c2].candidates.delete(val as SudokuValueV2);
                  removed.push({
                    row: r,
                    col: c2,
                    value: val as SudokuValueV2,
                  });
                }
              }
            }

            if (removed.length > 0) {
              return {
                technique: TechniqueName.X_WING,
                difficultyWeight: this.WEIGHTS[TechniqueName.X_WING],
                cellsInvolved: [
                  { row: row1.r, col: c1 },
                  { row: row1.r, col: c2 },
                  { row: row2.r, col: c1 },
                  { row: row2.r, col: c2 },
                ],
                candidatesRemoved: removed,
                valuesPlaced: [],
              };
            }
          }
        }
      }

      // 2. Check Cols for X-Wing (removes candidates from rows)
      const colsWithVal: { c: number; rows: number[] }[] = [];
      for (let c = 0; c < 9; c++) {
        const rows = [];
        for (let r = 0; r < 9; r++) {
          if (
            grid[r][c].value === 0 &&
            grid[r][c].candidates.has(val as SudokuValueV2)
          ) {
            rows.push(r);
          }
        }
        if (rows.length === 2) {
          colsWithVal.push({ c, rows });
        }
      }

      for (let i = 0; i < colsWithVal.length; i++) {
        for (let j = i + 1; j < colsWithVal.length; j++) {
          const col1 = colsWithVal[i];
          const col2 = colsWithVal[j];

          if (col1.rows[0] === col2.rows[0] && col1.rows[1] === col2.rows[1]) {
            // X-Wing found! Remove `val` from rows[0] and rows[1] in all OTHER cols
            const r1 = col1.rows[0];
            const r2 = col1.rows[1];
            const removed: CandidateRemoval[] = [];

            for (let c = 0; c < 9; c++) {
              if (c !== col1.c && c !== col2.c) {
                if (
                  grid[r1][c].value === 0 &&
                  grid[r1][c].candidates.has(val as SudokuValueV2)
                ) {
                  grid[r1][c].candidates.delete(val as SudokuValueV2);
                  removed.push({
                    row: r1,
                    col: c,
                    value: val as SudokuValueV2,
                  });
                }
                if (
                  grid[r2][c].value === 0 &&
                  grid[r2][c].candidates.has(val as SudokuValueV2)
                ) {
                  grid[r2][c].candidates.delete(val as SudokuValueV2);
                  removed.push({
                    row: r2,
                    col: c,
                    value: val as SudokuValueV2,
                  });
                }
              }
            }

            if (removed.length > 0) {
              return {
                technique: TechniqueName.X_WING,
                difficultyWeight: this.WEIGHTS[TechniqueName.X_WING],
                cellsInvolved: [
                  { row: r1, col: col1.c },
                  { row: r1, col: col2.c },
                  { row: r2, col: col1.c },
                  { row: r2, col: col2.c },
                ],
                candidatesRemoved: removed,
                valuesPlaced: [],
              };
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Helper: Check if cell A sees cell B
   */
  private static sees(r1: number, c1: number, r2: number, c2: number): boolean {
    if (r1 === r2 && c1 === c2) return false;
    return (
      r1 === r2 ||
      c1 === c2 ||
      (Math.floor(r1 / 3) === Math.floor(r2 / 3) &&
        Math.floor(c1 / 3) === Math.floor(c2 / 3))
    );
  }

  /**
   * Advanced: XY-Wing
   */
  public static findXYWing(grid: GridV2): LogicalStep | null {
    const biCells: { r: number; c: number; cands: SudokuValueV2[] }[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value === 0 && grid[r][c].candidates.size === 2) {
          biCells.push({
            r,
            c,
            cands: Array.from(grid[r][c].candidates) as SudokuValueV2[],
          });
        }
      }
    }

    for (const pivot of biCells) {
      const [X, Y] = pivot.cands;
      const potentialPincers = biCells.filter((cell) =>
        this.sees(pivot.r, pivot.c, cell.r, cell.c),
      );
      const xPincers = potentialPincers.filter(
        (p) => p.cands.includes(X) && !p.cands.includes(Y),
      );
      const yPincers = potentialPincers.filter(
        (p) => p.cands.includes(Y) && !p.cands.includes(X),
      );

      for (const px of xPincers) {
        const Z = px.cands[0] === X ? px.cands[1] : px.cands[0];
        for (const py of yPincers) {
          if (py.cands.includes(Z)) {
            const removed: CandidateRemoval[] = [];
            for (let r = 0; r < 9; r++) {
              for (let c = 0; c < 9; c++) {
                if (grid[r][c].value === 0 && grid[r][c].candidates.has(Z)) {
                  if (
                    (r === pivot.r && c === pivot.c) ||
                    (r === px.r && c === px.c) ||
                    (r === py.r && c === py.c)
                  )
                    continue;
                  if (
                    this.sees(r, c, px.r, px.c) &&
                    this.sees(r, c, py.r, py.c)
                  ) {
                    grid[r][c].candidates.delete(Z);
                    removed.push({ row: r, col: c, value: Z });
                  }
                }
              }
            }

            if (removed.length > 0) {
              return {
                technique: TechniqueName.XY_WING,
                difficultyWeight: this.WEIGHTS[TechniqueName.XY_WING],
                cellsInvolved: [
                  { row: pivot.r, col: pivot.c },
                  { row: px.r, col: px.c },
                  { row: py.r, col: py.c },
                ],
                candidatesRemoved: removed,
                valuesPlaced: [],
              };
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Advanced: Swordfish
   */
  public static findSwordfish(grid: GridV2): LogicalStep | null {
    for (let val = 1; val <= 9; val++) {
      const rowsWithVal: { r: number; cols: number[] }[] = [];
      for (let r = 0; r < 9; r++) {
        const cols = [];
        for (let c = 0; c < 9; c++) {
          if (
            grid[r][c].value === 0 &&
            grid[r][c].candidates.has(val as SudokuValueV2)
          ) {
            cols.push(c);
          }
        }
        if (cols.length >= 2 && cols.length <= 3) {
          rowsWithVal.push({ r, cols });
        }
      }

      for (let i = 0; i < rowsWithVal.length; i++) {
        for (let j = i + 1; j < rowsWithVal.length; j++) {
          for (let k = j + 1; k < rowsWithVal.length; k++) {
            const row1 = rowsWithVal[i];
            const row2 = rowsWithVal[j];
            const row3 = rowsWithVal[k];
            const unionCols = new Set([
              ...row1.cols,
              ...row2.cols,
              ...row3.cols,
            ]);

            if (unionCols.size === 3) {
              const colsArray = Array.from(unionCols);
              const removed: CandidateRemoval[] = [];
              for (let r = 0; r < 9; r++) {
                if (r !== row1.r && r !== row2.r && r !== row3.r) {
                  for (const c of colsArray) {
                    if (
                      grid[r][c].value === 0 &&
                      grid[r][c].candidates.has(val as SudokuValueV2)
                    ) {
                      grid[r][c].candidates.delete(val as SudokuValueV2);
                      removed.push({
                        row: r,
                        col: c,
                        value: val as SudokuValueV2,
                      });
                    }
                  }
                }
              }

              if (removed.length > 0) {
                return {
                  technique: TechniqueName.SWORDFISH,
                  difficultyWeight: this.WEIGHTS[TechniqueName.SWORDFISH],
                  cellsInvolved: [
                    ...row1.cols.map((c) => ({ row: row1.r, col: c })),
                    ...row2.cols.map((c) => ({ row: row2.r, col: c })),
                    ...row3.cols.map((c) => ({ row: row3.r, col: c })),
                  ],
                  candidatesRemoved: removed,
                  valuesPlaced: [],
                };
              }
            }
          }
        }
      }

      const colsWithVal: { c: number; rows: number[] }[] = [];
      for (let c = 0; c < 9; c++) {
        const rows = [];
        for (let r = 0; r < 9; r++) {
          if (
            grid[r][c].value === 0 &&
            grid[r][c].candidates.has(val as SudokuValueV2)
          ) {
            rows.push(r);
          }
        }
        if (rows.length >= 2 && rows.length <= 3) {
          colsWithVal.push({ c, rows });
        }
      }

      for (let i = 0; i < colsWithVal.length; i++) {
        for (let j = i + 1; j < colsWithVal.length; j++) {
          for (let k = j + 1; k < colsWithVal.length; k++) {
            const col1 = colsWithVal[i];
            const col2 = colsWithVal[j];
            const col3 = colsWithVal[k];
            const unionRows = new Set([
              ...col1.rows,
              ...col2.rows,
              ...col3.rows,
            ]);

            if (unionRows.size === 3) {
              const rowsArray = Array.from(unionRows);
              const removed: CandidateRemoval[] = [];
              for (let c = 0; c < 9; c++) {
                if (c !== col1.c && c !== col2.c && c !== col3.c) {
                  for (const r of rowsArray) {
                    if (
                      grid[r][c].value === 0 &&
                      grid[r][c].candidates.has(val as SudokuValueV2)
                    ) {
                      grid[r][c].candidates.delete(val as SudokuValueV2);
                      removed.push({
                        row: r,
                        col: c,
                        value: val as SudokuValueV2,
                      });
                    }
                  }
                }
              }

              if (removed.length > 0) {
                return {
                  technique: TechniqueName.SWORDFISH,
                  difficultyWeight: this.WEIGHTS[TechniqueName.SWORDFISH],
                  cellsInvolved: [
                    ...col1.rows.map((r) => ({ row: r, col: col1.c })),
                    ...col2.rows.map((r) => ({ row: r, col: col2.c })),
                    ...col3.rows.map((r) => ({ row: r, col: col3.c })),
                  ],
                  candidatesRemoved: removed,
                  valuesPlaced: [],
                };
              }
            }
          }
        }
      }
    }
    return null;
  }
}
