"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Gamepad2, Save, RefreshCw } from "lucide-react";
import { API_URL } from "@/lib/api";

interface ModeConfig {
  enabled: boolean;
  minLevel: number;
  description: string;
  maxWager?: number;
}

const FUTURE_MODES = ["TOURNAMENT", "SPECTATOR", "PUZZLE_CHALLENGE"];

export default function AdminModesPage() {
  const [modes, setModes] = useState<Record<string, ModeConfig>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchModes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/config/game-modes/all`, { credentials: "include" });
      if (res.ok) setModes(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModes();
  }, [fetchModes]);

  const flash = (m: string) => {
    setSuccess(m);
    setTimeout(() => setSuccess(""), 3000);
  };

  const saveMode = async (mode: string) => {
    setBusy(mode);
    setError("");
    try {
      const cfg: ModeConfig | undefined = modes[mode];
      if (!cfg) return;
      const res = await fetch(`${API_URL}/config/game-modes/${mode}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: cfg.enabled,
          minLevel: Number(cfg.minLevel),
          description: cfg.description,
          ...(cfg.maxWager !== undefined ? { maxWager: Number(cfg.maxWager) } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      flash(`${mode} enregistré.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const setMode = (mode: string, patch: Partial<ModeConfig>) =>
    setModes((prev) => ({ ...prev, [mode]: { ...prev[mode], ...patch } }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-primary" />
            Modes de jeu
          </h1>
          <p className="text-muted-foreground mt-2">
            Un mode désactivé disparaît de la navigation et du jeu. Les modes futurs restent
            invisibles jusqu&apos;à activation.
          </p>
        </div>
        <button onClick={fetchModes} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 text-sm">{error}</div>}
      {success && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm">{success}</div>}

      <div className="grid gap-4">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : (
          (Object.entries(modes) as [string, ModeConfig][]).map(([mode, cfg]) => (
            <div key={mode} className={`bg-card/40 border rounded-2xl p-5 ${cfg.enabled ? "border-white/10" : "border-white/5 opacity-80"}`}>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 font-black text-lg">
                  <input
                    type="checkbox"
                    checked={cfg.enabled}
                    onChange={(e) => setMode(mode, { enabled: e.target.checked })}
                  />
                  {mode}
                  {FUTURE_MODES.includes(mode) && (
                    <span className="text-xs bg-white/10 text-muted-foreground px-2 py-0.5 rounded font-bold">FUTUR</span>
                  )}
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Niveau min.</span>
                  <input
                    type="number" min={1} max={100}
                    value={cfg.minLevel}
                    onChange={(e) => setMode(mode, { minLevel: Number(e.target.value) })}
                    className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1"
                  />
                </div>
                {cfg.maxWager !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Pari max</span>
                    <input
                      type="number" min={0}
                      value={cfg.maxWager}
                      onChange={(e) => setMode(mode, { maxWager: Number(e.target.value) })}
                      className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1"
                    />
                  </div>
                )}
                <button
                  onClick={() => saveMode(mode)}
                  disabled={busy === mode}
                  className="ml-auto flex items-center gap-1.5 bg-primary hover:bg-primary/80 disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded-xl"
                >
                  <Save className="w-3.5 h-3.5" /> Enregistrer
                </button>
              </div>
              <input
                value={cfg.description}
                onChange={(e) => setMode(mode, { description: e.target.value })}
                className="w-full mt-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
                placeholder="Description du mode"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
