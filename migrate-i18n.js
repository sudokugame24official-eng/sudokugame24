const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'apps', 'web', 'app');
const langDir = path.join(appDir, '[lang]');

if (!fs.existsSync(langDir)) {
  fs.mkdirSync(langDir);
}

const items = fs.readdirSync(appDir);
const exclude = ['api', 'globals.css', 'favicon.ico', '[lang]', 'sitemap.ts', 'robots.ts', 'layout.tsx', 'page.tsx'];

items.forEach(item => {
  if (!exclude.includes(item)) {
    const oldPath = path.join(appDir, item);
    const newPath = path.join(langDir, item);
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${item} to [lang]/`);
  }
});

// Move layout and page into [lang] as well
if (fs.existsSync(path.join(appDir, 'layout.tsx'))) {
  fs.renameSync(path.join(appDir, 'layout.tsx'), path.join(langDir, 'layout.tsx'));
}
if (fs.existsSync(path.join(appDir, 'page.tsx'))) {
  fs.renameSync(path.join(appDir, 'page.tsx'), path.join(langDir, 'page.tsx'));
}

console.log('Restructuring complete.');
