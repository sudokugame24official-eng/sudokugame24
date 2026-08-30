import { Test, TestingModule } from '@nestjs/testing';
import { CoinLedgerService } from './coin-ledger.service';
import { prisma, CoinTransactionType } from '@repo/database';
import { BadRequestException } from '@nestjs/common';

describe('CoinLedgerService - Integration & Concurrency', () => {
  let service: CoinLedgerService;
  let testUserId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoinLedgerService],
    }).compile();

    service = module.get<CoinLedgerService>(CoinLedgerService);

    // Create a dummy user for tests
    const user = await prisma.user.create({
      data: {
        email: `test_${Date.now()}@test.com`,
        profile: {
          create: {
            username: `tester_${Date.now()}`,
            coins: 100, // Initial balance for concurrency tests
          },
        },
      },
      include: { profile: true },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('Concurrency & Race Conditions', () => {
    it('should handle 100 concurrent requests trying to debit 80 coins from a 100 coin balance and only succeed ONCE', async () => {
      const promises: Promise<any>[] = [];
      const TOTAL_REQUESTS = 100;
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < TOTAL_REQUESTS; i++) {
        promises.push(
          service
            .debit(
              testUserId,
              80,
              CoinTransactionType.SHOP_PURCHASE,
              'Test_Concurrency',
              `req_${i}`,
            )
            .then(() => {
              successCount++;
            })
            .catch((e) => {
              if (
                e instanceof BadRequestException ||
                e.status === 400 ||
                e.status === 409 ||
                e.name === 'PrismaClientKnownRequestError' ||
                e.message?.includes('Transaction')
              ) {
                failureCount++;
              } else {
                throw e; // Unexpected error
              }
            }),
        );
      }

      await Promise.allSettled(promises);

      // Verify the results
      const profile = await prisma.profile.findUnique({
        where: { userId: testUserId },
      });

      expect(successCount).toBe(1);
      expect(failureCount).toBe(99);
      expect(profile?.coins).toBe(20);
    });

    it('should handle 100 concurrent reward requests with the SAME idempotency key and only reward ONCE', async () => {
      // First, reset balance to 0 for easier assertions (or 20 from previous test)
      const idempotencyKey = `daily_reward_${Date.now()}`;

      const promises: Promise<any>[] = [];
      const TOTAL_REQUESTS = 100;

      for (let i = 0; i < TOTAL_REQUESTS; i++) {
        promises.push(
          service
            .credit(
              testUserId,
              50,
              CoinTransactionType.DAILY_REWARD,
              'Test_Idempotency',
              `reward_req_${i}`,
              idempotencyKey,
            )
            .catch((e) => {
              if (
                e.status === 409 ||
                e.status === 400 ||
                e.name === 'ConflictException' ||
                e.name === 'PrismaClientKnownRequestError' ||
                e.message?.includes('Transaction')
              ) {
                return { success: false, error: e };
              }
              throw e;
            }),
        );
      }

      const results = await Promise.all(promises);

      const successResults = results.filter(
        (r) => r.success && !r.idempotencyHit,
      );
      const idempotencyHits = results.filter(
        (r) => r.success && r.idempotencyHit,
      );
      const conflictFailures = results.filter((r) => !r.success);

      const profile = await prisma.profile.findUnique({
        where: { userId: testUserId },
      });

      // Expected: 1 actual credit, 99 requests that either hit idempotency or optimistic lock failure
      expect(successResults.length).toBe(1);
      expect(idempotencyHits.length + conflictFailures.length).toBe(99);
      expect(profile?.coins).toBe(70); // 20 from previous test + 50
    });
  });

  describe('Financial Invariants', () => {
    it('should rollback and throw error if balance falls below 0', async () => {
      const currentProfile = await prisma.profile.findUnique({
        where: { userId: testUserId },
      });
      const currentBalance = currentProfile!.coins;

      try {
        await service.debit(
          testUserId,
          currentBalance + 10,
          CoinTransactionType.SHOP_PURCHASE,
          'Test_Invariant',
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }

      const newProfile = await prisma.profile.findUnique({
        where: { userId: testUserId },
      });
      expect(newProfile?.coins).toBe(currentBalance); // Unchanged
    });

    it('should not allow zero or negative amounts', async () => {
      await expect(
        service.credit(
          testUserId,
          -50,
          CoinTransactionType.ADMIN_GRANT,
          'Test_Negative',
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.debit(
          testUserId,
          0,
          CoinTransactionType.ADMIN_GRANT,
          'Test_Zero',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
