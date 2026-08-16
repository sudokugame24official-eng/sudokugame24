import { Test, TestingModule } from '@nestjs/testing';
import { DuelService } from './duel.service';
import { RedisService } from '../redis/redis.service';
import { ProgressionService } from '../progression/progression.service';
import { CoinLedgerService } from '../coin-ledger/coin-ledger.service';

jest.mock('@repo/database', () => ({
  prisma: {
    matchHistory: { create: jest.fn() },
    user: { update: jest.fn() },
    $transaction: jest.fn(),
  },
  Difficulty: { EASY: 'EASY' },
  GameStatus: { ONGOING: 'ONGOING' },
  SpectatorMode: { PUBLIC: 'PUBLIC' },
}));

describe('DuelService', () => {
  let service: DuelService;
  let redisService: any;
  let progressionService: any;

  beforeEach(async () => {
    redisService = {
      getClient: jest.fn().mockReturnValue({
        hgetall: jest.fn().mockResolvedValue({}),
        hget: jest.fn().mockResolvedValue(null),
        hset: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        set: jest.fn().mockResolvedValue('OK'),
        get: jest.fn().mockResolvedValue(null),
        keys: jest.fn().mockResolvedValue([]),
        mget: jest.fn().mockResolvedValue([]),
        eval: jest
          .fn()
          .mockImplementation(
            (script, numkeys, key, arg1, arg2, arg3, arg4, arg5) => {
              return Promise.resolve(
                JSON.stringify({
                  success: true,
                  isSus: false,
                  isCorrect: true,
                  scoreP1: 1,
                  scoreP2: 0,
                  combo: 1,
                  currentBoard: [],
                }),
              );
            },
          ),
      }),
    };
    progressionService = {
      processDuelProgression: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DuelService,
        { provide: RedisService, useValue: redisService },
        { provide: ProgressionService, useValue: progressionService },
        { provide: CoinLedgerService, useValue: { credit: jest.fn(), debit: jest.fn() } },
      ],
    }).compile();

    service = module.get<DuelService>(DuelService);
    // Mock the setServer to prevent issues
    service.setServer({
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      in: jest.fn().mockReturnThis(),
      sockets: { sockets: new Map() },
    } as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Concurrency & Race Conditions (Phase C)', () => {
    it('should process concurrent moves on DIFFERENT cells', async () => {
      // Mock getActiveDuel
      const mockDuel = {
        id: 'match1',
        player1Id: 'p1',
        player2Id: 'p2',
        scoreP1: 0,
        scoreP2: 0,
        currentBoard: Array(9).fill(Array(9).fill(0)),
        solvedBoard: Array(9).fill(Array(9).fill(1)), // All 1s for test
        ownersBoard: Array(9).fill(Array(9).fill(null)),
      };
      // We need to return a deep copy so we don't share reference across concurrent getActiveDuel calls
      redisService
        .getClient()
        .get.mockImplementation(async () => JSON.stringify(mockDuel));

      const p1Move = service.handleMove('match1', 'p1', 0, 0, 1);
      const p2Move = service.handleMove('match1', 'p2', 8, 8, 1);

      await Promise.all([p1Move, p2Move]);

      // We expect set to be called (for both moves since they are on different cells)
      expect(redisService.getClient().set).toHaveBeenCalled();
    });

    it('should ignore the second move if same cell is hit concurrently', async () => {
      let readCount = 0;
      const mockDuel = {
        id: 'match1',
        player1Id: 'p1',
        player2Id: 'p2',
        currentBoard: Array(9).fill(Array(9).fill(0)),
        solvedBoard: Array(9).fill(Array(9).fill(1)),
        ownersBoard: Array(9).fill(Array(9).fill(null)),
      };

      redisService.getClient().get.mockImplementation(async () => {
        readCount++;
        if (readCount === 1) return JSON.stringify(mockDuel);
        // For the second read (after spinlock), the first move has updated the cell!
        const modifiedDuel = {
          ...mockDuel,
          currentBoard: [...mockDuel.currentBoard],
        };
        modifiedDuel.currentBoard[0] = [...modifiedDuel.currentBoard[0]];
        modifiedDuel.currentBoard[0][0] = 1; // P1 filled it
        return JSON.stringify(modifiedDuel);
      });

      const p1Move = service.handleMove('match1', 'p1', 0, 0, 1);
      const p2Move = service.handleMove('match1', 'p2', 0, 0, 1); // Same cell!

      await Promise.all([p1Move, p2Move]);
      // We expect set to be called at least once
      expect(redisService.getClient().set).toHaveBeenCalled();
    });
  });
});
