const fs = require('fs');
const path = require('path');

const API_IMPORT = "import { API_URL } from '@/lib/api';\n";
const WS_IMPORT = "import { WS_URL } from '@/lib/api';\n";
const API_URL_VAR = "API_URL";
const WS_URL_VAR = "WS_URL";

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const webDir = path.join(__dirname, 'apps', 'web');
const files = walk(webDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  let needsApi = false;
  let needsWs = false;

  // Replace io('http://localhost:3001...')
  if (content.includes("io('http://localhost:3001")) {
    content = content.replace(/io\('http:\/\/localhost:3001([^']*)'\)/g, (match, p1) => {
      needsWs = true;
      if (p1) return `io(\`\${WS_URL}${p1}\`)`;
      return `io(${WS_URL_VAR})`;
    });
    // also catch io('http://localhost:3001', options)
    content = content.replace(/io\('http:\/\/localhost:3001([^']*)'/g, (match, p1) => {
      needsWs = true;
      if (p1) return `io(\`\${WS_URL}${p1}\``;
      return `io(${WS_URL_VAR}`;
    });
    changed = true;
  }

  // Replace fetch('http://localhost:3001...')
  if (content.includes("'http://localhost:3001")) {
    content = content.replace(/'http:\/\/localhost:3001([^']*)'/g, (match, p1) => {
      needsApi = true;
      if (p1) return `\`\${API_URL}${p1}\``;
      return API_URL_VAR;
    });
    changed = true;
  }
  
  if (content.includes("`http://localhost:3001")) {
    content = content.replace(/`http:\/\/localhost:3001([^`]*)`/g, (match, p1) => {
      needsApi = true;
      return `\`\${API_URL}${p1}\``;
    });
    changed = true;
  }

  if (changed) {
    // Inject imports after the last import statement or at the top
    if (needsApi && !content.includes(API_IMPORT)) {
      content = API_IMPORT + content;
    }
    if (needsWs && !content.includes(WS_IMPORT)) {
      content = WS_IMPORT + content;
    }
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
