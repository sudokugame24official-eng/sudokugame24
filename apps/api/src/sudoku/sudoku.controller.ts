import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  ParseEnumPipe,
  Req,
} from '@nestjs/common';
import { SudokuService } from './sudoku.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { Difficulty } from '@repo/database';

@Controller('sudoku')
@UseGuards(JwtAuthGuard)
export class SudokuController {
  constructor(private readonly sudokuService: SudokuService) {}

  @Post('start')
  async startSession(
    @Req() req: any,
    @Body('difficulty', new ParseEnumPipe(Difficulty)) difficulty: Difficulty,
  ) {
    return this.sudokuService.startSession(req.user.id, difficulty);
  }

  @Post(':sessionId/submit')
  async submitSession(
    @Req() req: any,
    @Param('sessionId') sessionId: string,
    @Body('finalBoard') finalBoard: number[][],
    @Body('timeSec') timeSec: number,
    @Body('mistakes') mistakes: number,
  ) {
    return this.sudokuService.submitSession(
      req.user.id,
      sessionId,
      finalBoard,
      timeSec,
      mistakes || 0,
    );
  }
}
