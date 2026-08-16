import { IsInt, Min, Max, IsDefined } from 'class-validator';
import { IsValidSudokuBoard } from '../../common/dto/sudoku-board.validator';

export class SubmitChallengeDto {
  @IsDefined()
  @IsValidSudokuBoard()
  finalBoard!: number[][];

  @IsInt()
  @Min(0)
  @Max(86400)
  timeSec!: number;
}
