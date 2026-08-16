const fs = require('fs'); 
['duel/page.tsx', 'forum/page.tsx', 'multiplayer/page.tsx', 'page.tsx', 'play/page.tsx'].forEach(f => { 
  const p = 'apps/web/app/[lang]/' + f; 
  let c = fs.readFileSync(p, 'utf8'); 
  if (!c.startsWith('"use client"')) { 
    fs.writeFileSync(p, '"use client";\n' + c); 
  } 
});
