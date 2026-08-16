"use client";
import { API_URL } from "@/lib/api";
import React, { useState, useEffect } from "react";
import { Mail, BarChart2, Save, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MarketingAdminPage() {
  const [activeTab, setActiveTab] = useState<"pixels" | "emails">("pixels");
  const [pixels, setPixels] = useState({
    GA_MEASUREMENT_ID: "",
    FB_PIXEL_ID: "",
    TIKTOK_PIXEL_ID: "",
    AD_NETWORK_CLIENT_ID: "",
  });
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchPixels();
    fetchTemplates();
  }, []);

  const fetchPixels = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/marketing-settings`, {
        credentials: "include",
      });
      if (res.ok) setPixels(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/email-templates`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        if (data.length > 0) setSelectedTemplate(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const savePixels = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/admin/marketing-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: pixels }),
        credentials: "include",
      });
      showSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/admin/email-templates/${selectedTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedTemplate.subject,
          htmlContent: selectedTemplate.htmlContent,
        }),
        credentials: "include",
      });
      showSuccess();
      fetchTemplates();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const testEmail = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await fetch(
        `${API_URL}/admin/email-templates/${selectedTemplate.id}/test`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      if (res.ok) alert("Email de test envoyé avec succès (Log serveur).");
    } catch (e) {
      console.error(e);
    }
  };

  const showSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black mb-2">Emails & Marketing</h1>
        <p className="text-muted-foreground font-medium">
          Gérez vos pixels de suivi et vos modèles d'emails.
        </p>
      </div>

      <div className="flex border-b border-border mb-8">
        <button
          onClick={() => setActiveTab("pixels")}
          className={cn(
            "px-6 py-3 font-bold border-b-2 transition-colors",
            activeTab === "pixels"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-white",
          )}
        >
          <BarChart2 className="w-5 h-5 inline-block mr-2" />
          Pixels & Ads
        </button>
        <button
          onClick={() => setActiveTab("emails")}
          className={cn(
            "px-6 py-3 font-bold border-b-2 transition-colors",
            activeTab === "emails"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-white",
          )}
        >
          <Mail className="w-5 h-5 inline-block mr-2" />
          Modèles d'Emails
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-green-500/20 text-green-500 rounded-xl font-bold border border-green-500/30">
          Modifications sauvegardées avec succès !
        </div>
      )}

      {activeTab === "pixels" && (
        <div className="bg-card/40 backdrop-blur-3xl border border-white/10 p-6 rounded-2xl shadow-xl max-w-3xl">
          <h2 className="text-xl font-bold mb-6">
            Paramètres de Suivi (Analytics)
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">
                Google Analytics 4 (Measurement ID)
              </label>
              <input
                type="text"
                value={pixels.GA_MEASUREMENT_ID}
                onChange={(e) =>
                  setPixels({ ...pixels, GA_MEASUREMENT_ID: e.target.value })
                }
                placeholder="ex: G-XXXXXXXXXX"
                className="w-full bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                Facebook Pixel ID
              </label>
              <input
                type="text"
                value={pixels.FB_PIXEL_ID}
                onChange={(e) =>
                  setPixels({ ...pixels, FB_PIXEL_ID: e.target.value })
                }
                placeholder="ex: 1234567890"
                className="w-full bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                TikTok Pixel ID
              </label>
              <input
                type="text"
                value={pixels.TIKTOK_PIXEL_ID}
                onChange={(e) =>
                  setPixels({ ...pixels, TIKTOK_PIXEL_ID: e.target.value })
                }
                placeholder="ex: XXXXXXXXXXXXXXXXXX"
                className="w-full bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                Code Réseau Publicitaire (Client ID)
              </label>
              <input
                type="text"
                value={pixels.AD_NETWORK_CLIENT_ID}
                onChange={(e) =>
                  setPixels({ ...pixels, AD_NETWORK_CLIENT_ID: e.target.value })
                }
                placeholder="ex: ca-pub-XXXXXXXXXXXXXXXX"
                className="w-full bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={savePixels}
              disabled={loading}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              <Save className="w-5 h-5" /> Sauvegarder les Pixels
            </button>
          </div>
        </div>
      )}

      {activeTab === "emails" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-card/40 backdrop-blur-3xl border border-white/10 p-6 rounded-2xl shadow-xl lg:col-span-1">
            <h2 className="text-xl font-bold mb-6">Modèles disponibles</h2>
            <div className="space-y-2">
              {templates.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun modèle trouvé. (Nécessite la base de données remplie)
                </p>
              )}
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl transition-all font-bold",
                    selectedTemplate?.id === t.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-white",
                  )}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <h3 className="text-sm font-bold text-blue-400 mb-2">
                Variables Dynamiques
              </h3>
              <ul className="text-xs text-blue-300 space-y-1">
                <li>
                  <code>{`{{username}}`}</code> : Pseudo du joueur
                </li>
                <li>
                  <code>{`{{rank}}`}</code> : Rang actuel
                </li>
                <li>
                  <code>{`{{elo}}`}</code> : Score Elo
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-3xl border border-white/10 p-6 rounded-2xl shadow-xl lg:col-span-2">
            {selectedTemplate ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Sujet de l'email
                  </label>
                  <input
                    type="text"
                    value={selectedTemplate.subject}
                    onChange={(e) =>
                      setSelectedTemplate({
                        ...selectedTemplate,
                        subject: e.target.value,
                      })
                    }
                    className="w-full bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Contenu HTML
                  </label>
                  <textarea
                    value={selectedTemplate.htmlContent}
                    onChange={(e) =>
                      setSelectedTemplate({
                        ...selectedTemplate,
                        htmlContent: e.target.value,
                      })
                    }
                    className="w-full bg-secondary/50 border border-border rounded-xl p-4 min-h-[400px] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={saveTemplate}
                    disabled={loading}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                  >
                    <Save className="w-5 h-5" /> Mettre à jour le modèle
                  </button>
                  <button
                    onClick={testEmail}
                    className="flex items-center gap-2 bg-secondary text-foreground px-6 py-3 rounded-xl font-bold hover:bg-secondary/80 transition-colors"
                  >
                    <Send className="w-5 h-5" /> Envoyer un test
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground font-medium">
                Sélectionnez un modèle pour le modifier.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
