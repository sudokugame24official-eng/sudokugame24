const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const r = await p.goto('http://localhost:3000/en', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('STATUS:', r.status());
  const t = await p.title();
  console.log('TITLE:', t);
  const nav = await p.evaluate(() => Array.from(document.querySelectorAll('a')).map(a=>a.textContent.trim().slice(0,40)));
  console.log('NAV LINKS:', JSON.stringify([...new Set(nav.filter(Boolean))].slice(0,40)));
  await b.close();
  console.log('DONE');
})().catch(e=>{ console.log('ERR:', e.message); process.exit(1); });
