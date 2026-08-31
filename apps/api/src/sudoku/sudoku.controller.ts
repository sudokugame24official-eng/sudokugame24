import { Controller, Post, Body, UseGuards, Param, Req } from '@nestjs/common';
import { SudokuService } from './sudoku.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

import { Difficulty } from '@repo/database';
import { StartSessionDto, SubmitSessionDto } from './dto/sudoku.dto';

@Controller('sudoku')
export class SudokuController {
  constructor(private readonly sudokuService: SudokuService) {}

  @Post('start')
  @UseGuards(OptionalJwtAuthGuard)
  async startSession(@Req() req: any, @Body() dto: StartSessionDto) {
    const userId = req.user?.id || null;
    return this.sudokuService.startSession(userId, dto.difficulty);
  }

  @Post(':sessionId/submit')
  @UseGuards(JwtAuthGuard)
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
