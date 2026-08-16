import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';

export interface GameModeConfig {
  enabled: boolean;
  minLevel: number;
  description: string;
  maxWager?: number; // duel-family only
}

export type GameModeKey =
  | 'CLASSIC'
  | 'DAILY'
  | 'DUEL'
  | 'FRIEND_DUEL'
  | 'TOURNAMENT'
  | 'SPECTATOR'
  | 'PUZZLE_CHALLENGE';

const GAME_MODES_KEY = 'game_modes';

/**
 * P1-P: single source of truth for game modes.
 * Implemented modes are enabled by default; future modes (TOURNAMENT,
 * SPECTATOR, PUZZLE_CHALLENGE) ship DISABLED and therefore never appear in
 * the UI until the owner turns them on.
 */
const DEFAULT_MODES: Record<GameModeKey, GameModeConfig> = {
  CLASSIC: { enabled: true, minLevel: 1, description: 'Free solo sudoku, any difficulty.' },
  DAILY: { enabled: true, minLevel: 1, description: 'One shared challenge per day (UTC).' },
  DUEL: { enabled: true, minLevel: 3, description: 'Ranked 1v1 duels with optional wagers.', maxWager: 500 },
  FRIEND_DUEL: { enabled: true, minLevel: 3, description: 'Private duels against friends.', maxWager: 500 },
  TOURNAMENT: { enabled: false, minLevel: 5, description: 'Timed tournaments (coming later).' },
  SPECTATOR: { enabled: false, minLevel: 1, description: 'Watch live duels (coming later).' },
  PUZZLE_CHALLENGE: { enabled: false, minLevel: 2, description: 'Curated puzzle challenges (coming later).' },
};

@Injectable()
export class GameModesService {
  async getAllModes(): Promise<Record<GameModeKey, GameModeConfig>> {
    const row = await prisma.siteSettings.findUnique({ where: { key: GAME_MODES_KEY } });
    if (!row) return structuredClone(DEFAULT_MODES);
    try {
      const stored = JSON.parse(String(row.value)) as Partial<Record<GameModeKey, Partial<GameModeConfig>>>;
      const merged = structuredClone(DEFAULT_MODES);
      for (const key of Object.keys(DEFAULT_MODES) as GameModeKey[]) {
        if (stored[key]) {
          merged[key] = { ...merged[key], ...stored[key] };
        }
      }
      return merged;
    } catch {
      return structuredClone(DEFAULT_MODES);
    }
  }

  /** Public view: only ENABLED modes — a disabled mode disappears entirely. */
  async getPublicModes() {
    const all = await this.getAllModes();
    const visible: Record<string, GameModeConfig> = {};
    for (const [key, cfg] of Object.entries(all)) {
      if (cfg.enabled) visible[key] = cfg;
    }
    return visible;
  }

  async updateMode(mode: string, patch: Partial<GameModeConfig>) {
    if (!(mode in DEFAULT_MODES)) {
      throw new Error('Mode de jeu inconnu.');
    }
    const all = await this.getAllModes();
    const merged: GameModeConfig = { ...all[mode as GameModeKey], ...patch };
    if (merged.minLevel < 1) merged.minLevel = 1;
    if (merged.maxWager !== undefined && merged.maxWager < 0) merged.maxWager = 0;
    all[mode as GameModeKey] = merged;

    await prisma.siteSettings.upsert({
      where: { key: GAME_MODES_KEY },
      update: { value: JSON.stringify(all) },
      create: { key: GAME_MODES_KEY, value: JSON.stringify(all) },
    });
    return all;
  }
}
