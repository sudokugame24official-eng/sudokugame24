"use client";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { WS_URL } from "@/lib/api";
import { motion } from "framer-motion";
import { Users, Play, LogOut, MessageSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Dummy user state for preview
const currentUser = {
  id: "user_" + Math.floor(Math.random() * 10000),
  username: "Guest_" + Math.floor(Math.random() * 1000),
  elo: 1200,
  coins: 5000,
};

export default function LobbyPage() {
  const t = useTranslations("duel");
  const { id: lobbyId } = useParams();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobby, setLobby] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string }[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const newSocket = io(`${WS_URL}/duel`, { withCredentials: true });
    setSocket(newSocket);

    // Initial fetch/join? The backend currently only broadcasts lobby state.
    // If we refresh here, we might not be in the lobby. 
    // We can emit a "request_lobby_state" event, but for now we wait for `lobby_update`.
    // We should probably emit "rejoin_lobby" if needed, but let's assume standard flow where socket persists or we just listen.

    newSocket.on("lobby_update", (data) => {
      if (data.id === lobbyId) {
        setLobby(data);
      }
    });

    newSocket.on("duel_start", (data) => {
      router.push(`/duel/${data.matchId}`);
    });

    newSocket.on("receive_chat", (data) => {
      setChatMessages((prev) => [...prev, { user: data.userId, text: data.message }]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [lobbyId, router]);

  const handleStartMatch = () => {
    if (socket && lobby?.creatorId === currentUser.id) {
      socket.emit("start_match", { lobbyId });
    }
  };

  const handleLeaveLobby = () => {
    if (socket) {
      socket.emit("leave_lobby", { lobbyId });
    }
    router.push("/duel");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket && message.trim()) {
      socket.emit("send_chat", { matchId: lobbyId, message: message.trim() });
      setMessage("");
    }
  };

  if (!lobby) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-t-2 border-primary rounded-full" />
          <p className="mt-4 text-muted-foreground font-bold">{t("loadingLobby")}</p>
        </div>
      </div>
    );
  }

  const isCreator = lobby.creatorId === currentUser.id;
  const canStart = isCreator && lobby.player2;

  return (
    <div className="min-h-screen bg-[#050505] text-foreground p-4 lg:p-8 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Lobby Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h1 className="text-3xl font-black">Table de {lobby.creatorUsername}</h1>
              <div className="flex items-center gap-4">
                <span className="px-4 py-1.5 bg-secondary rounded-full text-sm font-bold border border-white/5">
                  Mise: {lobby.settings.betAmount} Coins
                </span>
                <span className="px-4 py-1.5 bg-primary/20 text-primary rounded-full text-sm font-bold border border-primary/20">
                  {lobby.settings.difficulty}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              {/* Player 1 */}
              <div className="bg-secondary/40 rounded-2xl p-6 border border-white/5 flex flex-col items-center">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-3xl font-black text-primary mb-4 border-4 border-primary">
                  {lobby.player1.username.charAt(0)}
                </div>
                <h2 className="text-xl font-bold">{lobby.player1.username}</h2>
                <p className="text-muted-foreground">Créateur (Elo: {lobby.player1.rating})</p>
              </div>

              {/* VS Divider */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 bg-card rounded-full font-black text-xl border-2 border-border z-20">
                VS
              </div>

              {/* Player 2 */}
              <div className={cn("rounded-2xl p-6 border flex flex-col items-center justify-center text-center", lobby.player2 ? "bg-secondary/40 border-white/5" : "bg-card border-dashed border-border")}>
                {lobby.player2 ? (
                  <>
                    <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center text-3xl font-black text-blue-400 mb-4 border-4 border-blue-500">
                      {lobby.player2.username.charAt(0)}
                    </div>
                    <h2 className="text-xl font-bold">{lobby.player2.username}</h2>
                    <p className="text-muted-foreground">Adversaire (Elo: {lobby.player2.rating})</p>
                  </>
                ) : (
                  <div className="space-y-4">
                    <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="w-24 h-24 mx-auto border-4 border-dashed border-muted-foreground rounded-full flex items-center justify-center">
                      <Users className="w-10 h-10 text-muted-foreground" />
                    </motion.div>
                    <p className="text-muted-foreground font-medium">{t("waitingOpponent")}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 flex justify-center gap-4 relative z-10">
              <button onClick={handleLeaveLobby} className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                <LogOut className="w-5 h-5" /> Quitter
              </button>
              
              {isCreator && (
                <button 
                  onClick={handleStartMatch} 
                  disabled={!canStart}
                  className={cn("flex items-center gap-2 px-8 py-3 font-bold rounded-xl transition-all", canStart ? "bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105" : "bg-secondary text-muted-foreground cursor-not-allowed")}
                >
                  <Play className="w-5 h-5" /> Démarrer la Partie
                </button>
              )}
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-6">
             <h3 className="font-bold mb-4 flex items-center gap-2 text-muted-foreground"><AlertCircle className="w-4 h-4"/> {t("tableSettings")}</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-secondary/30 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Chronomètre</p>
                  <p className="font-bold">{lobby.settings.hasTimer ? `${lobby.settings.timeLimitSec / 60} min` : 'Désactivé'}</p>
                </div>
                <div className="bg-secondary/30 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Spectateurs</p>
                  <p className="font-bold">{lobby.settings.allowSpectators ? 'Oui' : 'Non'}</p>
                </div>
                <div className="bg-secondary/30 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Chat Spectateurs</p>
                  <p className="font-bold">{lobby.settings.allowSpectatorChat ? 'Oui' : 'Non'}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar: Chat & Spectators */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex-1 flex flex-col min-h-[400px]">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Chat de Table
            </h3>
            <div className="flex-1 bg-secondary/20 rounded-xl p-4 overflow-y-auto mb-4 space-y-3 border border-border">
              {chatMessages.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center mt-10">{t("noMessages")}</p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-bold text-primary mr-2">{msg.user.substring(0,8)}:</span>
                    <span className="text-gray-300">{msg.text}</span>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("messagePlaceholder")}
                className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button type="submit" className="bg-primary px-4 py-2 rounded-lg font-bold hover:bg-primary/90">
                Envoyer
              </button>
            </form>
          </div>

          <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Spectateurs ({lobby.spectators?.length || 0})
            </h3>
            {lobby.spectators?.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noSpectators")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lobby.spectators.map((s: any, i: number) => (
                   <span key={i} className="px-3 py-1 bg-secondary text-xs rounded-full">{s.username}</span>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
