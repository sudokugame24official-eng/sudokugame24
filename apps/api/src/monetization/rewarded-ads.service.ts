import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { prisma, CoinTransactionType } from '@repo/database';
import { CoinLedgerService } from '../coin-ledger/coin-ledger.service';
import * as crypto from 'crypto';

export interface RewardedAdConfig {
  enabled: boolean;
  rewardAmount: number;
  dailyCap: number;
  cooldownSeconds: number;
  eligiblePages: string[];
  provider: 'MockRewarded' | 'GoogleRewarded' | 'UnityAds';
}

export interface RewardedSessionTokenPayload {
  userId: string;
  sessionId: string;
  rewardAmount: number;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

@Injectable()
export class RewardedAdsService {
  private readonly logger = new Logger(RewardedAdsService.name);
  private readonly secret =
    process.env.JWT_SECRET || 'rewarded-ad-secret-fallback-do-not-use-in-prod';

  // In-memory replay protection cache (stores claimed session IDs with TTL)
  private readonly claimedSessions = new Map<string, number>();

  // In-memory analytics counters
  private analytics = {
    optIns: 0,
    started: 0,
    completed: 0,
    abandoned: 0,
    rewardsGranted: 0,
    rewardsRejected: 0,
    coinsGranted: 0,
    dailyCapHits: 0,
    fraudRejections: 0,
  };

  private cleanupInterval: any;

