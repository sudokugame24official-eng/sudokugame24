"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Medal,
  Star,
  Swords,
  TrendingUp,
  Loader2,
  Users,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerIdentity } from "@/components/PlayerIdentity";
import { API_URL } from "@/lib/api";
import { Link } from "@/navigation";
import { Skeleton } from "@/components/ui/Skeleton";

const TABS = ["Global", "Weekly", "Monthly", "Daily"];

const leagueBadge = (rating: number) => {
  if (rating >= 2400)
    return {
      label: "Master",
      cls: "bg-red-500/20 text-red-400 border-red-500/30",
    };
  if (rating >= 2000)
    return {
      label: "Diamond",
      cls: "bg-blue-400/20 text-blue-300 border-blue-400/30",
    };
  if (rating >= 1600)
    return {
      label: "Platinum",
      cls: "bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30",
    };
  if (rating >= 1200)
    return {
      label: "Gold",
      cls: "bg-brand-gold/20 text-brand-gold border-brand-gold/30",
    };
  return {
    label: "Silver",
    cls: "bg-gray-400/20 text-gray-300 border-gray-400/30",
  };
};

function LeaderboardSkeleton() {
  return (
    <div className="divide-y divide-white/5">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center">
          <div className="col-span-1 flex justify-center">
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
          <div className="col-span-6 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="col-span-3 flex justify-center">
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="hidden md:flex col-span-2 justify-end">
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState("Global");

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`${API_URL}/leaderboard/global`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setTopPlayers(data.leaderboard || []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-brand-navy text-white">
      {/* Hero */}
      <section className="py-14 px-4 text-center border-b border-white/10 bg-gradient-to-b from-brand-navy-lighter/30 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest mb-6 border border-brand-gold/20">
            <Trophy className="w-4 h-4" /> Global Rankings
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            World <span className="text-brand-gold">Leaderboard</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-xl mx-auto">
            The top Sudoku players on the planet, ranked by Elo rating. Win
            duels to climb the leagues.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest whitespace-nowrap transition-all",
                activeTab === tab
                  ? "bg-brand-orange text-white shadow-[0_4px_0_#CC3700]"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Your Rank Banner */}
        <div className="bg-brand-navy-lighter border border-brand-gold/30 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold font-black">
              #
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">
                Your Current Rank
              </p>
              <p className="font-bold text-lg">Log in to see your position</p>
            </div>
          </div>
          <Link href="/duel">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-orange text-white font-bold text-sm rounded-xl uppercase tracking-widest shadow-[0_4px_0_#CC3700] hover:brightness-110 transition-all">
              <Swords className="w-4 h-4" /> Climb Now
            </button>
          </Link>
        </div>

        {/* Top 3 Podium */}
        {!loading && !error && topPlayers.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[topPlayers[1], topPlayers[0], topPlayers[2]].map((player, i) => {
              const heights = ["h-24", "h-32", "h-20"];
              const podiumRanks = [2, 1, 3];
              const rank = podiumRanks[i];
              const medals = [
                "text-gray-300",
                "text-brand-gold",
                "text-amber-600",
              ];
              return (
                <div
                  key={player?.userId}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-navy-light border-2 border-white/20 flex items-center justify-center font-black text-xl">
                    {player?.username?.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-bold text-center truncate max-w-full px-1">
                    {player?.username}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {player?.rating || player?.elo || 0}
                  </p>
                  <div
                    className={cn(
                      "w-full rounded-t-xl flex items-center justify-center",
                      heights[i],
                      rank === 1
                        ? "bg-brand-gold/20 border-2 border-brand-gold/50"
                        : "bg-white/5 border border-white/10",
                    )}
                  >
                    <Medal className={cn("w-8 h-8", medals[i])} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Table */}
        <div className="bg-brand-navy-light border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/10 bg-black/30 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-7 md:col-span-6">Player</div>
            <div className="hidden md:block md:col-span-3 text-center">
              League
            </div>
            <div className="col-span-4 md:col-span-2 text-right pr-2">
              Rating
            </div>
          </div>

          {loading ? (
            <LeaderboardSkeleton />
          ) : error ? (
            <div className="p-12 text-center">
              <TrendingUp className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Couldn't load rankings</h3>
              <p className="text-gray-400 mb-6">
                Something went wrong fetching the leaderboard.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-brand-orange text-white font-bold rounded-xl uppercase tracking-widest"
              >
                Try Again
              </button>
            </div>
          ) : topPlayers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Players Ranked Yet</h3>
              <p className="text-gray-400 mb-6">
                Be the first to complete a duel and claim the top spot.
              </p>
              <Link href="/duel">
                <button className="px-6 py-3 bg-brand-orange text-white font-bold rounded-xl uppercase tracking-widest shadow-[0_4px_0_#CC3700]">
                  Find an Opponent
                </button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {topPlayers.map((player, index) => {
                const { label, cls } = leagueBadge(
                  player.rating || player.elo || 0,
                );
                return (
                  <motion.div
                    key={player.userId || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                    className={cn(
                      "grid grid-cols-12 gap-4 px-4 py-3.5 items-center hover:bg-white/5 transition-colors",
                      index === 0 && "bg-brand-gold/5",
                    )}
                  >
                    <div className="col-span-1 flex justify-center">
                      {player.rank <= 3 ? (
                        <Medal
                          className={cn(
                            "w-6 h-6",
                            player.rank === 1
                              ? "text-brand-gold"
                              : player.rank === 2
                                ? "text-gray-300"
                                : "text-amber-600",
                          )}
                        />
                      ) : (
                        <span className="font-bold text-gray-400">
                          #{player.rank}
                        </span>
                      )}
                    </div>
                    <div className="col-span-7 md:col-span-6 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-orange/20 flex items-center justify-center font-black text-brand-orange shrink-0">
                        {player.username?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <PlayerIdentity
                        username={player.username || "Unknown"}
                        level={player.level || 1}
                        size="lg"
                      />
                    </div>
                    <div className="hidden md:flex md:col-span-3 justify-center">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase border",
                          cls,
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    <div className="col-span-4 md:col-span-2 flex justify-end items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                      <span className="font-black font-mono">
                        {player.rating || player.elo || 0}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Play CTA */}
        <div className="mt-10 text-center">
          <p className="text-gray-400 mb-4">
            Your Elo increases with every duel win. Start competing now.
          </p>
          <Link href="/duel">
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-brand-orange text-white font-black rounded-xl uppercase tracking-widest shadow-[0_4px_0_#CC3700] hover:brightness-110 active:translate-y-1 active:shadow-none transition-all">
              <Swords className="w-5 h-5" /> Enter the Arena
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
