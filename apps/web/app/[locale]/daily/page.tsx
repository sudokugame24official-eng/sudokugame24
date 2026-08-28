"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Calendar,
  Flame,
  Trophy,
  Clock,
  Play,
  ChevronRight,
  Star,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Link } from "@/navigation";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DailyPage() {
  const t = useTranslations("daily");
  const { user } = useAuth();
  const [daily, setDaily] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/daily/today`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setDaily(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-brand-navy text-white">
      {/* Hero */}
      <section className="py-16 px-4 text-center border-b border-white/10 bg-gradient-to-b from-brand-navy-lighter/40 to-transparent relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-gold/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-brand-orange/10 text-brand-orange px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest mb-6 border border-brand-orange/20">
            <Calendar className="w-4 h-4" /> {t("dailyChallenge")}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 leading-none break-words">
            {t("h1")}
          </h1>
          <p className="text-gray-300 text-lg mb-4">{todayDate}</p>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            {t("subtitle")}
          </p>

          {/* Streak Banner */}
          {user && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-gradient-to-r from-brand-orange/15 via-brand-gold/10 to-brand-orange/15 border border-brand-orange/40 rounded-2xl px-6 py-3.5 mb-8 w-fit mx-auto shadow-[0_0_30px_rgba(255,69,0,0.15)]">
              <Flame className="w-7 h-7 text-brand-orange animate-bounce" />
              <div className="text-left">
                <p className="text-[10px] text-slate-300 uppercase font-bold tracking-widest">
                  {t("currentStreak")}
                </p>
                <p className="text-2xl font-black text-brand-orange tabular-nums">
                  {(user as any).streak || 0} {t("days")}
                </p>
              </div>
              <div className="w-px h-8 bg-white/20 mx-3 hidden sm:block" />
              <div className="text-left">
                <p className="text-[10px] text-slate-300 uppercase font-bold tracking-widest">
                  {t("bestStreak")}
                </p>
                <p className="text-2xl font-black text-white tabular-nums">
                  {(user as any).maxStreak || 0} {t("days")}
                </p>
              </div>
            </div>
          )}

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/play">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-brand-orange to-[#FF6B33] text-white font-black text-xl rounded-2xl shadow-[0_8px_25px_rgba(255,69,0,0.4)] active:translate-y-1 transition-all uppercase tracking-widest btn-tactile"
              >
                <Play className="w-6 h-6 fill-white" /> {t("playToday")}
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        {/* Challenge Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-brand-navy-light/80 backdrop-blur-xl border border-white/15 rounded-2xl p-6 flex items-center gap-4 shadow-lg hover:border-white/25 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-brand-orange" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">
                {t("timeLimit")}
              </p>
              <p className="text-2xl font-black tabular-nums">2 min</p>
            </div>
          </div>

          <div className="bg-brand-navy-light/80 backdrop-blur-xl border border-white/15 rounded-2xl p-6 flex items-center gap-4 shadow-lg hover:border-white/25 transition-all">
            {loading ? (
              <Skeleton className="w-full h-12" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-brand-gold" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">
                    {t("playersToday")}
                  </p>
                  <p className="text-2xl font-black text-brand-gold tabular-nums">
                    {daily?.participantCount || "—"}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="bg-brand-navy-light border border-white/10 rounded-2xl p-6 flex items-center gap-4">
            {loading ? (
              <Skeleton className="w-full h-12" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-brand-cyan/20 flex items-center justify-center shrink-0">
                  <Star className="w-6 h-6 text-brand-cyan" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">
                    {t("difficulty")}
                  </p>
                  <p className="text-2xl font-black text-brand-cyan">
                    {daily?.difficulty || t("fallbackHard")}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* {t("howItWorks")} */}
        <div className="bg-brand-navy-light border border-white/10 rounded-3xl p-8">
          <h2 className="text-2xl font-black uppercase mb-6">{t("howItWorks")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Play className="w-6 h-6" />,
                color: "text-brand-orange bg-brand-orange/20",
                title: t("howStep1Title"),
                desc: t("playOnceDesc"),
              },
              {
                icon: <CheckCircle className="w-6 h-6" />,
                color: "text-brand-gold bg-brand-gold/20",
                title: t("howStep2Title"),
                desc: t("earnCoinsDesc"),
              },
              {
                icon: <Trophy className="w-6 h-6" />,
                color: "text-brand-cyan bg-brand-cyan/20",
                title: t("howStep3Title"),
                desc: t("checkRankingsDesc"),
              },
            ].map((step, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center gap-3"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center font-black`}
                >
                  {step.icon}
                </div>
                <h3 className="font-black text-lg">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Streak Info */}
        <div className="bg-gradient-to-r from-brand-navy-light to-brand-navy-lighter border border-brand-orange/30 rounded-3xl p-8 flex flex-col lg:flex-row items-center gap-6">
          <Flame className="w-16 h-16 text-brand-orange shrink-0" />
          <div className="flex-1">
            <h2 className="text-2xl font-black uppercase mb-2">
              Build Your Streak
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Complete the Daily Challenge every day to grow your streak. Miss a
              day and it resets to zero. Players with streaks of 7, 30, and 100
              days earn exclusive badges displayed on their profile.
            </p>
          </div>
          <Link href="/learn/how-to-play" className="shrink-0">
            <button className="flex items-center gap-2 px-6 py-3 border border-brand-orange text-brand-orange font-bold rounded-xl hover:bg-brand-orange hover:text-white transition-all">
              {t("learnStrategies")} <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/daily/leaderboard">
            <button className="flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
              <Trophy className="w-5 h-5 text-brand-gold" /> {t("dailyLeaderboard")}
            </button>
          </Link>
          <Link href="/leaderboard">
            <button className="flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
              <Star className="w-5 h-5 text-brand-cyan" /> {t("globalRankings")}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
