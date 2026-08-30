import { Controller, Post, Body, UseGuards, Param, Req } from '@nestjs/common';
import { SudokuService } from './sudoku.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { Difficulty } from '@repo/database';
import { StartSessionDto, SubmitSessionDto } from './dto/sudoku.dto';

@Controller('sudoku')
@UseGuards(JwtAuthGuard)
export class SudokuController {
  constructor(private readonly sudokuService: SudokuService) {}

  @Post('start')
  async startSession(@Req() req: any, @Body() dto: StartSessionDto) {
    return this.sudokuService.startSession(req.user.id, dto.difficulty);
  }

  @Post(':sessionId/submit')
  async submitSession(
    @Req() req: any,
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitSessionDto,
  ) {
    return this.sudokuService.submitSession(
      req.user.id,
      sessionId,
      dto.finalBoard,
      dto.timeSec,
      dto.mistakes || 0,
    );
  }
}
