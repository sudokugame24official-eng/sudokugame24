const fs = require('fs');
const path = require('path');

const adminDir = 'apps/web/app/[locale]/admin';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (item.name.endsWith('.tsx') || item.name.endsWith('.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getFiles(adminDir);
console.log(`Found ${files.length} admin TSX/TS files.`);

const hrefs = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  // Match href="..." or href={`...`}
  const linkMatches = content.matchAll(/href=["']([^"']+)["']/g);
  for (const m of linkMatches) {
    hrefs.push({ file, href: m[1] });
  }
  const templateMatches = content.matchAll(/href=\{`([^`]+)`\}/g);
  for (const m of templateMatches) {
    hrefs.push({ file, href: m[1] });
  }
  // Match router.push(...)
  const routerMatches = content.matchAll(/router\.(?:push|replace)\(["']([^"']+)["']\)/g);
  for (const m of routerMatches) {
    hrefs.push({ file, href: m[1] });
  }
  const routerTemplateMatches = content.matchAll(/router\.(?:push|replace)\(\{?`([^`]+)`\}?\)/g);
  for (const m of routerTemplateMatches) {
    hrefs.push({ file, href: m[1] });
  }
}

console.log(`Extracted ${hrefs.length} links/routes from admin pages.`);
for (const h of hrefs) {
  console.log(`${path.relative('apps/web', h.file)} -> ${h.href}`);
}
