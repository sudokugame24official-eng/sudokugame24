const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const r = await p.goto('http://localhost:3000/en', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('STATUS:', r.status());
  const t = await p.title();
  console.log('TITLE:', t);
  // collect visible nav links text
  const links = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('a, button').forEach(el => {
      const txt = (el.textContent || '').trim();
      const href = el.tagName === 'A' ? el.getAttribute('href') : null;
      if (txt && txt.length < 60) out.push({ tag: el.tagName, txt, href });
    });
    return out;
  });
  console.log('NAVAJ:', JSON.stringify(links.slice(0,80), null, 0));
  await b.close();
  console.log('DONE');
})().catch(e => { console.log('ERR:', e.message); process.exit(1); });
