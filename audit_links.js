const fs = require('fs');
const path = require('path');

const dir = './apps/web/app/[locale]';
const knownDynamicRoutes = [
  '/learn/',
  '/user/',
  '/forum/'
];

function scanDir(d) {
  let results = [];
  const files = fs.readdirSync(d);
  for (const f of files) {
    const fullPath = path.join(d, f);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(scanDir(fullPath));
    } else if (fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Match href="/something" or href={'/something'}
      const regex = /href={?["'](\/[^"']+)["']}?/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        results.push({ file: fullPath, link: match[1] });
      }
      
      // Match href={`/something`}
      const regexTemplate = /href={\`(\/[^\`]+)\`}/g;
      while ((match = regexTemplate.exec(content)) !== null) {
        results.push({ file: fullPath, link: match[1] });
      }
    }
  }
  return results;
}

const links = scanDir(dir);
const uniqueLinks = [...new Set(links.map(l => l.link))];
console.log("Found links:");
console.log(uniqueLinks);
