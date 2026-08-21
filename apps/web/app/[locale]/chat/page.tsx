"use client";

import React, { useState, useRef, useEffect } from "react";
import { WS_URL, API_URL } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import {
  Send,
  Users,
  UserPlus,
  MessageSquare,
  ShieldBan,
  X,
  Trophy,
  MapPin,
  Calendar,
  Medal,
  Check,
  Globe,
  Lock,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isMe?: boolean;
}

interface OnlinePlayer {
  id: string;
  username: string;
  rating?: number;
  country?: string;
  avatarUrl?: string;
  duelsWon?: number;
}

export default function ChatRoomPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlinePlayer[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [presenceSocket, setPresenceSocket] = useState<Socket | null>(null);
  const [selectedUser, setSelectedUser] = useState<OnlinePlayer | null>(null);
  const [friendStatus, setFriendStatus] = useState<"idle" | "sent">("idle");
  const [blockStatus, setBlockStatus] = useState<"idle" | "blocked">("idle");

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize WebSockets for Chat and Presence
  useEffect(() => {
    if (!user) return;

    const chatWs = io(`${WS_URL}/chat`, { withCredentials: true });
    const presenceWs = io(`${WS_URL}/presence`, { withCredentials: true });

    chatWs.on("connect", () => {
      chatWs.emit("authenticate");
      chatWs.emit("join_global");
    });

    presenceWs.on("connect", () => {
      presenceWs.emit("identify");
      presenceWs.emit("heartbeat");
    });

    presenceWs.on("presence_update", (users: OnlinePlayer[]) => {
      if (Array.isArray(users)) {
        setOnlineUsers(users);
      }
    });

    chatWs.on("global_message", (msg: any) => {
      setMessages((prev) => [
        ...prev,
        {
          id: msg.id || Date.now().toString(),
          senderId: msg.senderId || "unknown",
          senderName: msg.senderName || msg.sender?.username || "Player",
          content: msg.content || msg.text || "",
          createdAt: msg.createdAt || new Date().toISOString(),
          isMe: msg.senderId === user.id,
        },
      ]);
    });

    chatWs.on("chat_error", (data: { message: string }) => {
      toast.error(data.message || "Erreur de messagerie");
    });

    setSocket(chatWs);
    setPresenceSocket(presenceWs);

    const hb = setInterval(() => {
      if (presenceWs.connected) presenceWs.emit("heartbeat");
    }, 30000);

    return () => {
      clearInterval(hb);
      chatWs.disconnect();
      presenceWs.disconnect();
    };
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || !socket) return;

    const text = inputValue.trim();
    socket.emit("send_global_message", { content: text });

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        senderId: user.id,
        senderName: user.profile?.username || user.email?.split("@")[0] || "You",
        content: text,
        createdAt: new Date().toISOString(),
        isMe: true,
      },
    ]);

    setInputValue("");
  };

  const handleAddFriend = async (targetUser: OnlinePlayer) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ friendId: targetUser.id }),
      });
      if (res.ok) {
        setFriendStatus("sent");
        toast.success(`Demande d'ami envoyée à ${targetUser.username} !`);
        setTimeout(() => setFriendStatus("idle"), 3000);
      } else {
        toast.error("Impossible d'envoyer la demande.");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const handleBlockUser = async (targetUser: OnlinePlayer) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/users/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetUserId: targetUser.id }),
      });
      if (res.ok) {
        setBlockStatus("blocked");
        toast.success(`Utilisateur ${targetUser.username} bloqué.`);
        setTimeout(() => {
          setSelectedUser(null);
          setBlockStatus("idle");
        }, 1500);
      } else {
        toast.error("Erreur lors du blocage.");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  return (
    <div className="h-[calc(100vh-72px)] bg-gradient-to-br from-[#020F24] via-[#041E42] to-[#0A2A5C] text-white flex overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#FF4500]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00BFFF]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative border-r border-white/5 z-10">
        {/* Tabs Bar */}
        <div className="flex bg-[#041E42]/80 backdrop-blur-xl border-b border-white/10 overflow-x-auto shrink-0 shadow-lg relative z-20">
          <div className="flex items-center gap-2 px-8 py-5 font-black uppercase tracking-widest text-sm text-[#FFCC00] bg-white/5 relative">
            <Globe className="w-5 h-5" /> Global Lounge (Multi-Instance Live)
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FFCC00] shadow-[0_0_15px_#FFCC00]" />
          </div>
        </div>

        {/* Message Feed */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-black/20"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 opacity-40 text-brand-gold" />
              </div>
              <p className="text-lg font-bold text-gray-300">Bienvenue dans le Salon Global</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm text-center">
                Envoyez un message pour discuter avec les passionnés de Sudoku du monde entier.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.isMe ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg border border-white/10 ${
                    msg.isMe
                      ? "bg-gradient-to-br from-[#FF4500] to-[#CC3700] text-white"
                      : "bg-gradient-to-br from-blue-500 to-cyan-600 text-white"
                  }`}
                >
                  {msg.senderName.charAt(0).toUpperCase()}
                </div>
                <div className={msg.isMe ? "flex flex-col items-end" : ""}>
                  <div
                    className={`flex items-baseline gap-2 mb-1 ${
                      msg.isMe ? "flex-row-reverse" : ""
                    }`}
                  >
                    <span
                      className={`font-black text-xs tracking-wide ${
                        msg.isMe ? "text-[#FF4500]" : "text-blue-400"
                      }`}
                    >
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div
                    className={`px-5 py-3 max-w-2xl text-sm shadow-md backdrop-blur-md border ${
                      msg.isMe
                        ? "bg-gradient-to-br from-[#FF4500] to-[#E63E00] rounded-2xl rounded-tr-sm text-white border-[#FF6B33]"
                        : "bg-white/10 rounded-2xl rounded-tl-sm text-gray-100 border-white/5"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-4 md:p-6 bg-[#041E42]/90 backdrop-blur-xl border-t border-white/10 shrink-0 z-20">
          {!user ? (
            <div className="max-w-5xl mx-auto p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
              <p className="text-sm text-gray-400">
                Connectez-vous pour participer au chat en direct.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSendMessage}
              className="max-w-5xl mx-auto relative flex items-center group"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Envoyer un message dans le salon global..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-6 pr-20 text-white font-medium focus:outline-none focus:border-[#FF4500] transition-all shadow-inner placeholder:text-gray-500 text-sm"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className={`absolute right-2 top-2 bottom-2 aspect-square rounded-xl flex items-center justify-center transition-all ${
                  inputValue.trim()
                    ? "bg-brand-orange text-white shadow-lg hover:brightness-110"
                    : "bg-white/5 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Right Sidebar - Players */}
      <div className="w-80 border-l border-white/5 bg-[#041E42]/80 backdrop-blur-md flex flex-col shrink-0 hidden lg:flex z-10 shadow-2xl relative">
        <div className="h-[65px] border-b border-white/10 flex items-center px-6 justify-between shrink-0 bg-white/5">
          <h2 className="font-black text-white uppercase tracking-widest text-xs flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FFCC00]" />
            Joueurs en Ligne
          </h2>
          <span className="bg-[#FFCC00]/20 text-[#FFCC00] border border-[#FFCC00]/50 text-xs font-black px-2.5 py-0.5 rounded-full">
            {onlineUsers.length || (user ? 1 : 0)}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {onlineUsers.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">
              {user ? "Vous êtes connecté dans la salle." : "Aucun joueur connecté actuellement."}
            </div>
          ) : (
            onlineUsers.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedUser(p)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 cursor-pointer transition-all"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center font-bold text-white shadow">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#041E42] rounded-full" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-xs truncate text-gray-200">{p.username}</p>
                  <p className="text-[10px] text-gray-400">{p.rating ? `${p.rating} ELO` : "Membre"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A2A5C] border border-[#FFCC00]/40 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative p-6"
            >
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center font-black text-2xl mb-3 shadow-lg">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{selectedUser.username}</h3>
                <p className="text-xs text-brand-gold font-mono mb-6">
                  {selectedUser.rating ? `Classement : ${selectedUser.rating} ELO` : "Joueur Actif"}
                </p>

                <div className="w-full space-y-3">
                  <button
                    onClick={() => handleAddFriend(selectedUser)}
                    className="w-full py-3 bg-brand-gold text-brand-navy font-black text-xs rounded-xl uppercase tracking-wider hover:bg-white transition-colors flex items-center justify-center gap-2"
                  >
                    {friendStatus === "sent" ? (
                      <>
                        <Check className="w-4 h-4" /> Demande Envoyée
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Ajouter en Ami
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleBlockUser(selectedUser)}
                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldBan className="w-4 h-4" /> Bloquer cet utilisateur
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
