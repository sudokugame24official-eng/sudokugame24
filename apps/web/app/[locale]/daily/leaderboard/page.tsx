"use client";
import { API_URL } from "@/lib/api";
import { useTranslations } from "next-intl";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Medal, ArrowLeft, Clock, Coins, User } from "lucide-react";
import { Link } from "@/navigation";

interface LeaderboardEntry {
  id: string;
  score: number;
  timeSec: number;
  user: {
    id: string;
    profile?: {
      username: string;
      avatarUrl: string | null;
    };
  };
}

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const challengeId = searchParams.get("challengeId");
  const td = useTranslations("daily");
  const tg = useTranslations("game");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (challengeId) {
      fetch(`${API_URL}/daily/${challengeId}/leaderboard`)
        .then((res) => res.json())
        .then((data) => {
          setLeaderboard(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch leaderboard", err);
          setLoading(false);
        });
    }
  }, [challengeId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-[#041E42] text-white p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#FF4500]/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-[pulse_4s_ease-in-out_infinite]"></div>
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#FFCC00]/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-[pulse_6s_ease-in-out_infinite]"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="max-w-4xl mx-auto z-10 relative">
        <Link
          href="/play"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" /> {td("lbBack")}
        </Link>

        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-gradient-to-br from-[#FF4500] to-[#FFCC00] rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,69,0,0.4)]"
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
            {td("lbTitle")}
          </h1>
          <p className="text-lg text-blue-200/70 max-w-2xl mx-auto">
            {td("lbDesc")}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-[#FF4500]/20 border-t-[#FF4500] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 md:p-8 shadow-2xl">
            {leaderboard.length === 0 ? (
              <div className="text-center py-20 text-white/50">
                <p className="text-xl font-bold">
                  {tg("noScoresYet")}
                </p>
                <p>{tg("beFirst")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => {
                  const isTop3 = index < 3;
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={entry.id}
                      className={`flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all ${
                        index === 0
                          ? "bg-gradient-to-r from-[#FFCC00]/20 to-transparent border-[#FFCC00]/50 shadow-[0_0_20px_rgba(255,204,0,0.2)]"
                          : index === 1
                            ? "bg-gradient-to-r from-gray-300/20 to-transparent border-gray-300/50"
                            : index === 2
                              ? "bg-gradient-to-r from-amber-600/20 to-transparent border-amber-600/50"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-4 md:gap-6">
                        <div
                          className={`w-10 text-center font-black text-2xl ${
                            index === 0
                              ? "text-[#FFCC00]"
                              : index === 1
                                ? "text-gray-300"
                                : index === 2
                                  ? "text-amber-600"
                                  : "text-white/30"
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              isTop3 ? "bg-white/10" : "bg-black/50"
                            }`}
                          >
                            {entry.user.profile?.avatarUrl ? (
                              <img
                                src={entry.user.profile.avatarUrl}
                                alt="avatar"
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User
                                className={`w-6 h-6 ${isTop3 ? "text-white" : "text-white/50"}`}
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-lg">
                              {entry.user.profile?.username || entry.user.id}
                            </p>
                            {isTop3 && (
                              <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                                Top Player
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                            Temps
                          </span>
                          <div className="flex items-center gap-1.5 font-mono text-lg font-bold">
                            <Clock className="w-4 h-4 text-blue-400" />
                            {formatTime(entry.timeSec)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                            Score
                          </span>
                          <div className="flex items-center gap-1.5 text-xl font-black text-[#FFCC00]">
                            <Coins className="w-5 h-5" />
                            {entry.score}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DailyLeaderboardPage() {
  const t = useTranslations("game");
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#041E42] flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#FF4500]/20 border-t-[#FF4500] rounded-full animate-spin"></div>
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}
