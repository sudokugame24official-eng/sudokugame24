import { MonetizationService } from './monetization.service';

jest.mock('@repo/database', () => ({
  prisma: {
    featureFlag: { findUnique: jest.fn() },
    adSlotConfig: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
    },
    purchase: { findMany: jest.fn().mockResolvedValue([]) },
    coinTransaction: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
    },
  },
}));

const { prisma } = require('@repo/database');

describe('P1-F/G: monetization — flag unification + ad slot config', () => {
  let service: MonetizationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MonetizationService();
  });

  it('reads the CANONICAL ADS_ENABLED key first', async () => {
    (prisma.featureFlag.findUnique as jest.Mock).mockImplementation(
      ({ where }) => (where.key === 'ADS_ENABLED' ? { enabled: true } : null),
    );

    await expect(service.isFeatureEnabled('ADS_ENABLED')).resolves.toBe(true);
  });

  it('falls back to the legacy ENABLE_ADS key when canonical is absent', async () => {
    (prisma.featureFlag.findUnique as jest.Mock).mockImplementation(
      ({ where }) => (where.key === 'ENABLE_ADS' ? { enabled: true } : null),
    );

    await expect(service.isFeatureEnabled('ADS_ENABLED')).resolves.toBe(true);
  });

  it('unknown flags stay disabled (fail-closed)', async () => {
    (prisma.featureFlag.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.isFeatureEnabled('DOES_NOT_EXIST')).resolves.toBe(
      false,
    );
  });

  it('upserts a full ad slot config (all new P1-F/G fields pass through)', async () => {
    (prisma.adSlotConfig.upsert as jest.Mock).mockResolvedValue({
      slotName: 'home_leaderboard',
    });

    await service.updateAdConfig('home_leaderboard', {
      enabled: true,
      placement: 'leaderboard',
      format: 'horizontal',
      width: 728,
      height: 90,
      lazyLoad: true,
      consentRequired: true,
      frequencyCap: 3,
      priority: 10,
    });

    const call = (prisma.adSlotConfig.upsert as jest.Mock).mock.calls[0][0];
    expect(call.where.slotName).toBe('home_leaderboard');
    expect(call.update).toMatchObject({
      placement: 'leaderboard',
      height: 90,
      frequencyCap: 3,
    });
    expect(call.create).toMatchObject({
      slotName: 'home_leaderboard',
      enabled: true,
    });
  });

  it('public ad config reports the global flag AND the slot config', async () => {
    (prisma.featureFlag.findUnique as jest.Mock).mockResolvedValue({
      enabled: true,
    });
    (prisma.adSlotConfig.findUnique as jest.Mock).mockResolvedValue({
      slotName: 'forum_sidebar',
      enabled: false,
    });

    const res = await service.getAdConfig('forum_sidebar');
    expect(res.globalAdsEnabled).toBe(true);
    expect(res.slotConfig?.slotName).toBe('forum_sidebar');
  });
});
