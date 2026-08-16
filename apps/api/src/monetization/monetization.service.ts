import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class MonetizationService {
  private readonly logger = new Logger(MonetizationService.name);

  // --- Feature Flags ---

  async getFeatureFlags() {
    return prisma.featureFlag.findMany();
  }

  async updateFeatureFlag(key: string, enabled: boolean, description?: string) {
    const flag = await prisma.featureFlag.upsert({
      where: { key },
      update: { enabled, description },
      create: { key, enabled, description },
    });
    this.logger.log(`Feature Flag updated: ${key} = ${enabled}`);
    return flag;
  }

  async isFeatureEnabled(key: string): Promise<boolean> {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (flag) return flag.enabled;
    // Legacy key fallback: the codebase historically used both ENABLE_ADS and
    // ADS_ENABLED for the same concept. Canonical keys win, legacy keys are
    // read only when the canonical one is absent.
    if (key === 'ADS_ENABLED') {
      const legacy = await prisma.featureFlag.findUnique({ where: { key: 'ENABLE_ADS' } });
      return legacy?.enabled ?? false;
    }
    return false;
  }

  // --- Ad Slots ---

  async getAdConfig(slotName: string) {
    const globalAdsEnabled = await this.isFeatureEnabled('ENABLE_ADS');
    const slotConfig = await prisma.adSlotConfig.findUnique({
      where: { slotName },
    });

    return {
      globalAdsEnabled,
      slotConfig,
    };
  }

  async getAllAdConfigs() {
    const globalAdsEnabled = await this.isFeatureEnabled('ENABLE_ADS');
    const slotConfigs = await prisma.adSlotConfig.findMany();

    // Map them to an object for easy lookup in the frontend context
    const configsMap: Record<string, any> = {};
    for (const conf of slotConfigs) {
      configsMap[conf.slotName] = conf;
    }

    return {
      globalAdsEnabled,
      slots: configsMap,
    };
  }

  /**
   * P1-F/G: full DB-driven ad slot configuration (upsert by slotName).
   * Defaults keep ads OFF; the owner enables per-slot when ready.
   */
  async updateAdConfig(slotName: string, data: {
    provider?: string;
    enabled?: boolean;
    publisherId?: string;
    adSlotId?: string;
    deviceTarget?: string;
    pageTarget?: string;
    placement?: string;
    format?: string;
    width?: number;
    height?: number;
    lazyLoad?: boolean;
    consentRequired?: boolean;
    frequencyCap?: number;
    experimentGroup?: string;
    priority?: number;
  }) {
    const config = await prisma.adSlotConfig.upsert({
      where: { slotName },
      update: data,
      create: { slotName, ...data },
    });
    this.logger.log(`AdSlotConfig updated: ${slotName}`);
    return config;
  }

  // --- Analytics & Admin Dashboards ---

  async getRevenueStats() {
    // This is a simplified aggregated view. In production, we'd use raw SQL for group-by-date sums.
    const allPurchases = await prisma.purchase.findMany({
      where: { status: 'COMPLETED' },
    });
    const totalRevenue = allPurchases.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPurchases = allPurchases.filter((p) => p.createdAt >= today);
    const todayRevenue = todayPurchases.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );

    // Coins economy
    const coinsPurchased = await prisma.coinTransaction.aggregate({
      where: { type: 'PURCHASE' },
      _sum: { amount: true },
    });

    const coinsSpent = await prisma.coinTransaction.aggregate({
      where: { amount: { lt: 0 } },
      _sum: { amount: true },
    });

    return {
      totalRevenueEur: totalRevenue,
      todayRevenueEur: todayRevenue,
      purchasesCount: allPurchases.length,
      coinsCreated: coinsPurchased._sum.amount || 0,
      coinsSpent: Math.abs(coinsSpent._sum.amount || 0),
    };
  }
}
