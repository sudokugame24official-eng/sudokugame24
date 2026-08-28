import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// UAT noir-œil – parcours Guest (Next.js apps/web)
// Section 1 : nav bar — items de navigation localisés (EN/FR/DE), no-bleed
// Section 2 : auth gating — route protégée /profile redirige le guest vers /auth
// ─────────────────────────────────────────────────────────────────────────────

// === Section 1 — labels de navigation (EN) ===
test.describe('GUEST nav (Section 1) — English labels present on /en', () => {
  test('EN homepage exposes localized nav items', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('load');
    // Game-discovery nav items (routes)
    await expect(page.locator('body')).toContainText('Daily Challenge');
    await expect(page.locator('body')).toContainText('Leaderboard');
    await expect(page.locator('body')).toContainText('Learn');
    await expect(page.locator('body')).toContainText('Duel');
    await expect(page.locator('body')).toContainText('Play');
  });
});

// === Section 1 — French localization + no EN bleed ===
test('FR homepage nav is localized (Jouer / Classement / Apprendre / Duel), no EN nav bleed', async ({
  page,
}) => {
  await page.goto('/fr');
  await page.waitForLoadState('load');
  await expect(page.locator('body')).toContainText('Jouer');
  await expect(page.locator('body')).toContainText('Classement');
  await expect(page.locator('body')).toContainText('Apprendre');
  await expect(page.locator('body')).toContainText('Duel');
  await expect(page.locator('body')).not.toContainText('Daily Challenge');
  await expect(page.locator('body')).not.toContainText('Leaderboard');
  await expect(page.locator('body')).not.toContainText('Learn');
});

// === Section 1 — German localization + no EN bleed ===
test('DE homepage nav is localized (Spielen / Rangliste / Lernen / Duell), no EN nav bleed', async ({
  page,
}) => {
  await page.goto('/de');
  await page.waitForLoadState('load');
  await expect(page.locator('body')).toContainText('Spielen');
  await expect(page.locator('body')).toContainText('Rangliste');
  await expect(page.locator('body')).toContainText('Lernen');
  await expect(page.locator('body')).toContainText('Duell');
  await expect(page.locator('body')).not.toContainText('Daily Challenge');
  await expect(page.locator('body')).not.toContainText('Leaderboard');
  await expect(page.locator('body')).not.toContainText('Learn');
});

// === Section 2 — auth gating for guests ===
const GATED_LOCALES = [
  { locale: 'en', signIn: 'Sign In' },
  { locale: 'fr', signIn: 'Se Connecter' },
  { locale: 'de', signIn: 'Anmelden' },
];

for (const c of GATED_LOCALES) {
  test.describe(`GUEST auth gating (Section 2) — /${c.locale}/profile → /${c.locale}/auth`, () => {
    test(`guest is redirected to sign-in (${c.signIn})`, async ({ page }) => {
      // Fresh browser context carries NO auth cookie => resolved as Guest.
      await page.goto(`/${c.locale}/profile`, { waitUntil: 'domcontentloaded' });
      // AuthProvider.checkAuth (GET /auth/me) returns null for a guest, then
      // profile's useEffect calls router.push('/auth'). toHaveURL retries until
      // the client-side redirect lands on the localized auth page.
      await expect(page).toHaveURL(new RegExp(`/${c.locale}/auth`));
      await page.waitForLoadState('load');
      await expect(page.locator('body')).toContainText(c.signIn);
    });
  });
}
