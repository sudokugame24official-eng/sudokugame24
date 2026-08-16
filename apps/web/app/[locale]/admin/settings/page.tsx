"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { Settings, Save } from "lucide-react";

export default function SettingsAdmin() {
  const [settings, setSettings] = useState<any>({
    SITE_NAME: "Sudoku Premium",
    CONTACT_EMAIL: "support@sudokupremium.com",
    ENABLE_REGISTRATION: true,
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
          ...settings,
          ...data,
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
      alert("Paramètres sauvegardés avec succès !");
    } catch (e) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            Global Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Paramètres généraux et sécurité de la plateforme.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
        >
          <Save className="w-5 h-5" />
          Sauvegarder
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* General Settings */}
        <div className="bg-card/40 border border-white/10 rounded-2xl p-6 backdrop-blur-2xl space-y-6">
          <h2 className="text-xl font-bold border-b border-white/10 pb-4">
            Général
          </h2>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              Nom du site
            </label>
            <input
              type="text"
              value={settings.SITE_NAME || ""}
              onChange={(e) =>
                setSettings({ ...settings, SITE_NAME: e.target.value })
              }
              className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              Email de Contact / Support
            </label>
            <input
              type="email"
              value={settings.CONTACT_EMAIL || ""}
              onChange={(e) =>
                setSettings({ ...settings, CONTACT_EMAIL: e.target.value })
              }
              className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Security & Access */}
        <div className="bg-card/40 border border-white/10 rounded-2xl p-6 backdrop-blur-2xl space-y-6">
          <h2 className="text-xl font-bold border-b border-white/10 pb-4">
            Sécurité & Accès
          </h2>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
            <div>
              <p className="font-bold">Autoriser les inscriptions</p>
              <p className="text-xs text-muted-foreground">
                Permet aux nouveaux utilisateurs de créer un compte.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.ENABLE_REGISTRATION}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  ENABLE_REGISTRATION: e.target.checked,
                })
              }
              className="w-6 h-6 rounded accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
