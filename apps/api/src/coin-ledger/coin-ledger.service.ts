import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { prisma, CoinTransactionType } from '@repo/database';

@Injectable()
export class CoinLedgerService {
  private readonly logger = new Logger(CoinLedgerService.name);

  /**
   * Internal method to process any coin transaction.
   * Uses Prisma transaction to ensure atomicity.
   */
  private async processTransaction(
    userId: string,
    amount: number,
    type: CoinTransactionType,
    source: string,
    referenceId?: string,
    idempotencyKey?: string,
    metadata?: any,
    externalTx?: any,
  ) {
    if (amount === 0) {
      this.logger.warn(
        `Attempted to process 0 amount transaction for user ${userId}`,
      );
      return { success: true, balance: undefined };
    }

    const logic = async (tx: any) => {
      // 1. Check idempotency if a key is provided
      if (idempotencyKey) {
        const existing = await tx.coinTransaction.findUnique({
          where: { idempotencyKey },
        });
        if (existing) {
          this.logger.warn(`Idempotency key hit for ${idempotencyKey}`);
          return {
            success: true,
            balance: existing.balanceAfter,
            idempotencyHit: true,
            transaction: existing,
          };
        }
      }

      // 2. Fetch current balance.
      const profile = await tx.profile.findUnique({
        where: { userId },
        select: { coins: true },
      });

      if (!profile) {
        throw new BadRequestException('User profile not found');
      }

      const balanceBefore = profile.coins;
      const balanceAfter = balanceBefore + amount;

      // 3. Invariants Check
      if (balanceAfter < 0) {
        throw new BadRequestException('Insufficient balance');
      }

      // 4. Update Profile
      const updatedProfile = await tx.profile.updateMany({
        where: {
          userId,
          coins: balanceBefore,
        },
        data: {
          coins: balanceAfter,
        },
      });

      if (updatedProfile.count === 0) {
        throw new ConflictException(
          'Concurrent balance modification detected, please retry',
        );
      }

      // 5. Create Ledger Entry
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
    };

    try {
      const result = externalTx
        ? await logic(externalTx)
        : await prisma.$transaction(logic);

      if (!result.idempotencyHit) {
        this.logger.log(
          `Transaction processed: User ${userId} | Amount ${amount} | New Balance: ${result.balance} | Type: ${type}`,
        );
      }
      return result;
    } catch (error) {
      if (error instanceof ConflictException) {
        this.logger.error(
          `Concurrent modification failed for user ${userId}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Failed to process transaction for user ${userId}`,
          error.stack,
        );
      }
      throw error;
    }
  }

  async credit(
    userId: string,
    amount: number,
    type: CoinTransactionType,
    source: string,
    referenceId?: string,
    idempotencyKey?: string,
    metadata?: any,
    tx?: any,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
    }
    return this.processTransaction(
      userId,
      amount,
      type,
      source,
      referenceId,
      idempotencyKey,
      metadata,
      tx,
    );
  }

  async debit(
    userId: string,
    amount: number,
    type: CoinTransactionType,
    source: string,
    referenceId?: string,
    idempotencyKey?: string,
    metadata?: any,
    tx?: any,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Debit amount must be positive');
    }
    return this.processTransaction(
      userId,
      -amount,
      type,
      source,
      referenceId,
      idempotencyKey,
      metadata,
      tx,
    );
  }

  async refund(
    userId: string,
    amount: number,
    source: string,
    referenceId?: string,
    idempotencyKey?: string,
    metadata?: any,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Refund amount must be positive');
    }
    return this.processTransaction(
      userId,
      amount,
      CoinTransactionType.REFUND,
      source,
      referenceId,
      idempotencyKey,
      metadata,
    );
  }

  async reverse(
    userId: string,
    amount: number,
    source: string,
    referenceId?: string,
    idempotencyKey?: string,
    metadata?: any,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Reverse amount must be positive');
    }
    return this.processTransaction(
      userId,
      -amount,
      CoinTransactionType.REVERSAL,
      source,
      referenceId,
      idempotencyKey,
      metadata,
    );
  }

  async grantAdmin(
    userId: string,
    amount: number,
    source: string,
    referenceId?: string,
    idempotencyKey?: string,
    metadata?: any,
  ) {
    return this.processTransaction(
      userId,
      amount,
      CoinTransactionType.ADMIN_GRANT,
      source,
      referenceId,
      idempotencyKey,
      metadata,
    );
  }
}
