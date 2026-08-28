"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Palette, Save, Rocket, Undo2, RefreshCw } from "lucide-react";
import { API_URL } from "@/lib/api";

interface ThemeConfig {
  brandName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  colors: {
    primary: string;
    primaryForeground: string;
    background: string;
    surface: string;
    text: string;
    border: string;
    accent: string;
  };
  radius: string;
  shadow: string;
  mode: "dark" | "light";
}

const COLOR_FIELDS: { key: keyof ThemeConfig["colors"]; label: string }[] = [
  { key: "primary", label: "Primary (HSL)" },
  { key: "primaryForeground", label: "Primary text" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
  { key: "border", label: "Border" },
  { key: "accent", label: "Accent" },
];

// HSL "217.2 91.2% 59.8%" -> usable CSS color
const css = (hsl: string) => `hsl(${hsl})`;

export default function AdminThemePage() {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchDraft = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/config/theme/draft`, { credentials: "include" });
      if (res.ok) {
        setTheme(await res.json());
      } else {
        throw new Error("Failed to load theme");
      }
    } catch (e) {
      setTheme({
        brandName: "Sudoku Pro",
        logoUrl: null,
        faviconUrl: null,
        colors: {
          primary: "217.2 91.2% 59.8%",
          primaryForeground: "210 40% 98%",
          background: "222.2 84% 4.9%",
          surface: "222.2 84% 8%",
          text: "210 40% 98%",
          border: "217.2 32.6% 17.5%",
          accent: "217.2 32.6% 25%",
        },
        radius: "0.75rem",
        shadow: "none",
        mode: "dark",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  const flash = (m: string) => {
    setSuccess(m);
    setTimeout(() => setSuccess(""), 3000);
  };

  const saveDraft = async () => {
    if (!theme) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/config/theme/draft`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      flash("Brouillon enregistré (invisible pour les visiteurs).");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!confirm("Publier ce thème ? Il remplacera le thème actif immédiatement (rollback possible).")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/config/theme/publish`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      flash("Thème publié.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const rollback = async () => {
    if (!confirm("Restaurer le thème précédent ?")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/config/theme/rollback`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Erreur ${res.status}`);
      flash("Thème précédent restauré.");
      fetchDraft();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !theme) {
    return <p className="text-center text-muted-foreground py-8">Chargement…</p>;
  }

  const setColor = (key: keyof ThemeConfig["colors"], value: string) =>
    setTheme({ ...theme, colors: { ...theme.colors, [key]: value } });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <Palette className="w-8 h-8 text-primary" />
            Thème & marque
          </h1>
          <p className="text-muted-foreground mt-2">
            Modifiez, prévisualisez, publiez. Le rollback restaure toujours le thème précédent.
          </p>
        </div>
        <button onClick={fetchDraft} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 text-sm">{error}</div>}
      {success && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm">{success}</div>}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-card/40 border border-white/10 rounded-2xl p-6 space-y-5">
          <div>
            <label className="text-sm text-muted-foreground">Nom de la marque</label>
            <input
              value={theme.brandName}
              onChange={(e) => setTheme({ ...theme, brandName: e.target.value })}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Logo (URL https, optionnel)</label>
            <input
              value={theme.logoUrl || ""}
              onChange={(e) => setTheme({ ...theme, logoUrl: e.target.value || null })}
              placeholder="https://…"
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {COLOR_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground">{f.label}</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={css(theme.colors[f.key])}
                    onChange={(e) => {
                      // hex -> hsl components string
                      const hex = e.target.value;
                      const r = parseInt(hex.slice(1, 3), 16) / 255;
                      const g = parseInt(hex.slice(3, 5), 16) / 255;
                      const b = parseInt(hex.slice(5, 7), 16) / 255;
                      const max = Math.max(r, g, b), min = Math.min(r, g, b);
                      const l = (max + min) / 2;
                      const d = max - min;
                      let h = 0;
                      const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
                      if (d !== 0) {
                        if (max === r) h = 60 * (((g - b) / d) % 6);
                        else if (max === g) h = 60 * ((b - r) / d + 2);
                        else h = 60 * ((r - g) / d + 4);
                      }
                      setColor(f.key, `${h.toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`);
                    }}
                    className="w-10 h-10 rounded-lg bg-transparent border border-white/10"
                  />
                  <input
                    value={theme.colors[f.key]}
                    onChange={(e) => setColor(f.key, e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 text-xs font-mono"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Radius (ex: 0.75rem)</label>
              <input
                value={theme.radius}
                onChange={(e) => setTheme({ ...theme, radius: e.target.value })}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Mode</label>
              <select
                value={theme.mode}
                onChange={(e) => setTheme({ ...theme, mode: e.target.value as "dark" | "light" })}
                className="w-full mt-1 bg-card/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs"
              >
                <option value="dark">dark</option>
                <option value="light">light</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={saveDraft} disabled={busy}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 font-bold px-4 py-2.5 rounded-xl text-sm">
              <Save className="w-4 h-4" /> Enregistrer le brouillon
            </button>
            <button onClick={publish} disabled={busy}
              className="flex items-center gap-2 bg-primary hover:bg-primary/80 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl text-sm">
              <Rocket className="w-4 h-4" /> Publier
            </button>
            <button onClick={rollback} disabled={busy}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 disabled:opacity-40 font-bold px-4 py-2.5 rounded-xl text-sm">
              <Undo2 className="w-4 h-4" /> Rollback
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-card/40 border border-white/10 rounded-2xl p-6">
          <h2 className="font-black mb-4">Aperçu live</h2>
          <div
            className="rounded-2xl p-8 border transition-all"
            style={{
              background: css(theme.colors.background),
              borderColor: css(theme.colors.border),
              borderRadius: theme.radius,
              color: css(theme.colors.text),
              boxShadow: theme.shadow,
            }}
          >
            <p className="text-xs uppercase tracking-widest opacity-60 mb-2">{theme.brandName}</p>
            <h3 className="text-2xl font-black mb-3">Daily Sudoku Challenge</h3>
            <p className="text-sm opacity-70 mb-5">
              Un nouveau puzzle chaque jour. Comparez votre temps avec le monde entier.
            </p>
            <div className="flex gap-3">
              <span
                className="px-5 py-2.5 font-bold text-sm transition-all"
                style={{
                  background: css(theme.colors.primary),
                  color: css(theme.colors.primaryForeground),
                  borderRadius: theme.radius,
                }}
              >
                Jouer maintenant
              </span>
              <span
                className="px-5 py-2.5 font-bold text-sm border transition-all"
                style={{ borderColor: css(theme.colors.accent), color: css(theme.colors.accent), borderRadius: theme.radius }}
              >
                Voir le classement
              </span>
            </div>
            <div
              className="mt-6 p-4 border transition-all"
              style={{ background: css(theme.colors.surface), borderColor: css(theme.colors.border), borderRadius: theme.radius }}
            >
              <p className="text-xs opacity-60">Carte de surface</p>
              <div className="grid grid-cols-9 gap-1 mt-2 w-fit">
                {Array.from({ length: 81 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3"
                    style={{
                      background: i % 3 === 0 ? css(theme.colors.primary) : css(theme.colors.accent),
                      opacity: (i % 9) / 12 + 0.25,
                      borderRadius: theme.radius,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
