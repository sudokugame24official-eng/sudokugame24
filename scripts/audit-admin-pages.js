const fs = require('fs');
const path = require('path');

const adminDir = 'apps/web/app/[locale]/admin';

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      scanDir(full);
    } else if (e.name === 'page.tsx') {
      const content = fs.readFileSync(full, 'utf8');
      const rel = path.relative(adminDir, full).replace(/\\/g, '/');
      console.log(`\n=== PAGE: /admin/${rel.replace('/page.tsx', '')} ===`);
      
      // Find API endpoints fetched
      const apiCalls = content.matchAll(/\$\{API_URL\}([^`"'\s\)]+)/g);
      for (const m of apiCalls) {
        console.log(`  Fetch API: ${m[1]}`);
      }
      const rawFetches = content.matchAll(/fetch\(["']([^"']+)["']/g);
      for (const m of rawFetches) {
        console.log(`  Raw Fetch: ${m[1]}`);
      }
    }
  }
}

scanDir(adminDir);
