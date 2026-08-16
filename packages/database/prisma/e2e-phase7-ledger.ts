import { PrismaClient, CoinTransactionType } from "@prisma/client";
import assert from "assert";

const prisma = new PrismaClient();

// Inlined from CoinLedgerService for isolated ts-node execution
class CoinLedgerService {
  async processTransaction(
    userId: string,
    amount: number,
    type: CoinTransactionType,
    source: string,
    referenceId?: string,
    idempotencyKey?: string,
    metadata?: any,
  ) {
    const result = await prisma.$transaction(async (tx) => {
      if (idempotencyKey) {
        const existing = await tx.coinTransaction.findUnique({
          where: { idempotencyKey },
        });
        if (existing) {
          return {
            success: true,
            balance: existing.balanceAfter,
            idempotencyHit: true,
            transaction: existing,
          };
        }
      }

      const profile = await tx.profile.findUnique({
        where: { userId },
        select: { coins: true },
      });
      if (!profile) throw new Error("User profile not found");

      const balanceBefore = profile.coins;
      const balanceAfter = balanceBefore + amount;

      if (balanceAfter < 0) throw new Error("Insufficient balance");

      const updatedProfile = await tx.profile.updateMany({
        where: { userId, coins: balanceBefore },
        data: { coins: balanceAfter },
      });

      if (updatedProfile.count === 0)
        throw new Error("Concurrent balance modification detected");

      const coinTx = await tx.coinTransaction.create({
        data: {
          userId,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          source,
          referenceId,
          idempotencyKey,
          metadata,
        },
      });

      return {
        success: true,
        balance: balanceAfter,
        idempotencyHit: false,
        transaction: coinTx,
      };
    });
    return result;
  }

  async credit(
    userId: string,
    amount: number,
    type: CoinTransactionType,
    source: string,
    referenceId?: string,
    idempotencyKey?: string,
  ) {
    return this.processTransaction(
      userId,
      amount,
      type,
      source,
      referenceId,
      idempotencyKey,
    );
  }

  async debit(
    userId: string,
    amount: number,
    type: CoinTransactionType,
    source: string,
    referenceId?: string,
    idempotencyKey?: string,
  ) {
    return this.processTransaction(
      userId,
      -amount,
      type,
      source,
      referenceId,
      idempotencyKey,
    );
  }
}

async function main() {
  console.log("--- STARTING PHASE 7 COIN LEDGER E2E TEST ---");

  const ledgerService = new CoinLedgerService();

  // 2. Cleanup
  await prisma.coinTransaction.deleteMany({
    where: { user: { email: "ledger@test.com" } },
  });
  await prisma.user.deleteMany({ where: { email: "ledger@test.com" } });

  // 3. Create User with 100 coins
  const user = await prisma.user.create({
    data: {
      email: "ledger@test.com",
      passwordHash: "hash",
      role: "MEMBER",
      profile: {
        create: { username: "LedgerTest", coins: 100 },
      },
    },
  });

  // 4. Test 1: Concurrency (Double Spend attempt)
  console.log("Testing Concurrency (Double Spend)...");
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      ledgerService
        .debit(user.id, 100, CoinTransactionType.SHOP_PURCHASE, "Store")
        .catch((e: any) => ({ success: false, message: e.message })),
    );
  }
  const results = await Promise.all(promises);

  const successCount = results.filter((r: any) => r.success === true).length;
  assert(
    successCount === 1,
    "Only one transaction should succeed in a concurrent double spend attack",
  );

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  assert(profile?.coins === 0, "Balance should not be negative");
  console.log("✅ Concurrency & Anti-Double Spend Verified");

  // 5. Test 2: Negative Balance Prevention
  console.log("Testing Negative Balance...");
  let negativeError = false;
  try {
    await ledgerService.debit(
      user.id,
      50,
      CoinTransactionType.SHOP_PURCHASE,
      "Store",
    );
  } catch (e: any) {
    negativeError = true;
  }
  assert(negativeError, "Should prevent negative balance");
  console.log("✅ Negative Balance Prevention Verified");

  // 6. Test 3: Idempotency
  console.log("Testing Idempotency...");
  await ledgerService.credit(
    user.id,
    500,
    CoinTransactionType.DAILY_REWARD,
    "Daily",
    "ref1",
    "idemp_key_1",
  );
  const balanceAfterFirst = (
    await prisma.profile.findUnique({ where: { userId: user.id } })
  )?.coins;
  assert(balanceAfterFirst === 500, "First transaction should succeed");

  const res2 = await ledgerService.credit(
    user.id,
    500,
    CoinTransactionType.DAILY_REWARD,
    "Daily",
    "ref1",
    "idemp_key_1",
  );
  const balanceAfterSecond = (
    await prisma.profile.findUnique({ where: { userId: user.id } })
  )?.coins;

  assert(res2.idempotencyHit === true, "Idempotency should trigger");
  assert(
    balanceAfterSecond === 500,
    "Balance should not change on duplicate idempotency key",
  );
  console.log("✅ Idempotency Verified");

  // 7. Cleanup
  await prisma.coinTransaction.deleteMany({
    where: { user: { email: "ledger@test.com" } },
  });
  await prisma.user.deleteMany({ where: { email: "ledger@test.com" } });
  console.log("✅ Cleanup complete");

  console.log("--- ALL LEDGER TESTS PASSED ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
