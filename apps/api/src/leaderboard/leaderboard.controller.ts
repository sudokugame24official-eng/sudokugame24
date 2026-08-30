import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('global')
  async getGlobalLeaderboard(
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
  ) {
    const parsedLimit = parseInt(limit, 10) || 50;
    const parsedOffset = parseInt(offset, 10) || 0;

    // Cap limit to prevent abuse
    const safeLimit = Math.min(parsedLimit, 100);

    return this.leaderboardService.getTopPlayers(safeLimit, parsedOffset);
  }

  /** P1-Q: period leaderboards (wins inside the window, SQL-aggregated). */
  @Get('period/:period')
  async getPeriodLeaderboard(
    @Param('period') period: string,
    @Query('limit') limit = '50',
  ) {
    if (!PERIODS.includes(period as any)) {
      throw new BadRequestException(
        'Période invalide (daily|weekly|monthly|yearly).',
      );
    }
    const safeLimit = Math.min(parseInt(limit, 10) || 50, 100);
    return this.leaderboardService.getPeriodLeaderboard(
      period as any,
      safeLimit,
    );
  }

  /** P1-Q: the caller's own rank + percentile. */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyRank(@Request() req, @Query('period') period = 'global') {
    return this.leaderboardService.getUserRank(req.user.id, period);
  }
}
