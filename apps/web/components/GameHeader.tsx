"use client";
import React from "react";
import { ArrowLeft, Pause, Settings, Trophy, ShieldAlert } from "lucide-react";
import { Link } from "@/navigation";
import { usePathname } from "next/navigation";

interface GameHeaderProps {
  mode: "solo" | "daily" | "duel";
  difficulty?: string;
  mistakes?: number;
  maxMistakes?: number;
  score?: number;
  onPause?: () => void;
  onSettings?: () => void;
}

export const GameHeader = ({
  mode,
  difficulty,
  mistakes = 0,
  maxMistakes = 3,
  score = 0,
  onPause,
  onSettings,
}: GameHeaderProps) => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full bg-brand-navy border-b-[4px] border-brand-navy-lighter shadow-lg">
      <div className="flex h-16 items-center justify-between px-4 max-w-[1400px] mx-auto">
        {/* Left: Exit */}
        <div className="flex items-center">
          <Link href="/">
            <button className="flex items-center gap-2 text-gray-400 hover:text-brand-orange transition-colors group">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-orange/20">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="hidden sm:inline font-bold uppercase tracking-widest text-sm">
                Exit
              </span>
            </button>
          </Link>
        </div>

        {/* Center: Contextual Game Info */}
        <div className="flex-1 flex justify-center items-center gap-4 md:gap-8 text-white">
          {mode === "solo" && (
            <>
              <div className="text-center hidden sm:block">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block">
                  Difficulty
                </span>
                <span className="text-brand-gold font-bold">
                  {difficulty || "Normal"}
                </span>
              </div>
              <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
              <div className="text-center">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block">
                  Score
                </span>
                <span className="text-brand-cyan font-bold font-mono text-lg">
                  {score}
                </span>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-center flex items-center gap-2">
                <ShieldAlert
                  className={`w-5 h-5 ${mistakes > 0 ? "text-brand-orange" : "text-gray-500"}`}
                />
                <div className="flex gap-1">
                  {[...Array(maxMistakes)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i < mistakes ? "bg-brand-orange shadow-[0_0_10px_#FF4500]" : "bg-white/10"}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === "daily" && (
            <div className="text-center flex items-center gap-4">
              <div>
                <span className="text-[10px] text-brand-gold uppercase font-black tracking-widest block">
                  Daily Challenge
                </span>
                <span className="font-bold text-lg">Hard</span>
              </div>
              <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
              <div className="hidden sm:flex items-center gap-2 text-brand-orange font-bold">
                <Trophy className="w-5 h-5" /> 12 Day Streak
              </div>
            </div>
          )}

          {mode === "duel" && (
            <div className="text-center">
              <span className="text-xs text-brand-cyan uppercase font-black tracking-widest block">
                Ranked Duel
              </span>
              {/* The Battle Bar itself usually lives inside the gameplay area, but if it needs to be here, we can project it. Usually better to keep BattleBar in the game arena for layout reasons */}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {mode !== "duel" && (
            <button
              onClick={onPause}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors"
            >
              <Pause className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onSettings}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
