"use client";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { MessageCircleQuestion } from "lucide-react";
import { API_URL } from "@/lib/api";

export default function AskQuestionPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const t = (en: string, fr: string) => (locale === "fr" ? fr : en);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/questions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (res.status === 401) {
        router.push(`/${locale}/auth`);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);
      router.push(`/${locale}/questions/${data.slug}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020F24] text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href={`/${locale}/questions`} className="hover:text-white">← {t("All questions", "Toutes les questions")}</Link>
        </nav>

        <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3 mb-2">
          <MessageCircleQuestion className="w-9 h-9 text-primary" />
          {t("Ask a question", "Poser une question")}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t(
            "Be specific: describe the grid, the candidates you eliminated, and what you already tried.",
            "Soyez précis : décrivez la grille, les candidats éliminés et ce que vous avez déjà essayé."
          )}
        </p>

        <form onSubmit={submit} className="bg-card/40 border border-white/10 rounded-2xl p-6 space-y-5">
          <div>
            <label className="text-sm font-bold">{t("Title", "Titre")} *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={10}
              maxLength={180}
              placeholder={t("e.g. How do I spot an X-Wing pattern?", "ex : Comment repérer un pattern X-Wing ?")}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-bold">{t("Details", "Détails")} *</label>
            <textarea
              required
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              minLength={20}
              maxLength={20000}
              placeholder={t("Describe your grid, your reasoning so far…", "Décrivez votre grille, votre raisonnement jusqu'ici…")}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-bold">{t("Tags (max 5, comma-separated)", "Tags (max 5, séparés par des virgules)")}</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t("techniques, hard, x-wing", "techniques, difficile, x-wing")}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-mono"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy}
              className="bg-primary hover:bg-primary/80 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl"
            >
              {busy ? "…" : t("Post question", "Publier la question")}
            </button>
            <Link href={`/${locale}/questions`} className="bg-white/10 hover:bg-white/20 font-bold px-6 py-3 rounded-xl">
              {t("Cancel", "Annuler")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
