import { ForbiddenException } from '@nestjs/common';
import { DailyService } from './daily.service';

jest.mock('@repo/database', () => ({
  prisma: {
    siteSettings: { findUnique: jest.fn(), upsert: jest.fn() },
    dailyChallenge: { findUnique: jest.fn(), create: jest.fn() },
    dailyChallengeEntry: { findUnique: jest.fn(), update: jest.fn() },
  },
}));
jest.mock('@repo/sudoku-engine', () => ({
  SudokuGenerator: {
    generate: jest.fn().mockReturnValue({
      initialBoard: Array.from({ length: 9 }, () => Array(9).fill(0)),
      solvedBoard: Array.from({ length: 9 }, (_, i) => Array(9).fill(i + 1)),
    }),
  },
}));

const { prisma } = require('@repo/database');

const { SudokuGenerator } = require('@repo/sudoku-engine');

const coinLedger = {
  credit: jest.fn().mockResolvedValue({}),
  debit: jest.fn(),
};

describe('P1-O: daily challenge admin configurability', () => {
  let service: DailyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DailyService(coinLedger as any);
  });

  it('returns safe defaults when no config is stored', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue(null);
    const cfg = await service.getDailyConfig();
    expect(cfg).toMatchObject({
      enabled: true,
      difficulty: 'MEDIUM',
      coinRewardPerCell: 5,
      maxAttempts: 1,
    });
  });

  it('corrupt stored JSON falls back to defaults (never crashes the daily)', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({
      value: '{not json',
    });
    const cfg = await service.getDailyConfig();
    expect(cfg.difficulty).toBe('MEDIUM');
  });

  it('update merges the patch and persists as JSON', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.siteSettings.upsert as jest.Mock).mockResolvedValue({});

    const cfg = await service.updateDailyConfig({
      difficulty: 'EXPERT',
      coinRewardPerCell: 8,
    });

    expect(cfg.difficulty).toBe('EXPERT');
    expect(cfg.coinRewardPerCell).toBe(8);
    expect(cfg.enabled).toBe(true); // untouched keys preserved
    const call = (prisma.siteSettings.upsert as jest.Mock).mock.calls[0][0];
    expect(call.where.key).toBe('daily_config');
    expect(JSON.parse(call.update.value)).toMatchObject({
      difficulty: 'EXPERT',
    });
  });

  it('DISABLED daily -> getTodaysChallenge throws (fail-closed)', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({
      value: JSON.stringify({ enabled: false }),
    });
    await expect(service.getTodaysChallenge()).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('auto-generation uses the CONFIGURED difficulty', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({
      value: JSON.stringify({ difficulty: 'HARD' }),
    });
    (prisma.dailyChallenge.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.dailyChallenge.create as jest.Mock).mockImplementation(
      ({ data, include }) => ({
        id: 'c1',
        date: data.date,
        puzzle: { solvedBoard: 'X', initialBoard: [] },
      }),
    );

    await service.getTodaysChallenge();

    expect(SudokuGenerator.generate).toHaveBeenCalledWith('HARD');
    const createCall = (prisma.dailyChallenge.create as jest.Mock).mock
      .calls[0][0];
    expect(createCall.data.puzzle.create.difficulty).toBe('HARD');
  });

  it('publishToday refuses to overwrite an existing challenge (players may have entries)', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.dailyChallenge.findUnique as jest.Mock).mockResolvedValue({
      id: 'exists',
    });

    await expect(service.publishToday()).rejects.toThrow('existe déjà');
    expect(prisma.dailyChallenge.create).not.toHaveBeenCalled();
  });

  it('publishToday creates the challenge with featured/announcement from config', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({
      value: JSON.stringify({
        featured: true,
        announcement: 'Big tournament week!',
      }),
    });
    (prisma.dailyChallenge.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.dailyChallenge.create as jest.Mock).mockImplementation(
      ({ data }) => ({
        id: 'c1',
        date: data.date,
        puzzle: { initialBoard: [] },
      }),
    );

    const challenge = await service.publishToday('EXPERT');

    const call = (prisma.dailyChallenge.create as jest.Mock).mock.calls[0][0];
    expect(call.data.featured).toBe(true);
    expect(call.data.announcement).toBe('Big tournament week!');
    expect(call.data.puzzle.create.difficulty).toBe('EXPERT'); // explicit override wins
    expect((challenge.puzzle as any).solvedBoard).toBeNull(); // anti-cheat mask
  });

  it('previewTomorrow does NOT persist anything', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue(null);

    const preview = await service.previewTomorrow();

    expect(preview.difficulty).toBe('MEDIUM');
    expect(preview.emptyCells).toBe(81);
    expect((preview as any).solvedBoard).toBeUndefined();
    expect(prisma.dailyChallenge.create).not.toHaveBeenCalled();
  });
});
