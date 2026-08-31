import { Test, TestingModule } from '@nestjs/testing';
import { RewardedAdsService } from './rewarded-ads.service';
import { MonetizationService } from './monetization.service';
import { AdminService } from '../admin/admin.service';
import { CoinLedgerService } from '../coin-ledger/coin-ledger.service';
import { prisma, CoinTransactionType } from '@repo/database';
import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { EmailService } from '../email/email.service';

describe('Ultimate Google Ads & Rewarded Ads Control Center Test Suite', () => {
  let rewardedService: RewardedAdsService;
  let monetizationService: MonetizationService;
  let adminService: AdminService;
  let coinLedgerService: CoinLedgerService;

  const mockCoinLedger = {
    credit: jest
      .fn()
      .mockImplementation(
        (userId, amount, type, source, refId, idempotencyKey) => {
          return Promise.resolve({
            success: true,
            balance: 100 + amount,
            transaction: {
              id: `tx_${Date.now()}`,
              userId,
              amount,
              type,
              source,
              referenceId: refId,
              idempotencyKey,
            },
          });
        },
      ),
  };

  const mockEmailService = {
    sendEmail: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardedAdsService,
        MonetizationService,
        AdminService,
        {
          provide: CoinLedgerService,
          useValue: mockCoinLedger,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    rewardedService = module.get<RewardedAdsService>(RewardedAdsService);
    monetizationService = module.get<MonetizationService>(MonetizationService);
    adminService = module.get<AdminService>(AdminService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Standard Google Ads Architecture & Safety', () => {
    it('should keep ads OFF by default', async () => {
      const isEnabled =
        await monetizationService.isFeatureEnabled('ENABLE_ADS');
      expect(isEnabled).toBe(false);
    });

    it('should reject forbidden ad placements (e.g. grid, numpad, timer, duel_controls)', async () => {
      const forbiddenPlacements = [
        'grid',
        'sudoku_grid',
        'numpad',
        'timer',
        'pause_button',
        'duel_controls',
        'auth_form',
      ];

      for (const placement of forbiddenPlacements) {
        await expect(
          adminService.updateAdSlot('test_forbidden_slot', { placement }),
        ).rejects.toThrow(BadRequestException);
      }
    });

    it('should allow valid editorial/content placements', async () => {
      const validSlot = await adminService.updateAdSlot(
        'home_between_sections',
        {
          placement: 'in_content',
          format: 'horizontal',
          deviceTarget: 'ALL',
          width: 728,
          height: 90,
        },
      );

      expect(validSlot).toBeDefined();
      expect(validSlot.slotName).toBe('home_between_sections');
    });

    it('should disable all ads with one-click master disable action', async () => {
      const result = await adminService.disableAllAds('admin_test_id');
      expect(result.success).toBe(true);
      const isAdsEnabled =
        await monetizationService.isFeatureEnabled('ENABLE_ADS');
      expect(isAdsEnabled).toBe(false);
    });
  });

  describe('2. Rewarded Ads Subsystem & Cryptographic Verification', () => {
    const testUserId = 'test_user_player_123';

    it('should refuse initiation if Rewarded Ads are globally disabled', async () => {
      await rewardedService.updateConfig({ enabled: false });

      await expect(rewardedService.initiateSession(testUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should initiate session and issue a cryptographically signed token when enabled', async () => {
      await rewardedService.updateConfig({
        enabled: true,
        rewardAmount: 20,
        dailyCap: 5,
        cooldownSeconds: 0, // 0 for test speed
      });

      const session = await rewardedService.initiateSession(testUserId);
      expect(session).toBeDefined();
      expect(session.sessionId).toMatch(/^rwd_/);
      expect(session.rewardToken).toContain('.');
      expect(session.rewardAmount).toBe(20);
    });

    it('should claim reward successfully and credit authoritative CoinLedger', async () => {
      await rewardedService.updateConfig({
        enabled: true,
        rewardAmount: 20,
        dailyCap: 5,
        cooldownSeconds: 0,
      });

      const session = await rewardedService.initiateSession(testUserId);
      const claimResult = await rewardedService.claimReward(
        testUserId,
        session.rewardToken,
      );

      expect(claimResult.success).toBe(true);
      expect(claimResult.rewardAmount).toBe(20);
      expect(mockCoinLedger.credit).toHaveBeenCalledTimes(1);
      expect(mockCoinLedger.credit).toHaveBeenCalledWith(
        testUserId,
        20,
        CoinTransactionType.AD_REWARD,
        'RewardedAd',
        session.sessionId,
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should reject replay attacks when attempting to claim the same token twice', async () => {
      await rewardedService.updateConfig({
        enabled: true,
        rewardAmount: 20,
        dailyCap: 5,
        cooldownSeconds: 0,
      });

      const session = await rewardedService.initiateSession(testUserId);
      await rewardedService.claimReward(testUserId, session.rewardToken);

      // Replay attempt
      await expect(
        rewardedService.claimReward(testUserId, session.rewardToken),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject token claimed by a different user than the initiator', async () => {
      await rewardedService.updateConfig({
        enabled: true,
        rewardAmount: 20,
        dailyCap: 5,
        cooldownSeconds: 0,
      });

      const session = await rewardedService.initiateSession(testUserId);
      const hackerUserId = 'hacker_user_999';

      await expect(
        rewardedService.claimReward(hackerUserId, session.rewardToken),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject tampered or invalid cryptographic signatures', async () => {
      const tamperedToken =
        'eyJ1c2VySWQiOiJ0ZXN0X3VzZXIifQ.tampered_signature_xyz';

      await expect(
        rewardedService.claimReward(testUserId, tamperedToken),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Audit Log & Rollback Architecture', () => {
    it('should track configuration changes and support audit retrieval', async () => {
      await adminService.updateAdSlot(
        'audit_test_slot',
        { placement: 'in_content', format: 'rectangle', height: 250 },
        'admin_1',
      );

      const logs = await adminService.getAdAuditHistory(10);
      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
    });
  });
});
