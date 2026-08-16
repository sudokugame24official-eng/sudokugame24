import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@repo/database';
import { RedisService } from '../redis/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(private redisService: RedisService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async rebuildLeaderboard() {
    this.logger.log('Starting Leaderboard rebuild synchronization...');

    const topProfiles = await prisma.profile.findMany({
      orderBy: { rating: 'desc' },
      take: 10000,
      select: {
        userId: true,
        rating: true,
        username: true,
        avatarUrl: true,
        level: true,
      },
    });

    const redis = this.redisService.getClient();

    try {
      const pipeline = redis.pipeline();
      pipeline.del('leaderboard:global:rating');
      pipeline.del('leaderboard:global:rating:data');

      for (const profile of topProfiles) {
        pipeline.zadd(
          'leaderboard:global:rating',
          profile.rating,
          profile.userId,
        );
        pipeline.hset(
          'leaderboard:global:rating:data',
          profile.userId,
          JSON.stringify({
            username: profile.username,
            avatarUrl: profile.avatarUrl,
            level: profile.level,
            rating: profile.rating,
          }),
        );
      }

      await pipeline.exec();
      this.logger.log('Leaderboard rebuild complete.');
    } catch (err) {
      this.logger.warn(
        'Redis unavailable for leaderboard rebuild: ' + err.message,
      );
    }
  }

  async getTopPlayers(limit: number = 50, offset: number = 0) {
    const redis = this.redisService.getClient();

    try {
      // Try Redis first
      const userIds = await redis.zrevrange(
        'leaderboard:global:rating',
        offset,
        offset + limit - 1,
      );

      if (userIds && userIds.length > 0) {
        const userData = await redis.hmget(
          'leaderboard:global:rating:data',
          ...userIds,
        );
        return userData
          .map((data, index) => {
            if (!data) return null;
            const parsed = JSON.parse(data);
            return {
              rank: offset + index + 1,
              userId: userIds[index],
              ...parsed,
            };
          })
          .filter((item) => item !== null);
      }
    } catch (err) {
      this.logger.warn(
        'Redis unavailable, falling back to Postgres for leaderboard: ' +
          err.message,
      );
    }

    // Fallback: direct Postgres query
    const profiles = await prisma.profile.findMany({
      orderBy: { rating: 'desc' },
      take: limit,
      skip: offset,
      select: {
        userId: true,
        rating: true,
        username: true,
        avatarUrl: true,
        level: true,
      },
    });

    return profiles.map((p, i) => ({
      rank: offset + i + 1,
      userId: p.userId,
      username: p.username,
      avatarUrl: p.avatarUrl,
      level: p.level,
      rating: p.rating,
    }));
  }
}
