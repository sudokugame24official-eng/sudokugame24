import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayerIdentity } from "../PlayerIdentity";

interface BattleBarProps {
  player1: { id: string; username: string; score: number; level?: number };
  player2: { id: string; username: string; score: number; level?: number };
  onPlayerClick?: (e: React.MouseEvent, user: { id: string; username: string }) => void;
}

export const BattleBar: React.FC<BattleBarProps> = ({ player1, player2, onPlayerClick }) => {
  const [p1Prev, setP1Prev] = useState(0);
  const [p2Prev, setP2Prev] = useState(0);

  useEffect(() => {
    setP1Prev(player1.score);
  }, [player1.score]);

  useEffect(() => {
    setP2Prev(player2.score);
  }, [player2.score]);
  // We calculate the percentage for P1.
  // If total score is 0, bar is at 50%.
  // We can also allow negative scores, so we use an offset or total diff.

  // A standard way is to map the difference in score to a percentage.
  // E.g., max diff could be 20 points.
  const scoreDiff = player1.score - player2.score;
  const maxDiff = 40; // If someone is ahead by 40 points, they have 100% of the bar

  // Clamped percentage between 5% and 95% so the losing player always sees a little bit of their color.
  let p1Percentage = 50 + (scoreDiff / maxDiff) * 50;
  p1Percentage = Math.max(5, Math.min(95, p1Percentage));

  return (
    <div className="w-full max-w-[600px] mx-auto mb-6 bg-card/60 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Player Headers */}
      <div className="flex justify-between items-end mb-4 relative z-10">
        <div className="flex flex-col items-start gap-1 relative cursor-pointer" onClick={(e) => onPlayerClick?.(e, player1)}>
          <PlayerIdentity
            username={player1.username}
            level={player1.level || 1}
            size="lg"
          />
          <div className="relative">
            <span className="text-3xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-all">
              {player1.score}
            </span>
            <AnimatePresence>
              {player1.score !== 0 && (
                <motion.span
                  key={player1.score}
                  initial={{ opacity: 1, y: 0, scale: 1.5 }}
                  animate={{ opacity: 0, y: -30, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute left-full ml-2 text-red-400 font-bold text-lg"
                >
                  {player1.score >= p1Prev ? "+1" : "-1"}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col items-center justify-end pb-2">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">
            Domination
          </span>
        </div>

        <div className="flex flex-col items-end gap-1 relative cursor-pointer" onClick={(e) => onPlayerClick?.(e, player2)}>
          <PlayerIdentity
            username={player2.username}
            level={player2.level || 1}
            size="lg"
          />
          <div className="relative">
            <AnimatePresence>
              {player2.score !== 0 && (
                <motion.span
                  key={player2.score}
                  initial={{ opacity: 1, y: 0, scale: 1.5 }}
                  animate={{ opacity: 0, y: -30, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute right-full mr-2 text-blue-400 font-bold text-lg"
                >
                  {player2.score >= p2Prev ? "+1" : "-1"}
                </motion.span>
              )}
            </AnimatePresence>
            <span className="text-3xl font-black text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all">
              {player2.score}
            </span>
          </div>
        </div>
      </div>

      {/* The Bar */}
      <div className="h-6 w-full rounded-full bg-slate-900/80 border-2 border-slate-700/50 relative overflow-hidden shadow-inner">
        {/* P1 Fill (Red) */}
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 to-red-400"
          animate={{ width: `${p1Percentage}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          style={{ originX: 0 }}
        >
          {/* Subtle animated shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
        </motion.div>

        {/* P2 Fill (Blue) */}
        <motion.div
          className="absolute top-0 right-0 h-full bg-gradient-to-l from-blue-600 to-blue-400"
          animate={{ width: `${100 - p1Percentage}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          style={{ originX: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/20 to-transparent skew-x-12 translate-x-[100%] animate-[shimmer_2s_infinite_reverse]" />
        </motion.div>

        {/* Center Marker */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-white/50 z-10" />
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(200%) skewX(-12deg); }
        }
      `}</style>
    </div>
  );
};
