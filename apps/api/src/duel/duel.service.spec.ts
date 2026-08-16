import { Test, TestingModule } from '@nestjs/testing';
import { DuelService } from './duel.service';
import { RedisService } from '../redis/redis.service';
import { ProgressionService } from '../progression/progression.service';
import { CoinLedgerService } from '../coin-ledger/coin-ledger.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RedisMock = require('ioredis-mock');

jest.mock('@repo/database', () => ({
  prisma: {
    matchHistory: { create: jest.fn() },
    duelMatch: { update: jest.fn(), create: jest.fn() },
    user: { update: jest.fn() },
    $transaction: jest.fn(),
  },
  Difficulty: { EASY: 'EASY', MEDIUM: 'MEDIUM' },
  GameStatus: { ONGOING: 'ONGOING' },
  SpectatorMode: { PUBLIC: 'PUBLIC' },
  CoinTransactionType: { DUEL_WAGER: 'DUEL_WAGER', DUEL_WIN: 'DUEL_WIN' },
}));

function makeDuel(): any {
  const empty = () => Array.from({ length: 9 }, () => Array(9).fill(0));
  const ones = () => Array.from({ length: 9 }, () => Array(9).fill(1));
  return {
    id: 'm1',
    player1Id: 'p1',
    player2Id: 'p2',
    startTime: Date.now() - 1000,
    scoreP1: 0,
    scoreP2: 0,
    comboP1: 0,
    comboP2: 0,
    riskScoreP1: 0,
    riskScoreP2: 0,
    lastMoveTimeP1: 0,
    lastMoveTimeP2: 0,
    currentBoard: empty(),
    solvedBoard: ones(),
    ownersBoard: empty(),
    isBotMatch: false,
    difficulty: 'EASY',
    betAmount: 10,
  };
}

describe('DuelService.atomicHandleMove — P0-E concurrency regression', () => {
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

  const key = 'duel:active:m1';
  const move = (userId: string, r: number, c: number, val = 1) =>
    (service as any).atomicHandleMove('m1', userId, r, c, val, Date.now());

  const loadState = async () => JSON.parse(await redis.get(key));

  it('rejects spectator and invalid moves without touching state', async () => {
    await redis.set(key, JSON.stringify(makeDuel()), 'EX', 3600);

    const spectator = await move('intruder', 0, 0, 1);
    const zero = await move('p1', 0, 0, 0);
    const occupiedLater = await move('p1', 0, 0, 1);
    expect(spectator.error).toBe('spectator');
    expect(zero.error).toBe('invalid_move');
    expect(occupiedLater.success).toBe(true);

    const state = await loadState();
    expect(state.currentBoard[0][0]).toBe(1);
  });

  it('applies exactly ONE move when both players hit the SAME cell concurrently', async () => {
    await redis.set(key, JSON.stringify(makeDuel()), 'EX', 3600);

    const results = await Promise.all([move('p1', 0, 0, 1), move('p2', 0, 0, 1)]);

    const state = await loadState();
    // The cell is owned by exactly one player and scores sum to 1
    const succeeded = results.filter((r: any) => r.success);
    expect(state.scoreP1 + state.scoreP2).toBe(1);
    expect(state.currentBoard[0][0]).toBe(1);
    expect(succeeded.length).toBeGreaterThanOrEqual(1);
  });

  it('loses NO update when 10 concurrent moves target 10 DISTINCT cells', async () => {
    await redis.set(key, JSON.stringify(makeDuel()), 'EX', 3600);

    const moves: Promise<any>[] = [];
    for (let i = 0; i < 10; i++) {
      moves.push(move(i % 2 === 0 ? 'p1' : 'p2', 0, i, 1));
    }
    const results = await Promise.all(moves);

    const state = await loadState();
    const applied = results.filter((r: any) => r.success).length;
    let filled = 0;
    for (let c = 0; c < 10 && c < 9; c++) if (state.currentBoard[0][c] === 1) filled++;

    expect(filled).toBe(9); // 9 columns max
    expect(applied).toBe(9);
    expect(state.scoreP1 + state.scoreP2).toBe(9);
  });

  it('rejects a replayed/duplicate move on an already-filled cell', async () => {
    await redis.set(key, JSON.stringify(makeDuel()), 'EX', 3600);

    const first = await move('p1', 4, 4, 1);
    const replay = await move('p1', 4, 4, 1);

    expect(first.success).toBe(true);
    expect(replay.error).toBe('invalid_move');
  });

  it('PRESERVES the duel TTL after a move (regression: plain SET dropped it)', async () => {
    await redis.set(key, JSON.stringify(makeDuel()), 'EX', 3600);

    await move('p1', 1, 1, 1);

    const ttl = await redis.ttl(key);
    expect(ttl).toBeGreaterThan(3000);
    expect(ttl).toBeLessThanOrEqual(3600);
  });

  it('decrements score and resets combo on a WRONG value', async () => {
    await redis.set(key, JSON.stringify(makeDuel()), 'EX', 3600);

    await move('p1', 0, 0, 1); // correct (+1, combo 1)
    const wrong = await move('p1', 0, 1, 5); // wrong (solvedBoard is all 1s)

    expect(wrong.isCorrect).toBe(false);
    const state = await loadState();
    expect(state.scoreP1).toBe(0);
    expect(state.comboP1).toBe(0);
    expect(state.currentBoard[0][1]).toBe(0);
  });
});
