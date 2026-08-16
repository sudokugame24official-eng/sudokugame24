"use client";
import React, { useState, useEffect } from "react";
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
            <Calendar className="w-4 h-4" /> Daily Challenge
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-none">
            Today's <span className="text-brand-gold">Global</span> Puzzle
          </h1>
          <p className="text-gray-300 text-lg mb-4">{todayDate}</p>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            One puzzle. Every player on earth. Solve it, set your best time, and
            see how you rank.
          </p>

          {/* Streak Banner */}
          {user && (
            <div className="inline-flex items-center gap-3 bg-brand-orange/10 border border-brand-orange/30 rounded-2xl px-6 py-3 mb-8">
              <Flame className="w-6 h-6 text-brand-orange" />
              <div className="text-left">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">
                  Current Streak
                </p>
                <p className="text-2xl font-black text-brand-orange">
                  {(user as any).streak || 0} Days
                </p>
              </div>
              <div className="w-px h-8 bg-white/20 mx-2" />
              <div className="text-left">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">
                  Best Streak
                </p>
                <p className="text-2xl font-black text-white">
                  {(user as any).maxStreak || 0} Days
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
                className="flex items-center gap-3 px-10 py-5 bg-brand-orange text-white font-black text-xl rounded-xl shadow-[0_8px_0_#CC3700] active:shadow-[0_0px_0_#CC3700] active:translate-y-2 transition-all uppercase tracking-widest"
              >
                <Play className="w-6 h-6" /> Play Today's Challenge
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        {/* Challenge Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-brand-navy-light border border-white/10 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-orange/20 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-brand-orange" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">
                Time Limit
              </p>
              <p className="text-2xl font-black">2 Minutes</p>
            </div>
          </div>

          <div className="bg-brand-navy-light border border-white/10 rounded-2xl p-6 flex items-center gap-4">
            {loading ? (
              <Skeleton className="w-full h-12" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-brand-gold/20 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-brand-gold" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">
                    Players Today
                  </p>
                  <p className="text-2xl font-black text-brand-gold">
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
                    Difficulty
                  </p>
                  <p className="text-2xl font-black text-brand-cyan">
                    {daily?.difficulty || "Hard"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-brand-navy-light border border-white/10 rounded-3xl p-8">
          <h2 className="text-2xl font-black uppercase mb-6">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Play className="w-6 h-6" />,
                color: "text-brand-orange bg-brand-orange/20",
                title: "Play Once",
                desc: "You get one official attempt per day. The clock starts when you click Play.",
              },
              {
                icon: <CheckCircle className="w-6 h-6" />,
                color: "text-brand-gold bg-brand-gold/20",
                title: "Earn Coins",
                desc: "Each correct cell placement earns you +5 Coins. Complete the puzzle to maximize your haul.",
              },
              {
                icon: <Trophy className="w-6 h-6" />,
                color: "text-brand-cyan bg-brand-cyan/20",
                title: "Check Rankings",
                desc: "Compare your time against every other player on Earth on the Daily Leaderboard.",
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
        <div className="bg-gradient-to-r from-brand-navy-light to-brand-navy-lighter border border-brand-orange/30 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
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
              Learn Strategies <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/daily/leaderboard">
            <button className="flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
              <Trophy className="w-5 h-5 text-brand-gold" /> View Daily
              Leaderboard
            </button>
          </Link>
          <Link href="/leaderboard">
            <button className="flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
              <Star className="w-5 h-5 text-brand-cyan" /> Global Rankings
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
