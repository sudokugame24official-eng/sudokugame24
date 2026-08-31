"use client";
import { WS_URL } from "@/lib/api";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sword, Users, Coins, Eye, Play, Plus, Loader2, Bot, X, Zap, Trophy, Shield,
  ChevronRight, Sparkles,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { MemberOnlyModal } from "@/components/MemberOnlyModal";

type BotDifficulty = "EASY" | "MEDIUM" | "HARD";

interface BotLevel {
  key: BotDifficulty;
  labelKey: string;
  eloRange: [number, number];
  color: string;
  icon: React.ReactNode;
  descKey: string;
}

const BOT_LEVELS: BotLevel[] = [
  {
    key: "EASY",
    labelKey: "bot.easy.label",
    eloRange: [800, 1100],
    color: "from-green-500 to-emerald-400",
    icon: <Shield className="w-6 h-6" />,
    descKey: "bot.easy.desc",
  },
  {
    key: "MEDIUM",
    labelKey: "bot.medium.label",
    eloRange: [1200, 1500],
    color: "from-blue-500 to-cyan-400",
    icon: <Zap className="w-6 h-6" />,
    descKey: "bot.medium.desc",
  },
  {
    key: "HARD",
    labelKey: "bot.hard.label",
    eloRange: [1600, 1900],
    color: "from-purple-500 to-pink-500",
    icon: <Trophy className="w-6 h-6" />,
    descKey: "bot.hard.desc",
  },
];

// No mock user — auth state comes exclusively from useAuth()

