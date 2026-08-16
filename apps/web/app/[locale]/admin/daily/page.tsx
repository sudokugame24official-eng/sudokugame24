"use client";
import React, { useCallback, useEffect, useState } from "react";
import { CalendarDays, Save, Rocket, Eye, RefreshCw } from "lucide-react";
import { API_URL } from "@/lib/api";

interface DailyConfig {
  enabled: boolean;
  difficulty: string;
  xpReward: number;
  coinRewardPerCell: number;
  streakBonus: number;
  maxAttempts: number;
  featured: boolean;
  announcement: string | null;
}

const DEFAULTS: DailyConfig = {
  enabled: true,
  difficulty: "MEDIUM",
  xpReward: 50,
  coinRewardPerCell: 5,
  streakBonus: 25,
  maxAttempts: 1,
  featured: false,
  announcement: null,
};

export default function AdminDailyPage() {
  const [config, setConfig] = useState<DailyConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [publishDifficulty, setPublishDifficulty] = useState("");

  const flash = (m: string) => {
    setSuccess(m);
    setTimeout(() => setSuccess(""), 3000);
  };

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/daily/admin/config`, { credentials: "include" });
      if (res.ok) setConfig({ ...DEFAULTS, ...(await res.json()) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/daily/admin/config`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      flash("Configuration enregistrée.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const publishToday = async () => {
    if (!confirm("Publier le défi du jour maintenant ? Impossible si des joueurs ont déjà participé.")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/daily/admin/publish-today`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publishDifficulty ? { difficulty: publishDifficulty } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);
      flash("Défi du jour publié.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const previewTomorrow = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/daily/admin/preview-tomorrow`, { credentials: "include" });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setPreview(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary" />
            Défi du jour
          </h1>
          <p className="text-muted-foreground mt-2">
            Tout est configurable ici : activation, difficulté, récompenses, série, attempts.
            Le serveur reste autoritaire (grille, chrono, score).
          </p>
        </div>
        <button onClick={fetchConfig} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 text-sm">{error}</div>}
      {success && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm">{success}</div>}

      <form onSubmit={save} className="bg-card/40 border border-white/10 rounded-2xl p-6 space-y-5 max-w-2xl">
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            Défi activé
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={config.featured} onChange={(e) => setConfig({ ...config, featured: e.target.checked })} />
            Mis en avant (featured)
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Difficulté (auto-génération)</label>
            <select value={config.difficulty} onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}
              className="w-full mt-1 bg-card/50 border border-white/10 rounded-xl p-3 text-sm">
              {["EASY", "MEDIUM", "HARD", "EXPERT"].map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Récompense XP</label>
            <input type="number" min={0} max={1000} value={config.xpReward}
              onChange={(e) => setConfig({ ...config, xpReward: Number(e.target.value) })}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Coins / bonne case</label>
            <input type="number" min={0} max={50} value={config.coinRewardPerCell}
              onChange={(e) => setConfig({ ...config, coinRewardPerCell: Number(e.target.value) })}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Bonus de série (streak)</label>
            <input type="number" min={0} max={1000} value={config.streakBonus}
              onChange={(e) => setConfig({ ...config, streakBonus: Number(e.target.value) })}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Attempts max / joueur</label>
            <input type="number" min={1} max={10} value={config.maxAttempts}
              onChange={(e) => setConfig({ ...config, maxAttempts: Number(e.target.value) })}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Annonce (affichée sur la page du défi)</label>
          <textarea rows={2} value={config.announcement || ""} onChange={(e) => setConfig({ ...config, announcement: e.target.value || null })}
            className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
        </div>

        <button type="submit" disabled={busy}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl">
          <Save className="w-4 h-4" /> Enregistrer la configuration
        </button>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card/40 border border-white/10 rounded-2xl p-6">
          <h2 className="font-black mb-2 flex items-center gap-2"><Rocket className="w-5 h-5 text-primary" /> Publier le défi du jour</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Génère et publie la grille d&apos;aujourd&apos;hui immédiatement (avant le premier passage auto).
          </p>
          <div className="flex gap-2 mb-3">
            <select value={publishDifficulty} onChange={(e) => setPublishDifficulty(e.target.value)}
              className="bg-card/50 border border-white/10 rounded-xl p-2 text-sm">
              <option value="">Difficulté configurée</option>
              {["EASY", "MEDIUM", "HARD", "EXPERT"].map((d) => <option key={d}>{d}</option>)}
            </select>
            <button onClick={publishToday} disabled={busy}
              className="bg-primary hover:bg-primary/80 disabled:opacity-40 text-white font-bold px-5 py-2 rounded-xl text-sm">
              Publier maintenant
            </button>
          </div>
        </div>

        <div className="bg-card/40 border border-white/10 rounded-2xl p-6">
          <h2 className="font-black mb-2 flex items-center gap-2"><Eye className="w-5 h-5 text-primary" /> Prévisualiser demain</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Génère un aperçu de la grille de demain sans rien enregistrer.
          </p>
          <button onClick={previewTomorrow} disabled={busy}
            className="bg-white/10 hover:bg-white/20 font-bold px-5 py-2 rounded-xl text-sm">
            Générer l&apos;aperçu
          </button>
          {preview && (
            <div className="mt-4 text-sm space-y-1">
              <p><strong>Date :</strong> {new Date(preview.date).toLocaleDateString()}</p>
              <p><strong>Difficulté :</strong> {preview.difficulty}</p>
              <p><strong>Cellules vides :</strong> {preview.emptyCells}</p>
              <div className="grid grid-cols-9 gap-0.5 mt-2 w-fit">
                {preview.initialBoard.flat().map((v: number, i: number) => (
                  <div key={i} className={`w-4 h-4 flex items-center justify-center text-[8px] ${v === 0 ? "bg-white/5" : "bg-primary/30 font-bold"}`}>
                    {v || ""}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
