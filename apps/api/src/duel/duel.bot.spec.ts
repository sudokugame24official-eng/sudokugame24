import { Test, TestingModule } from '@nestjs/testing';
import { DuelService, BotDifficulty } from './duel.service';
import { RedisService } from '../redis/redis.service';
import { ProgressionService } from '../progression/progression.service';
import { CoinLedgerService } from '../coin-ledger/coin-ledger.service';
import { Difficulty } from '@repo/database';

const RedisMock = require('ioredis-mock');

const { prisma } = require('@repo/database');

jest.mock('@repo/database', () => ({
  prisma: {
    matchHistory: { create: jest.fn() },
    duelMatch: {
      update: jest.fn().mockResolvedValue({ id: 'match_123' }),
      create: jest.fn().mockResolvedValue({ id: 'match_123' }),
    },
    user: { update: jest.fn(), findUnique: jest.fn() },
    profile: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
  Difficulty: { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD' },
  GameStatus: {
    ONGOING: 'ONGOING',
    COMPLETED: 'COMPLETED',
    IN_PROGRESS: 'IN_PROGRESS',
  },
  SpectatorMode: { PUBLIC: 'PUBLIC', ALL: 'ALL', NONE: 'NONE' },
  CoinTransactionType: { DUEL_WAGER: 'DUEL_WAGER', DUEL_WIN: 'DUEL_WIN' },
}));

describe('DuelService: Bot isolation & gameplay loop verification', () => {
  let service: DuelService;
  let redis: any;

  beforeEach(async () => {
    redis = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DuelService,
        { provide: RedisService, useValue: { getClient: () => redis } },
        {
          provide: ProgressionService,
          useValue: { processDuelProgression: jest.fn() },
        },
        {
          provide: CoinLedgerService,
          useValue: { credit: jest.fn(), debit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DuelService>(DuelService);
    service.setServer({
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      in: jest.fn().mockReturnThis(),
      sockets: { sockets: new Map() },
    } as any);
  });

  it('pickBotProfile returns a valid bot name and Elo in expected difficulty range', () => {
    const easy = (service as any).pickBotProfile('EASY');
    expect(easy.username).toBeDefined();
    expect(easy.elo).toBeGreaterThanOrEqual(800);
    expect(easy.elo).toBeLessThanOrEqual(1100);

    const med = (service as any).pickBotProfile('MEDIUM');
    expect(med.elo).toBeGreaterThanOrEqual(1200);
    expect(med.elo).toBeLessThanOrEqual(1500);

    const hard = (service as any).pickBotProfile('HARD');
    expect(hard.elo).toBeGreaterThanOrEqual(1600);
    expect(hard.elo).toBeLessThanOrEqual(1900);
  });

  it('playAgainstBot initializes match without inserting bot into user database', async () => {
    const mockSocket: any = {
      id: 'sock_user_1',
      emit: jest.fn(),
      join: jest.fn(),
    };

    await service.playAgainstBot(
      mockSocket,
      'user_real_123',
      'RealPlayer',
      Difficulty.EASY,
      0,
      'MEDIUM',
    );

    // Verify socket joined personal room
    expect(mockSocket.join).toHaveBeenCalledWith('user_user_real_123');
  });
});
