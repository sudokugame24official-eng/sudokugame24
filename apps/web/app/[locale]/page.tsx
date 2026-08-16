"use client";
import { API_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
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
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("home");
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselImages, setCarouselImages] = useState<string[]>([
    "/hero1_new.jpg",
    "/hero2_new.jpg",
  ]);

  useEffect(() => {
    setMounted(true);
    fetch(`${API_URL}/settings/homepage`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setCarouselImages(data);
        }
      })
      .catch((err) => console.error("Failed to load homepage images", err));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-brand-navy text-white font-sans overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative w-full bg-brand-black grid min-h-[60vh]">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full flex items-center justify-center col-start-1 row-start-1 overflow-hidden"
          >
            {/* Fallback pattern if images are missing */}
            <div className="absolute inset-0 bg-brand-navy-light opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <img
              src={carouselImages[currentSlide]}
              alt={`Sudoku Hero image ${currentSlide + 1}`}
              className="w-full h-full object-cover block opacity-60"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 z-10 bg-gradient-to-t from-brand-navy via-transparent to-transparent">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl p-12 rounded-3xl backdrop-blur-sm bg-black/20 border border-white/5 shadow-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none">
              {t("heroTitle")
                .split(". ")
                .map((part, i) => (
                  <span key={i} className={i === 1 ? "text-brand-gold" : ""}>
                    {part}. {i < 2 && <br />}
                  </span>
                ))}
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 mb-10 font-medium max-w-2xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {t("heroDesc")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pointer-events-auto">
              <Link href="/play" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 text-xl font-black text-white bg-brand-orange rounded-xl shadow-[0_8px_0_#CC3700] active:shadow-[0_0px_0_#CC3700] active:translate-y-2 transition-all uppercase tracking-widest hover:brightness-110 flex items-center justify-center gap-2">
                  <Play className="w-6 h-6" /> {t("playSudoku")}
                </button>
              </Link>
              <Link href="/daily" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 text-xl font-black text-brand-gold bg-brand-navy/60 rounded-xl shadow-[0_8px_0_#05152F] active:shadow-[0_0px_0_#05152F] active:translate-y-2 transition-all uppercase tracking-widest hover:brightness-110 flex items-center justify-center gap-2 border border-brand-gold/30 backdrop-blur-sm">
                  <Calendar className="w-6 h-6" /> {t("dailyChallenge")}
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-[1200px] mx-auto py-16 px-4 space-y-32">
        {/* 2. WHAT IS SUDOKU PLATFORM? */}
        <section className="text-center max-w-3xl mx-auto">
          <h2 className="text-sm font-black text-brand-gold tracking-[0.2em] uppercase mb-4">
            {t("whatIsTitle")}
          </h2>
          <h3 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
            {t("whatIsSubtitle")}
          </h3>
          <p className="text-lg text-gray-300 leading-relaxed">
            {t("whatIsDesc")}
          </p>
        </section>

        {/* 3. WHAT CAN I DO? (4 Cards) */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/play" className="group">
              <div className="bg-brand-navy-light border border-white/10 p-6 rounded-2xl h-full flex flex-col items-center text-center hover:border-brand-orange/50 hover:bg-brand-navy-lighter transition-all hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black mb-2 uppercase">
                  {t("cardPlay")}
                </h3>
                <p className="text-gray-400 text-sm">{t("cardPlayDesc")}</p>
              </div>
            </Link>

            <Link href="/daily" className="group">
              <div className="bg-brand-navy-light border border-white/10 p-6 rounded-2xl h-full flex flex-col items-center text-center hover:border-brand-gold/50 hover:bg-brand-navy-lighter transition-all hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black mb-2 uppercase">
                  {t("cardDaily")}
                </h3>
                <p className="text-gray-400 text-sm">{t("cardDailyDesc")}</p>
              </div>
            </Link>

            <Link href="/duel" className="group">
              <div className="bg-brand-navy-light border border-white/10 p-6 rounded-2xl h-full flex flex-col items-center text-center hover:border-brand-cyan/50 hover:bg-brand-navy-lighter transition-all hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-brand-cyan/20 text-brand-cyan flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Swords className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black mb-2 uppercase">
                  {t("cardDuel")}
                </h3>
                <p className="text-gray-400 text-sm">{t("cardDuelDesc")}</p>
              </div>
            </Link>

            <Link href="/learn" className="group">
              <div className="bg-brand-navy-light border border-white/10 p-6 rounded-2xl h-full flex flex-col items-center text-center hover:border-white/50 hover:bg-brand-navy-lighter transition-all hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black mb-2 uppercase">
                  {t("cardLearn")}
                </h3>
                <p className="text-gray-400 text-sm">{t("cardLearnDesc")}</p>
              </div>
            </Link>
          </div>
        </section>

        {/* 4. DAILY CHALLENGE TEASER */}
        <section className="bg-gradient-to-r from-brand-navy-light to-brand-navy-lighter border-2 border-brand-gold/40 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(255,204,0,0.1)] relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl" />
          <div className="flex-1 relative z-10">
            <div className="inline-flex items-center gap-2 bg-brand-gold/20 text-brand-gold px-3 py-1 rounded-full text-sm font-black uppercase tracking-widest mb-4">
              <Star className="w-4 h-4" /> {t("dailyEvent")}
            </div>
            <h2 className="text-4xl font-black mb-4 uppercase">
              {t("dailyTitle")}
            </h2>
            <p className="text-lg text-gray-300 mb-6 max-w-lg">
              {t("dailyDesc")}
            </p>
            <div className="flex items-center gap-6 mb-8">
              <div className="text-center">
                <p className="text-sm text-gray-400 uppercase font-bold">
                  {t("difficulty")}
                </p>
                <p className="text-xl font-black text-brand-orange">
                  {t("master")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400 uppercase font-bold">
                  {t("yourStreak")}
                </p>
                <p className="text-xl font-black flex items-center justify-center gap-1">
                  <Flame className="text-brand-orange w-5 h-5" />{" "}
                  {t("days", { n: 12 })}
                </p>
              </div>
            </div>
            <Link href="/daily">
              <button className="px-8 py-4 bg-brand-gold text-brand-navy font-black rounded-xl uppercase tracking-widest hover:bg-brand-gold-dark transition-colors shadow-lg">
                {t("playToday")}
              </button>
            </Link>
          </div>
          <div className="w-full md:w-1/3 relative z-10 flex justify-center">
            {/* Visual representation of a calendar or grid */}
            <div className="w-48 h-48 bg-brand-navy border-4 border-brand-gold/50 rounded-2xl rotate-6 shadow-2xl flex items-center justify-center">
              <Calendar className="w-24 h-24 text-brand-gold opacity-50" />
            </div>
          </div>
        </section>

        {/* 5. COMPETITIVE SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-sm font-black text-brand-cyan tracking-[0.2em] uppercase mb-2">
              {t("competeTitle")}
            </h2>
            <h3 className="text-4xl font-black mb-6 uppercase">
              {t("competeSubtitle")}
            </h3>
            <p className="text-lg text-gray-300 mb-8">{t("competeDesc")}</p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 font-bold text-gray-200">
                <Target className="text-brand-cyan" /> {t("competeFeature1")}
              </li>
              <li className="flex items-center gap-3 font-bold text-gray-200">
                <Trophy className="text-brand-gold" /> {t("competeFeature2")}
              </li>
              <li className="flex items-center gap-3 font-bold text-gray-200">
                <Users className="text-brand-orange" /> {t("competeFeature3")}
              </li>
            </ul>
            <Link href="/duel">
              <button className="px-8 py-4 bg-transparent border-2 border-brand-cyan text-brand-cyan hover:bg-brand-cyan hover:text-brand-navy font-black rounded-xl uppercase tracking-widest transition-all">
                {t("enterArena")}
              </button>
            </Link>
          </div>
          <div className="bg-brand-navy-light rounded-3xl p-6 border border-white/10 shadow-2xl relative">
            <div className="absolute -top-4 -right-4 bg-brand-gold text-brand-navy text-xs font-black px-3 py-1 rounded-full uppercase shadow-lg rotate-12">
              {t("liveRankings")}
            </div>
            {/* Fake Leaderboard UI for visual */}
            <div className="space-y-3">
              {[
                {
                  rank: 1,
                  name: "LogicMaster99",
                  rating: 2450,
                  color: "text-brand-gold",
                },
                {
                  rank: 2,
                  name: "SudokuKing",
                  rating: 2390,
                  color: "text-gray-300",
                },
                {
                  rank: 3,
                  name: "Brainiac_22",
                  rating: 2315,
                  color: "text-orange-400",
                },
                {
                  rank: 4,
                  name: "You (Current)",
                  rating: 1850,
                  color: "text-white bg-white/10 rounded-lg",
                },
              ].map((p, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 border-b border-white/5 last:border-0 ${p.color}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-black w-6 text-center">
                      #{p.rank}
                    </span>
                    <span className="font-bold">{p.name}</span>
                  </div>
                  <span className="font-black">{p.rating}</span>
                </div>
              ))}
            </div>
            <Link
              href="/leaderboard"
              className="block text-center mt-4 text-sm font-bold text-brand-cyan hover:underline"
            >
              {t("viewLeaderboard")}
            </Link>
          </div>
        </section>

        {/* 6. ACADEMY SECTION */}
        <section className="text-center">
          <h2 className="text-4xl font-black mb-12 uppercase">
            {t("academyTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 border border-white/10 rounded-2xl bg-brand-navy-light">
              <h4 className="text-lg font-black text-brand-cyan mb-2 uppercase">
                {t("academyBeginner")}
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                {t("academyBeginnerDesc")}
              </p>
              <Link
                href="/learn/beginner"
                className="text-sm font-bold text-white hover:text-brand-cyan underline"
              >
                {t("readGuides")}
              </Link>
            </div>
            <div className="p-6 border border-brand-gold/30 rounded-2xl bg-brand-navy-lighter scale-105 shadow-xl">
              <h4 className="text-lg font-black text-brand-gold mb-2 uppercase">
                {t("academyIntermediate")}
              </h4>
              <p className="text-sm text-gray-300 mb-4">
                {t("academyIntermediateDesc")}
              </p>
              <Link
                href="/learn/intermediate"
                className="text-sm font-bold text-white hover:text-brand-gold underline"
              >
                {t("readGuides")}
              </Link>
            </div>
            <div className="p-6 border border-white/10 rounded-2xl bg-brand-navy-light">
              <h4 className="text-lg font-black text-brand-orange mb-2 uppercase">
                {t("academyAdvanced")}
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                {t("academyAdvancedDesc")}
              </p>
              <Link
                href="/learn/advanced"
                className="text-sm font-bold text-white hover:text-brand-orange underline"
              >
                {t("readGuides")}
              </Link>
            </div>
          </div>
        </section>

        {/* 7 & 8. COMMUNITY & GAMIFICATION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-brand-navy-light p-8 rounded-3xl border border-white/10">
            <MessageSquare className="w-10 h-10 text-brand-cyan mb-4" />
            <h3 className="text-2xl font-black mb-4 uppercase">
              {t("joinCommunity")}
            </h3>
            <p className="text-gray-300 mb-6">{t("joinCommunityDesc")}</p>
            <Link href="/forum">
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 font-bold rounded-xl transition-colors">
                {t("browseForums")}
              </button>
            </Link>
          </div>
          <div className="bg-brand-navy-light p-8 rounded-3xl border border-white/10">
            <Trophy className="w-10 h-10 text-brand-gold mb-4" />
            <h3 className="text-2xl font-black mb-4 uppercase">
              {t("unlockAchievements")}
            </h3>
            <p className="text-gray-300 mb-6">{t("unlockAchievementsDesc")}</p>
            <Link href="/profile">
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 font-bold rounded-xl transition-colors">
                {t("viewProfile")}
              </button>
            </Link>
          </div>
        </section>

        {/* 9. FINAL CTA */}
        <section className="text-center pb-20">
          <h2 className="text-4xl md:text-5xl font-black mb-8 uppercase tracking-tight">
            {t("readyTitle")}
          </h2>
          <Link href="/play">
            <button className="px-12 py-5 text-xl font-black text-white bg-brand-orange rounded-xl shadow-[0_8px_0_#CC3700,0_15px_30px_rgba(255,69,0,0.3)] active:shadow-[0_0px_0_#CC3700] active:translate-y-2 transition-all uppercase tracking-widest hover:brightness-110">
              {t("playNow")}
            </button>
          </Link>
        </section>
      </main>
    </div>
  );
}
