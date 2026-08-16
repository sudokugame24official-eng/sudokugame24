"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Users, Trophy, Flame, Globe } from "lucide-react";
import { API_URL } from "@/lib/api";

interface Stats {
  onlinePlayers: number;
  ongoingDuels: number;
  todayGames: number;
  topPlayer?: string;
}

const MOCK_STATS: Stats = {
  onlinePlayers: 3241,
  ongoingDuels: 87,
  todayGames: 12847,
  topPlayer: "MaitreSudoku",
};

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const start = useRef(Date.now());

  useEffect(() => {
    start.current = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start.current;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * ease));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

function StatItem({
  icon: Icon,
  value,
  label,
  color = "text-brand-gold",
  pulse = false,
}: {
  icon: React.ElementType;
  value: number | string;
  label: string;
  color?: string;
  pulse?: boolean;
}) {
  const numericValue = typeof value === "number" ? value : 0;
  const animated = useCountUp(numericValue);
  const display = typeof value === "number" ? animated.toLocaleString("fr-FR") : value;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 whitespace-nowrap">
      <div className={`relative ${pulse ? "animate-pulse" : ""}`}>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        {pulse && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
        )}
      </div>
      <span className={`text-xs font-black tracking-wide ${color}`}>{display}</span>
      <span className="text-[11px] text-gray-500">{label}</span>
    </div>
  );
}

export const LiveStatsTicker = () => {
  const [stats, setStats] = useState<Stats>(MOCK_STATS);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fetchStats = () => {
      fetch(`${API_URL}/stats/live`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.onlinePlayers !== undefined) setStats(data);
        })
        .catch(() => {});
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div className="w-full bg-brand-navy border-b border-white/5 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-orange/5 via-transparent to-brand-gold/5 animate-pulse pointer-events-none" />

      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4">
        {/* Left: Live indicator */}
        <div className="flex items-center gap-2 py-1.5 shrink-0">
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-green-400 rounded-full"
          />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-green-400">
            Live
          </span>
        </div>

        {/* Center: Scrolling stats */}
        <div className="flex items-center overflow-hidden flex-1 mx-4">
          <div className="flex items-center animate-[ticker_20s_linear_infinite] hover:[animation-play-state:paused]">
            <StatItem icon={Users} value={stats.onlinePlayers} label="joueurs en ligne" color="text-green-400" pulse />
            <span className="text-gray-700 mx-2">•</span>
            <StatItem icon={Swords} value={stats.ongoingDuels} label="duels en cours" color="text-brand-orange" />
            <span className="text-gray-700 mx-2">•</span>
            <StatItem icon={Trophy} value={stats.todayGames} label="parties aujourd'hui" color="text-brand-gold" />
            <span className="text-gray-700 mx-2">•</span>
            {stats.topPlayer && (
              <>
                <StatItem icon={Flame} value={stats.topPlayer} label="meilleur joueur du jour" color="text-brand-cyan" />
                <span className="text-gray-700 mx-2">•</span>
              </>
            )}
            <StatItem icon={Globe} value="12" label="langues supportées" color="text-purple-400" />
            {/* Repeat for seamless loop */}
            <span className="text-gray-700 mx-2 pl-8">•</span>
            <StatItem icon={Users} value={stats.onlinePlayers} label="joueurs en ligne" color="text-green-400" pulse />
            <span className="text-gray-700 mx-2">•</span>
            <StatItem icon={Swords} value={stats.ongoingDuels} label="duels en cours" color="text-brand-orange" />
          </div>
        </div>

        {/* Right: Close */}
        <button
          onClick={() => setVisible(false)}
          className="text-gray-600 hover:text-gray-400 transition-colors text-xs shrink-0 py-1.5"
        >
          ✕
        </button>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};
