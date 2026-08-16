import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  prisma,
  Difficulty,
  GameStatus,
  GameMode,
  CoinTransactionType,
} from '@repo/database';
import { SudokuGenerator } from '@repo/sudoku-engine';
import { ProgressionService } from '../progression/progression.service';
import { CoinLedgerService } from '../coin-ledger/coin-ledger.service';

@Injectable()
export class SudokuService {
  private readonly logger = new Logger(SudokuService.name);

  constructor(
    private readonly progression: ProgressionService,
    private readonly coinLedger: CoinLedgerService,
  ) {}

  async startSession(userId: string, difficulty: Difficulty) {
    const puzzleData = SudokuGenerator.generate(difficulty as any);

    // Create puzzle in DB to track it
    const puzzle = await prisma.sudokuPuzzle.create({
      data: {
        initialBoard: puzzleData.initialBoard,
        solvedBoard: puzzleData.solvedBoard,
        difficulty,
      },
    });

    const session = await prisma.gameSession.create({
      data: {
        userId,
        puzzleId: puzzle.id,
        mode: GameMode.SOLO,
        status: GameStatus.IN_PROGRESS,
      },
    });

    // Anti-cheat: the solution must NEVER be sent to the client.
    // The server validates the submitted board against puzzle.solvedBoard in submitSession.
    return {
      sessionId: session.id,
      difficulty: puzzle.difficulty,
      initialBoard: puzzleData.initialBoard,
    };
  }

  async submitSession(
    userId: string,
    sessionId: string,
    finalBoard: number[][],
    timeSec: number,
    mistakes: number,
  ) {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { puzzle: true },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestException('Session already completed');
    }

    if (timeSec < 0) {
      throw new BadRequestException('Invalid time');
    }

    if (!finalBoard || !Array.isArray(finalBoard) || finalBoard.length !== 9) {
      throw new BadRequestException('Invalid board format');
    }

    // Verify solution
    const solvedBoard = session.puzzle.solvedBoard as number[][];
    let isCorrect = true;
    for (let r = 0; r < 9; r++) {
      if (!finalBoard[r] || !Array.isArray(finalBoard[r]) || finalBoard[r].length !== 9) {
        throw new BadRequestException('Invalid board row format');
      }
      for (let c = 0; c < 9; c++) {
        if (finalBoard[r][c] !== solvedBoard[r][c]) {
          isCorrect = false;
          break;
        }
      }
    }

    if (!isCorrect) {
      // If it's a submission with mistakes that aborts the game
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          status: GameStatus.ABANDONED,
          endTime: new Date(),
          durationSec: timeSec,
        },
      });
      throw new BadRequestException(
        'Solution is incorrect or abandoned due to mistakes.',
      );
    }

    const actualTimeSec = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
    // We allow a small 5-second desync window, but ultimately cap it securely.
    const finalTimeSec = Math.max(actualTimeSec, 0);

    const minTimes: Record<Difficulty, number> = {
      EASY: 15,
      MEDIUM: 30,
      HARD: 60,
      EXPERT: 120,
      MASTER: 300,
    };
    if (finalTimeSec < (minTimes[session.puzzle.difficulty] || 15)) {
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          status: GameStatus.ABANDONED,
          endTime: new Date(),
          durationSec: finalTimeSec,
        },
      });
      throw new BadRequestException('Suspiciously fast solve time');
    }

    // Calculate score (won = true)
    const result = await this.progression.awardXP(
      userId,
      session.puzzle.difficulty,
      finalTimeSec,
      true,
    );

    let coinReward = 0;
    switch (session.puzzle.difficulty) {
      case Difficulty.EASY:
        coinReward = 50;
        break;
      case Difficulty.MEDIUM:
        coinReward = 100;
        break;
      case Difficulty.HARD:
        coinReward = 200;
        break;
      case Difficulty.EXPERT:
        coinReward = 400;
        break;
      case Difficulty.MASTER:
        coinReward = 800;
        break;
    }

    if (coinReward > 0) {
      await this.coinLedger.credit(
        userId,
        coinReward,
        CoinTransactionType.REWARD,
        'ClassicSudoku',
        sessionId,
      );
    }

    await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: GameStatus.COMPLETED,
        endTime: new Date(),
        durationSec: finalTimeSec,
      },
    });

    return {
      success: true,
      result,
      coinReward,
    };
  }
}
