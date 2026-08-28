"use client";
import { API_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Play,
  Calendar,
  Swords,
  BookOpen,
  Trophy,
  Users,
  Star,
  Flame,
  Target,
  MessageSquare,
  Zap,
  Shield,
  ChevronRight,
  Sparkles,
  Grid3X3,
  Crown,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";

// ─── Mini animated sudoku grid ───────────────────────────────────────────────
const DEMO_BOARD = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const DEMO_SOLUTION = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const CELL_COLORS: Record<number, string> = {
  1: "#FF6B35",
  2: "#4ECDC4",
  3: "#FFE66D",
  4: "#A8E6CF",
  5: "#FF8B94",
  6: "#C7B3FF",
  7: "#87CEEB",
  8: "#FFA07A",
  9: "#98FB98",
};

function AnimatedSudokuGrid() {
  const t = useTranslations("home");
  const [highlighted, setHighlighted] = useState<{ r: number; c: number } | null>(null);
  const [filledCells, setFilledCells] = useState<Set<string>>(new Set());

  useEffect(() => {
    const empties: { r: number; c: number }[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const row = DEMO_BOARD[r];
        if (row && row[c] === 0) {
          empties.push({ r, c });
        }
      }
    }

    let idx = 0;
    const iv = setInterval(() => {
      if (idx >= empties.length) {
        idx = 0;
        setFilledCells(new Set());
        setHighlighted(null);
        return;
      }
      const cell = empties[idx++];
      if (cell) {
        setHighlighted(cell);
        setFilledCells((prev) => new Set([...prev, `${cell.r}-${cell.c}`]));
      }
    }, 400);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="relative">
      <div className="relative bg-[#041E42]/90 border border-brand-gold/30 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md">
        <div
          className="grid gap-0.5"
          style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "2px" }}
        >
          {DEMO_BOARD.map((row, r) =>
            row.map((val, c) => {
              const isBox = (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 0;
              const isHighlighted = highlighted?.r === r && highlighted?.c === c;
              const isFilled = filledCells.has(`${r}-${c}`);
              const solvedVal = DEMO_SOLUTION[r]?.[c] ?? 1;
              const displayVal = val !== 0 ? val : isFilled ? solvedVal : "";
              const isPreset = val !== 0;

              const borderTop = r % 3 === 0 && r !== 0 ? "border-t-2 border-t-white/30" : "";
              const borderLeft = c % 3 === 0 && c !== 0 ? "border-l-2 border-l-white/30" : "";

              return (
                <motion.div
                  key={`${r}-${c}`}
                  animate={isHighlighted ? { scale: 1.15 } : { scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={[
                    "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded text-xs font-black transition-colors select-none",
                    isBox ? "bg-white/6" : "bg-white/2",
                    borderTop,
                    borderLeft,
                    isHighlighted ? "ring-2 ring-brand-cyan ring-opacity-90 z-10" : "",
                  ].join(" ")}
                  style={{
                    color: isPreset
                      ? "#FFFFFF"
                      : isFilled
                      ? CELL_COLORS[solvedVal] || "#00BFFF"
                      : "transparent",
                    backgroundColor: isHighlighted ? "rgba(0,191,255,0.3)" : undefined,
                  }}
                >
                  {displayVal}
                </motion.div>
              );
            })
          )}
        </div>
        <div className="flex items-center gap-2 mt-2.5 px-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]" />
          <span className="text-[11px] text-gray-300 font-bold uppercase tracking-wider">{t("gridLiveLabel")}</span>
          <span className="ml-auto text-[11px] text-brand-gold font-black">01:48</span>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Pill ───────────────────────────────────────────────────────────────
function StatBadge({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-2xl md:text-3xl font-black ${color} tracking-tight`}>{value}</span>
      <span className="text-xs text-gray-400 font-bold mt-0.5 text-center uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function HomeClient() {
  const t = useTranslations("home");
  const [activeVisualTab, setActiveVisualTab] = useState<"art" | "grid">("art");

  return (
    <div className="min-h-screen bg-[#041226] text-white font-sans overflow-x-hidden selection:bg-brand-orange selection:text-white">

      {/* ══════════════════════════════════════════════════════════════
          1. HERO SECTION — AAA GAME STUDIO HERO WITH HERO1 ARTWORK
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[94vh] flex items-center overflow-hidden pt-6 pb-16">
        {/* Dynamic Studio Ambient Glows */}
        <div className="absolute inset-0 bg-[#041226]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] bg-brand-orange/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-[20%] right-[-5%] w-[45vw] h-[45vw] bg-brand-gold/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[30%] w-[40vw] h-[40vw] bg-brand-cyan/15 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[1340px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT: Headline & Actions (7 Cols) */}
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7 space-y-7 text-left"
          >
            {/* Top esports/studio badge */}
            <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-brand-orange/20 via-brand-gold/15 to-transparent border border-brand-orange/40 text-brand-gold px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,69,0,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-spin" style={{ animationDuration: "6s" }} />
              <span>{t("heroBadge")}</span>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black leading-[1.02] tracking-tight uppercase">
              <span className="text-white drop-shadow-sm">{t("heroTitle").split('.')[0]}.</span>{" "}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-brand-gold to-brand-orange drop-shadow-[0_0_35px_rgba(255,69,0,0.4)]">
                {t("heroTitle").split('.')[1]}.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-200 leading-relaxed max-w-2xl font-medium">
              {t("heroDesc")}
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link href="/play" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative overflow-hidden w-full sm:w-auto flex items-center justify-center gap-3 px-9 py-4.5 bg-gradient-to-r from-brand-orange to-brand-orange-light text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(255,69,0,0.45)] hover:shadow-[0_15px_40px_rgba(255,69,0,0.65)] text-lg uppercase tracking-wider transition-all"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>{t("playNow")}</span>
                  <ChevronRight className="w-5 h-5 opacity-80" />
                  {/* Shimmer light sweep */}
                  <motion.div
                    animate={{ x: ["-100%", "250%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5 }}
                    className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                </motion.button>
              </Link>

              <Link href="/daily" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4.5 bg-brand-navy-light/80 border-2 border-brand-gold/40 text-brand-gold font-black rounded-2xl hover:bg-brand-gold/15 hover:border-brand-gold shadow-[0_10px_25px_rgba(0,0,0,0.4)] text-lg uppercase tracking-wider transition-all backdrop-blur-xl"
                >
                  <Calendar className="w-5 h-5 text-brand-gold" />
                  <span>{t("dailyChallenge")}</span>
                </motion.button>
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-300 font-bold uppercase tracking-wider pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>{t("trustFree")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-cyan" />
                <span>{t("trustAntiCheat")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-brand-gold" />
                <span>{t("trustTournaments")}</span>
              </div>
            </div>

            {/* Live Stats Bar */}
            <div className="flex items-center gap-6 sm:gap-10 pt-6 border-t border-white/10">
              <StatBadge value="50K+" label={t("statPlayers")} color="text-brand-orange" />
              <div className="w-px h-10 bg-white/15" />
              <StatBadge value="1.2M+" label={t("statSolved")} color="text-brand-gold" />
              <div className="w-px h-10 bg-white/15" />
              <StatBadge value="4.9 ★" label={t("statRating")} color="text-brand-cyan" />
            </div>
          </motion.div>

          {/* RIGHT: Visual Showcase featuring HERO1.PNG + Interactive Switcher (5 Cols) */}
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-5 flex flex-col items-center"
          >
            <div className="relative w-full max-w-[460px] group">
              {/* Outer Radiant Glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-brand-orange via-brand-gold to-brand-cyan rounded-3xl blur-2xl opacity-40 group-hover:opacity-70 transition duration-700 animate-pulse" />

              {/* Showcase Container */}
              <div className="relative rounded-3xl bg-brand-navy-light/95 border-2 border-brand-gold/40 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden">
                
                {/* Visual Mode Selector Tabs */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-ping" />
                    <span className="text-xs font-black uppercase tracking-widest text-brand-gold">
                      {t("showcaseBadge")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setActiveVisualTab("art")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeVisualTab === "art"
                          ? "bg-brand-orange text-white shadow"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {t("tabArt")}
                    </button>
                    <button
                      onClick={() => setActiveVisualTab("grid")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeVisualTab === "grid"
                          ? "bg-brand-cyan text-brand-navy shadow"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {t("tabGrid")}
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                {activeVisualTab === "art" ? (
                  <motion.div
                    key="art"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-inner group/art"
                  >
                    <Image
                      src="/hero1.png"
                      alt="Sudoku Masters - Master Your Mind"
                      fill
                      priority
                      className="object-cover transition-transform duration-700 group-hover/art:scale-105"
                      sizes="(max-width: 768px) 100vw, 460px"
                    />
                    
                    {/* Gradient Overlay & Tag */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                    {/* Floating Hero Badge 1 */}
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute top-3 left-3 bg-brand-navy/90 border border-brand-gold/60 px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2"
                    >
                      <Crown className="w-4 h-4 text-brand-gold" />
                      <span className="text-xs font-black text-brand-gold uppercase tracking-wider">{t("heroBadge2")}</span>
                    </motion.div>

                    {/* Floating Hero Badge 2 */}
                    <motion.div
                      animate={{ y: [0, 6, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="absolute bottom-3 right-3 bg-brand-orange/90 text-white px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 border border-white/20"
                    >
                      <Sparkles className="w-4 h-4 text-brand-gold" />
                      <span className="text-xs font-black uppercase tracking-wider">{t("heroBadge3")}</span>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="p-2"
                  >
                    <AnimatedSudokuGrid />
                  </motion.div>
                )}

                {/* Footer caption */}
                <div className="mt-3 pt-2 px-1 flex items-center justify-between text-xs text-gray-300 font-medium">
                  <span>{t("showcaseJoin")}</span>
                  <Link href="/learn" className="text-brand-cyan hover:text-brand-gold font-bold flex items-center gap-1 transition-colors">
                    {t("showcaseExplore")} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          2. FEATURE MODULES — 4 PILLARS (PLAY / DAILY / DUEL / LEARN)
      ══════════════════════════════════════════════════════════════ */}
      <main className="max-w-[1340px] mx-auto py-16 px-5 sm:px-8 lg:px-12 space-y-32">
        <section>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black text-brand-orange tracking-[0.25em] uppercase bg-brand-orange/10 px-4 py-1.5 rounded-full border border-brand-orange/30">
              {t("featureBadge")}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-4 uppercase tracking-tight">
              {t("featureTitle")}
            </h2>
            <p className="text-gray-300 text-base sm:text-lg mt-3">
              {t("featureDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                href: "/play",
                icon: <Play className="w-7 h-7 fill-white text-white" />,
                label: t("cardPlay"),
                desc: t("cardPlayDesc"),
                color: "from-brand-orange to-red-600",
                borderGlow: "group-hover:border-brand-orange group-hover:shadow-[0_10px_35px_rgba(255,69,0,0.35)]",
                badge: t("badgeSolo"),
                tagColor: "bg-brand-orange/20 text-brand-orange border-brand-orange/30",
              },
              {
                href: "/daily",
                icon: <Calendar className="w-7 h-7 text-black" />,
                label: t("cardDaily"),
                desc: t("cardDailyDesc"),
                color: "from-brand-gold to-amber-500",
                borderGlow: "group-hover:border-brand-gold group-hover:shadow-[0_10px_35px_rgba(255,204,0,0.35)]",
                badge: t("badgeDaily"),
                tagColor: "bg-brand-gold/20 text-brand-gold border-brand-gold/30",
              },
              {
                href: "/duel",
                icon: <Swords className="w-7 h-7 text-brand-navy" />,
                label: t("cardDuel"),
                desc: t("cardDuelDesc"),
                color: "from-brand-cyan to-blue-500",
                borderGlow: "group-hover:border-brand-cyan group-hover:shadow-[0_10px_35px_rgba(0,191,255,0.35)]",
                badge: t("badgeDuel"),
                tagColor: "bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30",
              },
              {
                href: "/learn",
                icon: <BookOpen className="w-7 h-7 text-white" />,
                label: t("cardLearn"),
                desc: t("cardLearnDesc"),
                color: "from-purple-500 to-indigo-600",
                borderGlow: "group-hover:border-purple-400 group-hover:shadow-[0_10px_35px_rgba(168,85,247,0.35)]",
                badge: t("badgeLearn"),
                tagColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
              },
            ].map((card) => (
              <Link key={card.href} href={card.href} className="group">
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative bg-brand-navy-light/70 border border-white/10 rounded-3xl p-7 h-full flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${card.borderGlow}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                        {card.icon}
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${card.tagColor}`}>
                        {card.badge}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black mb-3 uppercase tracking-wide group-hover:text-brand-gold transition-colors">
                      {card.label}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {card.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-8 text-sm font-black uppercase tracking-wider text-brand-cyan group-hover:text-brand-gold transition-colors">
                    <span>{t("cardStart")}</span>
                    <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            3. ESPORTS ARENA & DUELS — SHOWCASING HERO2.PNG ARTWORK
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#061838] via-[#041E42] to-[#0A2A5C] border-2 border-brand-cyan/40 p-8 sm:p-12 lg:p-14 shadow-[0_25px_70px_rgba(0,191,255,0.2)]">
          {/* Ambient stadium neon lights */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-brand-orange/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Text & Features (6 Cols) */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 bg-brand-cyan/20 border border-brand-cyan/50 text-brand-cyan px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(0,191,255,0.3)]">
                <Swords className="w-4 h-4 text-brand-cyan" />
                <span>{t("competeBadge")}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-tight">
                {t("competeSubtitle")}
              </h2>

              <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                {t("competeDesc")}
              </p>

              <div className="space-y-3.5 pt-2">
                {[
                  { icon: <Target className="text-brand-cyan w-5 h-5" />, text: t("competeFeature1") },
                  { icon: <Trophy className="text-brand-gold w-5 h-5" />, text: t("competeFeature2") },
                  { icon: <Users className="text-brand-orange w-5 h-5" />, text: t("competeFeature3") },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3.5 text-gray-100 font-bold">
                    <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                      {item.icon}
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <Link href="/duel">
                  <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-3 px-9 py-4.5 bg-gradient-to-r from-brand-cyan to-blue-500 text-brand-navy font-black rounded-2xl shadow-[0_10px_30px_rgba(0,191,255,0.4)] hover:shadow-[0_15px_40px_rgba(0,191,255,0.6)] text-lg uppercase tracking-wider transition-all"
                  >
                    <Swords className="w-5 h-5" />
                    <span>{t("enterArena")}</span>
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                <Link href="/leaderboard">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-7 py-4.5 bg-white/10 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 text-lg uppercase tracking-wider transition-all"
                  >
                    <Trophy className="w-5 h-5 text-brand-gold" />
                    <span>{t("competeRankings")}</span>
                  </motion.button>
                </Link>
              </div>
            </div>

            {/* Right: HERO2.PNG Esports Stage Graphic (6 Cols) */}
            <div className="lg:col-span-6 flex justify-center">
              <motion.div
                whileHover={{ scale: 1.02, rotate: 0.5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative w-full max-w-[500px] rounded-3xl overflow-hidden border-2 border-brand-cyan/50 shadow-[0_20px_60px_rgba(0,0,0,0.85)] group"
              >
                {/* Glowing border ring */}
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-cyan via-brand-gold to-brand-orange rounded-3xl blur-md opacity-50 group-hover:opacity-100 transition duration-500" />
                
                <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-black">
                  <Image
                    src="/hero2.png"
                    alt="Sudoku World Championship Grand Finals"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                  {/* Subtle vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Top LIVE Banner */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg animate-pulse">
                                            <span className="w-2 h-2 rounded-full bg-white" />
                      {t("finalsLive")}
                    </div>
                    <div className="bg-brand-navy/90 border border-brand-gold/60 text-brand-gold px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md">
                      ⚔️ {t("eloMatchmaking")}
                    </div>
                  </div>

                  {/* Bottom live overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-brand-navy-light/95 border border-brand-cyan/40 p-4 rounded-2xl backdrop-blur-xl shadow-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-brand-cyan font-black uppercase tracking-wider">{t("topDuel")}</p>
                      <p className="text-sm font-black text-white">LogicMaster99 (2450) vs Brainiac (2315)</p>
                    </div>
                    <Link href="/duel">
                      <button className="px-4 py-2 bg-brand-orange text-white text-xs font-black rounded-xl uppercase tracking-wider hover:brightness-110 transition-all shadow-md">
                        {t("joinDuel")}
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            4. DAILY EVENT HIGHLIGHT — CALENDAR & STREAK
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#12284C] via-[#0A2A5C] to-[#041E42] border-2 border-brand-gold/40 p-8 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="space-y-5 max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 bg-brand-gold/20 border border-brand-gold/50 text-brand-gold px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                <Star className="w-4 h-4 fill-brand-gold" />
                <span>{t("dailyEvent")}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight">
                {t("dailyTitle")}
              </h2>

              <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                {t("dailyDesc")}
              </p>

              <div className="flex items-center gap-8 pt-2">
                <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t("difficulty")}</p>
                  <p className="text-xl font-black text-brand-orange mt-0.5">{t("master")}</p>
                </div>
                <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t("yourStreak")}</p>
                  <p className="text-xl font-black text-brand-gold flex items-center gap-1.5 mt-0.5">
                    <Flame className="w-5 h-5 text-brand-orange fill-brand-orange animate-bounce" />
                    <span>{t("streakDays")}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 shrink-0">
              <Link href="/daily">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 bg-gradient-to-r from-brand-gold to-amber-400 text-brand-navy font-black rounded-2xl shadow-[0_10px_35px_rgba(255,204,0,0.4)] hover:shadow-[0_15px_45px_rgba(255,204,0,0.6)] text-xl uppercase tracking-widest transition-all flex items-center gap-3"
                >
                  <Calendar className="w-6 h-6" />
                  <span>{t("playToday")}</span>
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              </Link>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t("resetCaption")}</span>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            5. SUDOKU ACADEMY — 3 TIERS (BEGINNER / INTERMEDIATE / ADVANCED)
        ══════════════════════════════════════════════════════════════ */}
        <section className="text-center">
          <div className="max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black text-brand-gold tracking-[0.25em] uppercase bg-brand-gold/10 px-4 py-1.5 rounded-full border border-brand-gold/30">
              {t("academyBadge")}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-4 uppercase tracking-tight">
              {t("academyTitle")}
            </h2>
            <p className="text-gray-300 text-base sm:text-lg mt-3">
              {t("academyDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                level: t("academyBeginner"),
                desc: t("academyBeginnerDesc"),
                href: "/learn/beginner",
                color: "from-green-500 to-emerald-600",
                badge: t("academyLevel1"),
                border: "border-green-500/30 group-hover:border-green-400 group-hover:shadow-[0_10px_30px_rgba(34,197,94,0.25)]",
              },
              {
                level: t("academyIntermediate"),
                desc: t("academyIntermediateDesc"),
                href: "/learn/intermediate",
                color: "from-brand-gold to-amber-500",
                badge: t("academyLevel2Popular"),
                border: "border-brand-gold/40 group-hover:border-brand-gold group-hover:shadow-[0_15px_35px_rgba(255,204,0,0.35)] scale-105 bg-brand-navy-light/90",
                featured: true,
              },
              {
                level: t("academyAdvanced"),
                desc: t("academyAdvancedDesc"),
                href: "/learn/advanced",
                color: "from-brand-orange to-red-600",
                badge: t("academyLevel3Expert"),
                border: "border-brand-orange/30 group-hover:border-brand-orange group-hover:shadow-[0_10px_30px_rgba(255,69,0,0.25)]",
              },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="group">
                <motion.div
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative rounded-3xl p-8 text-left bg-brand-navy-light/70 border flex flex-col justify-between h-full transition-all duration-300 backdrop-blur-xl ${item.border}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full text-white/80">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black mb-3 uppercase tracking-wide group-hover:text-brand-gold transition-colors">
                      {item.level}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-8 text-sm font-black uppercase tracking-wider text-brand-gold group-hover:translate-x-1 transition-all">
                    <span>{t("readGuides")}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            6. COMMUNITY & ACHIEVEMENTS
        ══════════════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ y: -6 }}
            className="bg-brand-navy-light/80 border-2 border-brand-cyan/30 p-8 sm:p-10 rounded-3xl backdrop-blur-xl shadow-xl hover:border-brand-cyan transition-all group text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-cyan/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-7 h-7 text-brand-cyan" />
            </div>
            <h3 className="text-3xl font-black mb-3 uppercase tracking-tight">{t("joinCommunity")}</h3>
            <p className="text-gray-300 text-base leading-relaxed mb-8">{t("joinCommunityDesc")}</p>
            <Link href="/forum">
              <button className="px-7 py-3.5 bg-brand-cyan text-brand-navy font-black rounded-xl uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-2 shadow-lg">
                <span>{t("browseForums")}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ y: -6 }}
            className="bg-brand-navy-light/80 border-2 border-brand-gold/30 p-8 sm:p-10 rounded-3xl backdrop-blur-xl shadow-xl hover:border-brand-gold transition-all group text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-gold/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Trophy className="w-7 h-7 text-brand-gold" />
            </div>
            <h3 className="text-3xl font-black mb-3 uppercase tracking-tight">{t("unlockAchievements")}</h3>
            <p className="text-gray-300 text-base leading-relaxed mb-8">{t("unlockAchievementsDesc")}</p>
            <Link href="/profile">
              <button className="px-7 py-3.5 bg-brand-gold text-brand-navy font-black rounded-xl uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-2 shadow-lg">
                <span>{t("viewProfile")}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            7. FINAL STUDIO CALL-TO-ACTION
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden rounded-[3rem] text-center py-20 px-6 sm:px-12 bg-gradient-to-br from-brand-orange/20 via-brand-navy to-brand-cyan/20 border-2 border-brand-gold/40 shadow-[0_25px_80px_rgba(0,0,0,0.8)]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/15 rounded-full blur-[140px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-brand-gold px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
              <Grid3X3 className="w-4 h-4" />
              <span>{t("readyBadge")}</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-tight">
              {t("readyTitle")}
            </h2>

            <p className="text-gray-200 text-lg">
              {t("readyCommunity")}
            </p>

            <div className="pt-4 flex justify-center">
              <Link href="/play">
                <motion.button
                  whileHover={{ scale: 1.06, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-12 py-5 text-xl font-black text-white bg-gradient-to-r from-brand-orange via-brand-orange-light to-brand-orange rounded-2xl shadow-[0_10px_40px_rgba(255,69,0,0.55)] hover:shadow-[0_15px_50px_rgba(255,69,0,0.75)] uppercase tracking-widest transition-all flex items-center gap-3"
                >
                  <Play className="w-6 h-6 fill-white" />
                  <span>{t("playNow")}</span>
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
