"use client";

import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { toast } from "sonner";
import {
  Globe,
  Search,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Share2,
  Sliders,
  Eye,
  ShieldCheck,
} from "lucide-react";

export default function SeoAdmin() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/marketing-settings`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data || {});
      } else {
        toast.error("Erreur lors de la récupération des paramètres SEO.");
      }
    } catch {
      toast.error("Erreur de connexion serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/marketing-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Paramètres SEO & métadonnées enregistrés avec succès !");
      } else {
        toast.error("Échec de la sauvegarde des paramètres.");
      }
    } catch {
      toast.error("Erreur lors de la communication avec l'API.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // SERP character length calculation
  const siteTitle = settings.SEO_SITE_TITLE || "Sudoku Premium - Jouez en Ligne Gratuitement";
  const defaultDesc =
    settings.SEO_DEFAULT_DESCRIPTION ||
    "Jouez au Sudoku classique et découvrez les défis quotidiens, les duels 1v1 classés, l'Académie et la communauté Sudoku internationale.";
  const canonicalBase = settings.SEO_CANONICAL_BASE || "https://sudoku.example.com";
  const isNoIndex = settings.SEO_ROBOTS_NOINDEX === "true";

  const titleLength = siteTitle.length;
  const descLength = defaultDesc.length;

  return (
    <div className="space-y-8 max-w-6xl pb-24">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-8 h-8 text-brand-cyan" />
          <h1 className="text-3xl font-black tracking-tight">SEO & Indexation Control Center</h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Gérez l'optimisation pour les moteurs de recherche (Google, Bing), les balises OpenGraph,
          le fichier robots.txt, les sitemaps XML et prévisualisez vos résultats SERP en temps réel.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Chargement des paramètres SEO...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* 1. GOOGLE SERP PREVIEW */}
          <div className="bg-card border border-white/15 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-brand-gold" /> Aperçu Google SERP (Direct)
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                Moteur de rendu Desktop & Mobile
              </span>
            </div>

            {/* Google Search Result Mockup */}
            <div className="bg-[#202124] border border-[#3c4043] rounded-2xl p-5 max-w-3xl shadow-inner font-sans">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-brand-navy border border-brand-gold/40 flex items-center justify-center text-[10px] font-black text-brand-gold">
                  S
                </div>
                <div className="flex flex-col text-xs leading-none">
                  <span className="text-[#dadce0] font-medium">Sudoku Premium</span>
                  <span className="text-[#bdc1c6] text-[11px] font-mono mt-0.5">
                    {canonicalBase}
                  </span>
                </div>
              </div>

              <h3 className="text-[#8ab4f8] text-xl font-normal hover:underline cursor-pointer leading-snug mb-1">
                {siteTitle}
              </h3>

              <p className="text-[#bdc1c6] text-sm leading-relaxed">
                {defaultDesc.slice(0, 160)}
                {defaultDesc.length > 160 ? "..." : ""}
              </p>

              {isNoIndex && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-300 text-xs rounded-full font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Balise noindex active : cette page sera masquée des résultats Google
                </div>
              )}
            </div>
          </div>

          {/* 2. GLOBAL METADATA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Globe className="w-5 h-5 text-brand-cyan" />
                <h3 className="font-bold text-white">Métadonnées Principales</h3>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-300">Titre Principal du Site</label>
                  <span
                    className={`text-xs font-mono font-bold ${
                      titleLength >= 30 && titleLength <= 60
                        ? "text-green-400"
                        : titleLength > 60
                          ? "text-red-400"
                          : "text-brand-gold"
                    }`}
                  >
                    {titleLength} / 60 caractères
                  </span>
                </div>
                <input
                  type="text"
                  value={settings.SEO_SITE_TITLE || ""}
                  onChange={(e) => handleChange("SEO_SITE_TITLE", e.target.value)}
                  placeholder="ex: Sudoku Premium - Jouez en Ligne Gratuitement"
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-brand-cyan outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-300">Méta Description par Défaut</label>
                  <span
                    className={`text-xs font-mono font-bold ${
                      descLength >= 120 && descLength <= 160
                        ? "text-green-400"
                        : descLength > 160
                          ? "text-red-400"
                          : "text-brand-gold"
                    }`}
                  >
                    {descLength} / 160 caractères
                  </span>
                </div>
                <textarea
                  value={settings.SEO_DEFAULT_DESCRIPTION || ""}
                  onChange={(e) => handleChange("SEO_DEFAULT_DESCRIPTION", e.target.value)}
                  rows={3}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-brand-cyan outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">URL Canonique Racine (Base URL)</label>
                <input
                  type="url"
                  value={settings.SEO_CANONICAL_BASE || ""}
                  onChange={(e) => handleChange("SEO_CANONICAL_BASE", e.target.value)}
                  placeholder="https://sudoku.example.com"
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-brand-cyan outline-none"
                />
              </div>
            </div>

            {/* 3. OPEN GRAPH & SOCIAL */}
            <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Share2 className="w-5 h-5 text-brand-orange" />
                <h3 className="font-bold text-white">Réseaux Sociaux & OpenGraph</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Titre OpenGraph (OG Title)</label>
                <input
                  type="text"
                  value={settings.SEO_OG_TITLE || ""}
                  onChange={(e) => handleChange("SEO_OG_TITLE", e.target.value)}
                  placeholder="ex: Sudoku Multijoueur & Défis Quotidiens"
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-brand-orange outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Description OpenGraph</label>
                <textarea
                  value={settings.SEO_OG_DESCRIPTION || ""}
                  onChange={(e) => handleChange("SEO_OG_DESCRIPTION", e.target.value)}
                  rows={2}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-brand-orange outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Image de Partage (OG Image URL)</label>
                <input
                  type="url"
                  value={settings.SEO_OG_IMAGE || ""}
                  onChange={(e) => handleChange("SEO_OG_IMAGE", e.target.value)}
                  placeholder="https://sudoku.example.com/og-image.jpg"
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-brand-orange outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. CRAWL & SITEMAPS */}
          <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <FileCode className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-white">Robots.txt & Sitemaps XML</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Génération Automatique du Sitemap</h4>
                  <p className="text-xs text-muted-foreground">
                    Inclut dynamiquement les pages de Sudoku, Q&A, Forum et Académie.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.SEO_GENERATE_SITEMAP === "true"}
                  onChange={(e) =>
                    handleChange("SEO_GENERATE_SITEMAP", e.target.checked ? "true" : "false")
                  }
                  className="w-5 h-5 accent-brand-gold cursor-pointer"
                />
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Mode Maintenance / NoIndex Global</h4>
                  <p className="text-xs text-muted-foreground">
                    Ajoute la balise `noindex, nofollow` sur toutes les pages publiques.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.SEO_ROBOTS_NOINDEX === "true"}
                  onChange={(e) =>
                    handleChange("SEO_ROBOTS_NOINDEX", e.target.checked ? "true" : "false")
                  }
                  className="w-5 h-5 accent-red-500 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Contenu Personnalisé du Robots.txt</label>
              <textarea
                value={
                  settings.SEO_ROBOTS_TXT ||
                  "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: https://sudoku.example.com/sitemap.xml"
                }
                onChange={(e) => handleChange("SEO_ROBOTS_TXT", e.target.value)}
                rows={4}
                className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-green-400 outline-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Servi automatiquement par la route dynamique `/robots.txt`.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 bg-brand-orange hover:brightness-110 text-white font-black rounded-xl shadow-lg flex items-center gap-2 text-sm uppercase tracking-wider transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" /> {saving ? "Enregistrement..." : "Sauvegarder les Paramètres SEO"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
