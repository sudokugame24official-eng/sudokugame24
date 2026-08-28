// Dev-only one-shot patch: localize play/page.tsx (game + play namespaces).
const fs = require("fs");
const p = "app/[locale]/play/page.tsx";
let s = fs.readFileSync(p, "utf8");
const reps = [
  // hook
  ['"use client";', '"use client";\nimport { useTranslations } from "next-intl";'],
  ["export default function ", "export default function __KEEP__"],
  // toasts
  ['toast.error("Failed to fetch daily challenge")', 'toast.error(t("fetchDailyFail"))'],
  ['toast.error("Failed to start solo session")', 'toast.error(t("startSoloFail"))'],
  ['toast.error("Failed to submit daily score")', 'toast.error(t("submitDailyFail"))'],
  ['toast.error("Failed to submit solo score")', 'toast.error(t("submitSoloFail"))'],
  // header mode label
  ['{gameMode === "DAILY" ? "Daily Challenge" : "Solo Practice"}', '{gameMode === "DAILY" ? t("dailyChallenge") : t("soloPractice")}'],
  // result titles
  ['? "You Win!"\n                    : gameResult === "TIME_OUT"\n                      ? "Time\'s Up!"\n                      : "Game Over!"', '? t("youWin")\n                    : gameResult === "TIME_OUT"\n                      ? t("timesUp")\n                      : t("gameOver")'],
  // result descs
  ['? `Puzzle completed in ${formatTime(time)}.`\n                    : gameResult === "TIME_OUT"\n                      ? "The daily timer has ended."\n                      : "You made 3 mistakes."', '? t("completedIn", { time: formatTime(time) })\n                    : gameResult === "TIME_OUT"\n                      ? t("timerEnded")\n                      : t("mistakesMsg", { count: 3 })'],
  ["Gains Récoltés", '{t("earned")}'],
  ["+5 Coins par case correcte", '{t("perCellCoins")}'],
  ['<Trophy className="w-5 h-5" /> Leaderboard', '<Trophy className="w-5 h-5" /> {t("leaderboardBtn")}'],
  ["Play Again\n                    </button>", '{t("playAgain")}\n                    </button>'],
  ["Exit\n                  </button>", '{t("exit")}\n                  </button>'],
  // daily promo card
  ["Nouveau Quotidien", '{t("dailyNew")}'],
  ["Challenge du Jour", '{t("dailyCardTitle")}'],
  ['Vous avez <strong>2 minutes maximum</strong>. Chaque case\n                  correcte vous rapporte{" "}\n                  <strong className="text-[#FFCC00]">+5 Coins</strong>. Gagnez\n                  un maximum d\'argent avant la fin du temps !',
   '{t("dailyPrefix")} <strong>{t("dailyTimeLimit")}</strong>{t("dailyMid")}\n                  <strong className="text-[#FFCC00]">{t("dailyEarn")}</strong>{t("dailySuffix")}'],
  ["Démarrer le chrono", "{t(\"startTimer\")}"],
];
let ok = 0;
for (const [a, b] of reps) {
  if (!s.includes(a)) { console.log("MISS:", a.slice(0, 60).replace(/\n/g, "⏎")); continue; }
  s = s.split(a).join(b); ok++;
}
// component function gets hook: find main export
s = s.replace(/export default function (\w+)\(\) \{/, 'export default function $1() {\n  const t = useTranslations("play");');
s = s.replace('"use client";\nimport { useTranslations } from "next-intl";', '"use client";');
// put import after first import line instead
s = s.replace(/^(import [^\n]+\n)/m, '$1import { useTranslations } from "next-intl";\n');
fs.writeFileSync(p, s);
console.log("play ok:", ok);
