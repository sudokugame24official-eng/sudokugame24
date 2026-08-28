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
  Swords,
  Sparkles,
  Crown,
  Hash,
  Smile,
  Volume2,
  VolumeX,
  Radio,
  Search,
  CheckCircle2,
  Shield,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/navigation";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isMe?: boolean;
  channel?: string;
  role?: string;
  level?: number;
}

interface OnlinePlayer {
  id: string;
  username: string;
  rating?: number;
  country?: string;
  level?: number;
  isOnline?: boolean;
}

const CHANNELS = [
  { id: "global", name: "general", label: "General Lounge", desc: "Free discussion & community", icon: Hash, color: "text-brand-gold" },
  { id: "tactics", name: "tactics-guides", label: "Strategies & Tips", desc: "X-Wing, Swordfish, patterns", icon: Zap, color: "text-brand-orange" },
  { id: "duels", name: "duel-finder", label: "Challenges & Matchmaking", desc: "Challenge other players 1v1", icon: Swords, color: "text-brand-cyan" },
  { id: "beginners", name: "beginner-help", label: "Beginner Help", desc: "Ask all your questions", icon: Sparkles, color: "text-green-400" },
];

const QUICK_EMOJIS = ["🔥", "👑", "⚡", "🏆", "🎯", "👏", "🤯", "🚀"];

