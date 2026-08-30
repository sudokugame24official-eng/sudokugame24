"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { API_URL, WS_URL } from "@/lib/api";
import { Link } from "@/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Swords,
  MessageSquare,
  ShieldAlert,
  Search,
  Check,
  X,
  Trophy,
  Sparkles,
  Flame,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { UserAvatar } from "@/components/UserAvatar";

interface Friend {
  id: string;
  username: string;
  level?: number;
  rating?: number;
  isOnline?: boolean;
  avatarUrl?: string;
  status?: "ACCEPTED" | "PENDING" | "BLOCKED";
}

export default function FriendsPage() {
  const t = useTranslations("friends");
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "online" | "pending" | "add">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch friends list from API
    fetch(`${API_URL}/friends`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setFriends(Array.isArray(data) ? data : []);
        } else {
          // Fallback sample mock list for UI demonstration
          setFriends([
            { id: "f1", username: "LogicMaster99", level: 42, rating: 2450, isOnline: true },
            { id: "f2", username: "SudokuQueen_FR", level: 38, rating: 2190, isOnline: true },
            { id: "f3", username: "Brainiac_22", level: 29, rating: 1980, isOnline: false },
            { id: "f4", username: "GridRunner", level: 15, rating: 1650, isOnline: false },
          ]);
        }
      })
      .catch(() => {
        setFriends([
          { id: "f1", username: "LogicMaster99", level: 42, rating: 2450, isOnline: true },
          { id: "f2", username: "SudokuQueen_FR", level: 38, rating: 2190, isOnline: true },
          { id: "f3", username: "Brainiac_22", level: 29, rating: 1980, isOnline: false },
        ]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsername.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: addUsername.trim() }),
      });
      if (res.ok) {
        toast.success(t("requestSent", { name: addUsername }));
        setAddUsername("");
        setActiveTab("all");
      } else {
        toast.error(t("playerNotFound"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFriends = friends.filter((f) => {
    const matchesSearch = f.username.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "online") return matchesSearch && f.isOnline;
    if (activeTab === "pending") return matchesSearch && f.status === "PENDING";
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#041226] text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-brand-navy-light/80 border-2 border-brand-gold/30 p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-brand-cyan" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                {t("title")}
              </h1>
              <p className="text-gray-300 text-sm mt-1">
                {t("subtitle")}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab("add")}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-orange to-brand-orange-light text-white font-black rounded-xl uppercase tracking-wider shadow-lg hover:brightness-110 transition-all text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t("addFriend")}</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
            {[
              { id: "all", label: `${t("tabsAll")} (${friends.length})` },
              { id: "online", label: `${t("tabsOnline")} (${friends.filter((f) => f.isOnline).length})` },
              { id: "pending", label: t("tabsPending") },
              { id: "add", label: t("tabsAdd") },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all ${
                  activeTab === tab.id
                    ? "bg-brand-gold text-brand-navy shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab !== "add" && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan"
              />
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "add" ? (
          <div className="bg-brand-navy-light/60 border border-white/10 rounded-3xl p-8 max-w-xl mx-auto space-y-6 text-center">
            <div className="w-16 h-16 bg-brand-orange/20 rounded-2xl flex items-center justify-center mx-auto text-brand-orange">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase">{t("sendInvitation")}</h2>
              <p className="text-gray-300 text-sm mt-1">
                {t("sendInvitationDesc")}
              </p>
            </div>
            <form onSubmit={handleSendRequest} className="space-y-4">
              <input
                type="text"
                placeholder={t("playerPlaceholder")}
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-3.5 text-white font-bold placeholder-gray-500 focus:outline-none focus:border-brand-gold"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-brand-gold text-brand-navy font-black rounded-2xl uppercase tracking-wider hover:brightness-110 transition-all text-sm shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? t("sending") : t("sendRequest")}
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFriends.length === 0 ? (
              <div className="col-span-2 py-16 text-center text-gray-500 bg-white/3 rounded-3xl border border-white/5">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-bold text-gray-400">{t("noFriendsInSection")}</p>
                <button
                  onClick={() => setActiveTab("add")}
                  className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  {t("inviteFriend")}
                </button>
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <motion.div
                  key={friend.id}
                  whileHover={{ y: -3 }}
                  className="bg-brand-navy-light/70 border border-white/10 p-5 rounded-2xl backdrop-blur-md flex items-center justify-between gap-4 shadow-md hover:border-brand-cyan/40 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <UserAvatar
                      avatarUrl={friend.avatarUrl}
                      username={friend.username}
                      size="md"
                      isOnline={friend.isOnline}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base">{friend.username}</span>
                        {friend.level && (
                          <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded-md text-brand-gold">
                            LVL {friend.level}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1 font-bold text-brand-cyan">
                          <Trophy className="w-3.5 h-3.5" /> {friend.rating || 1500} ELO
                        </span>
                        <span>•</span>
                        <span className={friend.isOnline ? "text-green-400 font-bold" : "text-gray-500"}>
                          {friend.isOnline ? t("online") : t("offline")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/duel`}>
                      <button
                        title={t("challenge1v1")}
                        className="p-2.5 bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan hover:bg-brand-cyan hover:text-brand-navy rounded-xl font-bold transition-all shadow cursor-pointer"
                      >
                        <Swords className="w-4 h-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent("open-private-chat", {
                            detail: {
                              userId: friend.id,
                              username: friend.username,
                              avatarUrl: friend.avatarUrl,
                              level: friend.level,
                              rating: friend.rating,
                            },
                          })
                        );
                      }}
                      title={t("sendMessage")}
                      className="p-2.5 bg-brand-gold/20 border border-brand-gold/40 text-brand-gold hover:bg-brand-gold hover:text-brand-navy rounded-xl font-bold transition-all shadow cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
