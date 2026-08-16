import {
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDefined,
} from 'class-validator';
import { IsValidSudokuBoard } from '../../common/dto/sudoku-board.validator';

export enum DifficultyEnum {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
  MASTER = 'MASTER',
}

export class StartSessionDto {
  @IsEnum(DifficultyEnum)
  difficulty!: DifficultyEnum;
}

export class SubmitSessionDto {
  @IsDefined()
  @IsValidSudokuBoard()
  finalBoard!: number[][];

  @IsInt()
  @Min(0)
  @Max(86400) // one day max; server also enforces real elapsed time
  timeSec!: number;

  @IsInt()
  @Min(0)
  @Max(1000)
  mistakes!: number;
}
