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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/navigation";
import { useAuth } from "./AuthProvider";
import { io, Socket } from "socket.io-client";
import { PlayerIdentity } from "./PlayerIdentity";

export const ChatPanel = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "conversations">(
    "conversations",
  );
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggle-chat", handleToggle);
    return () => window.removeEventListener("toggle-chat", handleToggle);
  }, []);

  // Initialize Socket and Fetch Conversations
  useEffect(() => {
    if (user) {
      const newSocket = io(`${WS_URL}/chat`, { withCredentials: true });
      // Presence socket: identify + heartbeat so online status stays fresh
      // (Redis ZSET with TTL — a closed tab expires after ~90s).
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
          // Fetch conversations again if new user
          fetchConversations();
          return prev;
        });

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
        newSocket.close();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleBlockUser = async () => {
    if (!selectedUser || !user) return;
    if (
      confirm(
        `Êtes-vous sûr de vouloir bloquer/débloquer ${selectedUser.user.name} ?`,
      )
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
              ? "Utilisateur bloqué."
              : "Utilisateur débloqué.",
          );
          setSelectedUser(null);
          fetchConversations();
        }
      } catch (err) {
        console.error(err);
        toast.error("Erreur réseau");
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
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 border-b border-border bg-secondary/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredConversations.length === 0 && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Aucune conversation trouvée.
          </p>
        )}
        {filteredConversations.map((conv) => (
          <div
            key={conv.user.id}
            onClick={() => handleSelectUser(conv)}
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl cursor-pointer group transition-colors relative",
              selectedUser?.user.id === conv.user.id
                ? "bg-primary/20 border border-primary/30"
                : "hover:bg-secondary/60",
            )}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center shadow-sm border border-border/50 overflow-hidden">
                {conv.user.avatar ? (
                  <img
                    src={conv.user.avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold">
                    {conv.user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <PlayerIdentity
                  username={conv.user.name}
                  level={conv.user.level || 1}
                  className={cn(
                    "font-semibold text-sm truncate transition-colors",
                    selectedUser?.user.id === conv.user.id
                      ? "text-primary"
                      : "group-hover:text-primary",
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
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                )}
              </div>
              <p
                className={cn(
                  "text-[10px] truncate",
                  conv.unread
                    ? "text-foreground font-bold"
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
    <div className="flex flex-col h-full bg-background">
      {!selectedUser ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
          Sélectionnez une conversation pour commencer à discuter.
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center overflow-hidden">
                {selectedUser.user.avatar ? (
                  <img
                    src={selectedUser.user.avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-xs">
                    {selectedUser.user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
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
            <button
              onClick={handleBlockUser}
              className="text-xs text-red-500 hover:underline flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded"
            >
              <AlertTriangle className="w-3 h-3" /> Bloquer
            </button>
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
                      "px-4 py-2 rounded-2xl",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-secondary text-foreground rounded-tl-sm",
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
          <div className="p-3 bg-card border-t border-border">
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 relative"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Écrire un message..."
                className="flex-1 bg-background border border-border rounded-full px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.6)] hover:scale-110 hover:shadow-[0_0_30px_rgba(37,99,235,0.8)] transition-all relative"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-0 right-0 w-[360px] md:w-[700px] h-[550px] md:h-[550px] max-h-[calc(100vh-100px)] bg-card/95 backdrop-blur-2xl border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-5 bg-gradient-to-r from-card to-secondary/30 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-lg">Messagerie</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!user ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-bold mb-2">
                  Connectez-vous pour parler
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Vous devez avoir un compte pour envoyer des messages privés ou
                  bloquer des utilisateurs.
                </p>
                <Link href="/auth" onClick={() => setIsOpen(false)}>
                  <button className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-bold shadow-lg">
                    Se connecter
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
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    <Users className="w-4 h-4" /> Actifs
                    {activeTab === "conversations" && (
                      <motion.div
                        layoutId="mobiletab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={cn(
                      "flex-1 text-sm font-semibold transition-all relative flex items-center justify-center gap-2",
                      activeTab === "chat"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    <MessageCircle className="w-4 h-4" /> Chat
                    {activeTab === "chat" && (
                      <motion.div
                        layoutId="mobiletab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
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
                    <div className="w-[40%] min-w-[240px] max-w-[300px] shrink-0 border-r border-border bg-secondary/5">
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
