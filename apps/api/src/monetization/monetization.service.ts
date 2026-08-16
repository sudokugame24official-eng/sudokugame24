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
    return flag?.enabled ?? false;
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

  async updateAdConfig(
    slotName: string,
    provider: string,
    enabled: boolean,
    publisherId?: string,
  ) {
    const config = await prisma.adSlotConfig.upsert({
      where: { slotName },
      update: { provider, enabled, publisherId },
      create: { slotName, provider, enabled, publisherId },
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
