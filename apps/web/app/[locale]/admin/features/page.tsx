"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { ToggleRight, ToggleLeft, Activity, Plus } from "lucide-react";

export default function FeaturesAdmin() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFlagKey, setNewFlagKey] = useState("");
  const [newFlagDesc, setNewFlagDesc] = useState("");

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/features`, {
        credentials: "include",
      });
      if (res.ok) setFlags(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (key: string, current: boolean) => {
    try {
      await fetch(`${API_URL}/admin/features/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !current }),
        credentials: "include",
      });
      fetchFlags();
    } catch (e) {
      alert("Erreur lors de la modification du Feature Flag");
    }
  };

  const createFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlagKey) return;
    try {
      await fetch(`${API_URL}/admin/features/${newFlagKey.toUpperCase()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false, description: newFlagDesc }),
        credentials: "include",
      });
      setNewFlagKey("");
      setNewFlagDesc("");
      fetchFlags();
    } catch (e) {
      alert("Erreur");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Feature Flags (Kill Switches)</h1>
        <p className="text-muted-foreground">
          Activez ou désactivez globalement des modules (Boutique, Coach, Ads).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Flag List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <p>Chargement...</p>
          ) : (
            flags.map((flag) => (
              <div
                key={flag.key}
                className="flex items-center justify-between p-5 bg-card border border-white/10 rounded-2xl"
              >
                <div>
                  <h3 className="font-bold text-lg font-mono">{flag.key}</h3>
                  <p className="text-sm text-muted-foreground">
                    {flag.description || "Aucune description"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Rollout: {flag.percentage}%
                  </p>
                </div>
                <button
                  onClick={() => toggleFlag(flag.key, flag.enabled)}
                  className={`transition-colors ${flag.enabled ? "text-green-500" : "text-muted-foreground hover:text-white"}`}
                >
                  {flag.enabled ? (
                    <ToggleRight className="w-12 h-12" />
                  ) : (
                    <ToggleLeft className="w-12 h-12" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Create Flag */}
        <div className="bg-card border border-white/10 rounded-2xl p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Nouveau Flag</h3>
          </div>
          <form onSubmit={createFlag} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Clé (MAJUSCULES)</label>
              <input
                type="text"
                value={newFlagKey}
                onChange={(e) => setNewFlagKey(e.target.value)}
                placeholder="ex: SUDOKU_COACH_ENABLED"
                className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Description</label>
              <input
                type="text"
                value={newFlagDesc}
                onChange={(e) => setNewFlagDesc(e.target.value)}
                className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
