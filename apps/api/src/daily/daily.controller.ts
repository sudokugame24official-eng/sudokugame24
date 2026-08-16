import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DailyService } from './daily.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubmitChallengeDto } from './dto/submit-challenge.dto';

@Controller('daily')
export class DailyController {
  constructor(private readonly dailyService: DailyService) {}

  @Get('today')
  async getTodaysChallenge() {
    return this.dailyService.getTodaysChallenge();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':challengeId/start')
  async startChallenge(
    @Param('challengeId') challengeId: string,
    @Request() req,
  ) {
    return this.dailyService.startChallenge(req.user.id, challengeId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':challengeId/submit')
  async submitEntry(
    @Param('challengeId') challengeId: string,
    @Body() dto: SubmitChallengeDto,
    @Request() req,
  ) {
    return this.dailyService.submitEntry(
      req.user.id,
      challengeId,
      dto.finalBoard,
    );
  }

  @Get(':challengeId/leaderboard')
  async getLeaderboard(@Param('challengeId') challengeId: string) {
    return this.dailyService.getLeaderboard(challengeId);
  }
}
