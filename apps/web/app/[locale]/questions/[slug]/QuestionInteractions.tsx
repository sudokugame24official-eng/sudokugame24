"use client";
import React, { useState } from "react";
import { ArrowBigUp, ArrowBigDown, Star, Flag, Share2 } from "lucide-react";
import { API_URL } from "@/lib/api";

export default function QuestionInteractions({
  questionId,
  score,
  followers,
  isAuthorActionsEnabled,
}: {
  questionId: string;
  score: number;
  followers: number;
  isAuthorActionsEnabled: boolean;
}) {
  const [currentScore, setCurrentScore] = useState(score);
  const [voted, setVoted] = useState<0 | 1 | -1>(0);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(followers);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const vote = async (value: 1 | -1) => {
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/questions/${questionId}/vote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (res.ok && data.changed) {
        setCurrentScore(data.score ?? currentScore);
        setVoted(value);
      } else if (res.ok) {
        setVoted(value);
      } else {
        setMsg(data.message || "Connexion requise");
        setTimeout(() => setMsg(""), 3000);
      }
    } finally {
      setBusy(false);
    }
  };

  const follow = async () => {
    const res = await fetch(`${API_URL}/questions/${questionId}/follow`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setFollowing(data.following);
      setFollowerCount((c) => c + (data.following ? 1 : -1));
    }
  };

  const report = async () => {
    const reason = prompt("Raison (SPAM / HARASSMENT / OFFENSIVE_CONTENT / SCAM / INAPPROPRIATE / OTHER) :");
    if (!reason) return;
    const res = await fetch(`${API_URL}/questions/${questionId}/report`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason.toUpperCase().trim() }),
    });
    setMsg(res.ok ? "Signalement envoyé — merci." : "Échec du signalement.");
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-card/30 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-1">
        <button
          onClick={() => vote(1)} disabled={busy || voted === 1}
          className={`p-1 rounded hover:bg-white/10 disabled:opacity-40 ${voted === 1 ? "text-primary" : "text-muted-foreground"}`}
          aria-label="Upvote"
        >
          <ArrowBigUp className="w-6 h-6" />
        </button>
        <span className="font-black text-lg w-10 text-center">{currentScore}</span>
        <button
          onClick={() => vote(-1)} disabled={busy || voted === -1}
          className={`p-1 rounded hover:bg-white/10 disabled:opacity-40 ${voted === -1 ? "text-red-400" : "text-muted-foreground"}`}
          aria-label="Downvote"
        >
          <ArrowBigDown className="w-6 h-6" />
        </button>
      </div>

      <button
        onClick={follow}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${following ? "bg-yellow-500/20 text-yellow-400" : "bg-white/5 hover:bg-white/10 text-muted-foreground"}`}
      >
        <Star className="w-4 h-4" />
        {following ? "Suivie" : "Suivre"} · {followerCount}
      </button>

      <button onClick={report} className="flex items-center gap-1.5 px-3 py-2 text-muted-foreground hover:text-white text-sm">
        <Flag className="w-4 h-4" /> Signaler
      </button>

      <button
        onClick={() => {
          navigator.clipboard?.writeText(window.location.href);
          setMsg("Lien copié !");
          setTimeout(() => setMsg(""), 2000);
        }}
        className="flex items-center gap-1.5 px-3 py-2 text-muted-foreground hover:text-white text-sm ml-auto"
      >
        <Share2 className="w-4 h-4" /> Partager
      </button>

      {msg && <span className="text-sm text-primary w-full">{msg}</span>}
    </div>
  );
}
