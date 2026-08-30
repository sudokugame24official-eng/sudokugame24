import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';

export interface HomepageSection {
  id: string;
  type:
    | 'hero'
    | 'play'
    | 'daily'
    | 'duel'
    | 'leaderboard'
    | 'academy'
    | 'forum'
    | 'qa'
    | 'stats'
    | 'cta';
  enabled: boolean;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  variant: 'default' | 'compact' | 'banner';
}

const KEY_DRAFT = 'homepage_sections_draft';
const KEY_PUBLISHED = 'homepage_sections';

/**
 * P1-Y: configurable homepage sections. Defaults mirror the CURRENT homepage
 * order so publishing the default configuration changes nothing.
 * All strings are plain text — the builder cannot inject HTML/JS.
 */
@Injectable()
export class HomepageService {
  async getDefaults(): Promise<HomepageSection[]> {
    return [
      {
        id: 'sec_hero',
        type: 'hero',
        enabled: true,
        title: 'Play Sudoku',
        description: 'Improve your skills. Challenge the world.',
        buttonText: 'Play free',
        buttonLink: '/play',
        variant: 'default',
      },
      {
        id: 'sec_daily',
        type: 'daily',
        enabled: true,
        title: 'Daily Challenge',
        description: 'One shared puzzle per day, UTC.',
        buttonText: 'Play today',
        buttonLink: '/daily',
        variant: 'compact',
      },
      {
        id: 'sec_duel',
        type: 'duel',
        enabled: true,
        title: 'Duel mode',
        description: 'Ranked 1v1 sudoku with wagers.',
        buttonText: 'Find a duel',
        buttonLink: '/duel',
        variant: 'compact',
      },
      {
        id: 'sec_leaderboard',
        type: 'leaderboard',
        enabled: true,
        title: 'Leaderboard',
        description: 'Global and period rankings.',
        buttonText: 'View rankings',
        buttonLink: '/leaderboard',
        variant: 'compact',
      },
      {
        id: 'sec_academy',
        type: 'academy',
        enabled: true,
        title: 'Academy',
        description: 'Learn techniques from singles to swordfish.',
        buttonText: 'Start learning',
        buttonLink: '/learn',
        variant: 'compact',
      },
      {
        id: 'sec_forum',
        type: 'forum',
        enabled: false,
        title: 'Community forum',
        description: 'Talk strategies with other players.',
        buttonText: 'Open forum',
        buttonLink: '/forum',
        variant: 'compact',
      },
      {
        id: 'sec_qa',
        type: 'qa',
        enabled: false,
        title: 'Questions & answers',
        description: 'Ask anything, the community answers.',
        buttonText: 'Ask a question',
        buttonLink: '/questions',
        variant: 'compact',
      },
      {
        id: 'sec_cta',
        type: 'cta',
        enabled: true,
        title: 'Ready to play?',
        description: 'Free, no download.',
        buttonText: 'Play now',
        buttonLink: '/play',
        variant: 'banner',
      },
    ];
  }

  async getPublished(): Promise<HomepageSection[]> {
    const row = await prisma.siteSettings.findUnique({
      where: { key: KEY_PUBLISHED },
    });
    if (!row) return this.getDefaults();
    try {
      const parsed = JSON.parse(String(row.value));
      return Array.isArray(parsed)
        ? this.sanitizeAll(parsed)
        : this.getDefaults();
    } catch {
      return this.getDefaults();
    }
  }

  async getDraft(): Promise<HomepageSection[]> {
    const row = await prisma.siteSettings.findUnique({
      where: { key: KEY_DRAFT },
    });
    if (!row) return this.getPublished();
    try {
      const parsed = JSON.parse(String(row.value));
      return Array.isArray(parsed)
        ? this.sanitizeAll(parsed)
        : this.getPublished();
    } catch {
      return this.getPublished();
    }
  }

  async saveDraft(sections: unknown): Promise<HomepageSection[]> {
    if (!Array.isArray(sections))
      throw new Error('Format invalide : liste de sections attendue.');
    const clean = this.sanitizeAll(sections.slice(0, 20));
    await prisma.siteSettings.upsert({
      where: { key: KEY_DRAFT },
      update: { value: JSON.stringify(clean, undefined as any) },
      create: {
        key: KEY_DRAFT,
        value: JSON.stringify(clean, undefined as any),
      },
    });
    return clean;
  }

  async publish(): Promise<HomepageSection[]> {
    const draft = await this.getDraft();
    await prisma.siteSettings.upsert({
      where: { key: KEY_PUBLISHED },
      update: { value: JSON.stringify(draft, undefined as any) },
      create: {
        key: KEY_PUBLISHED,
        value: JSON.stringify(draft, undefined as any),
      },
    });
    return draft;
  }

  private static readonly TYPES: Set<string> = new Set([
    'hero',
    'play',
    'daily',
    'duel',
    'leaderboard',
    'academy',
    'forum',
    'qa',
    'stats',
    'cta',
  ]);

  /** Every string is plain-text capped; links must be internal relative paths. */
  private sanitizeAll(input: any[]): HomepageSection[] {
    return input
      .filter((s) => s && typeof s === 'object')
      .slice(0, 20)
      .map((s, i) => ({
        id:
          typeof s.id === 'string' && /^[a-z0-9_]{1,40}$/i.test(s.id)
            ? s.id
            : `sec_${i}_${Date.now().toString(36)}`,
        type: (HomepageService.TYPES.has(s.type)
          ? s.type
          : 'cta') as HomepageSection['type'],
        enabled: !!s.enabled,
        title: this.plain(s.title, 120),
        description: this.plain(s.description, 300),
        buttonText: this.plain(s.buttonText, 60),
        buttonLink: this.internalLink(s.buttonLink),
        variant: ['default', 'compact', 'banner'].includes(s.variant)
          ? s.variant
          : 'default',
      }));
  }

  private plain(v: unknown, max: number): string {
    if (typeof v !== 'string') return '';
    const stripped = v
      .replace(/<[^>]*>/g, '')
      .replace(/[<>]/g, '')
      .trim();
    return stripped.slice(0, max);
  }

  /** Only same-site relative links — kills open redirects and JS: URLs. */
  private internalLink(v: unknown): string {
    if (typeof v !== 'string') return '/play';
    const s = v.trim();
    if (/^\/[a-z0-9\-\/]*$/i.test(s)) return s || '/play';
    return '/play';
  }
}
