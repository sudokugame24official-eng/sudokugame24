const fs = require('fs');
const filePath = './apps/web/lib/academy-articles.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Find all occurrences of candidates key
const firstIdx = content.indexOf('  "candidates": {');
const secondIdx = content.indexOf('  "candidates": {', firstIdx + 20);

console.log('First index:', firstIdx, 'Second index:', secondIdx);

if (secondIdx !== -1) {
  content = content.substring(0, secondIdx).trim() + `
};

// Aliases mapping (e.g. regles-du-sudoku -> rules)
export const ARTICLE_SLUG_ALIASES: Record<string, string> = {
  "regles-du-sudoku": "rules",
  "sudoku-rules": "rules",
  "sudoku-regeln": "rules",
  "derniere-case-libre": "rules",
  "derniere-case-restante": "rules",
  "technique-du-dernier-chiffre-possible": "naked-singles",
  "les-notes-dans-le-sudoku": "how-to-play",
  "singletons-nus": "naked-singles",
  "paires-nues": "naked-pairs",
  "beginner": "rules",
  "intermediate": "naked-pairs",
  "advanced": "x-wing",
};
`;
  fs.writeFileSync(filePath, content);
  console.log('Successfully removed duplicate block!');
}
