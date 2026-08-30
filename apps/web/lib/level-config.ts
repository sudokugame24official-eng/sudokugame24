export interface LevelTier {
  minLevel: number;
  maxLevel: number;
  title: string;
  badge: string;
  textColor: string;
  badgeColor: string;
}

export const LEVEL_CONFIG: LevelTier[] = [
  {
    minLevel: 1,
    maxLevel: 4,
    title: "Rookie",
    badge: "◇",
    textColor: "text-gray-400",
    badgeColor: "text-gray-500",
  },
  {
    minLevel: 5,
    maxLevel: 9,
    title: "Challenger",
    badge: "◆",
    textColor: "text-amber-700",
    badgeColor: "text-amber-800",
  },
  {
    minLevel: 10,
    maxLevel: 19,
    title: "Silver",
    badge: "◈",
    textColor: "text-slate-300",
    badgeColor: "text-slate-400",
  },
  {
    minLevel: 20,
    maxLevel: 29,
    title: "Gold",
    badge: "✦",
    textColor: "text-yellow-400",
    badgeColor: "text-yellow-500",
  },
  {
    minLevel: 30,
    maxLevel: 39,
    title: "Platinum",
    badge: "✧",
    textColor: "text-teal-300",
    badgeColor: "text-teal-400",
  },
  {
    minLevel: 40,
    maxLevel: 49,
    title: "Diamond",
    badge: "💎",
    textColor: "text-cyan-400",
    badgeColor: "text-cyan-500",
  },
  {
    minLevel: 50,
    maxLevel: 59,
    title: "Master",
    badge: "♛",
    textColor: "text-purple-500",
    badgeColor: "text-purple-600",
  },
  {
    minLevel: 60,
    maxLevel: 74,
    title: "Grandmaster",
    badge: "⚔",
    textColor: "text-red-500",
    badgeColor: "text-red-600",
  },
  {
    minLevel: 75,
    maxLevel: 99,
    title: "Hero",
    badge: "👑",
    textColor: "text-rose-500",
    badgeColor: "text-rose-600",
  },
  {
    minLevel: 100,
    maxLevel: 9999,
    title: "Legend",
    badge: "🔥",
    textColor: "text-orange-500",
    badgeColor: "text-orange-600",
  },
];

export function getLevelTier(level: number): LevelTier {
  for (const tier of LEVEL_CONFIG) {
    if (level >= tier.minLevel && level <= tier.maxLevel) {
      return tier;
    }
  }
  return LEVEL_CONFIG[LEVEL_CONFIG.length - 1] as LevelTier;
}

export function getXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.floor(100 * Math.pow(i, 1.5));
  }
  return total;
}

export function getLevelFromXp(xp: number): number {
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

export function getXpProgress(xp: number): {
  currentLevelXp: number;
  requiredXp: number;
  percentage: number;
  level: number;
} {
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
