import { GameModesService } from './game-modes.service';

jest.mock('@repo/database', () => ({
  prisma: { siteSettings: { findUnique: jest.fn(), upsert: jest.fn() } },
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('@repo/database');

describe('P1-P: game modes control center', () => {
  let service: GameModesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GameModesService();
  });

  it('defaults: implemented modes ON, future modes OFF (invisible)', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue(null);
    const all = await service.getAllModes();
    expect(all.CLASSIC.enabled).toBe(true);
    expect(all.DAILY.enabled).toBe(true);
    expect(all.DUEL.enabled).toBe(true);
    expect(all.FRIEND_DUEL.enabled).toBe(true);
    expect(all.TOURNAMENT.enabled).toBe(false);
    expect(all.SPECTATOR.enabled).toBe(false);
    expect(all.PUZZLE_CHALLENGE.enabled).toBe(false);
  });

  it('PUBLIC view hides disabled modes entirely', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({
      value: JSON.stringify({ DUEL: { enabled: false }, TOURNAMENT: { enabled: false } }),
    });
    const pub = await service.getPublicModes();
    expect(pub.DUEL).toBeUndefined();
    expect(pub.CLASSIC.enabled).toBe(true);
    expect(Object.keys(pub)).not.toContain('TOURNAMENT');
  });

  it('update merges with stored defaults and persists the FULL map', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue(null);

    const all = await service.updateMode('DUEL', { minLevel: 10, maxWager: 1000 });

    expect(all.DUEL).toMatchObject({ enabled: true, minLevel: 10, maxWager: 1000 });
    expect(all.CLASSIC.enabled).toBe(true); // untouched modes preserved
    const call = (prisma.siteSettings.upsert as jest.Mock).mock.calls[0][0];
    expect(JSON.parse(call.update.value).DUEL.minLevel).toBe(10);
  });

  it('unknown mode rejected', async () => {
    await expect(service.updateMode('CASINO', { enabled: true })).rejects.toThrow('inconnu');
  });

  it('invalid values clamped (minLevel >= 1, wager >= 0)', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue(null);
    const all = await service.updateMode('DUEL', { minLevel: -5, maxWager: -50 } as any);
    expect(all.DUEL.minLevel).toBe(1);
    expect(all.DUEL.maxWager).toBe(0);
  });

  it('corrupt stored JSON falls back to safe defaults', async () => {
    (prisma.siteSettings.findUnique as jest.Mock).mockResolvedValue({ value: 'xx{' });
    const all = await service.getAllModes();
    expect(all.CLASSIC.enabled).toBe(true);
  });
});
