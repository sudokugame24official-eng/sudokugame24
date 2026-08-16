import { BadRequestException } from '@nestjs/common';
import { ShopService } from './shop.service';

jest.mock('@repo/database', () => ({
  prisma: {
    coinTransaction: { count: jest.fn() },
    purchase: { findUnique: jest.fn(), updateMany: jest.fn() },
    shopProduct: { findUnique: jest.fn() },
    profile: { update: jest.fn() },
    userPerk: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(async (fn) => {
      const tx = {
        userPerk: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
        profile: { update: jest.fn() },
      };
      return fn(tx);
    }),
  },
  CoinTransactionType: {
    AD_REWARD: 'AD_REWARD',
    SHOP_PURCHASE: 'SHOP_PURCHASE',
    PURCHASE: 'PURCHASE',
  },
  PerkType: { NO_ADS: 'NO_ADS', EXTRA_HINTS: 'EXTRA_HINTS' },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('@repo/database');

describe('P0-G: shop economy integrity', () => {
  let service: ShopService;
  const coinLedger = { credit: jest.fn(), debit: jest.fn() };
  const featureFlags = { isFeatureEnabled: jest.fn().mockResolvedValue(true) };

  beforeEach(() => {
    jest.clearAllMocks();
    featureFlags.isFeatureEnabled.mockResolvedValue(true);
    service = new ShopService(coinLedger as any, featureFlags as any);
  });

  it('BLOCKS ad rewards once the daily cap is reached (was: unlimited faucet)', async () => {
    (prisma.coinTransaction.count as jest.Mock).mockResolvedValue(5); // cap = 5

    await expect(service.rewardAdWatch('u1')).rejects.toThrow(BadRequestException);
    expect(coinLedger.credit).not.toHaveBeenCalled();
  });

  it('rewards coins AND hints in one transaction below the cap', async () => {
    (prisma.coinTransaction.count as jest.Mock).mockResolvedValue(2);

    const res = await service.rewardAdWatch('u1');

    expect(res.success).toBe(true);
    expect(coinLedger.credit).toHaveBeenCalledWith(
      'u1',
      10,
      'AD_REWARD',
      'AdSense_Rewarded',
      'ad_reward',
      undefined,
      undefined,
      expect.anything(),
    );
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('buyProduct debits WITHOUT a Date.now() idempotency key', async () => {
    (prisma.shopProduct.findUnique as jest.Mock).mockResolvedValue({
      id: 'p1',
      isActive: true,
      priceCoins: 100,
      type: 'consumable',
      entitlement: 'EXTRA_HINTS',
      quantity: 5,
      durationDays: null,
    });

    await service.buyProduct('u1', 'p1');

    const key = (coinLedger.debit as jest.Mock).mock.calls[0][5];
    expect(key).toBeUndefined(); // no fake timestamp-based dedup key
    expect(String((coinLedger.debit as jest.Mock).mock.calls[0][5])).not.toContain('Date');
  });

  it('webhook failure marks the purchase FAILED (never back to PENDING)', async () => {
    (prisma.purchase.findUnique as jest.Mock).mockResolvedValue({
      id: 'po1',
      userId: 'u1',
      coinsGranted: 500,
      status: 'PENDING',
    });
    (prisma.purchase.updateMany as jest.Mock)
      .mockResolvedValueOnce({ count: 1 }) // claim COMPLETED
      .mockResolvedValueOnce({ count: 1 }); // mark FAILED
    coinLedger.credit.mockRejectedValue(new Error('ledger down'));

    await service.handleSuccessfulPayment('sess_1', 'evt_1');

    const failedCall = (prisma.purchase.updateMany as jest.Mock).mock.calls[1][0];
    expect(failedCall.data.status).toBe('FAILED');
    expect(failedCall.data.status).not.toBe('PENDING');
  });
});
