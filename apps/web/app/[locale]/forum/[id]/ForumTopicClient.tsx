"use client";
import { API_URL } from "@/lib/api";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  MessageSquare,
  Heart,
  Share2,
  MoreHorizontal,
  Flag,
  Reply,
  Trophy,
  Crown,
  Medal,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { Link, useRouter } from "@/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PlayerIdentity } from "@/components/PlayerIdentity";
import { useAuth } from "@/components/AuthProvider";
import { useTranslations } from "next-intl";

export default function ForumTopicClient({
  topic: initialTopic,
}: {
  topic: any;
}) {
  const [topic, setTopic] = useState(initialTopic);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations("forum");

  // Optimistic UI state for Like on Topic
  const [isLikingTopic, setIsLikingTopic] = useState(false);
  const [showOptionsId, setShowOptionsId] = useState<string | null>(null);

  // Editing state
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const canModerate = (authorId: string) => {
    if (!user) return false;
    if (user.id === authorId) return true;
    if (
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN" ||
      user.role === "MODERATOR"
    )
      return true;
    return false;
  };

  const handleReply = async () => {
    if (!replyText.trim() || !user) {
      if (!user) toast.error(t("loginToReply"));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/forum/posts/${topic.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText }),
        credentials: "include",
      });
      if (res.ok) {
        const newComment = await res.json();
        toast.success(t("replyAdded"));
        setReplyText("");
        setTopic({
          ...topic,
          comments: [...(topic.comments || []), newComment],
        });
      } else {
        toast.error(t("errorSending"));
      }
    } catch (e) {
      toast.error(t("errorSending"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeTopic = async () => {
    if (!user) return toast.error(t("loginToReply"));
    if (isLikingTopic) return;

    setIsLikingTopic(true);
    const originalLikes = topic.likes || 0;

    // Optimistic update
    setTopic({ ...topic, likes: originalLikes + 1 });

    try {
      const res = await fetch(`${API_URL}/forum/posts/${topic.id}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    } catch (e) {
      setTopic({ ...topic, likes: originalLikes }); // Revert
    } finally {
      setIsLikingTopic(false);
    }
  };

  const handleLikeComment = async (commentId: string, currentLikes: number) => {
    if (!user) return toast.error(t("loginToReply"));

    // Optimistic
    const newComments = topic.comments.map((c: any) =>
      c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c,
    );
    setTopic({ ...topic, comments: newComments });

    try {
      const res = await fetch(`${API_URL}/forum/comments/${commentId}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    } catch (e) {
      // Revert
      const revertComments = topic.comments.map((c: any) =>
        c.id === commentId ? { ...c, likes: currentLikes } : c,
      );
      setTopic({ ...topic, comments: revertComments });
    }
  };

  const handleDeleteTopic = async () => {
    // Simplified for non-blocking UI
    toast("Confirmer la suppression", {
      action: {
        label: "Supprimer",
        onClick: async () => {
          try {
            const res = await fetch(`${API_URL}/forum/posts/${topic.id}`, {
              method: "DELETE",
              credentials: "include",
            });
            if (res.ok) {
              toast.success(t("topicDeleted"));
              router.push("/forum");
            } else {
              toast.error("Erreur");
            }
          } catch (e) {
            toast.error("Erreur");
          }
        },
      },
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    toast("Confirmer la suppression", {
      action: {
        label: "Supprimer",
        onClick: async () => {
          try {
            const res = await fetch(`${API_URL}/forum/comments/${commentId}`, {
              method: "DELETE",
              credentials: "include",
            });
            if (res.ok) {
              toast.success(t("replyDeleted"));
              setTopic({
                ...topic,
                comments: topic.comments.filter((c: any) => c.id !== commentId),
              });
            } else {
              toast.error("Erreur");
            }
          } catch (e) {
            toast.error("Erreur");
          }
        },
      },
    });
  };

  const submitEditComment = async (commentId: string) => {
    if (!editReplyText.trim()) return;
    setIsEditing(true);
    try {
      const res = await fetch(`${API_URL}/forum/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editReplyText }),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Commentaire modifié");
        setTopic({
          ...topic,
          comments: topic.comments.map((c: any) =>
            c.id === commentId ? { ...c, content: editReplyText } : c,
          ),
        });
        setEditingReplyId(null);
      } else {
        toast.error("Erreur");
      }
    } catch (e) {
      toast.error("Erreur");
    } finally {
      setIsEditing(false);
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

  useEffect(() => {
    const handleClick = () => setShowOptionsId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020F24] to-[#041E42] text-white p-4 md:p-8">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#FFCC00]/5 to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Top Navigation */}
        <div className="mb-8">
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-[#FFCC00] font-bold uppercase tracking-wider text-sm transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            {t("backToForum")}
          </Link>
        </div>

        {/* Topic Header */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {(topic.category ? [topic.category.name] : []).map(
              (tag: string) => (
                <span
                  key={tag}
                  className="bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase text-[#FFCC00]"
                >
                  {tag}
                </span>
              ),
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
            {topic.title}
          </h1>
        </div>

        {/* Original Post (OP) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0A2A5C]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFCC00]/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10 relative">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFCC00] to-[#E6B800] flex items-center justify-center font-black text-2xl text-[#041E42] shadow-lg">
                {topic.author?.profile?.avatarUrl ||
                  topic.author?.profile?.username?.charAt(0) ||
                  "U"}
              </div>
              <div>
                <div
                  className={cn(
                    "font-black text-lg text-white flex items-center gap-2",
                    hasPerk(topic.author?.perks, "CHAT_VIP") &&
                      "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500",
                  )}
                >
                  <PlayerIdentity
                    username={topic.author?.profile?.username || "User"}
                    level={topic.author?.profile?.level || 1}
                    size="lg"
                  />
                  {hasPerk(topic.author?.perks, "CHAT_VIP") && (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  )}
                  {hasPerk(topic.author?.perks, "CUSTOM_BADGE") && (
                    <Medal className="w-5 h-5 text-purple-400" />
                  )}
                  {(topic.author?.role === "ADMIN" ||
                    topic.author?.role === "SUPER_ADMIN") && (
                    <span className="bg-[#FF4500]/20 text-[#FF4500] text-[10px] px-2 rounded uppercase">
                      {t("official")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                  <Trophy className="w-3 h-3 text-[#FFCC00]" />
                  <span>{topic.author?.profile?.elo || 1000} elo</span>
                  <span>•</span>
                  <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptionsId(
                    showOptionsId === topic.id ? null : topic.id,
                  );
                }}
                className="text-gray-500 hover:text-white transition-colors p-2"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>

              <AnimatePresence>
                {showOptionsId === topic.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-[#041E42] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20"
                  >
                    {canModerate(topic.authorId) && (
                      <button
                        onClick={handleDeleteTopic}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-red-400 hover:bg-white/5 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> {t("delete")}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        toast.success(t("reportSent"));
                        setShowOptionsId(null);
                      }}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-gray-300 hover:bg-white/5 flex items-center gap-2"
                    >
                      <Flag className="w-4 h-4" /> {t("report")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="text-gray-200 leading-relaxed space-y-4 whitespace-pre-wrap text-[15px] md:text-base">
            {topic.content}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-6">
            <button
              onClick={handleLikeTopic}
              disabled={isLikingTopic}
              className={`flex items-center gap-2 font-bold transition-colors text-pink-500 hover:text-pink-400`}
            >
              <Heart className="w-5 h-5 fill-pink-500" />
              {topic.likes || 0} {t("likes")}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success(t("linkCopied"));
              }}
              className="flex items-center gap-2 font-bold text-gray-400 hover:text-[#FFCC00] transition-colors"
            >
              <Share2 className="w-5 h-5" /> {t("share")}
            </button>
          </div>
        </motion.div>

        {/* Replies Section */}
        <h2 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-[#FFCC00]" />
          {(topic.comments || []).length} {t("replies")}
        </h2>

        <div className="space-y-6 mb-12">
          {(topic.comments || []).map((reply: any, index: number) => {
            const role = reply.author?.role || "MEMBER";
            const isEditingThis = editingReplyId === reply.id;

            return (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={reply.id}
                className={cn(
                  "bg-black/20 border border-white/5 rounded-2xl p-6 relative group",
                  (role === "SUPER_ADMIN" || role === "ADMIN") &&
                    "border-[#FF4500]/30 bg-[#FF4500]/5",
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-lg ${
                        role === "SUPER_ADMIN" || role === "ADMIN"
                          ? "bg-gradient-to-br from-red-500 to-orange-500 text-white"
                          : role === "PREMIUM_MEMBER"
                            ? "bg-gradient-to-br from-[#FFCC00] to-yellow-600 text-white"
                            : "bg-gradient-to-br from-gray-600 to-gray-800 text-white"
                      }`}
                    >
                      {reply.author?.profile?.avatarUrl ||
                        reply.author?.profile?.username?.charAt(0) ||
                        "U"}
                    </div>
                    <div>
                      <div
                        className={cn(
                          "font-bold text-white text-sm flex items-center gap-1.5",
                          hasPerk(reply.author?.perks, "CHAT_VIP") &&
                            "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-black",
                        )}
                      >
                        <PlayerIdentity
                          username={reply.author?.profile?.username || "User"}
                          level={reply.author?.profile?.level || 1}
                          size="md"
                        />
                        {(role === "SUPER_ADMIN" || role === "ADMIN") && (
                          <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm uppercase ml-1">
                            {t("official")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-500">
                        <span>
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOptionsId(
                          showOptionsId === reply.id ? null : reply.id,
                        );
                      }}
                      className="text-gray-500 hover:text-white p-1"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    <AnimatePresence>
                      {showOptionsId === reply.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 w-40 bg-[#041E42] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20"
                        >
                          {canModerate(reply.authorId) && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingReplyId(reply.id);
                                  setEditReplyText(reply.content);
                                  setShowOptionsId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-300 hover:bg-white/5 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" /> {t("edit")}
                              </button>
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-white/5 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> {t("delete")}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              toast.success(t("reportSent"));
                              setShowOptionsId(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-300 hover:bg-white/5 flex items-center gap-2"
                          >
                            <Flag className="w-4 h-4" /> {t("report")}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {isEditingThis ? (
                  <div className="mb-4">
                    <textarea
                      value={editReplyText}
                      onChange={(e) => setEditReplyText(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-gold text-white"
                      rows={3}
                    />
                    <div className="flex gap-2 justify-end mt-2">
                      <button
                        onClick={() => setEditingReplyId(null)}
                        className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white"
                      >
                        {t("cancel")}
                      </button>
                      <button
                        onClick={() => submitEditComment(reply.id)}
                        disabled={isEditing}
                        className="bg-brand-gold text-brand-navy px-4 py-1.5 rounded-lg text-xs font-black uppercase"
                      >
                        {isEditing ? "..." : t("save")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                    {reply.content}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                  <button
                    onClick={() =>
                      handleLikeComment(reply.id, reply.likes || 0)
                    }
                    className="flex items-center gap-1 hover:text-pink-400 transition-colors text-pink-500"
                  >
                    <Heart className="w-4 h-4 fill-pink-500" />{" "}
                    {reply.likes || 0}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Post a Reply Area */}
        <div className="bg-[#0A2A5C]/50 backdrop-blur-md border border-[#FFCC00]/30 rounded-3xl p-6 shadow-xl">
          <h3 className="font-black uppercase tracking-wider mb-4 text-[#FFCC00]">
            {t("addReply")}
          </h3>
          {!user ? (
            <div className="bg-black/30 rounded-xl p-8 text-center border border-white/5">
              <p className="text-gray-400 font-bold mb-4">
                {t("loginToReply")}
              </p>
              <Link href="/auth">
                <button className="bg-brand-orange text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:-translate-y-1 transition-transform shadow-[0_4px_15px_rgba(255,69,0,0.4)]">
                  {t("loginButton")}
                </button>
              </Link>
            </div>
          ) : (
            <>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t("typeMessage")}
                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#FF4500] transition-colors resize-none mb-4"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || isSubmitting}
                  className={`font-black py-3 px-8 rounded-xl uppercase tracking-wider transition-all ${
                    replyText.trim() && !isSubmitting
                      ? "bg-[#FF4500] hover:bg-[#ff5c1a] text-white shadow-[0_4px_15px_rgba(255,69,0,0.4)] hover:-translate-y-0.5"
                      : "bg-white/10 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? t("sending") : t("send")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
