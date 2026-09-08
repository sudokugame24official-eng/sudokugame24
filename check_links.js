const fs = require('fs');
const path = require('path');

const webDir = path.join(__dirname, 'apps/web');
const appDir = path.join(webDir, 'app/[locale]');

const validRoutes = new Set();
validRoutes.add('/');

function walkDir(dir, routePath) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      let segment = file;
      if (segment.startsWith('[') && segment.endsWith(']')) {
        segment = '*';
      } else if (segment.startsWith('(') && segment.endsWith(')')) {
        walkDir(fullPath, routePath);
        continue;
      }
      const newPath = routePath + '/' + segment;
      validRoutes.add(newPath);
      walkDir(fullPath, newPath);
    } else if (file === 'page.tsx') {
      validRoutes.add(routePath || '/');
    }
  }
}

walkDir(appDir, '');

const foundLinks = [];

function scanForLinks(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.startsWith('.')) {
        scanForLinks(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const regex = /href=(?:\"|\'|\{\`|\{\")(\/[^\s\"\']*)/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        let link = match[1];
        foundLinks.push({ file: fullPath.replace(__dirname, ''), link });
      }
    }
  }
}

scanForLinks(webDir);

const brokenLinks = [];
for (const item of foundLinks) {
  let { file, link } = item;
  if (link.startsWith('http') || link.startsWith('#')) continue;
  
  let linkParts = link.split('?')[0].split('#')[0].split('/').filter(Boolean);
  
  let isBroken = true;
  for (const valid of validRoutes) {
    if (valid === link) {
      isBroken = false;
      break;
    }
    let validParts = valid.split('/').filter(Boolean);
    if (validParts.length === linkParts.length) {
      let match = true;
      for (let i = 0; i < validParts.length; i++) {
        if (validParts[i] !== '*' && validParts[i] !== linkParts[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        isBroken = false;
        break;
      }
    }
  }
  
  if (isBroken) {
    brokenLinks.push(item);
  }
}

const uniqueBroken = [...new Set(brokenLinks.map(b => b.link + '||' + b.file))].map(s => {
  const [link, file] = s.split('||');
  return { link, file };
});

console.log(JSON.stringify(uniqueBroken, null, 2));
