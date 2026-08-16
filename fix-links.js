const fs = require('fs');
const path = require('path');

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

const appDir = path.join(__dirname, 'apps', 'web', 'app');
const compDir = path.join(__dirname, 'apps', 'web', 'components');

const files = [...walk(appDir), ...walk(compDir)];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes("import Link from 'next/link'")) {
    content = content.replace("import Link from 'next/link'", "import { Link } from '@/navigation'");
    fs.writeFileSync(file, content);
    console.log(`Updated links in ${file}`);
  }
  if (content.includes('import Link from "next/link"')) {
    content = content.replace('import Link from "next/link"', "import { Link } from '@/navigation'");
    fs.writeFileSync(file, content);
    console.log(`Updated links in ${file}`);
  }
});
