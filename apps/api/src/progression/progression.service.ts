import { Injectable, Logger } from '@nestjs/common';
import { prisma, Difficulty, getLevelFromXp } from '@repo/database';

export interface XpRewardResult {
  xpEarned: number;
  newTotalXp: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
}

@Injectable()
export class ProgressionService {
  /**
   * Process progression after a solo game.
   */
  async awardXP(userId: string, difficulty: Difficulty, timeSec: number, won: boolean): Promise<XpRewardResult> {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new Error('Profile not found');

    if (!won) {
      return {
        xpEarned: 0,
        newTotalXp: profile.xp,
        oldLevel: profile.level,
        newLevel: profile.level,
        leveledUp: false,
      };
    }

    // Base XP derived from difficulty
    let xpEarned = 50 * this.diffMultiplier[difficulty];

    // Speed bonus
    let expectedTime = 0;
    switch(difficulty) {
      case Difficulty.EASY: expectedTime = 300; break;
      case Difficulty.MEDIUM: expectedTime = 600; break;
      case Difficulty.HARD: expectedTime = 1200; break;
      case Difficulty.EXPERT: expectedTime = 2400; break;
      case Difficulty.MASTER: expectedTime = 3600; break;
    }
    
    if (timeSec < expectedTime && timeSec > 30) {
      // Up to 50% extra XP for speed
      const speedFactor = 1 + (0.5 * (expectedTime - timeSec) / expectedTime);
      xpEarned = Math.floor(xpEarned * speedFactor);
    }

    const newTotalXp = profile.xp + xpEarned;
    const newLevel = getLevelFromXp(newTotalXp);

    // Streak logic
    const now = new Date();
    let currentStreak = profile.currentStreak;
    let longestStreak = profile.longestStreak;

    if (profile.lastPlayedDate) {
      const lastPlayed = new Date(profile.lastPlayedDate);
      const diffTime = Math.abs(now.getTime() - lastPlayed.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak += 1;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
      longestStreak = 1;
    }

    await prisma.profile.update({
      where: { userId },
      data: {
        xp: newTotalXp,
        level: newLevel,
        currentStreak,
        longestStreak,
        lastPlayedDate: now,
      },
    });

    return {
      xpEarned,
      newTotalXp,
      oldLevel: profile.level,
      newLevel,
      leveledUp: newLevel > profile.level,
    };
  }
  private readonly logger = new Logger(ProgressionService.name);

  // Difficulty multipliers
  private readonly diffMultiplier: Record<Difficulty, number> = {
    [Difficulty.EASY]: 1.0,
    [Difficulty.MEDIUM]: 1.5,
    [Difficulty.HARD]: 2.5,
    [Difficulty.EXPERT]: 4.0,
    [Difficulty.MASTER]: 6.0,
  };

  /**
   * Process progression after a duel.
   * Calculates XP for both players transactionally.
   */
  async processDuelProgression(
    matchId: string,
    difficulty: Difficulty,
    player1Id: string,
    player2Id: string | null,
    winnerId: string | null,
    isBotMatch: boolean,
  ): Promise<{
    p1Result: XpRewardResult | null;
    p2Result: XpRewardResult | null;
  }> {
    // Fetch current profiles
    const [p1Profile, p2Profile] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: player1Id } }),
      player2Id
        ? prisma.profile.findUnique({ where: { userId: player2Id } })
        : Promise.resolve(null),
    ]);

    if (!p1Profile) return { p1Result: null, p2Result: null };

    // Base XP derived from difficulty
    const baseWinXp = 50 * this.diffMultiplier[difficulty];
    const baseLossXp = 10 * this.diffMultiplier[difficulty];
    const baseDrawXp = 25 * this.diffMultiplier[difficulty];

    let p1XpEarned = 0;
    let p2XpEarned = 0;

    if (winnerId === player1Id) {
      p1XpEarned = baseWinXp;
      p2XpEarned = baseLossXp;
    } else if (winnerId === player2Id) {
      p1XpEarned = baseLossXp;
      p2XpEarned = baseWinXp;
    } else {
      // Draw or Timeout without winner
      p1XpEarned = baseDrawXp;
      p2XpEarned = baseDrawXp;
    }

    // Anti-farming & Rating adjustment
    if (isBotMatch) {
      // Bot matches give -70% XP
      p1XpEarned = Math.max(1, Math.floor(p1XpEarned * 0.3));
    } else if (p1Profile && p2Profile) {
      // Adjust XP based on rating difference (simple factor)
      const p1Rating = p1Profile.rating;
      const p2Rating = p2Profile.rating;

      const ratingDiff = p1Rating - p2Rating;

      if (winnerId === player1Id) {
        // P1 won. If P1 is much higher rated, they get less XP (min 50%). If lower rated, they get more (max 200%).
        const factor = Math.max(0.5, Math.min(2.0, 1 + ratingDiff * -0.001));
        p1XpEarned = Math.max(1, Math.floor(p1XpEarned * factor));

        // P2 lost against stronger player? Less penalty on participation, maybe? Let's just keep standard loss XP.
      } else if (winnerId === player2Id) {
        // P2 won.
        const factor = Math.max(0.5, Math.min(2.0, 1 + ratingDiff * 0.001));
        p2XpEarned = Math.max(1, Math.floor(p2XpEarned * factor));
      }
    }

    // Transaction to update both
    const queries: any[] = [];

    // We only update XP and Streak. The level is calculated dynamically, but we cache it in DB for queries
    const p1NewTotalXp = p1Profile.xp + p1XpEarned;
    const p1NewLevel = getLevelFromXp(p1NewTotalXp);

    // Streak logic P1
    const now = new Date();
    let p1CurrentStreak = p1Profile.currentStreak;
    let p1LongestStreak = p1Profile.longestStreak;

    if (p1Profile.lastPlayedDate) {
      const lastPlayed = new Date(p1Profile.lastPlayedDate);
      const diffTime = Math.abs(now.getTime() - lastPlayed.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        p1CurrentStreak += 1;
        if (p1CurrentStreak > p1LongestStreak)
          p1LongestStreak = p1CurrentStreak;
      } else if (diffDays > 1) {
        p1CurrentStreak = 1;
      }
    } else {
      p1CurrentStreak = 1;
      p1LongestStreak = 1;
    }

    queries.push(
      prisma.profile.update({
        where: { userId: player1Id },
        data: {
          xp: p1NewTotalXp,
          level: p1NewLevel,
          currentStreak: p1CurrentStreak,
          longestStreak: p1LongestStreak,
          lastPlayedDate: now,
        },
      }),
    );

    let p2Result: XpRewardResult | null = null;

    if (player2Id && p2Profile && !isBotMatch) {
      const p2NewTotalXp = p2Profile.xp + p2XpEarned;
      const p2NewLevel = getLevelFromXp(p2NewTotalXp);

      // Streak logic P2
      let p2CurrentStreak = p2Profile.currentStreak;
      let p2LongestStreak = p2Profile.longestStreak;

      if (p2Profile.lastPlayedDate) {
        const lastPlayed = new Date(p2Profile.lastPlayedDate);
        const diffTime = Math.abs(now.getTime() - lastPlayed.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          p2CurrentStreak += 1;
          if (p2CurrentStreak > p2LongestStreak)
            p2LongestStreak = p2CurrentStreak;
        } else if (diffDays > 1) {
          p2CurrentStreak = 1;
        }
      } else {
        p2CurrentStreak = 1;
        p2LongestStreak = 1;
      }

      queries.push(
        prisma.profile.update({
          where: { userId: player2Id },
          data: {
            xp: p2NewTotalXp,
            level: p2NewLevel,
            currentStreak: p2CurrentStreak,
            longestStreak: p2LongestStreak,
            lastPlayedDate: now,
          },
        }),
      );

      p2Result = {
        xpEarned: p2XpEarned,
        newTotalXp: p2NewTotalXp,
        oldLevel: p2Profile.level,
        newLevel: p2NewLevel,
        leveledUp: p2NewLevel > p2Profile.level,
      };
    }

    await prisma.$transaction(queries);

    const p1Result: XpRewardResult = {
      xpEarned: p1XpEarned,
      newTotalXp: p1NewTotalXp,
      oldLevel: p1Profile.level,
      newLevel: p1NewLevel,
      leveledUp: p1NewLevel > p1Profile.level,
    };

    return { p1Result, p2Result };
  }
}
