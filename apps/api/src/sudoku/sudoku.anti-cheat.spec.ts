import { SudokuService } from './sudoku.service';

jest.mock('@repo/database', () => {
  const actual = jest.requireActual('@repo/database');
  return {
    ...actual,
    prisma: {
      sudokuPuzzle: { create: jest.fn() },
      gameSession: { create: jest.fn() },
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('@repo/database');

const progressionStub = { awardXP: jest.fn() } as any;
const coinLedgerStub = { credit: jest.fn(), debit: jest.fn() } as any;

describe('Sudoku solo anti-cheat (P0-D regression)', () => {
  let service: SudokuService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SudokuService(progressionStub, coinLedgerStub);
  });

  it('NEVER includes solvedBoard in the start session response', async () => {
    (prisma.sudokuPuzzle.create as jest.Mock).mockResolvedValue({
      id: 'puzzle-1',
      difficulty: 'MEDIUM',
    });
    (prisma.gameSession.create as jest.Mock).mockResolvedValue({
      id: 'session-1',
    });

    const res = await service.startSession('user-1', 'MEDIUM' as any);

    expect(res).toHaveProperty('sessionId', 'session-1');
    expect(res).toHaveProperty('initialBoard');
    // THE anti-cheat regression assertion:
    expect(res).not.toHaveProperty('solvedBoard');
    expect(JSON.stringify(res)).not.toContain('"solvedBoard"');
  });

  it('still persists the solution server-side for submit validation', async () => {
    (prisma.sudokuPuzzle.create as jest.Mock).mockResolvedValue({ id: 'p2' });
    (prisma.gameSession.create as jest.Mock).mockResolvedValue({ id: 's2' });

    await service.startSession('user-1', 'EASY' as any);

    const createCall = (prisma.sudokuPuzzle.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.solvedBoard).toBeDefined();
    expect(createCall.data.initialBoard).toBeDefined();
  });
});
