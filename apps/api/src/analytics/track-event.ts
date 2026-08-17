import { prisma } from '@repo/database';

/**
 * Fire-and-forget analytics write usable from any service WITHOUT DI wiring.
 * Mirrors AnalyticsService.track (same whitelist + truncation). Never throws:
 * analytics must not take the game down.
 */
const EVENT_NAMES = new Set([
  'page_view', 'registration', 'login', 'logout',
  'game_start', 'game_complete', 'daily_start', 'daily_complete',
  'duel_start', 'duel_complete', 'friend_request', 'friend_accept',
  'friend_challenge', 'forum_post', 'forum_reply',
  'question_ask', 'question_answer', 'chat_message',
  'shop_view', 'purchase', 'ad_impression', 'ad_reward',
  'achievement_unlock', 'search', 'share',
]);

export async function trackEvent(input: {
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
  if (!EVENT_NAMES.has(input.name)) return;
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
  } catch {
    // swallow: analytics failure must never propagate
  }
}
