import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

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
}
