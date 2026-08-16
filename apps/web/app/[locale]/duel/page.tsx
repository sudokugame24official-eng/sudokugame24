"use client";
import { WS_URL } from "@/lib/api";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sword, Users, Coins, Eye, Play, Plus, Loader2 } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Dummy user state for preview
const currentUser = {
  id: "user_" + Math.floor(Math.random() * 10000),
  username: "Guest_" + Math.floor(Math.random() * 1000),
  elo: 1200,
  coins: 5000,
};

export default function DuelLobbyPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobbyState, setLobbyState] = useState({
    waitingPlayers: [],
    ongoingMatches: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [receivedInvite, setReceivedInvite] = useState<any>(null);
  const [targetUsername, setTargetUsername] = useState("");
  const router = useRouter();

  // Create table state
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [bet, setBet] = useState(50);
  const [hasTimer, setHasTimer] = useState(true);
  const [timeLimit, setTimeLimit] = useState(300); // 5 minutes
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [allowSpectatorChat, setAllowSpectatorChat] = useState(true);

  useEffect(() => {
    // Connect to the backend socket
    const newSocket = io(`${WS_URL}/duel`);
    setSocket(newSocket);

    newSocket.on("lobby_state", (data) => {
      setLobbyState(data);
    });

    newSocket.on("duel_start", (data) => {
      router.push(`/duel/${data.matchId}`);
    });

    newSocket.on("lobby_created", (data) => {
      router.push(`/duel/lobby/${data.lobbyId}`);
    });

    newSocket.on("lobby_joined", (data) => {
      router.push(`/duel/lobby/${data.lobbyId}`);
    });

    newSocket.on("bot_offer", (data) => {
      if (window.confirm(data.message)) {
        newSocket.emit("accept_bot", { userId: currentUser.id });
      }
    });

    newSocket.on("duel_invite_received", (data) => {
      setReceivedInvite(data);
    });

    newSocket.on("chat_error", (data) => alert("Erreur: " + data.message));
    newSocket.on("chat_success", (data) => alert("Succès: " + data.message));

    return () => {
      newSocket.disconnect();
    };
  }, [router]);

  const handleCreateGame = () => {
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

  const handleJoinTable = (targetUserId: string) => {
    if (socket) {
      socket.emit("join_table", {
        userId: currentUser.id,
        username: currentUser.username,
        targetUserId,
      });
    }
  };

  const handleSpectate = (matchId: string) => {
    router.push(`/duel/${matchId}?spectate=true`);
  };

  const handleSendInvite = () => {
    if (socket && targetUsername) {
      socket.emit("send_invite", {
        targetUsername,
        difficulty,
        betAmount: bet,
      });
      setShowInviteModal(false);
    }
  };

  const handleAcceptInvite = () => {
    if (socket && receivedInvite) {
      socket.emit("accept_invite", {
        inviteId: receivedInvite.inviteId,
      });
      setReceivedInvite(null);
    }
  };

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
              Paris en direct, parties classées, aucune triche.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-card/50 backdrop-blur-md px-6 py-3 rounded-full border border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold">
                {currentUser.username.charAt(0)}
              </div>
              <span className="font-bold">{currentUser.username}</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2 font-bold text-yellow-500">
              <Coins className="w-5 h-5 fill-yellow-500" />
              {currentUser.coins.toLocaleString()}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Action & Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h2 className="text-2xl font-black mb-6">Prêt au Combat ?</h2>

              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-20 h-20 rounded-full border-b-2 border-l-2 border-primary"
                    />
                    <Loader2 className="w-6 h-6 text-primary animate-spin absolute top-[28px] left-[28px]" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">
                    Recherche d'adversaire
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Mise: {bet} Coins • Diff: {difficulty}
                  </p>
                  <button
                    onClick={() => {
                      setIsSearching(false);
                      socket?.emit("leave_queue", { userId: currentUser.id });
                    }}
                    className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    Annuler la recherche
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 transition-all hover:scale-[1.02]"
                  >
                    <Plus className="w-5 h-5" />
                    Créer une Table
                  </button>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="w-full flex items-center justify-center gap-3 bg-secondary/50 border border-white/10 hover:bg-secondary text-white py-4 rounded-2xl font-bold transition-all hover:scale-[1.02]"
                  >
                    <Sword className="w-5 h-5 text-purple-400" />
                    Défier un ami directement
                  </button>
                </div>
              )}
            </div>

            <div className="bg-card/40 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] shadow-xl">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" /> Stats Globales
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-xl">
                  <span className="text-muted-foreground text-sm">
                    Joueurs en ligne
                  </span>
                  <span className="font-bold text-green-400">1,204</span>
                </div>
                <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-xl">
                  <span className="text-muted-foreground text-sm">
                    Duels en cours
                  </span>
                  <span className="font-bold text-blue-400">
                    {lobbyState.ongoingMatches.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lobby Lists */}
          <div className="lg:col-span-2 space-y-8">
            {/* Waiting Players (Tables to join) */}
            <section>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                Joueurs en attente ({lobbyState.waitingPlayers.length})
              </h2>

              <div className="bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-xl overflow-hidden min-h-[250px]">
                {lobbyState.waitingPlayers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
                    <Users className="w-12 h-12 mb-4 opacity-20" />
                    <p>Aucun joueur en attente pour le moment.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {lobbyState.waitingPlayers.map((player: any, i) => (
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
                              Elo: {player.elo}
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
                              currentUser.coins < player.betAmount ||
                              currentUser.id === player.userId
                            }
                            className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white px-6 py-2 rounded-full font-bold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Rejoindre
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Spectator Mode */}
            <section>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                Parties en direct ({lobbyState.ongoingMatches.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lobbyState.ongoingMatches.length === 0 ? (
                  <p className="text-muted-foreground text-sm p-4 col-span-2">
                    Aucun match en cours.
                  </p>
                ) : (
                  lobbyState.ongoingMatches.map((match: any, i) => (
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
                        </div>
                        <p className="text-sm font-medium">
                          Table {match.id.substring(0, 6)}{" "}
                          {match.isBotMatch && "(vs Bot)"}
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

      {/* Create Table Modal */}
      <AnimatePresence>
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
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <Users className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-black mb-6">Créer une Table</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">
                    Mise en Coins
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[50, 200, 1000].map((val) => (
                      <button
                        key={val}
                        onClick={() => setBet(val)}
                        className={cn(
                          "py-3 rounded-xl font-bold flex flex-col items-center justify-center border transition-all",
                          bet === val
                            ? "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                            : "bg-secondary border-transparent text-muted-foreground",
                        )}
                      >
                        <Coins className="w-4 h-4 mb-1" />
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">
                    Difficulté
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl p-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                  >
                    <option value="EASY">Facile</option>
                    <option value="MEDIUM">Moyen</option>
                    <option value="HARD">Difficile</option>
                    <option value="EXPERT">Expert</option>
                    <option value="MASTER">Master</option>
                  </select>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Chronomètre</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={hasTimer} onChange={(e) => setHasTimer(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {hasTimer && (
                    <div className="flex items-center justify-between pl-4">
                      <span className="text-sm text-muted-foreground">Durée (minutes)</span>
                      <select value={timeLimit / 60} onChange={(e) => setTimeLimit(Number(e.target.value) * 60)} className="bg-secondary rounded p-1 text-sm outline-none border border-border">
                        <option value="3">3 min</option>
                        <option value="5">5 min</option>
                        <option value="10">10 min</option>
                        <option value="15">15 min</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Spectateurs autorisés</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={allowSpectators} onChange={(e) => setAllowSpectators(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {allowSpectators && (
                    <div className="flex items-center justify-between pl-4">
                      <span className="text-sm text-muted-foreground">Chat spectateurs</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={allowSpectatorChat} onChange={(e) => setAllowSpectatorChat(e.target.checked)} className="sr-only peer" />
                        <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCreateGame}
                  className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-primary/90 transition-colors"
                >
                  Lancer la recherche
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

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
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <Users className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-black mb-6">Défier un ami</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">
                    Pseudo de l'ami
                  </label>
                  <input
                    type="text"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    placeholder="Ex: SudokuKing99"
                    className="w-full bg-secondary border border-border rounded-xl p-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">
                    Mise en Coins
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[50, 200, 1000].map((val) => (
                      <button
                        key={val}
                        onClick={() => setBet(val)}
                        className={cn(
                          "py-3 rounded-xl font-bold flex flex-col items-center justify-center border transition-all",
                          bet === val
                            ? "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                            : "bg-secondary border-transparent text-muted-foreground",
                        )}
                      >
                        <Coins className="w-4 h-4 mb-1" />
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">
                    Difficulté
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl p-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                  >
                    <option value="EASY">Facile</option>
                    <option value="MEDIUM">Moyen</option>
                    <option value="HARD">Difficile</option>
                    <option value="EXPERT">Expert</option>
                    <option value="MASTER">Master</option>
                  </select>
                </div>

                <button
                  onClick={handleSendInvite}
                  className="w-full bg-purple-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-purple-600 transition-colors"
                >
                  Envoyer le défi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {receivedInvite && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-card border border-primary/50 shadow-2xl p-6 rounded-2xl w-full max-w-sm"
          >
            <h3 className="font-black text-xl mb-2 text-primary">Nouveau Défi !</h3>
            <p className="font-medium mb-4">
              <strong className="text-white">{receivedInvite.senderUsername}</strong> vous défie en {receivedInvite.difficulty} pour <strong className="text-yellow-500">{receivedInvite.betAmount} Coins</strong> !
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAcceptInvite}
                className="flex-1 bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600"
              >
                Accepter
              </button>
              <button
                onClick={() => setReceivedInvite(null)}
                className="flex-1 bg-secondary text-white font-bold py-2 rounded-lg hover:bg-white/10"
              >
                Refuser
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
