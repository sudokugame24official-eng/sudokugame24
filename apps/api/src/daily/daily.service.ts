import { Injectable, Logger } from '@nestjs/common';
import { prisma, Difficulty, CoinTransactionType } from '@repo/database';
import { SudokuGenerator } from '@repo/sudoku-engine';
import { CoinLedgerService } from '../coin-ledger/coin-ledger.service';

@Injectable()
export class DailyService {
  private readonly logger = new Logger(DailyService.name);

  constructor(private readonly coinLedger: CoinLedgerService) {}

  async getTodaysChallenge() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let challenge = await prisma.dailyChallenge.findUnique({
      where: { date: today },
      include: { puzzle: true },
    });

    if (!challenge) {
      this.logger.log('Generating new Daily Challenge for today');
      const puzzleData = SudokuGenerator.generate(Difficulty.MEDIUM as any);

      challenge = await prisma.dailyChallenge.create({
        data: {
          date: today,
          puzzle: {
            create: {
              initialBoard: puzzleData.initialBoard,
              solvedBoard: puzzleData.solvedBoard,
              difficulty: Difficulty.MEDIUM,
            },
          },
        },
        include: { puzzle: true },
      });
    }

    // Remove solvedBoard before sending to client for anti-cheat
    if (challenge && challenge.puzzle) {
      (challenge.puzzle as any).solvedBoard = null;
    }

    return challenge;
  }

  async startChallenge(userId: string, challengeId: string) {
    // We only allow starting the challenge for today (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (challenge.date.getTime() !== today.getTime()) {
      throw new Error("You can only start today's challenge");
    }

    // Check if already started
    const existing = await prisma.dailyChallengeEntry.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });

    if (existing) {
      if (existing.completed) {
        throw new Error('Challenge already completed');
      }
      return existing; // Resume
    }

    return prisma.dailyChallengeEntry.create({
      data: {
        challengeId,
        userId,
        score: 0,
        timeSec: 0,
        completed: false,
      },
    });
  }

  async submitEntry(
    userId: string,
    challengeId: string,
    finalBoard: any[][], // Add finalBoard
  ) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: challengeId },
      include: { puzzle: true }, // Need the puzzle to get solvedBoard
    });

    if (!challenge) throw new Error('Challenge not found');

    if (challenge.date.getTime() !== today.getTime()) {
      throw new Error('This challenge has expired or is not for today');
    }

    const entry = await prisma.dailyChallengeEntry.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });

    if (!entry || entry.completed) {
      throw new Error('Invalid state for submission');
    }

    // Server-Authoritative Anti-Cheat: Calculate score here
    let trueScore = 0;
    const solvedBoard = challenge.puzzle.solvedBoard as any[][];
    const initialBoard = challenge.puzzle.initialBoard as any[][];

    if (finalBoard && finalBoard.length === 9) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          // If cell was empty originally and now matches the solved board
          if (
            initialBoard[r][c] === 0 &&
            finalBoard[r][c] === solvedBoard[r][c]
          ) {
            trueScore += 5; // 5 coins per correct cell
          }
        }
      }
    }

    if (trueScore > 0) {
      await this.coinLedger.credit(
        userId,
        trueScore,
        CoinTransactionType.DAILY_REWARD,
        'DailyChallenge',
        challengeId,
        `daily_${challengeId}_${userId}`, // Idempotency key
      );
    }

    // Server-Authoritative Anti-Cheat: Calculate time strictly from server creation
    const finalTimeSec = Math.floor(
      (Date.now() - entry.createdAt.getTime()) / 1000,
    );

    // If they took more than 5 minutes (300s), they might have cheated or left the app.
    // We record the real time. If it's too long, they naturally rank at the bottom of the leaderboard.

    return prisma.dailyChallengeEntry.update({
      where: {
        challengeId_userId: {
          challengeId,
          userId,
        },
      },
      data: {
        score: trueScore,
        timeSec: finalTimeSec,
        completed: true,
      },
    });
  }

  async getLeaderboard(challengeId: string) {
    return prisma.dailyChallengeEntry.findMany({
      where: { challengeId, completed: true },
      orderBy: [
        { score: 'desc' },
        { timeSec: 'asc' }, // Less time is better if score is tied
      ],
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }
}
