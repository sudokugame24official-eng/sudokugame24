"use client";
import { API_URL } from "@/lib/api";
import React, { useState, useEffect } from "react";
import {
  Mail,
  BarChart2,
  Save,
  Send,
  Code,
  HelpCircle,
  FileCode,
  Globe,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function MarketingAdminPage() {
  const [activeTab, setActiveTab] = useState<"pixels" | "scripts" | "emails">("pixels");
  const [pixels, setPixels] = useState({
    GA_MEASUREMENT_ID: "",
    GTM_CONTAINER_ID: "",
    FB_PIXEL_ID: "",
    TIKTOK_PIXEL_ID: "",
    CUSTOM_HEADER_SCRIPTS: "",
    CUSTOM_BODY_SCRIPTS: "",
  });
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchTemplates();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/marketing-settings`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPixels((prev) => ({
          ...prev,
          GA_MEASUREMENT_ID: data.GA_MEASUREMENT_ID || "",
          GTM_CONTAINER_ID: data.GTM_CONTAINER_ID || "",
          FB_PIXEL_ID: data.FB_PIXEL_ID || "",
          TIKTOK_PIXEL_ID: data.TIKTOK_PIXEL_ID || "",
          CUSTOM_HEADER_SCRIPTS: data.CUSTOM_HEADER_SCRIPTS || "",
          CUSTOM_BODY_SCRIPTS: data.CUSTOM_BODY_SCRIPTS || "",
        }));
      }
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

  const saveMarketingSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/marketing-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: pixels }),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Pixels & Scripts de suivi enregistrés avec succès !");
      } else {
        toast.error("Erreur lors de la sauvegarde.");
      }
    } catch (e) {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const saveTemplate = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/email-templates/${selectedTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedTemplate.subject,
          htmlContent: selectedTemplate.htmlContent,
        }),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Modèle d'email mis à jour !");
        fetchTemplates();
      } else {
        toast.error("Erreur lors de la mise à jour du modèle.");
      }
    } catch (e) {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const testEmail = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await fetch(
        `${API_URL}/admin/email-templates/${selectedTemplate.id}/test`,
        { method: "POST", credentials: "include" },
      );
      if (res.ok) {
        toast.success("Email de test expédié avec succès vers votre adresse admin !");
      } else {
        toast.error("Impossible d'envoyer l'email de test.");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-brand-cyan" />
            Marketing, Pixels & Communication
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos balises de suivi (Google Analytics, Pixels) et personnalisez vos emails transactionnels.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {[
          { id: "pixels", label: "Pixels & IDs de Suivi", icon: BarChart2 },
          { id: "scripts", label: "Scripts Personnalisés (Head / Body)", icon: Code },
          { id: "emails", label: "Modèles d'Emails (Templates)", icon: Mail },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all",
                activeTab === tab.id
                  ? "bg-brand-cyan text-brand-navy shadow-lg"
                  : "bg-white/5 text-gray-400 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "pixels" && (
        <div className="space-y-6">
          <div className="bg-[#0A2A5C]/80 border border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-black text-white">Identifiants des Outils d'Analyse</h3>
                <p className="text-xs text-gray-400">Renseignez uniquement l'identifiant pour une intégration automatique.</p>
              </div>
              <button
                onClick={saveMarketingSettings}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-cyan text-brand-navy font-black rounded-xl uppercase tracking-wider text-xs shadow-lg hover:brightness-110 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? "Enregistrement..." : "Sauvegarder"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brand-cyan" />
                  Google Analytics 4 (Measurement ID)
                </label>
                <input
                  type="text"
                  value={pixels.GA_MEASUREMENT_ID}
                  onChange={(e) => setPixels({ ...pixels, GA_MEASUREMENT_ID: e.target.value })}
                  placeholder="ex: G-XXXXXXXXXX"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white font-mono focus:outline-none focus:border-brand-cyan"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">Visible dans GA4 &gt; Flux de données &gt; ID de mesure.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-brand-gold" />
                  Google Tag Manager (Container ID)
                </label>
                <input
                  type="text"
                  value={pixels.GTM_CONTAINER_ID}
                  onChange={(e) => setPixels({ ...pixels, GTM_CONTAINER_ID: e.target.value })}
                  placeholder="ex: GTM-XXXXXXX"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white font-mono focus:outline-none focus:border-brand-cyan"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">Permet de gérer toutes vos balises depuis Tag Manager.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Meta / Facebook Pixel ID
                </label>
                <input
                  type="text"
                  value={pixels.FB_PIXEL_ID}
                  onChange={(e) => setPixels({ ...pixels, FB_PIXEL_ID: e.target.value })}
                  placeholder="ex: 1234567890123456"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white font-mono focus:outline-none focus:border-brand-cyan"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">Pour le suivi des conversions de publicités Facebook/Instagram.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  TikTok Pixel ID
                </label>
                <input
                  type="text"
                  value={pixels.TIKTOK_PIXEL_ID}
                  onChange={(e) => setPixels({ ...pixels, TIKTOK_PIXEL_ID: e.target.value })}
                  placeholder="ex: CXXXXXXXXXXXXXXXXX"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white font-mono focus:outline-none focus:border-brand-cyan"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">Pour le suivi de vos campagnes TikTok Ads.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "scripts" && (
        <div className="bg-[#0A2A5C]/80 border border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div>
              <h3 className="text-xl font-black text-white">Injection de Scripts Personnalisés</h3>
              <p className="text-xs text-gray-400">Pour ajouter des balises d'affiliation, chatbots ou scripts d'en-tête</p>
            </div>
            <button
              onClick={saveMarketingSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-cyan text-brand-navy font-black rounded-xl uppercase tracking-wider text-xs shadow-lg hover:brightness-110 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? "Enregistrement..." : "Sauvegarder"}
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">
                Scripts dans l'En-tête (&lt;head&gt;)
              </label>
              <textarea
                rows={5}
                value={pixels.CUSTOM_HEADER_SCRIPTS}
                onChange={(e) => setPixels({ ...pixels, CUSTOM_HEADER_SCRIPTS: e.target.value })}
                placeholder={`<!-- Exemple: code de vérification Google Search Console, Pinterest, etc. -->\n<meta name="google-site-verification" content="..." />`}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-mono text-cyan-400 focus:outline-none focus:border-brand-cyan resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">
                Scripts dans le Corps de Page (&lt;body&gt;)
              </label>
              <textarea
                rows={5}
                value={pixels.CUSTOM_BODY_SCRIPTS}
                onChange={(e) => setPixels({ ...pixels, CUSTOM_BODY_SCRIPTS: e.target.value })}
                placeholder={`<!-- Exemple: Widget de support externe, widget Crisp, etc. -->`}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-mono text-cyan-400 focus:outline-none focus:border-brand-cyan resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMAILS */}
      {activeTab === "emails" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-[#0A2A5C]/80 border border-white/10 p-6 rounded-3xl shadow-xl lg:col-span-1 space-y-4">
            <h2 className="text-lg font-black text-white">Modèles Disponibles</h2>
            <div className="space-y-2">
              {templates.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 bg-black/30 rounded-xl">
                  Aucun modèle enregistré.
                </p>
              ) : (
                templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl transition-all font-bold text-xs",
                      selectedTemplate?.id === t.id
                        ? "bg-brand-cyan text-brand-navy shadow-lg"
                        : "bg-black/30 hover:bg-white/5 text-gray-300",
                    )}
                  >
                    {t.name}
                  </button>
                ))
              )}
            </div>
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <h3 className="text-xs font-bold text-blue-400 mb-2 uppercase">
                Variables Dynamiques
              </h3>
              <ul className="text-xs text-blue-300 space-y-1">
                <li>
                  <code>{`{{username}}`}</code> : Pseudo du joueur
                </li>
                <li>
                  <code>{`{{email}}`}</code> : Adresse email
                </li>
                <li>
                  <code>{`{{verificationUrl}}`}</code> : Lien de validation
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-[#0A2A5C]/80 border border-white/10 p-6 md:p-8 rounded-3xl shadow-xl lg:col-span-2">
            {selectedTemplate ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
                    Sujet de l'email (Subject)
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
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-cyan font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
                    Contenu HTML
                  </label>
                  <textarea
                    rows={12}
                    value={selectedTemplate.htmlContent}
                    onChange={(e) =>
                      setSelectedTemplate({
                        ...selectedTemplate,
                        htmlContent: e.target.value,
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-mono text-xs text-gray-200 focus:outline-none focus:border-brand-cyan resize-none"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={saveTemplate}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-cyan text-brand-navy font-black rounded-xl text-xs uppercase tracking-wider shadow-lg hover:brightness-110 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> Mettre à jour le modèle
                  </button>
                  <button
                    onClick={testEmail}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all"
                  >
                    <Send className="w-4 h-4" /> Envoyer un test
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground font-medium text-xs">
                Sélectionnez un modèle pour le modifier.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
