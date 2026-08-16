"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function QuestionAnswerForm({
  questionId,
  closed,
  t,
}: {
  questionId: string;
  closed: boolean;
  t: (en: string, fr: string) => string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (closed) {
    return (
      <p className="text-muted-foreground text-sm">
        {t("This question is closed or locked.", "Cette question est fermée ou verrouillée.")}
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/questions/${questionId}/answers`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.status === 401) {
        router.push("/auth");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Erreur ${res.status}`);
      }
      setBody("");
      router.refresh(); // re-fetch the SSR page with the new answer
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <textarea
        required
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("Write your answer…", "Rédigez votre réponse…")}
        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={busy || body.trim().length < 5}
        className="bg-primary hover:bg-primary/80 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl"
      >
        {busy ? "…" : t("Post answer", "Publier la réponse")}
      </button>
    </form>
  );
}
