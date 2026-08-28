import { test, expect } from '@playwright/test';

// UAT noir-d oeil : homepage guest EN/FR + absence de language bleeding.
test.describe('GUEST homepage i18n', () => {
  test('EN homepage renders English only (no FR bleed)', async ({ page }) => {
            await page.goto('/en');
    await page.waitForLoadState('load');
    await expect(page).toHaveTitle(/Play Sudoku. Improve Your Skills/im);

    // English labels present (translated via t())
    await expect(page.locator('body')).toContainText('AI Grid');
    await expect(page.locator('body')).toContainText('Artwork');
        await expect(page.locator('body')).toContainText('FINALs LIVE');
    await expect(page.locator('body')).toContainText('The Complete Sudoku Experience');
    await expect(page.locator('body')).toContainText('Four Game Modes. Zero Compromise.');

    // French bleeding ABSENT
    await expect(page.locator('body')).not.toContainText('Grille IA');
    await expect(page.locator('body')).not.toContainText('Rejoindre');
    await expect(page.locator('body')).not.toContainText("L'Expérience Sudoku Complète");
    await expect(page.locator('body')).not.toContainText('Quatre Modes de Jeu');
    await expect(page.locator('body')).not.toContainText('FINALS EN DIRECT');
  });

  test('FR homepage renders French only (no EN bleed)', async ({ page }) => {
        await page.goto('/fr');
    await page.waitForLoadState('load');
    await expect(page).toHaveTitle(/Jouez au Sudoku. Améliorez vos Compétences/im);

    await expect(page.locator('body')).toContainText('Grille IA');
    await expect(page.locator('body')).toContainText('Art');
    await expect(page.locator('body')).toContainText('Rejoindre');
    await expect(page.locator('body')).toContainText('FINALs EN DIRECT');
    await expect(page.locator('body')).toContainText("L'Expérience Sudoku Complète");
    await expect(page.locator('body')).toContainText('Quatre Modes de Jeu. Zéro Compromis.');

    // English bleeding ABSENT
    await expect(page.locator('body')).not.toContainText('AI Grid');
    await expect(page.locator('body')).not.toContainText('FINALS LIVE');
    await expect(page.locator('body')).not.toContainText('Four Game Modes. Zero Compromise.');
  });

  test('DE homepage renders German', async ({ page }) => {
        await page.goto('/de');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).toContainText('KI-Raster');
    await expect(page.locator('body')).toContainText('Beitreten');
    await expect(page.locator('body')).toContainText('FINALs LIVE');
    await expect(page.locator('body')).not.toContainText('Grille IA');
    await expect(page.locator('body')).not.toContainText('Rejoindre');
  });
});
