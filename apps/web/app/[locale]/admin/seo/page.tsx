"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { Save, Search, Settings, Globe } from "lucide-react";

export default function SeoAdmin() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/marketing-settings`, {
        credentials: "include",
      });
      if (res.ok) setSettings(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/admin/marketing-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
        credentials: "include",
      });
      alert("Paramètres SEO sauvegardés !");
    } catch (e) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">SEO Control Center</h1>
        <p className="text-muted-foreground">
          Gérez les métadonnées globales, le robots.txt et les paramètres d'indexation pour maximiser la visibilité.
        </p>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
          {/* Global Meta */}
          <div className="bg-card border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold">Méta Globale</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Titre de site global (Suffixe)</label>
                <input
                  type="text"
                  value={settings.SEO_SITE_TITLE || ""}
                  onChange={(e) => handleChange("SEO_SITE_TITLE", e.target.value)}
                  placeholder="ex: - Jouez au Sudoku Gratuitement"
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1">Description Globale par défaut</label>
                <textarea
                  value={settings.SEO_DEFAULT_DESCRIPTION || ""}
                  onChange={(e) => handleChange("SEO_DEFAULT_DESCRIPTION", e.target.value)}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2 text-white h-24"
                />
              </div>
            </div>
          </div>

          {/* Robots & Sitemaps */}
          <div className="bg-card border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Search className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-bold">Indexation & Crawl</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Robots.txt personnalisé</label>
                <textarea
                  value={settings.SEO_ROBOTS_TXT || "User-agent: *\nAllow: /"}
                  onChange={(e) => handleChange("SEO_ROBOTS_TXT", e.target.value)}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-4 py-2 text-white h-40 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ce texte remplacera la réponse du route `/robots.txt`.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <h3 className="font-bold">Sitemaps XML dynamiques</h3>
                  <p className="text-sm text-muted-foreground">Activer la génération automatique du sitemap pour le contenu dynamique.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.SEO_GENERATE_SITEMAP === "true"}
                  onChange={(e) => handleChange("SEO_GENERATE_SITEMAP", e.target.checked ? "true" : "false")}
                  className="w-5 h-5 accent-primary"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Save className="w-5 h-5" /> Sauvegarder les Paramètres SEO
          </button>
        </form>
      )}
    </div>
  );
}
