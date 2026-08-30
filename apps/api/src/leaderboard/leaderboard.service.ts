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
      where: {
        user: {
          isBot: false,
          isBanned: false,
        },
      },
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
      where: {
        user: {
          isBot: false,
          isBanned: false,
        },
      },
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
  // --- P1-Q: period leaderboards (daily / weekly / monthly / yearly) ---

  private static readonly PERIOD_DAYS: Record<string, number> = {
    daily: 1,
    weekly: 7,
    monthly: 30,
    yearly: 365,
  };

  /**
   * Wins inside the time window, aggregated in SQL (groupBy), cached 60s in
   * Redis. Never loads raw matches into JS.
   */
  async getPeriodLeaderboard(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    limit = 50,
  ) {
    const capped = Math.min(100, Math.max(10, limit));
    const cacheKey = `leaderboard:period:${period}:${capped}`;
    const redis = this.redisService.getClient();

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {
      /* Redis down -> compute from DB */
    }

    const days = LeaderboardService.PERIOD_DAYS[period];
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);

    const [winGroups, p1Groups, p2Groups] = await Promise.all([
      prisma.duelMatch.groupBy({
        by: ['winnerId'],
        where: { winnerId: { not: null }, endTime: { gte: cutoff } },
        _count: { id: true },
      }),
      prisma.duelMatch.groupBy({
        by: ['player1Id'],
        where: { createdAt: { gte: cutoff } },
        _count: { id: true },
      }),
      prisma.duelMatch.groupBy({
        by: ['player2Id'],
        where: { player2Id: { not: null }, createdAt: { gte: cutoff } },
        _count: { id: true },
      }),
    ]);

    const wins = new Map<string, number>();
    for (const g of winGroups)
      if (g.winnerId) wins.set(g.winnerId, g._count.id);
    const games = new Map<string, number>();
    for (const g of p1Groups) games.set(g.player1Id, g._count.id);
    for (const g of p2Groups)
      if (g.player2Id)
        games.set(g.player2Id, (games.get(g.player2Id) ?? 0) + g._count.id);

    const candidates = [...new Set([...wins.keys(), ...games.keys()])]
      .map((userId) => ({
        userId,
        wins: wins.get(userId) ?? 0,
        games: games.get(userId) ?? 0,
      }))
      .sort((a, b) => b.wins - a.wins || b.games - a.games)
      .slice(0, capped);

    const profiles = candidates.length
      ? await prisma.profile.findMany({
          where: {
            userId: { in: candidates.map((c) => c.userId) },
            user: {
              isBot: false,
              isBanned: false,
            },
          },
          select: {
            userId: true,
            username: true,
            avatarUrl: true,
            level: true,
            rating: true,
            currentStreak: true,
          },
        })
      : [];
    const byUser = new Map(profiles.map((p) => [p.userId, p]));

    const rows = candidates
      .filter((c) => byUser.has(c.userId))
      .map((c, i) => {
        const p = byUser.get(c.userId)!;
        return {
          rank: i + 1,
          userId: c.userId,
          username: p.username,
          avatarUrl: p.avatarUrl,
          level: p.level,
          rating: p.rating,
          streak: p.currentStreak,
          games: c.games,
          wins: c.wins,
          winRate: c.games > 0 ? Math.round((c.wins / c.games) * 100) : 0,
        };
      });

    try {
      await redis.set(cacheKey, JSON.stringify(rows), 'EX', 60);
    } catch {
      /* best-effort */
    }
    return rows;
  }

  /** Caller's own rank and percentile within a leaderboard. */
  async getUserRank(userId: string, period: string = 'global') {
    const rows =
      period === 'global'
        ? await this.getTopPlayers(100, 0)
        : await this.getPeriodLeaderboard(period as any, 100);
    const idx = rows.findIndex((r: any) => r.userId === userId);
    if (idx === -1) return null;
    return {
      rank: idx + 1,
      percentile: Math.round(((rows.length - idx - 1) / rows.length) * 100),
      row: rows[idx],
    };
  }
}
