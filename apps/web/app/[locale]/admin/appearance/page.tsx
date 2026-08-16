"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { Palette, Eye, Save } from "lucide-react";

export default function AppearanceAdmin() {
  const [settings, setSettings] = useState<any>({
    THEME_PRIMARY_COLOR: "#3b82f6",
    THEME_SECONDARY_COLOR: "#1e293b",
    THEME_MODE: "dark",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/marketing-settings`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          THEME_PRIMARY_COLOR: data.THEME_PRIMARY_COLOR || "#3b82f6",
          THEME_SECONDARY_COLOR: data.THEME_SECONDARY_COLOR || "#1e293b",
          THEME_MODE: data.THEME_MODE || "dark",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await fetch(`${API_URL}/admin/marketing-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
        credentials: "include",
      });
      alert(
        "Thème sauvegardé avec succès ! Les modifications seront visibles après rafraîchissement global.",
      );
    } catch (e) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <Palette className="w-8 h-8 text-primary" />
            Theme Builder
          </h1>
          <p className="text-muted-foreground mt-2">
            Personnalisez l'apparence visuelle de la plateforme.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
        >
          <Save className="w-5 h-5" />
          Publier le Thème
        </button>
      </div>

      <div className="flex gap-8">
        {/* Editor */}
        <div className="w-1/3 space-y-6">
          <div className="bg-card/40 border border-white/10 rounded-2xl p-6 backdrop-blur-2xl space-y-4">
            <h2 className="text-xl font-bold mb-4">Couleurs</h2>

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">
                Couleur Primaire (Boutons, Liens)
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={settings.THEME_PRIMARY_COLOR}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      THEME_PRIMARY_COLOR: e.target.value,
                    })
                  }
                  className="w-12 h-12 rounded bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.THEME_PRIMARY_COLOR}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      THEME_PRIMARY_COLOR: e.target.value,
                    })
                  }
                  className="flex-1 bg-secondary/50 border border-white/10 rounded-xl px-4 py-2 uppercase font-mono text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2 mt-4">
                Couleur Secondaire (Fonds, UI)
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={settings.THEME_SECONDARY_COLOR}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      THEME_SECONDARY_COLOR: e.target.value,
                    })
                  }
                  className="w-12 h-12 rounded bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.THEME_SECONDARY_COLOR}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      THEME_SECONDARY_COLOR: e.target.value,
                    })
                  }
                  className="flex-1 bg-secondary/50 border border-white/10 rounded-xl px-4 py-2 uppercase font-mono text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2 mt-4">
                Mode par défaut
              </label>
              <select
                value={settings.THEME_MODE}
                onChange={(e) =>
                  setSettings({ ...settings, THEME_MODE: e.target.value })
                }
                className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
              >
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex-1 bg-card/40 border border-white/10 rounded-2xl p-6 backdrop-blur-2xl flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-muted-foreground font-bold text-sm uppercase tracking-wider">
            <Eye className="w-4 h-4" /> Live Preview
          </div>

          <div
            className="flex-1 border border-white/10 rounded-xl overflow-hidden shadow-2xl relative"
            style={{
              backgroundColor:
                settings.THEME_MODE === "dark" ? "#0f172a" : "#f8fafc",
            }}
          >
            {/* Mock UI */}
            <div
              className="h-16 border-b border-white/10 flex items-center justify-between px-6"
              style={{ backgroundColor: settings.THEME_SECONDARY_COLOR }}
            >
              <div className="w-32 h-6 bg-white/20 rounded" />
              <div className="flex gap-4">
                <div className="w-16 h-4 bg-white/20 rounded" />
                <div className="w-16 h-4 bg-white/20 rounded" />
              </div>
            </div>
            <div className="p-12 text-center">
              <h1
                className="text-4xl font-black mb-4"
                style={{
                  color: settings.THEME_MODE === "dark" ? "#fff" : "#000",
                }}
              >
                Sudoku Premium
              </h1>
              <p
                className="mb-8"
                style={{
                  color: settings.THEME_MODE === "dark" ? "#94a3b8" : "#64748b",
                }}
              >
                Bienvenue sur la meilleure plateforme de Sudoku au monde.
              </p>
              <button
                className="px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105"
                style={{ backgroundColor: settings.THEME_PRIMARY_COLOR }}
              >
                Jouer au Sudoku
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
