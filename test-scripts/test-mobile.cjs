const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  const vps = [
    { name: "iPhone SE", w: 375, h: 667 },
    { name: "iPhone 14", w: 390, h: 844 },
    { name: "Pixel 6", w: 412, h: 915 },
    { name: "iPad Mini", w: 768, h: 1024 }
  ];
  
  const routes = ["/en/daily", "/en/forum", "/en/leaderboard"];
  
  for (const vp of vps) {
    for (const route of routes) {
      const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: true, isMobile: true });
      const page = await context.newPage();
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForTimeout(1000);
      
      const metrics = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const bodyW = document.body.scrollWidth;
        const innerW = window.innerWidth;
        const overflow = docW > innerW || bodyW > innerW;
        
        let badEls = [];
        if (overflow) {
          document.querySelectorAll('*').forEach(el => {
            if (el.scrollWidth > innerW || el.getBoundingClientRect().width > innerW) {
              badEls.push({
                tag: el.tagName,
                cls: el.className,
                w: el.getBoundingClientRect().width,
                sw: el.scrollWidth
              });
            }
          });
        }
        return { docW, bodyW, innerW, overflow, badEls: badEls };
      });
      
      if (metrics.overflow) {
        console.log(`[OVERFLOW] ${vp.name} ${route}`);
        console.log(`  inner=${metrics.innerW}, body=${metrics.bodyW}, doc=${metrics.docW}`);
        const deepest = metrics.badEls.slice(-3); // Get the most deeply nested ones that usually cause it
        deepest.forEach(b => console.log(`  -> ${b.tag} cls="${b.cls}" width=${b.w} scrollWidth=${b.sw}`));
      } else {
        console.log(`[PASS] ${vp.name} ${route}`);
      }
      await context.close();
    }
  }
  await browser.close();
})();
