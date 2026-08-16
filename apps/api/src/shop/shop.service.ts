import {
  Injectable,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { prisma, PerkType, CoinTransactionType } from '@repo/database';
import { CoinLedgerService } from '../coin-ledger/coin-ledger.service';
import { FeatureFlagService } from '../config/feature-flag.service';
import Stripe from 'stripe';

// Real-money coin packs (can be moved to DB later if needed, but usually fixed SKU)
const COIN_PACKS = [
  { id: 'pack_1', name: 'Pack Débutant', coins: 500, priceEur: 4.99, image: '/images/coins_small.png' },
  { id: 'pack_2', name: 'Pack Populaire', coins: 1500, priceEur: 9.99, image: '/images/coins_medium.png', popular: true },
  { id: 'pack_3', name: 'Trésor du Maître', coins: 4000, priceEur: 19.99, image: '/images/coins_large.png' },
];

@Injectable()
export class ShopService {
  private readonly logger = new Logger(ShopService.name);
  private stripe: Stripe;

  constructor(
    private readonly coinLedger: CoinLedgerService,
    private readonly featureFlags: FeatureFlagService,
  ) {
    this.stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY || 'sk_test_mock',
      {},
    );
  }

  getCoinPacks() {
    return COIN_PACKS;
  }

  async getProducts() {
    return prisma.shopProduct.findMany({
      where: { isActive: true },
      orderBy: { priceCoins: 'asc' }
    });
  }

  async getAllProductsAdmin() {
    return prisma.shopProduct.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async createProductAdmin(data: any) {
    return prisma.shopProduct.create({ data });
  }

  async updateProductAdmin(id: string, data: any) {
    return prisma.shopProduct.update({ where: { id }, data });
  }

  async deleteProductAdmin(id: string) {
    return prisma.shopProduct.delete({ where: { id } });
  }

  async getUserPerks(userId: string) {
    const perks = await prisma.userPerk.findMany({
      where: { userId },
    });
    const now = new Date();
    return perks.filter((p) => !p.expiresAt || p.expiresAt > now);
  }

  async createCheckoutSession(userId: string, packId: string) {
    const isStripeEnabled = await this.featureFlags.isFeatureEnabled('ENABLE_STRIPE');
    if (!isStripeEnabled) throw new ForbiddenException('Les achats sont temporairement désactivés.');

    const pack = COIN_PACKS.find((p) => p.id === packId);
    if (!pack) throw new BadRequestException('Pack introuvable');

    let session;
    if (process.env.NODE_ENV !== 'test') {
      try {
        session = await this.stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: { name: pack.name },
                unit_amount: Math.round(pack.priceEur * 100),
              },
              quantity: 1,
            },
          ],
          client_reference_id: userId,
          metadata: { packId: pack.id, coinsGranted: pack.coins },
          success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shop?success=true`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shop?canceled=true`,
        });
      } catch (e) {
        this.logger.error('Erreur de création de session Stripe', e);
        throw new BadRequestException('Erreur de création de paiement');
      }
    }

    const mockSessionId = session?.id || `mock_sess_${Date.now()}`;

    await prisma.purchase.create({
      data: {
        userId,
        stripeSessionId: mockSessionId,
        amount: pack.priceEur,
        currency: 'EUR',
        coinsGranted: pack.coins,
        status: 'PENDING',
      },
    });

    return { url: session?.url || `http://localhost:3000/shop/checkout?session_id=${mockSessionId}` };
  }

  async verifyStripeWebhook(signature: string, payload: Buffer): Promise<Stripe.Event> {
    try {
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
      return this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (err) {
      this.logger.error(`⚠️  Webhook signature failed.`, err.message);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  async handleSuccessfulPayment(sessionId: string, stripeEventId?: string) {
    const isStripeEnabled = await this.featureFlags.isFeatureEnabled('ENABLE_STRIPE');
    if (!isStripeEnabled) return;

    const purchase = await prisma.purchase.findUnique({ where: { stripeSessionId: sessionId } });
    if (!purchase || purchase.status === 'COMPLETED') return;

    try {
      const updatedPurchase = await prisma.purchase.updateMany({
        where: { id: purchase.id, status: 'PENDING' },
        data: { status: 'COMPLETED' },
      });

      if (updatedPurchase.count === 0) throw new Error('Already processed');

      await this.coinLedger.credit(
        purchase.userId,
        purchase.coinsGranted,
        CoinTransactionType.PURCHASE,
        'Stripe',
        sessionId,
        stripeEventId,
      );
    } catch (e) {
      // P0-G/D1: a failed completion must be terminal (FAILED), never reverted
      // to PENDING — reverting allowed a replayed webhook to double-credit.
      this.logger.error(`Paiement échoué pour ${sessionId}`, e);
      await prisma.purchase.updateMany({
        where: { stripeSessionId: sessionId, status: 'COMPLETED' },
        data: { status: 'FAILED' },
      });
    }
  }

  async buyProduct(userId: string, productId: string) {
    const isShopEnabled = await this.featureFlags.isFeatureEnabled('SHOP_ENABLED');
    if (!isShopEnabled) throw new ForbiddenException('La boutique est temporairement désactivée.');

    const product = await prisma.shopProduct.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw new BadRequestException('Produit indisponible.');

    let expiresAt: Date | null = null;
    if (product.durationDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + product.durationDays);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Debit coins. No Date.now()-based idempotency key: such keys never
        // deduplicate anything (every retry is a new key). The $transaction +
        // optimistic balance lock below is the actual double-spend guard, and
        // a retried purchase fairly delivers the product twice for two charges.
        await this.coinLedger.debit(
          userId,
          product.priceCoins,
          CoinTransactionType.SHOP_PURCHASE,
          'Shop',
          productId,
          undefined,
          undefined,
          tx,
        );

        // Apply Entitlement
        if (product.type === 'perk') {
           const existing = await tx.userPerk.findUnique({
            where: { userId_perkType: { userId, perkType: product.entitlement as PerkType } },
          });

          if (existing && expiresAt) {
            const currentExp = existing.expiresAt && existing.expiresAt > new Date() ? existing.expiresAt : new Date();
            currentExp.setDate(currentExp.getDate() + product.durationDays!);
            await tx.userPerk.update({
              where: { id: existing.id },
              data: { expiresAt: currentExp },
            });
          } else {
            await tx.userPerk.create({
              data: { userId, perkType: product.entitlement as PerkType, expiresAt },
            });
          }
        } else if (product.type === 'consumable' && product.entitlement === 'EXTRA_HINTS') {
            await tx.profile.update({
              where: { userId },
              data: { hints: { increment: product.quantity || 1 } }
            });
        }
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw new BadRequestException('Fonds insuffisants');
      throw error;
    }

    return { success: true, message: 'Achat réussi !' };
  }

  async rewardAdWatch(userId: string) {
    const isRewardedAdsEnabled = await this.featureFlags.isFeatureEnabled('ADS_ENABLED');
    if (!isRewardedAdsEnabled) throw new ForbiddenException('Les publicités sont désactivées.');

    const REWARD_HINTS = 1;
    const REWARD_COINS = 10;
    // P0-G: daily cap — without it, spamming the (client-simulated) ad watch
    // was an unlimited coin faucet (a Date.now() idempotency key dedups nothing).
    const DAILY_CAP = parseInt(process.env.AD_REWARD_DAILY_CAP || '5', 10);

    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const claimedToday = await prisma.coinTransaction.count({
      where: {
        userId,
        type: CoinTransactionType.AD_REWARD,
        createdAt: { gte: dayStart },
      },
    });
    if (claimedToday >= DAILY_CAP) {
      throw new BadRequestException('Limite quotidienne de récompenses publicitaires atteinte.');
    }

    try {
      // Coins and hints atomically: one transaction, no partial reward.
      await prisma.$transaction(async (tx) => {
        await this.coinLedger.credit(
          userId,
          REWARD_COINS,
          CoinTransactionType.AD_REWARD,
          'AdSense_Rewarded',
          'ad_reward',
          undefined,
          undefined,
          tx,
        );
        await tx.profile.update({
          where: { userId },
          data: { hints: { increment: REWARD_HINTS } },
        });
      });
    } catch (e) {
      throw new BadRequestException('Could not reward at this time');
    }

    return { success: true, hintsGranted: REWARD_HINTS, coinsGranted: REWARD_COINS };
  }
}
