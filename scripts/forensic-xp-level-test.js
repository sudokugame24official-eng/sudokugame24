function getXpRequiredForLevel(level) {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.floor(100 * Math.pow(i, 1.5));
  }
  return total;
}

function getLevelFromXp(xp) {
  let level = 1;
  while (true) {
    const required = getXpRequiredForLevel(level + 1);
    if (xp >= required) {
      level++;
    } else {
      break;
    }
  }
  return level;
}

function getXpProgress(xp) {
  const level = getLevelFromXp(xp);
  const currentLevelBaseXp = getXpRequiredForLevel(level);
  const nextLevelXp = getXpRequiredForLevel(level + 1);

  const currentLevelXp = xp - currentLevelBaseXp;
  const requiredXp = nextLevelXp - currentLevelBaseXp;
  const percentage = Math.min(
    100,
    Math.max(0, (currentLevelXp / requiredXp) * 100),
  );

  return { currentLevelXp, requiredXp, percentage, level };
}

console.log('================================================================');
console.log('🔬 FORENSIC XP & LEVEL THRESHOLD AUDIT');
console.log('================================================================\n');

const testXpValues = [0, 50, 99, 100, 200, 381, 382, 400, 900, 901, 1600, 1700, 1701, 2500, 2818, 2819];

for (const xp of testXpValues) {
  const level = getLevelFromXp(xp);
  const progress = getXpProgress(xp);
  console.log(`XP: ${String(xp).padStart(4)} ➔ Level: ${level} | Level Progress: ${progress.currentLevelXp}/${progress.requiredXp} (${progress.percentage.toFixed(1)}%)`);
}

console.log('\n--- Level Threshold Requirements (getXpRequiredForLevel) ---');
for (let lvl = 1; lvl <= 10; lvl++) {
  const req = getXpRequiredForLevel(lvl);
  console.log(`Level ${String(lvl).padStart(2)}: Requires ${String(req).padStart(5)} Cumulative XP`);
}
