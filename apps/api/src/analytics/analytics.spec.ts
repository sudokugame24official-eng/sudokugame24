import { AnalyticsService } from './analytics.service';

jest.mock('@repo/database', () => ({
  prisma: {
    analyticsEvent: { create: jest.fn(), groupBy: jest.fn(), findMany: jest.fn() },
    analyticsDaily: { upsert: jest.fn(), findMany: jest.fn() },
  },
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('@repo/database');

describe('P1-V: analytics engine', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsService();
  });

  it('drops UNKNOWN event names (no free-form table bloat)', async () => {
    await service.track({ name: 'arbitrary_thing' } as any);
    expect(prisma.analyticsEvent.create).not.toHaveBeenCalled();
  });

  it('tracks whitelisted events with truncated properties', async () => {
    await service.track({
      name: 'page_view',
      sessionId: 'x'.repeat(200),
      locale: 'fr-FR-long',
      page: '/en/play'.repeat(200),
    });
    const call = (prisma.analyticsEvent.create as jest.Mock).mock.calls[0][0];
    expect(call.data.name).toBe('page_view');
    expect(call.data.sessionId.length).toBeLessThanOrEqual(64);
    expect(call.data.locale.length).toBeLessThanOrEqual(8);
    expect(call.data.page.length).toBeLessThanOrEqual(500);
    expect(call.data.userId).toBeNull();
  });

  it('track NEVER throws (analytics must not take the game down)', async () => {
    (prisma.analyticsEvent.create as jest.Mock).mockRejectedValue(new Error('db down'));
    await expect(service.track({ name: 'login' })).resolves.toBeUndefined();
  });

  it('rollup aggregates via SQL groupBy + distinct users -> dau', async () => {
    (prisma.analyticsEvent.groupBy as jest.Mock).mockResolvedValue([
      { name: 'page_view', _count: { id: 150 } },
      { name: 'duel_complete', _count: { id: 12 } },
    ]);
    (prisma.analyticsEvent.findMany as jest.Mock).mockResolvedValue([
      { userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' },
    ]);

    const rows = await service.rollupDaily();

    expect(rows).toContainEqual({ metric: 'page_view', value: 150 });
    expect(rows).toContainEqual({ metric: 'duel_complete', value: 12 });
    expect(rows).toContainEqual({ metric: 'dau', value: 3 });
    expect(prisma.analyticsDaily.upsert).toHaveBeenCalledTimes(3);
  });

  it('series fills gaps with zeros for continuous charts', async () => {
    (prisma.analyticsDaily.findMany as jest.Mock).mockResolvedValue([
      { day: new Date(), value: 42 },
    ]);
    const series = await service.getSeries('dau', 7);
    expect(series).toHaveLength(7);
    expect(series.filter((p) => p.value === 0)).toHaveLength(6);
    expect(series[6].value).toBe(42);
  });

  it('insights stay SILENT on small samples and noisy changes', async () => {
    // 5 events this week, 4 before -> below MIN_SAMPLE (20)
    (prisma.analyticsDaily.findMany as jest.Mock).mockImplementation(({ where }) => {
      const from = where.day.gte.getTime();
      const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
      return Promise.resolve(
        from < weekAgo
          ? [{ metric: 'dau', value: 9 }] // 4 previous + 5 current = totals14
          : [{ metric: 'dau', value: 5 }],
      );
    });
    const insights = await service.getInsights('en');
    expect(insights).toEqual([]);
  });

  it('insights emit a plain sentence with period + numbers on real change', async () => {
    (prisma.analyticsDaily.findMany as jest.Mock).mockImplementation(({ where }) => {
      const from = where.day.gte.getTime();
      const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
      return Promise.resolve(
        from < weekAgo
          ? [{ metric: 'daily_complete', value: 220 }] // 100 previous + 120 current
          : [{ metric: 'daily_complete', value: 120 }],
      );
    });
    const insights = await service.getInsights('en');
    expect(insights).toHaveLength(1);
    expect(insights[0]).toContain('Daily Challenge participation');
    expect(insights[0]).toContain('20%');
    expect(insights[0]).toContain('last week');
  });
});
