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
        userPerk: {
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
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

    await expect(service.rewardAdWatch('u1')).rejects.toThrow(
      BadRequestException,
    );
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
      stock: null,
      maxPerUser: null,
      startDate: null,
      endDate: null,
    });

    await service.buyProduct('u1', 'p1');

    const key = coinLedger.debit.mock.calls[0][5];
    expect(key).toBeUndefined(); // no fake timestamp-based dedup key
    expect(String(coinLedger.debit.mock.calls[0][5])).not.toContain('Date');
  });

  it('buyProduct REJECTS when stock is exhausted (P1-E constraint)', async () => {
    (prisma.shopProduct.findUnique as jest.Mock).mockResolvedValue({
      id: 'p1',
      isActive: true,
      priceCoins: 100,
      type: 'consumable',
      entitlement: 'EXTRA_HINTS',
      stock: 0,
      maxPerUser: null,
      startDate: null,
      endDate: null,
    });

    await expect(service.buyProduct('u1', 'p1')).rejects.toThrow(
      'Rupture de stock',
    );
    expect(coinLedger.debit).not.toHaveBeenCalled();
  });

  it('buyProduct REJECTS when maxPerUser is reached (P1-E constraint)', async () => {
    (prisma.shopProduct.findUnique as jest.Mock).mockResolvedValue({
      id: 'p1',
      isActive: true,
      priceCoins: 100,
      type: 'consumable',
      entitlement: 'EXTRA_HINTS',
      stock: 10,
      maxPerUser: 2,
      startDate: null,
      endDate: null,
    });
    (prisma.coinTransaction.count as jest.Mock).mockResolvedValue(2); // already bought twice

    await expect(service.buyProduct('u1', 'p1')).rejects.toThrow('Limite de 2');
    expect(coinLedger.debit).not.toHaveBeenCalled();
  });

  it('buyProduct REJECTS outside the availability window (P1-E constraint)', async () => {
    const past = new Date(Date.now() - 86400000);
    (prisma.shopProduct.findUnique as jest.Mock).mockResolvedValue({
      id: 'p1',
      isActive: true,
      priceCoins: 100,
      type: 'consumable',
      entitlement: 'EXTRA_HINTS',
      stock: 10,
      maxPerUser: null,
      startDate: null,
      endDate: past,
    });

    await expect(service.buyProduct('u1', 'p1')).rejects.toThrow(
      'nest plus disponible',
    );
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

    const failedCall = (prisma.purchase.updateMany as jest.Mock).mock
      .calls[1][0];
    expect(failedCall.data.status).toBe('FAILED');
    expect(failedCall.data.status).not.toBe('PENDING');
  });

  describe('P1-H: server-authoritative Stripe verification', () => {
    it('rejects a session owned by ANOTHER user (no cross-user completion)', async () => {
      (prisma.purchase.findUnique as jest.Mock).mockResolvedValue({
        id: 'po1',
        userId: 'someone-else',
        status: 'PENDING',
        coinsGranted: 100,
      });

      await expect(
        service.verifyAndCompleteSession('u1', 'sess_1'),
      ).rejects.toThrow('ne vous appartient pas');
    });

    it('returns COMPLETED immediately for an already-completed purchase (idempotent)', async () => {
      (prisma.purchase.findUnique as jest.Mock).mockResolvedValue({
        id: 'po1',
        userId: 'u1',
        status: 'COMPLETED',
        coinsGranted: 500,
      });

      const res = await service.verifyAndCompleteSession('u1', 'sess_1');
      expect(res.status).toBe('COMPLETED');
      expect(coinLedger.credit).not.toHaveBeenCalled(); // no double credit
    });

    it('refuses to process webhooks when STRIPE_WEBHOOK_SECRET is missing (fail closed)', async () => {
      const prev = process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      try {
        await expect(
          service.verifyStripeWebhook('sig', Buffer.from('{}')),
        ).rejects.toThrow('Webhook non configuré');
      } finally {
        if (prev) process.env.STRIPE_WEBHOOK_SECRET = prev;
      }
    });

    it('refuses payments when STRIPE_SECRET_KEY is missing (no dummy key fallback)', () => {
      const prev = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;
      try {
        expect(() => (service as any).getStripe()).toThrow('STRIPE_SECRET_KEY');
      } finally {
        if (prev) process.env.STRIPE_SECRET_KEY = prev;
      }
    });
  });
});
