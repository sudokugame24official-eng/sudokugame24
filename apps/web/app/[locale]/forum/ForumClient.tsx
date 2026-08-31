"use client";
import { API_URL } from "@/lib/api";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import AdSlot from "@/components/monetization/AdSlot";
import {
  MessageSquare,
  Users,
  Eye,
  Clock,
  Pin,
  Flame,
  ChevronRight,
  Search,
  Loader2,
  Crown,
  Medal,
} from "lucide-react";
import { Link } from "@/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { PlayerIdentity } from "@/components/PlayerIdentity";
import { useTranslations } from "next-intl";

import { useParams } from "next/navigation";

// No seed topics — only real database topics are shown to prevent fake 404-producing links.
// The forum will display a loading indicator until live data is fetched from the API.

export default function ForumClient() {
  const params = useParams<{ locale: string }>();
  const currentLocale = params?.locale || "en";
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const t = useTranslations("forum");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [categories, setCategories] = useState<any[]>([
    { id: "c1", name: currentLocale === "fr" ? "Débutants & Entraide" : currentLocale === "de" ? "Anfänger & Hilfe" : "Beginners & Help" },
    { id: "c2", name: currentLocale === "fr" ? "Stratégies & Techniques" : currentLocale === "de" ? "Strategien & Techniken" : "Strategies & Techniques" },
    { id: "c3", name: currentLocale === "fr" ? "Duels & Multijoueur 1v1" : currentLocale === "de" ? "Duelle & 1v1 Multiplayer" : "Duels & 1v1 Multiplayer" },
    { id: "c4", name: currentLocale === "fr" ? "Variantes & Casse-têtes" : currentLocale === "de" ? "Varianten & Rätsel" : "Variants & Puzzles" },
  ]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("c1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/forum/posts`)
      .then(async (res) => {
        if (!res.ok) throw new Error("API Error");
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.posts;
        setTopics(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        // On API failure show empty list, never fabricated topics
        setTopics([]);
      })
      .finally(() => setLoading(false));

    fetch(`${API_URL}/forum/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          setSelectedCategoryId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateTopic = async () => {
    if (!newTitle.trim() || !newContent.trim() || !selectedCategoryId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/forum/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          categoryId: selectedCategoryId,
        }),
        credentials: "include",
      });
      if (res.ok) {
        toast.success(t("topicCreated"));
        setIsModalOpen(false);
        setNewTitle("");
        setNewContent("");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(t("errorCreating"));
      }
    } catch (e) {
      toast.error(t("errorCreating"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasPerk = (userPerks: any[], perkType: string) => {
    if (!userPerks) return false;
    return userPerks.some(
      (p: any) =>
        p.perkType === perkType &&
        (!p.expiresAt || new Date(p.expiresAt) > new Date()),
    );
  };

  return (
    <div className="min-h-screen bg-[#041E42] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2 uppercase tracking-wide flex flex-wrap items-center gap-4">
              <MessageSquare className="w-10 h-10 text-[#FFCC00]" />
              Community <span className="text-[#FFCC00]">Forum</span>
            </h1>
          </div>

          {user ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#FF4500] text-white font-bold px-6 py-3 rounded-xl uppercase tracking-wider shadow-[0_4px_0_#CC3700] active:translate-y-1 active:shadow-none transition-all"
            >
              + {t("newTopic")}
            </button>
          ) : (
            <Link
              href="/auth"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl uppercase tracking-wider transition-all border border-white/20"
            >
              {t("loginToPost")}
            </Link>
          )}
        </div>

        {/* Stats & Search */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-6 justify-between items-center backdrop-blur-md">
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-black text-[#FFCC00]">
                {topics.length}
              </p>
              <p className="text-xs text-gray-400 uppercase tracking-widest">
                Topics
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white">
                {topics.reduce(
                  (acc, curr) => acc + (curr._count?.comments || 0),
                  0,
                )}
              </p>
              <p className="text-xs text-gray-400 uppercase tracking-widest">
                {t("replies")}
              </p>
            </div>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full bg-black/50 border border-white/20 rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#FFCC00] transition-colors"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          <button
            onClick={() => setFilterCategory(null)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border",
              filterCategory === null
                ? "bg-[#FFCC00] text-[#041E42] border-[#FFCC00]"
                : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10",
            )}
          >
            {t("allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border",
                filterCategory === cat.id
                  ? "bg-[#FFCC00] text-[#041E42] border-[#FFCC00]"
                  : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Topic List */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto overflow-y-hidden backdrop-blur-sm shadow-2xl">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-black/40 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-12 md:col-span-6">Topic</div>
            <div className="hidden md:block md:col-span-2 text-center">
              {t("replies")}
            </div>
            <div className="hidden md:block md:col-span-2 text-center">
              {t("category")}
            </div>
            <div className="hidden md:block md:col-span-2 text-right pr-4">
              Activity
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" />
              </div>
            ) : (
              (() => {
                const filteredTopics = topics.filter((t) => {
                  const matchesSearch =
                    !searchQuery ||
                    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.content.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesCategory =
                    !filterCategory || t.categoryId === filterCategory;
                  return matchesSearch && matchesCategory;
                });

                if (filteredTopics.length === 0) {
                  return (
                    <div className="p-12 text-center">
                      <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">
                        {t("noTopicsFound")}
                      </h3>
                      <p className="text-gray-400 mb-6">{t("adjustFilters")}</p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setFilterCategory(null);
                        }}
                        className="text-[#FFCC00] hover:underline font-bold"
                      >
                        {t("clearFilters")}
                      </button>
                    </div>
                  );
                }

                return filteredTopics.map((topic, index) => {
                  const topicHref = topic.slug ? `/forum/topic/${topic.slug}` : `/forum/${topic.id}`;
                  return (
                    <Link
                      href={topicHref}
                      key={topic.id}
                      className="block group"
                    >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/10 transition-all cursor-pointer group-hover:pl-6"
                    >
                      <div className="col-span-12 md:col-span-6 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold shrink-0 text-[#FFCC00] group-hover:bg-[#FFCC00] group-hover:text-[#041E42] transition-colors shadow-lg">
                          {topic.author?.profile?.username?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg group-hover:text-[#FFCC00] transition-colors line-clamp-1">
                              {topic.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span
                              className={cn(
                                "font-medium text-gray-300 flex items-center gap-1",
                                hasPerk(topic.author?.perks, "CHAT_VIP") &&
                                  "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-black",
                              )}
                            >
                              <PlayerIdentity
                                username={
                                  topic.author?.profile?.username || "User"
                                }
                                level={topic.author?.profile?.level || 1}
                              />
                              {hasPerk(topic.author?.perks, "CHAT_VIP") && (
                                <Crown className="w-3 h-3 text-yellow-500" />
                              )}
                              {hasPerk(topic.author?.perks, "CUSTOM_BADGE") && (
                                <Medal className="w-3 h-3 text-purple-400" />
                              )}
                              {(topic.author?.role === "ADMIN" ||
                                topic.author?.role === "SUPER_ADMIN") && (
                                <span className="bg-[#FF4500]/20 text-[#FF4500] text-[8px] px-1 rounded uppercase">
                                  {t("official")}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-12 flex md:hidden gap-4 text-xs text-gray-400 ml-14">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />{" "}
                          {topic._count?.comments || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{" "}
                          {new Date(topic.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="hidden md:flex md:col-span-2 justify-center text-sm font-bold text-gray-300">
                        {topic._count?.comments || 0}
                      </div>
                      <div className="hidden md:flex md:col-span-2 justify-center text-xs font-medium text-gray-400">
                        <span className="bg-white/10 px-2 py-1 rounded">
                          {topic.category?.name || "General"}
                        </span>
                      </div>
                      <div className="hidden md:flex md:col-span-2 justify-end items-center gap-2 pr-4 text-xs text-gray-400">
                        {new Date(topic.createdAt).toLocaleDateString()}
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#FFCC00] group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  </Link>
                  );
                });
              })()
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0A2A5C] border border-[#FFCC00]/30 rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl"
          >
            <h2 className="text-2xl font-black uppercase text-[#FFCC00] mb-6">
              {t("createTopic")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">
                  {t("category")}
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#FF4500] transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">
                  {t("title")}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#FF4500] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">
                  {t("content")}
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#FF4500] transition-colors resize-none"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleCreateTopic}
                disabled={
                  isSubmitting || !newTitle.trim() || !newContent.trim()
                }
                className={`px-8 py-3 rounded-xl font-black uppercase tracking-wider transition-all ${
                  isSubmitting || !newTitle.trim() || !newContent.trim()
                    ? "bg-white/10 text-gray-500 cursor-not-allowed"
                    : "bg-[#FF4500] text-white hover:bg-[#ff5c1a] shadow-[0_4px_15px_rgba(255,69,0,0.4)] hover:-translate-y-0.5"
                }`}
              >
                {isSubmitting ? t("publishing") : t("publish")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
