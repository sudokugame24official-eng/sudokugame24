import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';

export interface ThemeConfig {
  brandName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  // HSL component values WITHOUT the hsl() wrapper, matching the CSS vars
  colors: {
    primary: string; // "217.2 91.2% 59.8%"
    primaryForeground: string;
    background: string;
    surface: string;
    text: string;
    border: string;
    accent: string;
  };
  radius: string; // "0.75rem"
  shadow: string; // "0 20px 50px rgba(0,0,0,0.5)"
  mode: 'dark' | 'light';
}

/**
 * Defaults mirror the CURRENT hardcoded globals.css values exactly —
 * publishing the default theme changes NOTHING visually (P1-X rule:
 * no component may break).
 */
export const DEFAULT_THEME: ThemeConfig = {
  brandName: 'Sudoku Premium',
  logoUrl: null,
  faviconUrl: null,
  colors: {
    primary: '217.2 91.2% 59.8%',
    primaryForeground: '222.2 47.4% 11.2%',
    background: '240 10% 3.9%',
    surface: '240 10% 6%',
    text: '0 0% 98%',
    border: '240 10% 15%',
    accent: '38 92% 50%',
  },
  radius: '0.75rem',
  shadow: '0 20px 50px rgba(0,0,0,0.5)',
  mode: 'dark',
};

const KEY_PUBLISHED = 'theme_published';
const KEY_DRAFT = 'theme_draft';
const KEY_PREVIOUS = 'theme_previous';

@Injectable()
export class ThemeService {
  /** Public: the live theme. Falls back to defaults (never null). */
  async getPublished(): Promise<ThemeConfig> {
    const row = await prisma.siteSettings.findUnique({
      where: { key: KEY_PUBLISHED },
    });
    if (!row) return { ...DEFAULT_THEME };
    try {
      return this.sanitize(JSON.parse(String(row.value)));
    } catch {
      return { ...DEFAULT_THEME };
    }
  }

  async getDraft(): Promise<ThemeConfig> {
    const row = await prisma.siteSettings.findUnique({
      where: { key: KEY_DRAFT },
    });
    if (!row) return this.getPublished();
    try {
      return this.sanitize(JSON.parse(String(row.value)));
    } catch {
      return this.getPublished();
    }
  }

  async saveDraft(patch: Partial<ThemeConfig>): Promise<ThemeConfig> {
    const current = await this.getDraft();
    const merged = this.sanitize({
      ...current,
      ...patch,
      colors: { ...current.colors, ...(patch.colors || {}) },
    });
    await prisma.siteSettings.upsert({
      where: { key: KEY_DRAFT },
      update: { value: JSON.stringify(merged, undefined as any) },
      create: {
        key: KEY_DRAFT,
        value: JSON.stringify(merged, undefined as any),
      },
    });
    return merged;
  }

  /** Publish: draft becomes live, current live is kept for rollback. */
  async publish(): Promise<ThemeConfig> {
    const draft = await this.getDraft();
    const currentRow = await prisma.siteSettings.findUnique({
      where: { key: KEY_PUBLISHED },
    });
    const published = await this.getPublished();

    await prisma.$transaction(async (tx) => {
      if (currentRow) {
        await tx.siteSettings.upsert({
          where: { key: KEY_PREVIOUS },
          update: { value: currentRow.value as any },
          create: { key: KEY_PREVIOUS, value: currentRow.value as any },
        });
      }
      await tx.siteSettings.upsert({
        where: { key: KEY_PUBLISHED },
        update: { value: JSON.stringify(draft, undefined as any) },
        create: {
          key: KEY_PUBLISHED,
          value: JSON.stringify(draft, undefined as any),
        },
      });
    });
    return published; // caller sees what was replaced
  }

  /** Rollback: swap published <-> previous. */
  async rollback(): Promise<ThemeConfig> {
    const prevRow = await prisma.siteSettings.findUnique({
      where: { key: KEY_PREVIOUS },
    });
    if (!prevRow) throw new Error('Aucune version précédente à restaurer.');
    const currentRow = await prisma.siteSettings.findUnique({
      where: { key: KEY_PUBLISHED },
    });

    await prisma.$transaction(async (tx) => {
      if (currentRow) {
        await tx.siteSettings.upsert({
          where: { key: KEY_PREVIOUS },
          update: { value: currentRow.value as any },
          create: { key: KEY_PREVIOUS, value: currentRow.value as any },
        });
      }
      await tx.siteSettings.upsert({
        where: { key: KEY_PUBLISHED },
        update: { value: prevRow.value as any },
        create: { key: KEY_PUBLISHED, value: prevRow.value as any },
      });
    });
    return this.getPublished();
  }

  /** Strips anything that is not a safe CSS value (defense against injection). */
  private sanitize(input: any): ThemeConfig {
    const cssSafe = (v: unknown, fallback: string, maxLen = 60): string => {
      if (typeof v !== 'string') return fallback;
      const s = v.slice(0, maxLen);
      // only HSL numbers/% and . , space rem px allowed — no url(), no ;
      return /^[0-9%\.\,\s\-a-z#]+$/i.test(s) ? s : fallback;
    };
    return {
      brandName:
        typeof input?.brandName === 'string'
          ? input.brandName.slice(0, 60)
          : DEFAULT_THEME.brandName,
      logoUrl:
        typeof input?.logoUrl === 'string' && /^https?:\/\//.test(input.logoUrl)
          ? input.logoUrl.slice(0, 500)
          : null,
      faviconUrl:
        typeof input?.faviconUrl === 'string' &&
        /^https?:\/\//.test(input.faviconUrl)
          ? input.faviconUrl.slice(0, 500)
          : null,
      colors: {
        primary: cssSafe(input?.colors?.primary, DEFAULT_THEME.colors.primary),
        primaryForeground: cssSafe(
          input?.colors?.primaryForeground,
          DEFAULT_THEME.colors.primaryForeground,
        ),
        background: cssSafe(
          input?.colors?.background,
          DEFAULT_THEME.colors.background,
        ),
        surface: cssSafe(input?.colors?.surface, DEFAULT_THEME.colors.surface),
        text: cssSafe(input?.colors?.text, DEFAULT_THEME.colors.text),
        border: cssSafe(input?.colors?.border, DEFAULT_THEME.colors.border),
        accent: cssSafe(input?.colors?.accent, DEFAULT_THEME.colors.accent),
      },
      radius: cssSafe(input?.radius, DEFAULT_THEME.radius, 12),
      shadow: cssSafe(input?.shadow, DEFAULT_THEME.shadow, 120),
      mode: input?.mode === 'light' ? 'light' : 'dark',
    };
  }
}
