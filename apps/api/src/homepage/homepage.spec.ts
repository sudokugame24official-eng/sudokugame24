import { HomepageService } from './homepage.service';

jest.mock('@repo/database', () => ({
  prisma: { siteSettings: { findUnique: jest.fn(), upsert: jest.fn() } },
}));

const { prisma } = require('@repo/database');

describe('P1-Y: homepage builder', () => {
  let service: HomepageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HomepageService();
  });

  it('defaults mirror the current homepage (publishing defaults changes nothing)', async () => {
    const defaults = await service.getDefaults();
    expect(defaults.find((s) => s.type === 'hero')?.enabled).toBe(true);
    expect(defaults.find((s) => s.type === 'daily')?.enabled).toBe(true);
    expect(defaults.find((s) => s.type === 'forum')?.enabled).toBe(false);
    expect(defaults.length).toBeGreaterThanOrEqual(8);
  });

  it('no stored config -> defaults', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue(null);
    const sections = await service.getPublished();
    expect(sections.length).toBeGreaterThanOrEqual(8);
  });

  it('corrupt stored JSON -> defaults, never a crash', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({
      value: '{{{',
    });
    const sections = await service.getPublished();
    expect(sections.length).toBeGreaterThanOrEqual(8);
  });

  it('saveDraft sanitizes: no HTML, capped lengths, internal links only', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue(null);
    const saved = await service.saveDraft([
      {
        id: 'x_1',
        type: 'cta',
        enabled: true,
        title: '<script>alert(1)</script>',
        description: 'd'.repeat(500),
        buttonText: 'ok',
        buttonLink: 'https://evil.com/phish',
        variant: 'banner',
      },
      {
        id: 'y_2',
        type: 'nonsense_type',
        enabled: 1,
        buttonLink: 'javascript:alert(1)',
      },
    ]);
    expect(saved).toHaveLength(2);
    expect(saved[0].title).not.toContain('<script>');
    expect(saved[0].description.length).toBeLessThanOrEqual(300);
    expect(saved[0].buttonLink).toBe('/play'); // external link rejected
    expect(saved[1].type).toBe('cta'); // unknown type downgraded
    expect(saved[1].buttonLink).toBe('/play'); // javascript: rejected
  });

  it('saveDraft rejects non-array payloads and caps at 20 sections', async () => {
    await expect(service.saveDraft({} as any)).rejects.toThrow(
      'Format invalide',
    );
    await expect(
      service.saveDraft(
        Array.from({ length: 25 }, (_, i) => ({ id: `s_${i}`, type: 'cta' })),
      ),
    ).resolves.toHaveProperty('length', 20);
  });

  it('section ids are constrained to safe characters', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue(null);
    const saved = await service.saveDraft([
      { id: 'bad id with spaces!', type: 'cta' },
    ]);
    expect(saved[0].id).toMatch(/^[a-z0-9_]+$/i);
  });
});
