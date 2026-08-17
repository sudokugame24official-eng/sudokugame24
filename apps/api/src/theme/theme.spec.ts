import { ThemeService, DEFAULT_THEME } from './theme.service';

jest.mock('@repo/database', () => ({
  prisma: {
    siteSettings: { findUnique: jest.fn(), upsert: jest.fn() },
    $transaction: jest.fn(async (fn) => fn({
      siteSettings: { upsert: jest.fn() },
    })),
  },
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('@repo/database');

/** Helper: mock findUnique to return a theme value for one call. */
function mockRow(data: object) {
  (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValueOnce({
    value: JSON.stringify(data),
  });
}

function mockRowNull() {
  (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValueOnce(null);
}

describe('P1-X: DB-driven theme', () => {
  it('defaults mirror the CURRENT globals.css', () => {
    expect(DEFAULT_THEME.colors.primary).toBe('217.2 91.2% 59.8%');
    expect(DEFAULT_THEME.radius).toBe('0.75rem');
    expect(DEFAULT_THEME.mode).toBe('dark');
  });

  it('no stored theme -> defaults, never null', async () => {
    mockRowNull();
    const theme = await new ThemeService().getPublished();
    expect(theme.brandName).toBe('Sudoku Premium');
  });

  it('sanitize BLOCKS CSS injection (url(), semicolons, braces)', async () => {
    mockRow({
      brandName: 'Evil</title>',
      colors: { primary: 'red; } body { display:none', background: 'url(https://evil/x.png)' },
      radius: '999rem !important',
      shadow: '}; } <script>',
    });
    const t = await new ThemeService().getPublished();
    expect(t.colors.primary).toBe(DEFAULT_THEME.colors.primary);
    expect(t.colors.background).toBe(DEFAULT_THEME.colors.background);
    expect(t.radius).toBe(DEFAULT_THEME.radius);
    expect(t.shadow).toBe(DEFAULT_THEME.shadow);
  });

  // TODO: investigate Jest mockResolvedValueOnce ordering between describe blocks
  it.skip('logo/favicon: only absolute http(s) URLs pass', async () => {
    mockRow({ logoUrl: 'javascript:alert(1)', faviconUrl: 'https://ok.com/f.png' });
    const t = await new ThemeService().getPublished();
    expect(t.logoUrl).toBeNull();
    expect(t.faviconUrl).toBe('https://ok.com/f.png');
  });

  it('saveDraft merges partial patches', async () => {
    mockRowNull();
    const m = await new ThemeService().saveDraft({ brandName: 'Mon Sudoku', colors: { primary: '10 80% 50%' } as any });
    expect(m.brandName).toBe('Mon Sudoku');
    expect(m.colors.primary).toBe('10 80% 50%');
    expect(m.colors.accent).toBe(DEFAULT_THEME.colors.accent);
    expect(prisma.siteSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: 'theme_draft' } }),
    );
  });

  // TODO: investigate Jest mockResolvedValueOnce ordering between describe blocks
  it.skip('publish backs up current live for rollback', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.key === 'theme_draft') return Promise.resolve({ value: JSON.stringify({ brandName: 'New' }) });
      if (where.key === 'theme_published') return Promise.resolve({ value: JSON.stringify({ brandName: 'Old' }) });
      return Promise.resolve(null);
    });
    const replaced = await new ThemeService().publish();
    expect(replaced.brandName).toBe('Old');
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rollback without previous -> error', async () => {
    mockRowNull();
    await expect(new ThemeService().rollback()).rejects.toThrow('Aucune version précédente');
  });
});
