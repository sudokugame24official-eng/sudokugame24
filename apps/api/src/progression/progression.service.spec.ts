import { Test, TestingModule } from '@nestjs/testing';
import { ProgressionService } from './progression.service';
import { getLevelFromXp, Difficulty } from '@repo/database';

jest.mock('@repo/database', () => ({
  prisma: {
    profile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  Difficulty: {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
    EXPERT: 'EXPERT',
    MASTER: 'MASTER',
  },
  getLevelFromXp: jest.fn().mockReturnValue(2),
}));

describe('ProgressionService', () => {
  let service: ProgressionService;
  const db = require('@repo/database');

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgressionService],
    }).compile();

    service = module.get<ProgressionService>(ProgressionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processDuelProgression', () => {
    it('should correctly calculate XP for a win', async () => {
      db.prisma.profile.findUnique.mockResolvedValue({
        userId: 'p1',
        xp: 990,
        level: 1,
        elo: 1000,
        rating: 1000,
      });
      db.prisma.$transaction.mockResolvedValue([]);

      const result = await service.processDuelProgression(
        'match1',
        db.Difficulty.EASY,
        'p1',
        'p2',
        'p1',
        false,
      );

      // p1 wins EASY => 50 XP
      // Factor is 1 because ratingDiff is 0
      expect(result.p1Result?.xpEarned).toBe(50);
      expect(result.p1Result?.leveledUp).toBe(true);
      expect(result.p1Result?.newTotalXp).toBe(1040);

      expect(db.prisma.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'p1' },
          data: expect.objectContaining({ xp: 1040, level: 2 }),
        }),
      );
    });

    it('should apply penalty for bot match', async () => {
      db.prisma.profile.findUnique.mockResolvedValue({
        userId: 'p1',
        xp: 990,
        level: 1,
        elo: 1000,
        rating: 1000,
      });

      const result = await service.processDuelProgression(
        'match1',
        db.Difficulty.EASY,
        'p1',
        null,
        'p1',
        true,
      );

      // Base 50 * 0.3 = 15
      expect(result.p1Result?.xpEarned).toBe(15);
      expect(result.p1Result?.newTotalXp).toBe(1005);
    });
  });
});
