"use client";
import { API_URL } from "@/lib/api";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Brain,
  Trophy,
  ChevronRight,
  Play,
  ArrowLeft,
  Clock,
  Coins,
} from "lucide-react";
import { SudokuBoard } from "@/components/SudokuGrid";
import AdSlot from "@/components/monetization/AdSlot";
import { useGameModes } from "@/hooks/useGameModes";
import { cn } from "@/lib/utils";
import { Link } from "@/navigation";

export default function SoloPlayPage() {
  const t = useTranslations("play");
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<"SOLO" | "DAILY">("SOLO");
  const { isEnabled } = useGameModes(); // P1-P: disabled modes disappear
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<string>("MEDIUM");

  const [time, setTime] = useState(0); // counts up for SOLO, down for DAILY
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<
    "TIME_OUT" | "ERRORS" | "VICTORY" | null
  >(null);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [currentBoard, setCurrentBoard] = useState<any[][] | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !gameOver) {
      interval = setInterval(() => {
        setTime((t) => {
          if (gameMode === "DAILY") {
            if (t <= 1) {
              setGameOver(true);
              setGameResult("TIME_OUT");
              return 0;
            }
            return t - 1;
          }
          return t + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameMode, gameOver]);

  const [dailyPuzzle, setDailyPuzzle] = useState<any>(null);
  const [challengeId, setChallengeId] = useState<string>("");
  const [soloSessionId, setSoloSessionId] = useState<string>("");
  const [mistakes, setMistakes] = useState(0);

  const startGame = async (
    mode: "SOLO" | "DAILY",
    difficulty: string = "MEDIUM",
  ) => {
    if (mode === "DAILY") {
      try {
        const res = await fetch(`${API_URL}/daily/today`);
        const data = await res.json();
        if (data && data.puzzle) {
          setDailyPuzzle(data.puzzle);
          setChallengeId(data.id);
        }
      } catch (err) {
        console.error("Failed to fetch daily challenge", err);
      }
    } else {
      try {
        const res = await fetch(`${API_URL}/sudoku/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficulty }),
          credentials: "include",
        });
        const data = await res.json();
        if (data && data.sessionId) {
          setSoloSessionId(data.sessionId);
          setDailyPuzzle(data);
        }
      } catch (err) {
        console.error("Failed to start solo session", err);
      }
      setChallengeId("");
    }

    setGameMode(mode);
    setSelectedDifficulty(difficulty);
    setTime(mode === "DAILY" ? 120 : 0);
    setCoinsEarned(0);
    setGameOver(false);
    setGameResult(null);
    setCurrentBoard(null);
    setMistakes(0);
    setIsPlaying(true);
  };

  const handleCorrectCell = (coins: number) => {
    if (gameMode === "DAILY" && !gameOver) {
      setCoinsEarned((prev) => prev + coins);
    }
  };

  const handleGameOverErrors = () => {
    setGameOver(true);
    setGameResult("ERRORS");
    setMistakes(3);
  };

  const handleGameComplete = () => {
    setGameOver(true);
    setGameResult("VICTORY");
  };

  useEffect(() => {
    if (
      gameOver &&
      (gameResult === "TIME_OUT" ||
        gameResult === "VICTORY" ||
        gameResult === "ERRORS")
    ) {
      if (gameMode === "DAILY" && challengeId && Array.isArray(currentBoard)) {
        fetch(`${API_URL}/daily/${challengeId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            finalBoard: currentBoard,
            timeSec: 120 - time,
          }),
          credentials: "include",
        }).catch((err) => console.error("Failed to submit daily score", err));
      } else if (gameMode === "SOLO" && soloSessionId && Array.isArray(currentBoard)) {
        fetch(`${API_URL}/sudoku/${soloSessionId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            finalBoard: currentBoard,
            timeSec: time,
            mistakes,
          }),
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data && data.coinReward) {
              setCoinsEarned(data.coinReward);
            }
          })
          .catch((err) => console.error("Failed to submit solo score", err));
      }
    }
  }, [
    gameOver,
    gameMode,
    challengeId,
    soloSessionId,
    currentBoard,
    time,
    gameResult,
    mistakes,
  ]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (isPlaying) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-[#041E42] flex flex-col relative overflow-hidden font-sans">
        {/* Animated Background Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#FF4500]/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-[pulse_4s_ease-in-out_infinite]"></div>
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#FFCC00]/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-[pulse_6s_ease-in-out_infinite]"
          style={{ animationDelay: "2s" }}
        ></div>
        <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>

        {/* Header */}
        <div className="w-full bg-black/20 backdrop-blur-md border-b border-white/10 z-10 sticky top-0">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <button
              onClick={() => {
                setIsPlaying(false);
                setTime(0);
              }}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold hidden sm:inline">Exit</span>
            </button>

            <div className="flex items-center gap-2">
              {gameMode === "DAILY" ? (
                <Calendar className="w-6 h-6 text-[#FF4500]" />
              ) : (
                <Brain className="w-6 h-6 text-[#FF4500]" />
              )}
              <h2 className="text-xl font-black text-white tracking-wide uppercase">
                {gameMode === "DAILY" ? t("dailyChallenge") : t("soloPractice")}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {gameMode === "DAILY" && (
                <div className="flex items-center gap-1.5 bg-[#FFCC00]/10 px-3 py-1 rounded-full border border-[#FFCC00]/20">
                  <Coins className="w-4 h-4 text-[#FFCC00]" />
                  <span className="text-sm font-bold text-[#FFCC00]">
                    +{coinsEarned}
                  </span>
                </div>
              )}
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] transition-colors",
                  gameMode === "DAILY" && time <= 10
                    ? "bg-red-500/20 border-red-500/50 text-red-500 animate-pulse"
                    : "bg-black/30 border-white/10 text-white",
                )}
              >
                <Clock className="w-4 h-4" />
                <span className="text-lg font-mono font-bold tracking-widest">
                  {formatTime(time)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 w-full overflow-y-auto">
          <SudokuBoard
            difficulty={selectedDifficulty as any}
            isDaily={gameMode === "DAILY"}
            disabled={gameOver}
            onCorrectCell={handleCorrectCell}
            onComplete={handleGameComplete}
            onGameOver={handleGameOverErrors}
            onBoardChange={setCurrentBoard}
            initialBoardProp={dailyPuzzle?.initialBoard}
          />
        </div>

        {/* Game Over Modal */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className={cn(
                  "border p-8 rounded-[2rem] max-w-md w-full text-center",
                  gameResult === "VICTORY"
                    ? "bg-gradient-to-b from-[#0A2A5C] to-[#041E42] border-[#FFCC00]/30 shadow-[0_0_50px_rgba(255,204,0,0.2)]"
                    : "bg-gradient-to-b from-[#2A0A0A] to-[#1E0404] border-red-500/30 shadow-[0_0_50px_rgba(255,0,0,0.2)]",
                )}
              >
                <div
                  className={cn(
                    "w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6",
                    gameResult === "VICTORY"
                      ? "bg-[#FFCC00]/20 text-[#FFCC00]"
                      : "bg-red-500/20 text-red-500",
                  )}
                >
                  {gameResult === "VICTORY" ? (
                    <Trophy className="w-10 h-10" />
                  ) : (
                    <Brain className="w-10 h-10" />
                  )}
                </div>

                <h2 className="text-3xl font-black text-white mb-2 uppercase">
                  {gameResult === "VICTORY"
                    ? t("youWin")
                    : gameResult === "TIME_OUT"
                      ? t("timesUp")
                      : t("gameOver")}
                </h2>
                <p className="text-white/70 mb-6">
                  {gameResult === "VICTORY"
                    ? t("completedIn", { time: formatTime(time) })
                    : gameResult === "TIME_OUT"
                      ? t("timerEnded")
                      : t("mistakesMsg", { count: 3 })}
                </p>

                {(gameMode === "DAILY" || coinsEarned > 0) && (
                  <div className="bg-black/30 rounded-2xl p-6 mb-8 border border-white/10">
                    <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">
                      {t("earned")}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Coins className="w-8 h-8 text-[#FFCC00]" />
                      <span className="text-5xl font-black text-[#FFCC00]">
                        {coinsEarned}
                      </span>
                    </div>
                    {gameMode === "DAILY" && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {t("perCellCoins")}
                      </p>
                    )}
                  </div>
                )}

                <AdSlot slotName="post_game" />
                <div className="flex gap-4">
                  {gameMode === "DAILY" ? (
                    <Link
                      href={`/daily/leaderboard?challengeId=${challengeId}`}
                      className="flex-1 bg-white hover:bg-gray-100 text-[#0A2A5C] font-black uppercase tracking-wider py-4 rounded-xl transition-all text-center flex justify-center items-center gap-2"
                    >
                      <Trophy className="w-5 h-5" /> {t("leaderboardBtn")}
                    </Link>
                  ) : (
                    <button
                      onClick={() => startGame("SOLO", selectedDifficulty)}
                      className="flex-1 bg-white hover:bg-gray-100 text-black font-black uppercase tracking-wider py-4 rounded-xl transition-all"
                    >
                      {t("playAgain")}
                    </button>
                  )}
                  <button
                    onClick={() => setIsPlaying(false)}
                    className="flex-1 bg-[#FF4500] hover:bg-[#ff5c1a] text-white font-black uppercase tracking-wider py-4 rounded-xl transition-all"
                  >
                    {t("exit")}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-background text-foreground p-4 md:p-8 flex items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-primary/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl w-full mx-auto z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full font-bold text-sm mb-6 uppercase tracking-widest border border-primary/20"
          >
            <Trophy className="w-4 h-4" /> Solo Play
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            Choose Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4500] to-[#FFCC00]">
              Difficulty
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Play at your own pace, train your brain, and discover new techniques
            — from Beginner to Master level.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Daily Puzzle Card */}
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => startGame("DAILY", "MEDIUM")}
            style={isEnabled("DAILY") ? undefined : { display: "none" }}
            className="bg-gradient-to-br from-[#041E42] to-[#0A2A5C] border border-[#FF4500]/30 p-8 rounded-[2rem] relative overflow-hidden group cursor-pointer shadow-[0_20px_50px_rgba(4,30,66,0.5)]"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500">
              <Calendar className="w-48 h-48 text-[#FF4500]" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="bg-[#FF4500] text-white text-xs font-black uppercase px-3 py-1 rounded-full inline-block mb-6 shadow-md">
                  {t("dailyNew")}
                </div>
                <h2 className="text-3xl font-black text-white mb-4">
                  {t("dailyCardTitle")}
                </h2>
                <p className="text-blue-200/70 mb-4 max-w-[90%] leading-relaxed">
                  {t("dailyPrefix")} <strong>{t("dailyTimeLimit")}</strong>{t("dailyMid")}
                  <strong className="text-[#FFCC00]">{t("dailyEarn")}</strong>{t("dailySuffix")}
                </p>
              </div>
              <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF4500] to-[#ff5c1a] text-white font-black uppercase tracking-wider px-6 py-4 rounded-xl shadow-[0_10px_20px_rgba(255,69,0,0.3)] hover:shadow-[0_15px_30px_rgba(255,69,0,0.5)] hover:-translate-y-1 transition-all w-full mt-4">
                <Play className="w-5 h-5 fill-current" /> {t("startTimer")}
              </button>
            </div>
          </motion.div>

          {/* Practice Mode Card */}
          <div className="space-y-4" style={isEnabled("CLASSIC") ? undefined : { display: "none" }}>
            <h3 className="text-2xl font-black flex items-center gap-3 mb-6 uppercase tracking-wide">
              <Brain className="w-6 h-6 text-[#FFCC00]" />
              Solo Practice
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  level: "EASY",
                  desc: "For beginners",
                  time: "~5 min",
                  color:
                    "border-green-500/50 hover:border-green-500 hover:bg-green-500/10 text-green-500",
                },
                {
                  level: "MEDIUM",
                  desc: "Balanced challenge",
                  time: "~10 min",
                  color:
                    "border-yellow-500/50 hover:border-yellow-500 hover:bg-yellow-500/10 text-yellow-500",
                },
                {
                  level: "HARD",
                  desc: "For experienced players",
                  time: "~20 min",
                  color:
                    "border-orange-500/50 hover:border-orange-500 hover:bg-orange-500/10 text-orange-500",
                },
                {
                  level: "EXPERT",
                  desc: "Extreme logic required",
                  time: "~40 min",
                  color:
                    "border-red-500/50 hover:border-red-500 hover:bg-red-500/10 text-red-500",
                },
              ].map((diff) => (
                <motion.div
                  key={diff.level}
                  whileHover={{ x: 5 }}
                  onClick={() => startGame("SOLO", diff.level)}
                  className={cn(
                    "bg-card/50 backdrop-blur-sm border p-5 rounded-2xl flex items-center justify-between cursor-pointer transition-all group",
                    diff.color,
                  )}
                >
                  <div>
                    <h4 className="font-black text-xl uppercase tracking-wider mb-1">
                      {diff.level}
                    </h4>
                    <p className="text-xs font-bold opacity-70 uppercase tracking-widest">
                      {diff.desc}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-110 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
