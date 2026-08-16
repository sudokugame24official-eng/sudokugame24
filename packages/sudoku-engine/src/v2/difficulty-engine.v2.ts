import { DifficultyV2, TechniqueName, SolverResultV2 } from "./types.v2";

export class DifficultyEngineV2 {
  /**
   * Determine the difficulty of a puzzle based on its logical resolution trace.
   */
  public static evaluateDifficulty(result: SolverResultV2): DifficultyV2 {
    if (result.requiresGuessing) {
      // If it requires guessing, we classify it as EXPERT by default,
      // but ideally our generator will reject it anyway.
      return DifficultyV2.EXPERT;
    }

    const { maxTechnique, logicalScore, steps } = result;

    const basicTechniques = [
      TechniqueName.NAKED_SINGLE,
      TechniqueName.HIDDEN_SINGLE,
    ];
    const intermediateTechniques = [
      TechniqueName.NAKED_PAIR,
      TechniqueName.HIDDEN_PAIR,
      TechniqueName.POINTING_PAIR_TRIPLE,
      TechniqueName.BOX_LINE_REDUCTION,
      TechniqueName.NAKED_TRIPLE,
      TechniqueName.HIDDEN_TRIPLE,
    ];
    const advancedTechniques = [
      TechniqueName.X_WING,
      TechniqueName.XY_WING,
      TechniqueName.SWORDFISH,
    ];

    if (advancedTechniques.includes(maxTechnique)) {
      if (logicalScore > 1000 || steps.length > 65) {
        return DifficultyV2.EXPERT;
      }
      return DifficultyV2.HARD;
    }

    if (intermediateTechniques.includes(maxTechnique)) {
      if (logicalScore > 400) {
        return DifficultyV2.HARD;
      }
      return DifficultyV2.MEDIUM;
    }

    if (basicTechniques.includes(maxTechnique)) {
      if (logicalScore > 200) {
        return DifficultyV2.MEDIUM;
      }
      return DifficultyV2.EASY;
    }

    return DifficultyV2.EASY;
  }
}
