"use client";
import { useTranslations } from "next-intl";
import { WS_URL } from "@/lib/api";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import {
  Shield,
  Crown,
  MicOff,
  Settings,
  Coins,
  Users,
  Eye,
} from "lucide-react";
import { SharedDuelBoard } from "@/components/duel/SharedDuelBoard";
import { DuelChat } from "@/components/duel/DuelChat";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

export default function ActiveDuelPage() {
  const t = useTranslations("duel");
  const { user } = useAuth();
  const { matchId } = useParams();
  const searchParams = useSearchParams();
  const isSpectating = searchParams.get("spectate") === "true";
  const router = useRouter();

  const currentUserId = user?.id || "spectator";

  const [socket, setSocket] = useState<Socket | null>(null);

  // Game State
  const [board, setBoard] = useState<number[][]>([]);
  const [ownersBoard, setOwnersBoard] = useState<(string | null)[][]>(
    Array(9).fill(Array(9).fill(null)),
  );
  const [player1, setPlayer1] = useState<any>(null);
  const [player2, setPlayer2] = useState<any>(null);
  const [combo, setCombo] = useState<number>(0);
  const [isBotMatch, setIsBotMatch] = useState(false);
  const [status, setStatus] = useState<"starting" | "playing" | "ended">("playing");
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [xpGained, setXpGained] = useState<number | null>(null);
  
  // Social Menu
  const [socialMenu, setSocialMenu] = useState<{ x: number, y: number, userId: string, username: string } | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showModeration, setShowModeration] = useState(false);

  useEffect(() => {
    const newSocket = io(`${WS_URL}/duel`, { withCredentials: true });
    setSocket(newSocket);

    if (isSpectating) {
      newSocket.emit("spectate_match", { matchId, userId: currentUserId });
    } else {
      newSocket.emit("join_match", { matchId });
    }

    // --- GAME EVENTS ---
    newSocket.on("duel_start", (data) => {
      setBoard(data.board);
      setOwnersBoard(data.ownersBoard || Array(9).fill(Array(9).fill(null)));
      setPlayer1(data.player1);
      setPlayer2(data.player2);
      setIsBotMatch(data.isBotMatch);
      setStatus("starting");
      setCountdown(3);
    });

    newSocket.on("spectator_joined", (data) => {
      setBoard(data.board);
      setOwnersBoard(data.ownersBoard || Array(9).fill(Array(9).fill(null)));
      setPlayer1({ id: "unknown", score: data.scoreP1 });
      setPlayer2({ id: "unknown", score: data.scoreP2 });
    });

    newSocket.on("duel_move", (data) => {
      if (data.isCorrect) {
        setBoard((prev) => {
          const newBoard = [...prev];
          const row = [...(newBoard[data.row] || [])];
          row[data.col] = data.value;
          newBoard[data.row] = row;
          return newBoard;
        });
        setOwnersBoard((prev) => {
          const newOwners = [...prev];
          const row = [...(newOwners[data.row] || [])];
          row[data.col] = data.userId;
          newOwners[data.row] = row;
          return newOwners;
        });
      }

      // Update scores
      setPlayer1((prev: any) => ({ ...prev, score: data.scoreP1 }));
      setPlayer2((prev: any) => ({ ...prev, score: data.scoreP2 }));

      // Update combo if it's the current player
      if (data.userId === currentUserId) {
        if (data.isCorrect) setCombo((c) => c + 1);
        else setCombo(0);
      }
    });

    newSocket.on("duel_end", (data) => {
      setStatus("ended");
      setWinnerId(data.winnerId);
      setPlayer1((prev: any) => ({ ...prev, score: data.scoreP1 }));
      setPlayer2((prev: any) => ({ ...prev, score: data.scoreP2 }));
      if (currentUserId === player1?.id) setXpGained(data.p1XpGained);
      else if (currentUserId === player2?.id) setXpGained(data.p2XpGained);
    });

    // --- CHAT EVENTS ---
    newSocket.on("duel_chat", (data) => {
      setChatMessages((prev) => [...prev, data]);
    });

    newSocket.on("system_message", (data) => {
      setChatMessages((prev) => [...prev, { ...data, isSystem: true }]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [matchId, isSpectating, player1?.id, player2?.id, currentUserId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setStatus("playing");
      setCountdown(null);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle outside click for context menu
  useEffect(() => {
    const handleClick = () => setSocialMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // --- ACTIONS ---
  const handleCellClick = (r: number, c: number, val: number) => {
    if (isSpectating || status === "ended" || status === "starting") return;
    if (socket) {
      socket.emit("make_move", {
        matchId,
        userId: currentUserId,
        row: r,
        col: c,
        value: val,
      });
    }
  };

  const handleSendChat = (message: string) => {
    if (!socket) return;
    socket.emit("send_chat", { matchId, message });
  };

  const handleModerate = (
    action: "mute" | "disable_all_chat",
    targetId: string = "",
  ) => {
    if (socket) {
      socket.emit("moderate_spectator", {
        matchId,
        authorId: currentUserId,
        targetId,
        action,
      });
    }
  };

  const isPlayer =
    player1?.id === currentUserId || player2?.id === currentUserId;

  const handleUserClick = (e: React.MouseEvent, clickedUser: { id: string; username: string }) => {
    e.stopPropagation();
    if (clickedUser.id === currentUserId) return;
    setSocialMenu({ x: e.clientX, y: e.clientY, userId: clickedUser.id, username: clickedUser.username });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-foreground p-2 md:p-4 lg:p-8 relative flex flex-col overflow-hidden">
      {/* Top Banner */}
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center bg-card/40 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 mb-6 shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/duel")}
            className="text-sm font-bold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-colors"
          >
            Quitter
          </button>
          {isSpectating && (
            <span className="bg-blue-500/20 text-blue-400 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-2">
              <Eye className="w-4 h-4" /> Mode Spectateur
            </span>
          )}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black tracking-widest text-primary">
            ARÈNE DE DUEL
          </h2>
          <p className="text-xs text-muted-foreground">ID: {matchId}</p>
        </div>
        <div className="w-24"></div> {/* Spacer for center alignment */}
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto flex items-center justify-center">
        {board.length > 0 && player1 && player2 ? (
          <div className="w-full relative">
            <AnimatePresence>
              {status === "starting" && countdown !== null && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl pointer-events-none"
                >
                  <motion.div 
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-8xl font-black text-primary drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]"
                  >
                    {countdown > 0 ? countdown : "GO!"}
                  </motion.div>
                </motion.div>
              )}

              {status === "ended" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl"
                >
                  <Crown className="w-16 h-16 text-yellow-500 mb-4" />
                  <h2 className="text-3xl font-black mb-2 text-white">
                    {t("matchOver")}
                  </h2>
                  <p className="text-lg text-yellow-400 font-bold mb-6">
                    {winnerId === currentUserId
                      ? t("youWon")
                      : winnerId
                        ? t("defeat")
                        : t("draw")}
                  </p>
                  
                  {xpGained !== null && (
                    <div className="bg-secondary/80 px-6 py-4 rounded-xl border border-white/10 flex flex-col items-center mb-6">
                      <span className="text-sm text-muted-foreground uppercase font-bold tracking-wider mb-2">{t("xpGained")}</span>
                      <div className="flex items-center gap-3">
                         <div className="text-2xl font-black text-primary">+{xpGained} XP</div>
                      </div>
                      <div className="w-full h-2 bg-background mt-4 rounded-full overflow-hidden">
                         <motion.div initial={{ width: "0%" }} animate={{ width: "60%" }} className="h-full bg-primary" />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => router.push("/duel")}
                    className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-primary/30 transition-transform hover:scale-105"
                  >
                    Retour au Lobby
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <SharedDuelBoard
              board={board}
              ownersBoard={ownersBoard}
              player1={player1}
              player2={player2}
              userId={currentUserId}
              onMove={(r, c, v) => handleCellClick(r, c, v)}
              combo={combo}
            />
          </div>
        ) : (
          <div className="text-muted-foreground animate-pulse">
            Chargement du duel...
          </div>
        )}
      </div>

      {/* Chat & Spectator Section (Bottom) */}
      <div className="w-full max-w-6xl mx-auto mt-6 bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row h-64">
        {/* Chat Area */}
        <div className="flex-1">
          <DuelChat
            messages={chatMessages}
            onSendMessage={handleSendChat}
            player1Id={player1?.id}
            player2Id={player2?.id}
          />
        </div>

        {/* Moderation Panel */}
        {showModeration && isPlayer && (
          <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-border bg-secondary/10 p-4 flex flex-col">
            <h3 className="font-bold text-sm mb-4 text-primary flex items-center gap-2">
              <Shield className="w-4 h-4" /> Modération
            </h3>

            <button
              onClick={() => handleModerate("disable_all_chat")}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors mb-4"
            >
              <MicOff className="w-4 h-4" /> Couper Chat Spectateurs
            </button>

            <div className="flex-1 overflow-y-auto">
              <p className="text-[10px] text-muted-foreground font-bold uppercase mb-2">
                Spectateurs récents
              </p>
              {/* Fake list for UI demo */}
              {["Spectator_84", "Spectator_12"].map((spec, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-background/50 p-2 rounded-lg mb-2"
                >
                  <span 
                    className="text-xs font-bold cursor-pointer hover:text-primary transition-colors"
                    onClick={(e) => handleUserClick(e, { id: spec, username: spec })}
                  >{spec}</span>
                  <button
                    onClick={() => handleModerate("mute", spec)}
                    className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors"
                    title={t("muteSpectator")}
                  >
                    <MicOff className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Social Context Menu */}
      <AnimatePresence>
        {socialMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ top: socialMenu.y, left: socialMenu.x }}
            className="fixed z-[100] bg-card border border-border shadow-2xl rounded-xl overflow-hidden w-48 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2 border-b border-border/50 bg-secondary/30">
              <p className="font-bold text-sm truncate">{socialMenu.username}</p>
            </div>
            <button className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors" onClick={() => setSocialMenu(null)}>
              Ajouter en ami
            </button>
            <button className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors" onClick={() => setSocialMenu(null)}>
              Message privé
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors" onClick={() => setSocialMenu(null)}>
              Bloquer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
