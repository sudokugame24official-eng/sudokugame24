import { test } from '@playwright/test';

// Black-box exploration ONLY (no assertions yet) — records what the browser
// actually renders for each guest route so Section 3 can assert ground truth.
const MATRIX = [
  'en/play',
  'fr/play',
  'de/play',
  'en/daily',
  'en/duel',
  'en/leaderboard',
  'en/learn',
  'en/forum',
  'en/questions',
  'en/help',
  'en/faq',
  'en/shop',
];

test('explore: guest access matrix (black-box)', async ({ page }) => {
  for (const m of MATRIX) {
    const route = `/${m}`;
    let status: string | number = 'ERR';
    let url = '';
    let body = '';
    try {
      const res = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForLoadState('load').catch(() => {});
      status = res ? res.status() : 'NULL';
      url = page.url();
      body = await page.evaluate(() => document.body.innerText.slice(0, 220).replace(/\s+/g, ' '));
    } catch (e: any) {
      status = `EXC:${e?.message?.slice(0, 80)}`;
      url = page.url();
    }
    console.log('EXPLORE', JSON.stringify({ route, status, url, body }));
  }
});