// ─── Bot Offer Modal ──────────────────────────────────────────────────────────
function BotOfferModal({
  offer,
  onAccept,
  onDecline,
}: {
  offer: { timeoutMs: number };
  onAccept: (level: BotDifficulty) => void;
  onDecline: () => void;
}) {
  const t = useTranslations("duel");
  const [remaining, setRemaining] = useState(Math.ceil(offer.timeoutMs / 1000));
  const [selected, setSelected] = useState<BotDifficulty>("MEDIUM");

  const onAcceptRef = useRef(onAccept);
  useEffect(() => {
    onAcceptRef.current = onAccept;
  }, [onAccept]);

  useEffect(() => {
    const iv = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(iv);
          onAcceptRef.current("MEDIUM"); // auto-accept medium
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-[#0f0f1a] border border-white/10 w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{t("noOpponent")}</h2>
              <p className="text-sm text-muted-foreground">{t("playVsBotQ")}</p>
            </div>
            {/* Countdown ring */}
            <div className="ml-auto flex flex-col items-center">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="#ffffff15" strokeWidth="3" />
                  <circle
                    cx="22" cy="22" r="18" fill="none"
                    stroke="url(#timerGrad)" strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 18}`}
                    strokeDashoffset={`${2 * Math.PI * 18 * (1 - remaining / Math.ceil(offer.timeoutMs / 1000))}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">
                  {remaining}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1">{t("autoLabel")}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            {t("botOfferDesc")}
          </p>

          {/* Bot level selection */}
          <div className="space-y-3 mb-6">
            {BOT_LEVELS.map((lvl) => (
              <button
                key={lvl.key}
                onClick={() => setSelected(lvl.key)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all",
                  selected === lvl.key
                    ? "border-white/30 bg-white/10"
                    : "border-white/5 bg-white/3 hover:bg-white/7"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0", lvl.color)}>
                  {lvl.icon}
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-sm text-white">{t(lvl.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(lvl.descKey)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Elo</p>
                  <p className="text-sm font-bold text-white">{lvl.eloRange[0]}–{lvl.eloRange[1]}</p>
                </div>
                {selected === lvl.key && (
                  <motion.div
                    layoutId="bot-selected"
                    className={cn("w-2 h-2 rounded-full bg-gradient-to-br shrink-0", lvl.color)}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 py-3 rounded-xl border border-white/10 text-muted-foreground font-bold text-sm hover:bg-white/5 transition-colors"
            >
              {t("keepWaiting")}
            </button>
            <button
              onClick={() => onAccept(selected)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" />
              {t("playVsBotBtn")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Direct Bot Modal ─────────────────────────────────────────────────────────
function PlayBotModal({
  onClose,
  onPlay,
  difficulty,
  bet,
}: {
  onClose: () => void;
  onPlay: (botDifficulty: BotDifficulty) => void;
  difficulty: string;
  bet: number;
}) {
  const t = useTranslations("duel");
  const [selected, setSelected] = useState<BotDifficulty>("MEDIUM");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.88, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, y: 24 }}
        transition={{ type: "spring", damping: 22 }}
        className="bg-[#0f0f1a] border border-white/10 w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{t("playVsBotTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("instantStart", { difficulty, bet })}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-5">
            {t("botLevelHint")}
          </p>

          <div className="space-y-3 mb-6">
            {BOT_LEVELS.map((lvl) => (
              <button
                key={lvl.key}
                onClick={() => setSelected(lvl.key)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group",
                  selected === lvl.key
                    ? "border-white/30 bg-white/10"
                    : "border-white/5 hover:border-white/15 hover:bg-white/5"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0 transition-transform group-hover:scale-110", lvl.color)}>
                  {lvl.icon}
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-sm text-white">{t(lvl.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(lvl.descKey)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{t("eloApprox")}</p>
                  <p className="text-sm font-bold text-white">{lvl.eloRange[0]}–{lvl.eloRange[1]}</p>
                </div>
                {selected === lvl.key && (
                  <ChevronRight className="w-4 h-4 text-white shrink-0" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPlay(selected)}
            onTouchEnd={(e) => { e.preventDefault(); onPlay(selected); }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black shadow-xl shadow-purple-500/25 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {t("startBotDuel", { level: BOT_LEVELS.find((b) => b.key === selected) ? t(BOT_LEVELS.find((b) => b.key === selected)!.labelKey) : "" })}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DuelLobbyPage() {
  const t = useTranslations("duel");
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobbyState, setLobbyState] = useState<{
    waitingPlayers: any[];
    ongoingMatches: any[];
    createdTables?: any[];
  }>({ waitingPlayers: [], ongoingMatches: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBotModal, setShowBotModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [botOffer, setBotOffer] = useState<{ timeoutMs: number } | null>(null);
  const [receivedInvite, setReceivedInvite] = useState<any>(null);
  const [targetUsername, setTargetUsername] = useState("");
  const router = useRouter();

  // Create table state
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [bet, setBet] = useState(50);
  const [hasTimer, setHasTimer] = useState(true);
  const [timeLimit, setTimeLimit] = useState(300);
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [allowSpectatorChat, setAllowSpectatorChat] = useState(true);

  // Searching countdown display
  const [searchSeconds, setSearchSeconds] = useState(0);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startSearchTimer = useCallback(() => {
    setSearchSeconds(0);
    searchTimerRef.current = setInterval(() => setSearchSeconds((s) => s + 1), 1000);
  }, []);

  const stopSearchTimer = useCallback(() => {
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    setSearchSeconds(0);
  }, []);

  // Only connect the duel WebSocket when the user is authenticated.
  // Guests must never establish a competitive socket connection.
  useEffect(() => {
    if (!user) {
      // Ensure no leftover socket remains if user logs out
      setSocket(null);
      return;
    }

    const newSocket = io(`${WS_URL}/duel`, { withCredentials: true });
    setSocket(newSocket);

    newSocket.on("lobby_state", (data) => setLobbyState(data));

    newSocket.on("duel_start", (data) => {
      stopSearchTimer();
      router.push(`/duel/${data.matchId}`);
    });

    newSocket.on("lobby_created", (data) => {
      router.push(`/duel/lobby/${data.lobbyId}`);
    });

    newSocket.on("lobby_joined", (data) => {
      router.push(`/duel/lobby/${data.lobbyId}`);
    });

    newSocket.on("bot_offer", (data) => {
      setBotOffer(data);
    });

    newSocket.on("duel_invite_received", (data) => {
      setReceivedInvite(data);
    });

    newSocket.on("chat_error", (data) => alert(t('errorAlert') + data.message));
    newSocket.on("chat_success", (data) => alert(t('successAlert') + data.message));

    return () => {
      stopSearchTimer();
      newSocket.disconnect();
    };
  }, [user, router, stopSearchTimer]);

  const handleCreateGame = () => {
    if (!user) {
      setShowMemberModal(true);
      return;
    }
    if (socket) {
      socket.emit("create_lobby", {
        difficulty,
        betAmount: bet,
        hasTimer,
        timeLimitSec: hasTimer ? timeLimit : null,
        allowSpectators,
        allowSpectatorChat: allowSpectators ? allowSpectatorChat : false,
      });
      setIsSearching(true);
      setShowCreateModal(false);
    }
  };

  const handleQuickSearch = () => {
    if (!user) {
      setShowMemberModal(true);
      return;
    }
    if (socket) {
      socket.emit("join_queue", { difficulty, betAmount: bet });
      setIsSearching(true);
      startSearchTimer();
    }
  };

  const handleJoinTable = (targetUserId: string) => {
    if (!user) {
      setShowMemberModal(true);
      return;
    }
    if (socket) {
      socket.emit("join_table", {
        userId: user.id,
        username: user.profile?.username || "Player",
        targetUserId,
      });
    }
  };

  const handleSpectate = (matchId: string) => {
    router.push(`/duel/${matchId}?spectate=true`);
  };

  const handleSendInvite = () => {
    if (!user) {
      setShowMemberModal(true);
      return;
    }
    if (socket && targetUsername) {
      socket.emit("send_invite", { targetUsername, difficulty, betAmount: bet });
      setShowInviteModal(false);
    }
  };

  const handleAcceptInvite = () => {
    if (!user) {
      setShowMemberModal(true);
      return;
    }
    if (socket && receivedInvite) {
      socket.emit("accept_invite", { inviteId: receivedInvite.inviteId });
      setReceivedInvite(null);
    }
  };

  // Accept bot offer from matchmaking queue (after 10s wait)
  const handleAcceptBotOffer = (botDifficulty: BotDifficulty) => {
    if (!user) {
      setShowMemberModal(true);
      return;
    }
    if (socket) {
      socket.emit("accept_bot", { botDifficulty });
      setBotOffer(null);
      stopSearchTimer();
    }
  };

  const handleDeclineBotOffer = () => {
    setBotOffer(null);
    // Stay in queue — server will continue matchmaking
  };

  // Direct "Play vs Bot" button (skips queue entirely)
  const handlePlayVsBot = (botDifficulty: BotDifficulty) => {
    if (!user) {
      setShowMemberModal(true);
      return;
    }
    if (socket) {
      socket.emit("play_vs_bot", {
        difficulty,
        botDifficulty,
        betAmount: bet,
      });
      setShowBotModal(false);
      setIsSearching(false);
    }
  };

  const handleCancelSearch = () => {
    setIsSearching(false);
    setBotOffer(null);
    stopSearchTimer();
    if (user) {
      socket?.emit("leave_queue", { userId: user.id });
    }
  };

  const formatSearchTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-[#050505] text-foreground p-4 lg:p-8 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 15, repeat: Infinity }}
        className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[150px] mix-blend-screen pointer-events-none"
      />

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col h-full">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 flex items-center gap-3">
              <Sword className="w-10 h-10 text-primary" />
              <span>
                DUEL{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                  ARENA
                </span>
              </span>
            </h1>
            <p className="text-muted-foreground font-medium">
              {t("subtitle")}
            </p>
          </div>

          {user ? (
            <div className="flex items-center gap-6 bg-card/50 backdrop-blur-md px-6 py-3 rounded-full border border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold">
                  {(user.profile?.username || "U").charAt(0).toUpperCase()}
                </div>
                <span className="font-bold">{user.profile?.username || "Player"}</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2 font-bold text-yellow-500">
                <Coins className="w-5 h-5 fill-yellow-500" />
                {(user.profile?.coins ?? 0).toLocaleString()}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowMemberModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-brand-orange to-brand-gold text-brand-navy font-black px-6 py-2.5 rounded-full uppercase tracking-wider text-xs shadow-lg hover:brightness-110 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>{t("memberLoginRequired", { defaultValue: "Log In / Register" })}</span>
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Action & Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h2 className="text-2xl font-black mb-6 relative z-10">{t("readyTitle")}</h2>

              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-8 relative z-10">
                  <div className="relative mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 rounded-full border-b-2 border-l-2 border-primary"
                    />
                    <Loader2 className="w-6 h-6 text-primary animate-spin absolute top-[28px] left-[28px]" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{t("searching")}</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    {formatSearchTime(searchSeconds)}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t("betInfo", { bet, difficulty })}
                  </p>

                  {/* "Play vs Bot" shortcut while searching */}
                  {searchSeconds >= 5 && (
                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setShowBotModal(true)}
                      onTouchEnd={(e) => { e.preventDefault(); setShowBotModal(true); }}
                      className="flex items-center gap-2 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors mb-4 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/30"
                    >
                      <Bot className="w-4 h-4" />
                      {t("playBotNow")}
                    </motion.button>
                  )}

                  <button
                    onClick={handleCancelSearch}
                    className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    {t("cancelSearch")}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 relative z-10">
                  {/* Quick Match */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block font-bold uppercase tracking-wide">{t("difficultyLabel")}</label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value)}
                          className="w-full bg-secondary border border-border rounded-xl p-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                        >
                          <option value="EASY">{t("easy")}</option>
                          <option value="MEDIUM">{t("medium")}</option>
                          <option value="HARD">{t("hard")}</option>
                          <option value="EXPERT">{t("expert")}</option>
                          <option value="MASTER">Master</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block font-bold uppercase tracking-wide">{t("betLabel")}</label>
                        <select
                          value={bet}
                          onChange={(e) => setBet(Number(e.target.value))}
                          className="w-full bg-secondary border border-border rounded-xl p-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                        >
                          <option value={0}>{t("free")}</option>
                          <option value={50}>50 Coins</option>
                          <option value={200}>200 Coins</option>
                          <option value={1000}>1 000 Coins</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleQuickSearch}
                      onTouchEnd={(e) => { e.preventDefault(); handleQuickSearch(); }}
                      className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 transition-all hover:scale-[1.02]"
                    >
                      <Sword className="w-5 h-5" />
                      {t("quickSearch")}
                    </button>
                  </div>

                  <div className="relative flex items-center gap-2">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-muted-foreground font-bold">{t("orDivider")}</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Play vs Bot — direct */}
                  <button
                    onClick={() => setShowBotModal(true)}
                    onTouchEnd={(e) => { e.preventDefault(); setShowBotModal(true); }}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30 hover:border-purple-400/60 text-white py-4 rounded-2xl font-bold transition-all hover:scale-[1.02]"
                  >
                    <Bot className="w-5 h-5 text-purple-400" />
                    {t("playVsBotTitle")}
                    <span className="ml-auto text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">{t("instantBadge")}</span>
                  </button>

                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full flex items-center justify-center gap-3 bg-secondary/50 border border-white/10 hover:bg-secondary text-white py-3 rounded-2xl font-bold transition-all hover:scale-[1.02]"
                  >
                    <Plus className="w-5 h-5" />
                    {t("createPrivateTable")}
                  </button>

                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="w-full flex items-center justify-center gap-3 bg-secondary/30 border border-white/5 hover:bg-secondary/50 text-muted-foreground hover:text-white py-3 rounded-2xl font-bold transition-all"
                  >
                    <Users className="w-5 h-5" />
                    {t("challengeFriend")}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-card/40 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] shadow-xl">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" /> {t("globalStats")}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-xl">
                  <span className="text-muted-foreground text-sm">{t("playersOnline")}</span>
                  <span className="font-bold text-green-400">1,204</span>
                </div>
                <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-xl">
                  <span className="text-muted-foreground text-sm">{t("ongoingDuels")}</span>
                  <span className="font-bold text-blue-400">{lobbyState.ongoingMatches.length}</span>
                </div>
                <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-xl">
                  <span className="text-muted-foreground text-sm">{t("openTables")}</span>
                  <span className="font-bold text-purple-400">{lobbyState.waitingPlayers?.length ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lobby Lists */}
          <div className="lg:col-span-2 space-y-8">
            {/* Waiting Players */}
            <section>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                {t("waitingPlayers", { count: lobbyState.waitingPlayers.length })}
              </h2>

              <div className="bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-xl overflow-hidden min-h-[200px]">
                {lobbyState.waitingPlayers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
                    <Users className="w-12 h-12 mb-4 opacity-20" />
                    <p>{t("noWaiting")}</p>
                    <button
                      onClick={() => setShowBotModal(true)}
                      className="mt-4 flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 font-bold transition-colors"
                    >
                      <Bot className="w-4 h-4" />
                      {t("playBotInstead")}
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {lobbyState.waitingPlayers.map((player: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center font-bold">
                            {player.username.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold flex items-center gap-2">
                              {player.username}
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                {player.difficulty}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Elo: {player.rating ?? player.elo ?? "?"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-1 font-bold text-yellow-500">
                            <Coins className="w-4 h-4 fill-yellow-500" />{" "}
                            {player.betAmount}
                          </div>
                          <button
                            onClick={() => handleJoinTable(player.userId)}
                            disabled={
                              !user ||
                              (user.profile?.coins ?? 0) < player.betAmount ||
                              user.id === player.userId
                            }
                            className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white px-6 py-2 rounded-full font-bold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t("join")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Live Matches */}
            <section>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                {t("liveMatches", { count: lobbyState.ongoingMatches.length })}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lobbyState.ongoingMatches.length === 0 ? (
                  <p className="text-muted-foreground text-sm p-4 col-span-2">
                    {t("noMatches")}
                  </p>
                ) : (
                  lobbyState.ongoingMatches.map((match: any, i: number) => (
                    <div
                      key={i}
                      className="bg-card/40 backdrop-blur-3xl border border-white/10 p-4 rounded-2xl flex justify-between items-center hover:border-primary/50 transition-colors"
                    >
                      <div>
                        <div className="flex gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {match.difficulty}
                          </span>
                          <span className="text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Coins className="w-3 h-3" /> {match.betAmount * 2}
                          </span>
                          {match.isBotMatch && (
                            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Bot className="w-3 h-3" /> Bot
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium">
                          Table {match.id.substring(0, 6)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSpectate(match.id)}
                        className="bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors"
                      >
                        <Play className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {/* Bot offer from matchmaking */}
        {botOffer && (
          <BotOfferModal
            offer={botOffer}
            onAccept={handleAcceptBotOffer}
            onDecline={handleDeclineBotOffer}
          />
        )}

        {/* Direct "Play vs Bot" modal */}
        {showBotModal && (
          <PlayBotModal
            onClose={() => setShowBotModal(false)}
            onPlay={handlePlayVsBot}
            difficulty={difficulty}
            bet={bet}
          />
        )}

        {/* Create Table Modal */}
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card border border-border w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <h2 className="text-2xl font-black mb-6">{t("createTable")}</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">{t("coinBet")}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[50, 200, 1000].map((val) => (
                      <button
                        key={val}
                        onClick={() => setBet(val)}
                        className={cn(
                          "py-3 rounded-xl font-bold flex flex-col items-center justify-center border transition-all",
                          bet === val
                            ? "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                            : "bg-secondary border-transparent text-muted-foreground"
                        )}
                      >
                        <Coins className="w-4 h-4 mb-1" />
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">{t("difficultyLabel")}</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl p-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                  >
                    <option value="EASY">{t("easy")}</option>
                    <option value="MEDIUM">{t("medium")}</option>
                    <option value="HARD">{t("hard")}</option>
                    <option value="EXPERT">{t("expert")}</option>
                    <option value="MASTER">{t("master")}</option>
                  </select>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{t("timerLabel")}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={hasTimer} onChange={(e) => setHasTimer(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {hasTimer && (
                    <div className="flex items-center justify-between pl-4">
                      <span className="text-sm text-muted-foreground">{t("durationMinutes")}</span>
                      <select value={timeLimit / 60} onChange={(e) => setTimeLimit(Number(e.target.value) * 60)} className="bg-secondary rounded p-1 text-sm outline-none border border-border">
                        <option value="3">3 min</option>
                        <option value="5">5 min</option>
                        <option value="10">10 min</option>
                        <option value="15">15 min</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{t("allowSpectators")}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={allowSpectators} onChange={(e) => setAllowSpectators(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleCreateGame}
                  className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-primary/90 transition-colors"
                >
                  {t("startSearch")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card border border-border w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setShowInviteModal(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <h2 className="text-2xl font-black mb-6">{t("challengeFriend")}</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">{t("friendUsername")}</label>
                  <input
                    type="text"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    placeholder="SudokuKing99"
                    className="w-full bg-secondary border border-border rounded-xl p-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">{t("coinBet")}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[50, 200, 1000].map((val) => (
                      <button
                        key={val}
                        onClick={() => setBet(val)}
                        className={cn(
                          "py-3 rounded-xl font-bold flex flex-col items-center justify-center border transition-all",
                          bet === val
                            ? "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                            : "bg-secondary border-transparent text-muted-foreground"
                        )}
                      >
                        <Coins className="w-4 h-4 mb-1" />
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSendInvite}
                  className="w-full bg-purple-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-purple-600 transition-colors"
                >
                  {t("sendChallenge")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Received invite toast */}
        {receivedInvite && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-card border border-primary/50 shadow-2xl p-6 rounded-2xl w-full max-w-sm"
          >
            <h3 className="font-black text-xl mb-2 text-primary">{t("newChallenge")}</h3>
            <p className="font-medium mb-4">
              <strong className="text-white">{receivedInvite.senderUsername}</strong> {t("inviteMiddle")}{" "}
              {receivedInvite.difficulty} pour{" "}
              <strong className="text-yellow-500">{receivedInvite.betAmount} Coins</strong> !
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAcceptInvite}
                className="flex-1 bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600"
              >
                {t("accept")}
              </button>
              <button
                onClick={() => setReceivedInvite(null)}
                className="flex-1 bg-secondary text-white font-bold py-2 rounded-lg hover:bg-white/10"
              >
                {t("decline")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MemberOnlyModal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
      />
    </div>
  );
}