  constructor(private readonly coinLedgerService: CoinLedgerService) {
    // Periodically clean up claimed sessions older than 1 hour
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [sessionId, timestamp] of this.claimedSessions.entries()) {
        if (now - timestamp > 3600000) {
          this.claimedSessions.delete(sessionId);
        }
      }
    }, 600000);
    if (this.cleanupInterval?.unref) {
      this.cleanupInterval.unref();
    }
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  // --- Configuration Management ---

  async getConfig(): Promise<RewardedAdConfig> {
    const flag = await prisma.featureFlag.findUnique({
      where: { key: 'REWARDED_ADS_CONFIG' },
    });

    const isGloballyEnabled = await prisma.featureFlag.findUnique({
      where: { key: 'ENABLE_REWARDED_ADS' },
    });

    const defaultConfig: RewardedAdConfig = {
      enabled: isGloballyEnabled?.enabled ?? false,
      rewardAmount: 20,
      dailyCap: 5,
      cooldownSeconds: 60,
      eligiblePages: ['/play', '/daily', '/shop'],
      provider: 'MockRewarded',
    };

    if (!flag?.description) {
      return defaultConfig;
    }

    try {
      const parsed = JSON.parse(flag.description);
      return {
        ...defaultConfig,
        ...parsed,
        enabled: isGloballyEnabled?.enabled ?? false,
      };
    } catch {
      return defaultConfig;
    }
  }

  async updateConfig(
    config: Partial<RewardedAdConfig>,
    adminId?: string,
  ): Promise<RewardedAdConfig> {
    const current = await this.getConfig();
    const updated: RewardedAdConfig = {
      ...current,
      ...config,
    };

    // Update feature flag for global toggle
    if (config.enabled !== undefined) {
      await prisma.featureFlag.upsert({
        where: { key: 'ENABLE_REWARDED_ADS' },
        update: { enabled: config.enabled },
        create: {
          key: 'ENABLE_REWARDED_ADS',
          enabled: config.enabled,
          description: 'Master switch for Rewarded Ads',
        },
      });
    }

    // Save JSON configuration in description
    await prisma.featureFlag.upsert({
      where: { key: 'REWARDED_ADS_CONFIG' },
      update: {
        enabled: updated.enabled,
        description: JSON.stringify(updated),
      },
      create: {
        key: 'REWARDED_ADS_CONFIG',
        enabled: updated.enabled,
        description: JSON.stringify(updated),
      },
    });

    this.logger.log(
      `Rewarded Ads configuration updated by ${adminId || 'system'}: ${JSON.stringify(updated)}`,
    );
    return updated;
  }

  // --- User Eligibility & Quota ---

  async getUserStatus(userId: string) {
    const config = await this.getConfig();

    if (!config.enabled) {
      return {
        enabled: false,
        eligible: false,
        reason: 'REWARDED_ADS_DISABLED',
        rewardAmount: config.rewardAmount,
        todayCount: 0,
        dailyCap: config.dailyCap,
        cooldownRemainingSeconds: 0,
      };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Count rewards today from authoritative CoinLedger
    const todayTransactions = await prisma.coinTransaction.findMany({
      where: {
        userId,
        type: CoinTransactionType.AD_REWARD,
        createdAt: { gte: todayStart },
      },
      orderBy: { createdAt: 'desc' },
    });

    const todayCount = todayTransactions.length;
    const dailyCapReached = todayCount >= config.dailyCap;

    // Check cooldown since last reward
    let cooldownRemainingSeconds = 0;
    if (todayTransactions.length > 0) {
      const lastRewardTime = todayTransactions[0].createdAt.getTime();
      const elapsedSeconds = Math.floor((Date.now() - lastRewardTime) / 1000);
      if (elapsedSeconds < config.cooldownSeconds) {
        cooldownRemainingSeconds = config.cooldownSeconds - elapsedSeconds;
      }
    }

    const isEligible = !dailyCapReached && cooldownRemainingSeconds === 0;

    return {
      enabled: config.enabled,
      eligible: isEligible,
      reason: dailyCapReached
        ? 'DAILY_CAP_REACHED'
        : cooldownRemainingSeconds > 0
          ? 'COOLDOWN_ACTIVE'
          : 'ELIGIBLE',
      rewardAmount: config.rewardAmount,
      todayCount,
      dailyCap: config.dailyCap,
      cooldownRemainingSeconds,
    };
  }

  // --- Token Generation & Signing ---

  private signToken(payload: RewardedSessionTokenPayload): string {
    const json = JSON.stringify(payload);
    const base64Payload = Buffer.from(json).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(base64Payload)
      .digest('base64url');
    return `${base64Payload}.${signature}`;
  }

  private verifyToken(token: string): RewardedSessionTokenPayload {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new BadRequestException('Invalid token format');
    }

    const [base64Payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(base64Payload)
      .digest('base64url');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      throw new ForbiddenException('Invalid cryptographic token signature');
    }

    try {
      const json = Buffer.from(base64Payload, 'base64url').toString('utf8');
      return JSON.parse(json) as RewardedSessionTokenPayload;
    } catch {
      throw new BadRequestException('Malformed token payload');
    }
  }

  // --- Ad Session Initiation ---

  async initiateSession(userId: string) {
    const status = await this.getUserStatus(userId);
    if (!status.enabled) {
      this.analytics.fraudRejections++;
      throw new ForbiddenException('Rewarded Ads are currently disabled');
    }

    if (!status.eligible) {
      if (status.reason === 'DAILY_CAP_REACHED') {
        this.analytics.dailyCapHits++;
        throw new BadRequestException(
          'Daily reward cap reached. Come back tomorrow!',
        );
      }
      if (status.reason === 'COOLDOWN_ACTIVE') {
        throw new BadRequestException(
          `Please wait ${status.cooldownRemainingSeconds}s before watching another ad.`,
        );
      }
    }

    const config = await this.getConfig();
    const sessionId = `rwd_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const nonce = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const expiresAt = now + 300000; // 5 minutes TTL

    const payload: RewardedSessionTokenPayload = {
      userId,
      sessionId,
      rewardAmount: config.rewardAmount,
      issuedAt: now,
      expiresAt,
      nonce,
    };

    const token = this.signToken(payload);
    this.analytics.optIns++;
    this.analytics.started++;

    return {
      sessionId,
      rewardToken: token,
      rewardAmount: config.rewardAmount,
      expiresAt,
      provider: config.provider,
    };
  }

  // --- Ad Reward Claiming & Verification ---

  async claimReward(
    userId: string,
    rewardToken: string,
    idempotencyKey?: string,
  ) {
    const now = Date.now();

    // 1. Verify token cryptographic integrity
    let payload: RewardedSessionTokenPayload;
    try {
      payload = this.verifyToken(rewardToken);
    } catch (err) {
      this.analytics.fraudRejections++;
      this.analytics.rewardsRejected++;
      throw err;
    }

    // 2. Verify token ownership
    if (payload.userId !== userId) {
      this.analytics.fraudRejections++;
      this.analytics.rewardsRejected++;
      throw new ForbiddenException('Token user mismatch');
    }

    // 3. Verify token expiration
    if (now > payload.expiresAt) {
      this.analytics.rewardsRejected++;
      throw new BadRequestException(
        'Reward session has expired. Please try again.',
      );
    }

    // 4. Verify single-use session (replay attack prevention)
    if (this.claimedSessions.has(payload.sessionId)) {
      this.analytics.fraudRejections++;
      this.analytics.rewardsRejected++;
      throw new ConflictException('This reward token has already been claimed');
    }

    // 5. Verify live status (cooldown & daily cap at the time of claim)
    const status = await this.getUserStatus(userId);
    if (!status.enabled) {
      this.analytics.fraudRejections++;
      throw new ForbiddenException('Rewarded Ads are currently disabled');
    }

    if (status.todayCount >= status.dailyCap) {
      this.analytics.dailyCapHits++;
      this.analytics.rewardsRejected++;
      throw new BadRequestException('Daily reward cap reached');
    }

    // 6. Record session as claimed immediately
    this.claimedSessions.set(payload.sessionId, now);

    // 7. Authoritative Coin Ledger Credit
    const finalIdempotencyKey =
      idempotencyKey || `rewarded_ad_${payload.sessionId}`;

    const creditResult = await this.coinLedgerService.credit(
      userId,
      payload.rewardAmount,
      CoinTransactionType.AD_REWARD,
      'RewardedAd',
      payload.sessionId,
      finalIdempotencyKey,
      {
        sessionId: payload.sessionId,
        nonce: payload.nonce,
        claimedAt: new Date().toISOString(),
      },
    );

    // 8. Update Analytics
    this.analytics.completed++;
    this.analytics.rewardsGranted++;
    this.analytics.coinsGranted += payload.rewardAmount;

    const txId = (creditResult as any).transaction?.id;

    this.logger.log(
      `Rewarded ad successfully granted +${payload.rewardAmount} coins to user ${userId} (tx: ${txId || 'unknown'})`,
    );

    return {
      success: true,
      rewardAmount: payload.rewardAmount,
      newBalance: creditResult.balance,
      transactionId: txId,
      sessionId: payload.sessionId,
    };
  }

  // --- Admin Analytics ---

  getAnalytics() {
    return {
      ...this.analytics,
      timestamp: new Date().toISOString(),
    };
  }
}
