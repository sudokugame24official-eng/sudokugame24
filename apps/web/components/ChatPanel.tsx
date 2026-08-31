"use client";
import { WS_URL, API_URL } from "@/lib/api";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Lock,
  Users,
  Search,
  Smile,
  Shield,
  Crown,
  Star,
  Medal,
  UserCheck,
  AlertTriangle,
  Swords,
  Bell,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/navigation";
import { useAuth } from "./AuthProvider";
import { io, Socket } from "socket.io-client";
import { PlayerIdentity } from "./PlayerIdentity";
import { UserAvatar } from "./UserAvatar";
import { useTranslations } from "next-intl";

export const ChatPanel = () => {
  const { user } = useAuth();
  const t = useTranslations("chat");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "conversations">("conversations");
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Unread count
  const unreadCount = conversations.reduce((acc, c) => acc + (c.unread ? 1 : 0), 0);

  // Toggle Chat via window event
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggle-chat", handleToggle);
    return () => window.removeEventListener("toggle-chat", handleToggle);
  }, []);

  // Listen for open-private-chat event from anywhere (Chat Room, Friends page, Profile, etc.)
  useEffect(() => {
    const handleOpenPrivateChat = (e: any) => {
      const detail = e.detail;
      if (!detail?.userId) return;
      setIsOpen(true);
      setActiveTab("chat");
      const targetUserObj = {
        user: {
          id: detail.userId,
          name: detail.username || "Joueur",
          avatar: detail.avatarUrl,
          level: detail.level || 1,
          rating: detail.rating || 1500,
        },
      };
      setSelectedUser(targetUserObj);
      fetchMessages(detail.userId);
    };

    window.addEventListener("open-private-chat", handleOpenPrivateChat as any);
    return () => window.removeEventListener("open-private-chat", handleOpenPrivateChat as any);
  }, []);

  // Initialize Socket, Presence, and Duel Invite Listeners
  useEffect(() => {
    if (user) {
      const newSocket = io(`${WS_URL}/chat`, { withCredentials: true });
      const duelSocket = io(`${WS_URL}/duel`, { withCredentials: true });
      const presence = io(`${WS_URL}/presence`, { withCredentials: true });

      const hb = setInterval(() => {
        if (presence.connected) presence.emit("heartbeat");
      }, 30000);

      newSocket.on("connect", () => {
        newSocket.emit("authenticate");
      });

      presence.on("connect", () => {
        presence.emit("identify");
        presence.emit("heartbeat");
      });

      // Listen for duel invite received
      duelSocket.on("duel_invite_received", (invite: any) => {
        toast(`⚔️ ${invite.senderUsername || "Un joueur"} vous défie en Duel 1v1 !`, {
          description: `Difficulté : ${invite.difficulty || "Normal"} - Mise : ${invite.betAmount || 0} pièces`,
          action: {
            label: "Accepter le Duel",
            onClick: () => {
              window.location.href = `/duel`;
            },
          },
          duration: 12000,
        });
      });

      // Listen for incoming private messages
      newSocket.on("receive_message", (msg) => {
        setConversations((prev) => {
          const exists = prev.find((c) => c.user.id === msg.senderId);
          if (exists) {
            return prev.map((c) =>
              c.user.id === msg.senderId
                ? {
                    ...c,
                    lastMessage: msg.content,
                    unread: selectedUser?.user?.id !== msg.senderId,
                  }
                : c,
            );
          }
          fetchConversations();
          return prev;
        });

        // If message is for currently open conversation
        if (selectedUser?.user?.id === msg.senderId) {
          setMessages((prev) => [
            ...prev,
            {
              ...msg,
              author: "Them",
              time: new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
        } else {
          // Toast notification if chat is closed or chatting with someone else
          toast(`💬 Message de ${msg.senderName || "un ami"}`, {
            description: msg.content?.length > 45 ? msg.content.slice(0, 45) + "..." : msg.content,
            action: {
              label: "Répondre",
              onClick: () => {
                setIsOpen(true);
                setActiveTab("chat");
                setSelectedUser({
                  user: {
                    id: msg.senderId,
                    name: msg.senderName || "Ami",
                    avatar: msg.senderAvatar,
                  },
                });
                fetchMessages(msg.senderId);
              },
            },
          });
        }
      });

      newSocket.on("message_sent", (msg) => {
        setMessages((prev) => [
          ...prev,
          {
            ...msg,
            author: "You",
            time: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        setConversations((prev) =>
          prev.map((c) =>
            c.user.id === msg.receiverId
              ? { ...c, lastMessage: msg.content }
              : c,
          ),
        );
      });

      newSocket.on("chat_error", (data) => {
        setChatError(data.message);
        setTimeout(() => setChatError(null), 3000);
      });

      setSocket(newSocket);
      fetchConversations();

      return () => {
        clearInterval(hb);
        presence.disconnect();
        duelSocket.disconnect();
        newSocket.close();
      };
    }
  }, [user, selectedUser]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/conversations`, {
        credentials: "include",
      });
      if (res.ok) setConversations(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      const res = await fetch(`${API_URL}/chat/messages/${otherUserId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(
          data.map((m: any) => ({
            ...m,
            author: m.senderId === user?.id ? "You" : "Them",
            time: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, activeTab, selectedUser]);

  const handleSelectUser = (conv: any) => {
    setSelectedUser(conv);
    fetchMessages(conv.user.id);

    // Mark as read locally
    setConversations((prev) =>
      prev.map((c) =>
        c.user.id === conv.user.id ? { ...c, unread: false } : c,
      ),
    );

    if (window.innerWidth < 768) {
      setActiveTab("chat");
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || !selectedUser || !socket) return;

    socket.emit("send_message", {
      receiverId: selectedUser.user.id,
      content: inputValue,
    });
    setInputValue("");
  };

  const handleChallengeDuel = () => {
    if (!selectedUser?.user) return;
    toast.success(`⚔️ Défi 1v1 envoyé à ${selectedUser.user.name} !`);
    window.location.href = `/duel`;
  };

  const handleBlockUser = async () => {
    if (!selectedUser || !user) return;
    if (
      confirm(t("confirmBlock", { name: selectedUser.user.name }))
    ) {
      try {
        const res = await fetch(
          `${API_URL}/chat/block/${selectedUser.user.id}`,
          { method: "POST", credentials: "include" },
        );
        if (res.ok) {
          const result = await res.json();
          toast.success(
            result.status === "blocked"
              ? t("blockedToast")
              : t("unblockedToast"),
          );
          setSelectedUser(null);
          fetchConversations();
        }
      } catch (err) {
        console.error(err);
        toast.error(t("networkError"));
      }
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const hasPerk = (userPerks: any[], perkType: string) => {
    if (!userPerks) return false;
    return userPerks.some(
      (p: any) =>
        p.perkType === perkType &&
        (!p.expiresAt || new Date(p.expiresAt) > new Date()),
    );
  };

  const ConversationsList = () => (
    <div className="flex flex-col h-full bg-card/40 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-blue-500/10 blur-[50px] pointer-events-none" />

      <div className="p-4 border-b border-white/5 bg-black/20 z-10">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-brand-gold transition-colors" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all shadow-inner text-white placeholder-gray-500"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredConversations.length === 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            {t("noConversations")}
          </p>
        )}
        {filteredConversations.map((conv) => (
          <div
            key={conv.user.id}
            onClick={() => handleSelectUser(conv)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-2xl cursor-pointer group transition-all relative z-10",
              selectedUser?.user.id === conv.user.id
                ? "bg-gradient-to-r from-brand-gold/20 to-transparent border border-brand-gold/40 shadow-[inset_4px_0_0_0_#FFCC00]"
                : "hover:bg-white/5 border border-transparent",
            )}
          >
            <UserAvatar
              avatarUrl={conv.user.avatar}
              username={conv.user.name}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <PlayerIdentity
                  username={conv.user.name}
                  level={conv.user.level || 1}
                  className={cn(
                    "font-semibold text-sm truncate transition-colors",
                    selectedUser?.user.id === conv.user.id
                      ? "text-brand-gold"
                      : "group-hover:text-brand-gold text-white",
                    hasPerk(conv.user.perks, "CHAT_VIP") &&
                      "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-black",
                  )}
                />
                {hasPerk(conv.user.perks, "CHAT_VIP") && (
                  <Crown className="w-3 h-3 text-yellow-500 shrink-0" />
                )}
                {hasPerk(conv.user.perks, "CUSTOM_BADGE") && (
                  <Medal className="w-3 h-3 text-purple-400 shrink-0" />
                )}
                {conv.unread && (
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-orange shrink-0 animate-pulse" />
                )}
              </div>
              <p
                className={cn(
                  "text-xs truncate mt-0.5",
                  conv.unread
                    ? "text-brand-gold font-bold"
                    : "text-muted-foreground",
                )}
              >
                {conv.lastMessage}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ChatMessagesArea = () => (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-purple-500/5 blur-[80px] pointer-events-none" />

      {!selectedUser ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center z-10">
          <MessageCircle className="w-16 h-16 text-white/10 mb-4" />
          <p className="text-sm font-medium">{t("selectToChat")}</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <UserAvatar
                avatarUrl={selectedUser.user.avatar}
                username={selectedUser.user.name}
                size="md"
              />
              <div>
                <div
                  className={cn(
                    "font-bold text-sm flex items-center gap-1.5",
                    hasPerk(selectedUser.user.perks, "CHAT_VIP") &&
                      "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-black",
                  )}
                >
                  <PlayerIdentity
                    username={selectedUser.user.name}
                    level={selectedUser.user.level || 1}
                  />
                  {hasPerk(selectedUser.user.perks, "CHAT_VIP") && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                  {hasPerk(selectedUser.user.perks, "CUSTOM_BADGE") && (
                    <Medal className="w-4 h-4 text-purple-400" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleChallengeDuel}
                className="px-3 py-1.5 bg-gradient-to-r from-brand-orange to-red-500 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
                title="Défier en Duel 1v1"
              >
                <Swords className="w-3.5 h-3.5" /> 1v1
              </button>
              <button
                onClick={handleBlockUser}
                className="text-xs text-red-400 hover:underline flex items-center gap-1 bg-red-500/10 px-2 py-1.5 rounded-xl cursor-pointer"
                title="Bloquer"
              >
                <AlertTriangle className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3 relative">
            {chatError && (
              <div className="sticky top-0 bg-red-500 text-white text-xs p-2 rounded text-center z-10 shadow">
                {chatError}
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.author === "You";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    isMe ? "self-end items-end" : "self-start items-start",
                  )}
                >
                  <div
                    className={cn(
                      "px-5 py-3 shadow-lg",
                      isMe
                        ? "bg-gradient-to-br from-brand-orange to-brand-gold text-brand-navy font-medium rounded-3xl rounded-tr-sm shadow-orange-500/20"
                        : "bg-white/10 backdrop-blur-md border border-white/5 text-white rounded-3xl rounded-tl-sm",
                    )}
                  >
                    <p className="text-sm break-words">
                      {msg.text || msg.content}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                    {msg.time}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/5 z-10">
            <form
              onSubmit={handleSend}
              className="flex items-center gap-3 relative"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t("writeMessage")}
                className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all shadow-inner text-white placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-12 h-12 bg-gradient-to-br from-brand-gold to-brand-orange text-brand-navy font-bold rounded-2xl flex items-center justify-center hover:scale-105 hover:shadow-[0_0_20px_rgba(255,204,0,0.5)] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 z-40">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#FF4500] via-[#FF6B33] to-[#FFCC00] text-brand-navy rounded-full md:rounded-[2rem] flex items-center justify-center shadow-[0_10px_40px_rgba(255,69,0,0.5)] hover:scale-110 hover:shadow-[0_15px_50px_rgba(255,69,0,0.7)] transition-all relative group overflow-hidden cursor-pointer pointer-events-auto"
            title="Messagerie Sociale"
          >
            <div className="absolute inset-0 rounded-full md:rounded-[2rem] border-[2px] border-white/30"></div>
            <MessageCircle className="w-6 h-6 md:w-7 md:h-7 relative z-10 text-white group-hover:rotate-12 transition-transform duration-300" />
            
            {/* Unread message badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-brand-navy shadow-lg animate-bounce z-20">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 right-0 w-[380px] md:w-[750px] h-[600px] md:h-[600px] max-h-[calc(100vh-100px)] bg-[#0A1A38]/95 backdrop-blur-3xl border border-white/15 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden text-white"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 bg-gradient-to-r from-white/10 to-transparent border-b border-white/10 shrink-0 relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent"></div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-gold/20 flex items-center justify-center border border-brand-gold/30">
                  <MessageCircle className="w-4 h-4 text-brand-gold" />
                </div>
                <h3 className="font-black text-base text-white tracking-tight">MESSAGERIE SOCIALE</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 hover:scale-110 transition-all border border-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!user ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-bold mb-2">
                  {t("loginPromptTitle")}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {t("loginPromptDesc")}
                </p>
                <Link href="/auth" onClick={() => setIsOpen(false)}>
                  <button className="px-6 py-2 bg-brand-gold text-brand-navy rounded-full font-bold shadow-lg">
                    {t("loginButton")}
                  </button>
                </Link>
              </div>
            ) : (
              <>
                {/* Mobile Tabs */}
                <div className="md:hidden flex h-12 border-b border-border bg-card shrink-0">
                  <button
                    onClick={() => setActiveTab("conversations")}
                    className={cn(
                      "flex-1 text-sm font-semibold transition-all relative flex items-center justify-center gap-2",
                      activeTab === "conversations"
                        ? "text-brand-gold"
                        : "text-muted-foreground",
                    )}
                  >
                    <Users className="w-4 h-4" /> {t("activeTab")}
                    {activeTab === "conversations" && (
                      <motion.div
                        layoutId="mobiletab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-gold"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={cn(
                      "flex-1 text-sm font-semibold transition-all relative flex items-center justify-center gap-2",
                      activeTab === "chat"
                        ? "text-brand-gold"
                        : "text-muted-foreground",
                    )}
                  >
                    <MessageCircle className="w-4 h-4" /> {t("chatTab")}
                    {activeTab === "chat" && (
                      <motion.div
                        layoutId="mobiletab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-gold"
                      />
                    )}
                  </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Mobile View */}
                  <div className="w-full md:hidden flex flex-col">
                    {activeTab === "conversations" ? (
                      <ConversationsList />
                    ) : (
                      <ChatMessagesArea />
                    )}
                  </div>

                  {/* Desktop View (Side by Side) */}
                  <div className="hidden md:flex w-full h-full">
                    <div className="w-[40%] min-w-[240px] max-w-[300px] shrink-0 border-r border-white/10 bg-black/20">
                      <ConversationsList />
                    </div>
                    <div className="flex-1 min-w-0">
                      <ChatMessagesArea />
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
