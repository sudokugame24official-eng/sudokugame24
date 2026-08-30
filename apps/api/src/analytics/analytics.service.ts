import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from '@repo/database';

/**
 * P1-V: analytics engine.
 * - track(): fire-and-forget event writes (never blocks the caller, never
 *   throws on failure — analytics must not take the game down).
 * - rollupDaily(): SQL aggregation of yesterday's events into AnalyticsDaily
 *   (grouped by name; DAU/WAU/MAU computed from distinct userIds). Dashboards
 *   read rollups only — a year of raw events is NEVER loaded into memory.
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  private static readonly EVENT_NAMES = new Set([
    'page_view',
    'registration',
    'login',
    'logout',
    'game_start',
    'game_complete',
    'daily_start',
    'daily_complete',
    'duel_start',
    'duel_complete',
    'friend_request',
    'friend_accept',
    'friend_challenge',
    'forum_post',
    'forum_reply',
    'question_ask',
    'question_answer',
    'chat_message',
    'shop_view',
    'purchase',
    'ad_impression',
    'ad_reward',
    'achievement_unlock',
    'search',
    'share',
  ]);

  async track(input: {
    name: string;
    userId?: string | null;
    sessionId?: string | null;
    locale?: string | null;
    country?: string | null;
    device?: string | null;
    page?: string | null;
    referrer?: string | null;
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    // Unknown event names are dropped: no free-form table bloat.
    if (!AnalyticsService.EVENT_NAMES.has(input.name)) return;
    try {
      await prisma.analyticsEvent.create({
        data: {
          name: input.name,
          userId: input.userId ?? null,
          sessionId: input.sessionId?.slice(0, 64) ?? null,
          locale: input.locale?.slice(0, 8) ?? null,
          country: input.country?.slice(0, 2) ?? null,
          device: input.device?.slice(0, 16) ?? null,
          page: input.page?.slice(0, 500) ?? null,
          referrer: input.referrer?.slice(0, 500) ?? null,
          source: input.source?.slice(0, 64) ?? null,
          medium: input.medium?.slice(0, 64) ?? null,
          campaign: input.campaign?.slice(0, 128) ?? null,
          metadata: (input.metadata ?? undefined) as any,
        },
      });
    } catch (e) {
      this.logger.warn(
        `analytics track failed (${input.name}): ${(e as Error).message}`,
      );
    }
  }

  /** Aggregate one UTC day of events into AnalyticsDaily rows. Idempotent. */
  async rollupDaily(
    dayOverride?: Date,
  ): Promise<{ metric: string; value: number }[]> {
    const day = dayOverride ?? new Date(Date.now() - 24 * 3600 * 1000);
    day.setUTCHours(0, 0, 0, 0);
    const next = new Date(day.getTime() + 24 * 3600 * 1000);

    // Raw counts per event name — computed in SQL, streamed as small groups
    const groups = await prisma.analyticsEvent.groupBy({
      by: ['name'],
      where: { createdAt: { gte: day, lt: next } },
      _count: { id: true },
    });

    // Distinct active users that day (DAU) — SQL count distinct
    const active = await prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: day, lt: next }, userId: { not: null } },
      select: { userId: true },
      distinct: ['userId'],
    });

    const rows: { metric: string; value: number }[] = groups.map((g) => ({
      metric: g.name,
      value: g._count.id,
    }));
    rows.push({ metric: 'dau', value: active.length });

    for (const r of rows) {
      await prisma.analyticsDaily.upsert({
        where: {
          day_metric_dimension: { day, metric: r.metric, dimension: null },
        } as any,
        update: { value: r.value },
        create: { day, metric: r.metric, dimension: null, value: r.value },
      });
    }
    return rows;
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async nightlyRollup() {
    try {
      const rows = await this.rollupDaily();
      this.logger.log(`Nightly analytics rollup: ${rows.length} metrics`);
    } catch (e) {
      this.logger.error(`Nightly rollup failed: ${(e as Error).message}`);
    }
  }

  /** Series of a metric over N days, from ROLLUPS only (never raw events). */
  async getSeries(
    metric: string,
    days = 30,
  ): Promise<{ day: string; value: number }[]> {
    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    from.setUTCDate(from.getUTCDate() - (days - 1));

    const rows = await prisma.analyticsDaily.findMany({
      where: { metric, day: { gte: from } },
      orderBy: { day: 'asc' },
      select: { day: true, value: true },
    });

    // Fill gaps with 0 so charts stay continuous
    const byDay = new Map(
      rows.map((r) => [r.day.toISOString().slice(0, 10), r.value]),
    );
    const series: { day: string; value: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from.getTime() + i * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10);
      series.push({ day: d, value: byDay.get(d) ?? 0 });
    }
    return series;
  }

  /** Totals for the owner KPI cards (rollup reads, capped windows). */
  async getTotals(days = 30) {
    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    from.setUTCDate(from.getUTCDate() - (days - 1));

    const rows = await prisma.analyticsDaily.findMany({
      where: { day: { gte: from }, dimension: null },
      select: { metric: true, value: true },
    });

    const totals: Record<string, number> = {};
    for (const r of rows) totals[r.metric] = (totals[r.metric] ?? 0) + r.value;
    return totals;
  }

  /**
   * P1-W: plain-language insights, computed ONLY from rollups. No sentence is
   * emitted when the sample is too small to mean anything.
   */
  async getInsights(locale = 'en'): Promise<string[]> {
    const totals7 = await this.getTotals(7);
    const totalsPrev7 = await this.getTotals(14); // 14-day totals include the last 7

    const prevOnly: Record<string, number> = {};
    for (const [k, v] of Object.entries(totalsPrev7))
      prevOnly[k] = v - (totals7[k] ?? 0);

    const fr = locale === 'fr';
    const out: string[] = [];
    const MIN_SAMPLE = 20; // below this, a % change is noise -> stay silent

    const compare = (
      metric: string,
      labelEn: string,
      labelFr: string = labelEn,
    ) => {
      const now = totals7[metric] ?? 0;
      const before = prevOnly[metric] ?? 0;
      if (now + before < MIN_SAMPLE) return;
      if (before === 0) {
        if (now > 0)
          out.push(
            fr
              ? `${labelFr} : ${now} cette semaine (aucun la semaine précédente).`
              : `${labelEn}: ${now} this week (none last week).`,
          );
        return;
      }
      const pct = Math.round(((now - before) / before) * 100);
      if (Math.abs(pct) < 3) return; // ignore noise under 3%
      const dir =
        pct > 0 ? (fr ? 'en hausse de' : 'up') : fr ? 'en baisse de' : 'down';
      out.push(
        fr
          ? `${labelFr} : ${dir} ${Math.abs(pct)}% par rapport à la semaine précédente (${before} → ${now}).`
          : `${labelEn} ${dir} ${Math.abs(pct)}% compared with last week (${before} → ${now}).`,
      );
    };

    compare(
      'dau',
      fr ? 'Utilisateurs actifs quotidiens' : 'Daily active users',
    );
    compare(
      'daily_complete',
      fr ? 'Participation au Défi du jour' : 'Daily Challenge participation',
    );
    compare('duel_complete', fr ? 'Duels terminés' : 'Duels completed');
    compare('forum_post', fr ? 'Activité du forum' : 'Forum activity');
    compare('question_ask', fr ? 'Questions posées' : 'Questions asked');
    compare('registration', fr ? 'Inscriptions' : 'Registrations');
    compare('purchase', fr ? 'Achats' : 'Purchases');

    return out;
  }
}
