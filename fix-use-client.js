const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        processDir(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // If it contains "use client" anywhere, but not as the absolute first line
      if (content.includes('"use client"') || content.includes("'use client'")) {
        // Remove all occurrences of use client
        content = content.replace(/['"]use client['"];?\s*\n?/g, '');
        // Add it to the top
        fs.writeFileSync(fullPath, '"use client";\n' + content);
      }
    }
  }
}

processDir('apps/web/app');
processDir('apps/web/components');
