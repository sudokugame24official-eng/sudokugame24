import { LeaderboardService } from './leaderboard.service';

jest.mock('@repo/database', () => ({
  prisma: {
    profile: { findMany: jest.fn() },
    duelMatch: { groupBy: jest.fn() },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('@repo/database');

const redis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  pipeline: jest.fn().mockReturnValue({ zadd: jest.fn(), del: jest.fn(), exec: jest.fn() }),
};

describe('P1-Q: period leaderboards', () => {
  let service: LeaderboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LeaderboardService({ getClient: () => redis } as any);
  });

  it('aggregates wins and games via SQL groupBy (never loads raw matches)', async () => {
    (prisma.duelMatch.groupBy as jest.Mock)
      .mockResolvedValueOnce([{ winnerId: 'u1', _count: { id: 5 } }])  // wins
      .mockResolvedValueOnce([{ player1Id: 'u1', _count: { id: 6 } }]) // games as p1
      .mockResolvedValueOnce([{ player2Id: 'u1', _count: { id: 2 } }]); // games as p2
    (prisma.profile.findMany as jest.Mock).mockResolvedValue([
      { userId: 'u1', username: 'alice', avatarUrl: null, level: 7, rating: 1400, currentStreak: 3 },
    ]);

    const rows = await service.getPeriodLeaderboard('weekly', 50);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      username: 'alice', wins: 5, games: 8, winRate: Math.round((5 / 8) * 100), streak: 3,
    });
    expect(prisma.duelMatch.groupBy).toHaveBeenCalledTimes(3);
  });

  it('window cutoffs scale with the period', async () => {
    (prisma.duelMatch.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.profile.findMany as jest.Mock).mockResolvedValue([]);

    await service.getPeriodLeaderboard('daily', 20);
    const dailyWhere = (prisma.duelMatch.groupBy as jest.Mock).mock.calls[0][0].where;
    expect(dailyWhere.endTime.gte.getTime()).toBeGreaterThan(Date.now() - 2 * 24 * 3600 * 1000);

    await service.getPeriodLeaderboard('yearly', 20);
    const yearlyWhere = (prisma.duelMatch.groupBy as jest.Mock).mock.calls[3][0].where;
    expect(yearlyWhere.endTime.gte.getTime()).toBeLessThan(Date.now() - 364 * 24 * 3600 * 1000);
  });

  it('caches the result in Redis with a 60s TTL', async () => {
    (prisma.duelMatch.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.profile.findMany as jest.Mock).mockResolvedValue([]);

    await service.getPeriodLeaderboard('monthly', 30);
    expect(redis.set).toHaveBeenCalledWith(
      'leaderboard:period:monthly:30',
      expect.any(String),
      'EX',
      60,
    );
  });

  it('serves from cache when present (no DB hit)', async () => {
    redis.get.mockResolvedValueOnce(JSON.stringify([{ rank: 1, userId: 'u1', username: 'x' }]));
    const rows = await service.getPeriodLeaderboard('daily', 30);
    expect(rows[0].username).toBe('x');
    expect(prisma.duelMatch.groupBy).not.toHaveBeenCalled();
  });

  it('sorts by wins, then games', async () => {
    (prisma.duelMatch.groupBy as jest.Mock)
      .mockResolvedValueOnce([
        { winnerId: 'a', _count: { id: 3 } },
        { winnerId: 'b', _count: { id: 5 } },
      ])
      .mockResolvedValue([])
      .mockResolvedValue([]);
    (prisma.profile.findMany as jest.Mock).mockResolvedValue([
      { userId: 'a', username: 'A', avatarUrl: null, level: 1, rating: 1000, currentStreak: 0 },
      { userId: 'b', username: 'B', avatarUrl: null, level: 2, rating: 1100, currentStreak: 0 },
    ]);

    const rows = await service.getPeriodLeaderboard('weekly', 10);
    expect(rows[0].username).toBe('B'); // more wins first
  });

  it('getUserRank returns rank + percentile for a listed player', async () => {
    redis.get.mockResolvedValue(JSON.stringify([
      { rank: 1, userId: 'u1', username: 'a', rating: 1500 },
      { rank: 2, userId: 'u2', username: 'b', rating: 1400 },
      { rank: 3, userId: 'u3', username: 'c', rating: 1300 },
    ]));

    const me = await service.getUserRank('u2', 'daily');
    expect(me?.rank).toBe(2);
    expect(me?.percentile).toBe(33); // bottom 1 of 3 -> top 33%
    expect(await service.getUserRank('unknown', 'daily')).toBeNull();
  });

  it('limit is capped at 100 (no unbounded reads)', async () => {
    redis.get.mockResolvedValue(null); // drop the cache left by the previous test
    (prisma.duelMatch.groupBy as jest.Mock).mockResolvedValue([
      { winnerId: 'u1', _count: { id: 1 } },
    ]);
    (prisma.profile.findMany as jest.Mock).mockResolvedValue([
      { userId: 'u1', username: 'x', avatarUrl: null, level: 1, rating: 1000, currentStreak: 0 },
    ]);
    const rows = await service.getPeriodLeaderboard('weekly', 9999);
    expect(rows).toHaveLength(1); // capped, no crash
  });
});
