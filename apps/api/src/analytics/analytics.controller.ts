import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AnalyticsService } from './analytics.service';
import { Throttle } from '@nestjs/throttler';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RedisService } from '../redis/redis.service';
import { prisma } from '@repo/database';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

const ALL_EVENTS = [
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
] as const;

export class TrackDto {
  @IsIn(ALL_EVENTS)
  name!: string;

  @IsOptional() @IsString() @MaxLength(64) sessionId?: string;
  @IsOptional() @IsString() @MaxLength(8) locale?: string;
  @IsOptional() @IsString() @MaxLength(500) page?: string;
  @IsOptional() @IsString() @MaxLength(500) referrer?: string;
  @IsOptional() @IsString() @MaxLength(64) source?: string;
  @IsOptional() @IsString() @MaxLength(64) medium?: string;
  @IsOptional() @IsString() @MaxLength(128) campaign?: string;
  @IsOptional() metadata?: Record<string, unknown>;
}

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly redisService: RedisService,
  ) {}

  /** Public endpoint for client-side events (page_view, share, search...). */
  @SkipThrottle()
  @Post('track')
  async track(@Body() dto: TrackDto) {
    // No userId from public clients — authenticated tracking happens
    // server-side in the services that own the events.
    await this.analyticsService.track({
      name: dto.name,
      sessionId: dto.sessionId,
      locale: dto.locale,
      page: dto.page,
      referrer: dto.referrer,
      source: dto.source,
      medium: dto.medium,
      campaign: dto.campaign,
      metadata: dto.metadata ?? null,
    });
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('analytics.view')
  @Get('series')
  async series(@Query('metric') metric = 'dau', @Query('days') days = '30') {
    const safeDays = Math.min(365, Math.max(7, parseInt(days, 10) || 30));
    return {
      metric,
      days: safeDays,
      points: await this.analyticsService.getSeries(metric, safeDays),
    };
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('analytics.view')
  @Get('totals')
  async totals(@Query('days') days = '30') {
    const safeDays = Math.min(365, Math.max(7, parseInt(days, 10) || 30));
    return {
      days: safeDays,
      totals: await this.analyticsService.getTotals(safeDays),
    };
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('analytics.view')
  @Get('insights')
  async insights(@Query('locale') locale = 'en') {
    return { insights: await this.analyticsService.getInsights(locale) };
  }

  /**
   * P1-W: real-time counters. Every number is MEASURED (presence ZSET, active
   * duel set, today's indexed events) — nothing extrapolated.
   */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('analytics.view')
  @Get('realtime')
  async realtime() {
    const redis = this.redisService.getClient();
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [online, activeDuels, dbOk, pageViewsToday, registrationsToday] =
      await Promise.all([
        redis.zcard('presence:online_zset').catch(() => null),
        redis.scard('duel:active_ids').catch(() => null),
        prisma.$queryRaw`SELECT 1 as ok`.then(() => true).catch(() => false),
        prisma.analyticsEvent
          .count({
            where: { name: 'page_view', createdAt: { gte: todayStart } },
          })
          .catch(() => null),
        prisma.user
          .count({ where: { createdAt: { gte: todayStart } } })
          .catch(() => null),
      ]);

    let redisOk: boolean | null = null;
    try {
      const pong = await redis.ping();
      redisOk = pong === 'PONG';
    } catch {
      redisOk = false;
    }

    return {
      onlineUsers: online,
      activeDuels,
      pageViewsToday,
      registrationsToday,
      health: { db: dbOk, redis: redisOk },
      measuredAt: new Date().toISOString(),
    };
  }

  /** Manual rollup trigger (also runs nightly at 03:00 UTC via cron). */
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('analytics.view')
  @Post('rollup')
  async rollup() {
    return { rolled: await this.analyticsService.rollupDaily() };
  }
}
