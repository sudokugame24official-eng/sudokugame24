const fs = require('fs');
const path = require('path');

const adminRoutes = [
  '',
  '/users',
  '/moderation',
  '/audit',
  '/daily',
  '/modes',
  '/forum',
  '/support',
  '/homepage',
  '/content',
  '/media',
  '/marketing',
  '/shop',
  '/monetization',
  '/monetization/ad-slots',
  '/analytics',
  '/theme',
  '/seo',
  '/features',
  '/settings',
  '/system/health',
  '/emergency'
];

console.log('=== AUDITING ADMIN ROUTES ===');
adminRoutes.forEach(r => {
  const p = path.join('apps/web/app/[locale]/admin', r, 'page.tsx');
  const exists = fs.existsSync(p);
  console.log(`/admin${r.padEnd(25)} => ${exists ? 'EXISTS' : 'MISSING (404)'}`);
});

console.log('\n=== AUDITING ALL PUBLIC LOCALE ROUTES ===');
const publicDir = 'apps/web/app/[locale]';
function getPages(dir, base = '') {
  let list = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    if (f.isDirectory()) {
      list = list.concat(getPages(path.join(dir, f.name), `${base}/${f.name}`));
    } else if (f.name === 'page.tsx') {
      list.push(base || '/');
    }
  }
  return list;
}

const allPages = getPages(publicDir);
console.log(`Total public pages found: ${allPages.length}`);
allPages.sort().forEach(p => console.log(`  ${p}`));
