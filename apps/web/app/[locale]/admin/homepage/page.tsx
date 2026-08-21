"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";
import { toast } from "sonner";
import {
  Layout,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  Send,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export interface HomepageSection {
  id: string;
  type:
    | "hero"
    | "play"
    | "daily"
    | "duel"
    | "leaderboard"
    | "academy"
    | "forum"
    | "qa"
    | "stats"
    | "cta";
  enabled: boolean;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  variant: "default" | "compact" | "banner";
}

const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: "Hero Banner & Carousel",
  play: "Quick Play Grid",
  daily: "Daily Challenge Teaser",
  duel: "Ranked 1v1 Arena",
  leaderboard: "Global & Period Leaderboard",
  academy: "Sudoku Academy & Lessons",
  forum: "Community Forum Showcase",
  qa: "Q&A Community Discussions",
  stats: "Player Statistics & Gamification",
  cta: "Conversion & Call to Action Banner",
};

export default function AdminHomepageBuilder() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchDraft();
  }, []);

  const fetchDraft = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/config/homepage/draft`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSections(data);
      } else {
        toast.error("Impossible de charger la configuration de la page d'accueil.");
      }
    } catch {
      toast.error("Erreur de connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefaults = async () => {
    try {
      const res = await fetch(`${API_URL}/config/homepage/defaults`, {
        credentials: "include",
      });
      if (res.ok) {
        const defaults = await res.json();
        setSections(defaults);
        toast.info("Sections réinitialisées aux valeurs par défaut (non sauvegardé).");
      }
    } catch {
      toast.error("Erreur lors de la récupération des valeurs par défaut.");
    }
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const newSections = [...sections];
    const temp = newSections[index]!;
    newSections[index] = newSections[targetIndex]!;
    newSections[targetIndex] = temp;
    setSections(newSections);
  };

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const updateSection = (id: string, patch: Partial<HomepageSection>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/config/homepage/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sections }),
      });
      if (res.ok) {
        toast.success("Brouillon de la page d'accueil sauvegardé !");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Erreur lors de la sauvegarde du brouillon.");
      }
    } catch {
      toast.error("Erreur de connexion.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const saveRes = await fetch(`${API_URL}/config/homepage/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sections }),
      });
      if (!saveRes.ok) {
        toast.error("Erreur lors de la mise à jour préalable du brouillon.");
        setPublishing(false);
        return;
      }
      const pubRes = await fetch(`${API_URL}/config/homepage/publish`, {
        method: "POST",
        credentials: "include",
      });
      if (pubRes.ok) {
        toast.success("Page d'accueil publiée avec succès et en ligne !");
      } else {
        toast.error("Erreur lors de la publication.");
      }
    } catch {
      toast.error("Erreur de connexion lors de la publication.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Layout className="w-8 h-8 text-brand-orange" />
            <h1 className="text-3xl font-black tracking-tight">Homepage Builder</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Personnalisez la page d'accueil sans écrire de code. Réorganisez les sections,
            modifiez les accroches, activez ou désactivez les blocs en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border transition-all ${
              previewMode
                ? "bg-brand-gold text-brand-navy border-brand-gold shadow-lg"
                : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
            }`}
          >
            {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {previewMode ? "Mode Édition" : "Aperçu Direct"}
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-xl font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center gap-2 transition-all"
            title="Réinitialiser"
          >
            <RotateCcw className="w-4 h-4" /> Défauts
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveDraft}
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Enregistrement..." : "Brouillon"}
          </button>
          <button
            type="button"
            disabled={publishing}
            onClick={handlePublish}
            className="px-6 py-2.5 rounded-xl font-black text-sm bg-brand-orange hover:brightness-110 text-white shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {publishing ? "Publication..." : "Publier en Direct"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Chargement des sections...</div>
      ) : previewMode ? (
        /* Preview Mode */
        <div className="space-y-6 bg-brand-black/50 border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <span className="text-xs font-black uppercase tracking-widest text-brand-gold flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Rendu Simulateur Page d'Accueil
            </span>
            <span className="text-xs text-muted-foreground">
              {sections.filter((s) => s.enabled).length} sections actives affichées
            </span>
          </div>

          <div className="space-y-8">
            {sections
              .filter((s) => s.enabled)
              .map((section, idx) => (
                <div
                  key={section.id}
                  className="p-6 rounded-2xl bg-brand-navy-light/60 border border-white/10 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-cyan uppercase">
                      #{idx + 1} — {SECTION_TYPE_LABELS[section.type] || section.type}
                    </span>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded font-mono text-gray-400">
                      {section.variant}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">{section.title}</h3>
                  <p className="text-gray-300 text-sm mb-4 max-w-2xl">{section.description}</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-white text-xs font-bold rounded-lg shadow">
                    {section.buttonText} → <span className="font-mono opacity-70">{section.buttonLink}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        /* Edit Mode List */
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`p-6 rounded-2xl border transition-all ${
                section.enabled
                  ? "bg-card/60 border-white/15 shadow-lg"
                  : "bg-card/20 border-white/5 opacity-60"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm text-gray-400">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {SECTION_TYPE_LABELS[section.type] || section.type}
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground">ID: {section.id}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveSection(index, "up")}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 transition-colors"
                    title="Monter"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === sections.length - 1}
                    onClick={() => moveSection(index, "down")}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 transition-colors"
                    title="Descendre"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      section.enabled
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-gray-700/40 text-gray-400 border border-gray-600/30"
                    }`}
                  >
                    {section.enabled ? "Activé" : "Désactivé"}
                  </button>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 mb-1">Titre de la section</label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white font-medium focus:border-brand-orange outline-none"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 mb-1">Variante d'affichage</label>
                  <select
                    value={section.variant}
                    onChange={(e) =>
                      updateSection(section.id, {
                        variant: e.target.value as HomepageSection["variant"],
                      })
                    }
                    className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white font-medium focus:border-brand-orange outline-none"
                  >
                    <option value="default">Standard (Default)</option>
                    <option value="compact">Compact (Cartes)</option>
                    <option value="banner">Bannière Pleine Largeur</option>
                  </select>
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-xs font-bold text-gray-400 mb-1">Description / Accroche</label>
                  <textarea
                    value={section.description}
                    onChange={(e) => updateSection(section.id, { description: e.target.value })}
                    rows={2}
                    className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-orange outline-none"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 mb-1">Texte du bouton CTA</label>
                  <input
                    type="text"
                    value={section.buttonText}
                    onChange={(e) => updateSection(section.id, { buttonText: e.target.value })}
                    className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-orange outline-none"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 mb-1">Lien cible (relatif)</label>
                  <input
                    type="text"
                    value={section.buttonLink}
                    onChange={(e) => updateSection(section.id, { buttonLink: e.target.value })}
                    placeholder="/play"
                    className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-brand-orange outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