export default function ModernChatPage() {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState<string>("global");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlinePlayer[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [presenceSocket, setPresenceSocket] = useState<Socket | null>(null);
  const [selectedUser, setSelectedUser] = useState<OnlinePlayer | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [playerSearch, setPlayerSearch] = useState("");
  const [mobileView, setMobileView] = useState<"channels" | "chat" | "players">("chat");

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial sample messages for immediate atmosphere
    setMessages([
      {
        id: "m1",
        senderId: "system",
        senderName: "Sudoku Bot",
        content: "👋 Bienvenue sur le Live Chat officiel Sudoku Masters ! Respectez la charte de fair-play.",
        createdAt: new Date(Date.now() - 300000).toISOString(),
        role: "ADMIN",
        channel: "global",
      },
      {
        id: "m2",
        senderId: "p1",
        senderName: "LogicMaster99",
        content: "Quelqu'un de chaud pour un duel en niveau Expert ? ⚔️",
        createdAt: new Date(Date.now() - 180000).toISOString(),
        level: 42,
        channel: "global",
      },
      {
        id: "m3",
        senderId: "p2",
        senderName: "SudokuQueen_FR",
        content: "La grille du Défi du Jour était incroyable aujourd'hui ! J'ai débloqué le Skyscraper en 2min30.",
        createdAt: new Date(Date.now() - 60000).toISOString(),
        level: 38,
        channel: "global",
      },
    ]);

    // Live WebSockets setup
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
      if (Array.isArray(users) && users.length > 0) {
        setOnlineUsers(users);
      } else {
        // Fallback sample online users
        setOnlineUsers([
          { id: "u1", username: "LogicMaster99", rating: 2450, level: 42, isOnline: true },
          { id: "u2", username: "SudokuQueen_FR", rating: 2190, level: 38, isOnline: true },
          { id: "u3", username: "Brainiac_22", rating: 1980, level: 29, isOnline: true },
          { id: "u4", username: "Alex_Solver", rating: 1720, level: 19, isOnline: true },
          { id: "u5", username: "GrandMaster_X", rating: 2560, level: 50, isOnline: true },
        ]);
      }
    });

    chatWs.on("global_message", (msg: any) => {
      setMessages((prev) => [
        ...prev,
        {
          id: msg.id || Date.now().toString(),
          senderId: msg.senderId || "unknown",
          senderName: msg.senderName || msg.sender?.username || "Joueur",
          content: msg.content || msg.text || "",
          createdAt: msg.createdAt || new Date().toISOString(),
          isMe: user ? msg.senderId === user.id : false,
          channel: activeChannel,
        },
      ]);
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
  }, [user, activeChannel]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (!user) {
      toast.error("Veuillez vous connecter pour envoyer un message.");
      return;
    }

    const text = inputValue.trim();
    if (socket && socket.connected) {
      socket.emit("send_global_message", { content: text });
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        senderId: user.id,
        senderName: user.profile?.username || user.email?.split("@")[0] || "Vous",
        content: text,
        createdAt: new Date().toISOString(),
        isMe: true,
        channel: activeChannel,
        level: (user.profile as any)?.level || 1,
      },
    ]);

    setInputValue("");
  };

  const handleAddEmoji = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
  };

  const handleAddFriend = async (targetUser: OnlinePlayer) => {
    if (!user) {
      toast.error("Connectez-vous pour ajouter des amis.");
      return;
    }
    toast.success(`Demande d'ami envoyée à ${targetUser.username} !`);
    setSelectedUser(null);
  };

  const filteredOnlineUsers = onlineUsers.filter((u) =>
    u.username.toLowerCase().includes(playerSearch.toLowerCase())
  );

  const currentChannel = CHANNELS.find((c) => c.id === activeChannel) || CHANNELS[0] || {
    id: "global",
    name: "salon-general",
    desc: "Discussions libres & communauté",
  };

  return (
    <div className="h-[calc(100vh-70px)] bg-[#041226] text-white flex flex-col overflow-hidden font-sans">
      
      {/* Mobile navigation toggle bar */}
      <div className="lg:hidden flex items-center justify-around bg-brand-navy border-b border-white/10 p-2 text-xs font-black uppercase">
        <button
          onClick={() => setMobileView("channels")}
          className={`px-3 py-1.5 rounded-lg ${mobileView === "channels" ? "bg-brand-gold text-brand-navy" : "text-gray-400"}`}
        >
          Salons
        </button>
        <button
          onClick={() => setMobileView("chat")}
          className={`px-3 py-1.5 rounded-lg ${mobileView === "chat" ? "bg-brand-orange text-white" : "text-gray-400"}`}
        >
          Discussion
        </button>
        <button
          onClick={() => setMobileView("players")}
          className={`px-3 py-1.5 rounded-lg ${mobileView === "players" ? "bg-brand-cyan text-brand-navy" : "text-gray-400"}`}
        >
          En Ligne ({onlineUsers.length})
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* ─── LEFT: DISCORD-STYLE CHANNELS BAR ─── */}
        <aside
          className={`w-72 bg-brand-navy-light/95 border-r border-white/10 flex flex-col shrink-0 ${
            mobileView === "channels" ? "block w-full" : "hidden lg:flex"
          }`}
        >
          {/* Platform Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-orange to-brand-gold flex items-center justify-center shadow">
                <Radio className="w-4 h-4 text-brand-navy animate-pulse" />
              </div>
              <div>
                <h2 className="font-black text-sm uppercase tracking-wide">Sudoku Live</h2>
                <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" /> Main Server
                </span>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
              title={soundEnabled ? "Mute sound" : "Enable sound"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <div className="px-3 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Text Channels
            </div>

            {CHANNELS.map((ch) => {
              const Icon = ch.icon;
              const isActive = activeChannel === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChannel(ch.id);
                    setMobileView("chat");
                  }}
                  className={`w-full text-left p-3 rounded-2xl flex items-start gap-3 transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-white/15 to-white/5 border border-brand-gold/40 shadow-lg"
                      : "hover:bg-white/5 text-gray-300 hover:text-white"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5 ${ch.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-black truncate ${isActive ? "text-brand-gold" : "text-white"}`}>
                      #{ch.name}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{ch.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Duel CTA in Sidebar */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <Link href="/duel">
              <button className="w-full py-3 bg-gradient-to-r from-brand-cyan to-blue-500 text-brand-navy font-black rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all">
                <Swords className="w-4 h-4" /> Lancer un Duel 1v1
              </button>
            </Link>
          </div>
        </aside>

        {/* ─── CENTER: LIVE CHAT STREAM ─── */}
        <main
          className={`flex-1 flex flex-col bg-[#041226]/90 relative overflow-hidden ${
            mobileView === "chat" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Active Channel Header */}
          <div className="h-16 px-6 border-b border-white/10 bg-brand-navy/60 backdrop-blur-xl flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-brand-gold" />
              <div>
                <h3 className="font-black text-base uppercase tracking-wide">
                  {currentChannel.name}
                </h3>
                <p className="text-xs text-gray-400">
                  {currentChannel.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/15 border border-green-500/30 text-green-400 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {onlineUsers.length} En Direct
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3.5 ${msg.isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg border border-white/10 ${
                    msg.role === "ADMIN"
                      ? "bg-gradient-to-br from-red-500 to-brand-orange text-white"
                      : msg.isMe
                      ? "bg-gradient-to-br from-brand-orange to-brand-gold text-brand-navy"
                      : "bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
                  }`}
                >
                  {msg.role === "ADMIN" ? "⚡" : msg.senderName.charAt(0).toUpperCase()}
                </div>

                {/* Message Content */}
                <div className={`max-w-xl ${msg.isMe ? "items-end text-right" : "items-start text-left"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-black uppercase tracking-wider ${
                        msg.isMe ? "text-brand-orange" : msg.role === "ADMIN" ? "text-red-400" : "text-brand-cyan"
                      }`}
                    >
                      {msg.senderName}
                    </span>
                    {msg.level && (
                      <span className="text-[9px] font-black bg-white/10 px-1.5 py-0.5 rounded text-brand-gold">
                        LVL {msg.level}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-md border ${
                      msg.isMe
                        ? "bg-gradient-to-r from-brand-orange to-brand-orange-light text-white border-brand-orange/40 rounded-tr-none"
                        : msg.role === "ADMIN"
                        ? "bg-red-950/40 border-red-500/40 text-red-200 rounded-tl-none font-medium"
                        : "bg-brand-navy-light/90 border-white/10 text-gray-100 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Emojis Bar */}
          <div className="px-6 py-2 bg-black/40 border-t border-white/5 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest shrink-0">Réactions :</span>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAddEmoji(emoji)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-sm transition-all hover:scale-110 shrink-0"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-brand-navy/90 border-t border-white/10 backdrop-blur-xl">
            <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
              <input
                type="text"
                placeholder={user ? `Write a message in #${currentChannel.name}...` : "Log in to join the chat..."}
                disabled={!user}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold disabled:opacity-50 transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!user || !inputValue.trim()}
                className="px-6 py-3.5 bg-gradient-to-r from-brand-orange to-brand-gold text-brand-navy font-black rounded-2xl uppercase tracking-wider hover:brightness-110 transition-all shadow-lg disabled:opacity-40 flex items-center gap-2 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </main>

        {/* ─── RIGHT: ONLINE PLAYERS ROSTER ─── */}
        <aside
          className={`w-80 bg-brand-navy-light/95 border-l border-white/10 flex flex-col shrink-0 ${
            mobileView === "players" ? "block w-full" : "hidden xl:flex"
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-brand-cyan uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> Joueurs en Ligne ({onlineUsers.length})
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Chercher un joueur..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          {/* Players Roster */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredOnlineUsers.map((player) => (
              <div
                key={player.id}
                onClick={() => setSelectedUser(player)}
                className="p-3 rounded-2xl bg-white/3 border border-white/5 hover:border-brand-cyan/40 hover:bg-white/6 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-orange to-brand-gold flex items-center justify-center font-black text-xs text-brand-navy shadow">
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-brand-navy" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white group-hover:text-brand-gold transition-colors">
                      {player.username}
                    </p>
                    <p className="text-[10px] text-brand-cyan font-bold flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> {player.rating || 1500} ELO
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Link href={`/duel`}>
                    <button
                      title="Défier en 1v1"
                      className="p-2 bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan hover:text-brand-navy rounded-xl transition-all font-bold text-xs"
                    >
                      <Swords className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </aside>

      </div>

      {/* User Quick Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-navy-light border-2 border-brand-gold/50 p-6 rounded-3xl max-w-sm w-full space-y-5 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-gold flex items-center justify-center text-xl font-black text-brand-navy shadow-lg">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">{selectedUser.username}</h4>
                  <p className="text-xs text-brand-gold font-bold flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> {selectedUser.rating || 1500} ELO
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link href={`/duel`} className="w-full">
                  <button className="w-full py-3 bg-brand-orange text-white font-black rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow">
                    <Swords className="w-4 h-4" /> Défier 1v1
                  </button>
                </Link>
                <button
                  onClick={() => handleAddFriend(selectedUser)}
                  className="py-3 bg-brand-gold text-brand-navy font-black rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <UserPlus className="w-4 h-4" /> Ajouter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
