"use client";

import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { toast } from "sonner";
import {
  Tv,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  Settings2,
  Sparkles,
  Smartphone,
  Monitor,
  Tablet,
  Coins,
  History,
  Layers,
  HelpCircle,
  Sliders,
  PowerOff,
} from "lucide-react";
import { AdPreviewFrame } from "@/components/monetization/AdPreviewFrame";

interface AdSlot {
  slotName: string;
  provider: string;
  enabled: boolean;
  publisherId?: string;
  adSlotId?: string;
  deviceTarget: string;
  pageTarget?: string;
  placement?: string;
  format: string;
  width?: number;
  height?: number;
  lazyLoad: boolean;
  consentRequired: boolean;
  frequencyCap?: number;
  priority: number;
}

const DEFAULT_SLOT_PRESETS = [
  {
    slotName: "home_between_sections",
    placement: "in_content",
    pageTarget: "home",
    format: "horizontal",
    width: 970,
    height: 90,
    deviceTarget: "ALL",
  },
  {
    slotName: "academy_article_separator",
    placement: "in_content",
    pageTarget: "learn",
    format: "horizontal",
    width: 728,
    height: 90,
    deviceTarget: "ALL",
  },
  {
    slotName: "forum_between_topics",
    placement: "in_content",
    pageTarget: "forum",
    format: "horizontal",
    width: 728,
    height: 90,
    deviceTarget: "ALL",
  },
  {
    slotName: "leaderboard_below_podium",
    placement: "leaderboard",
    pageTarget: "leaderboard",
    format: "leaderboard",
    width: 970,
    height: 90,
    deviceTarget: "ALL",
  },
  {
    slotName: "post_game_summary",
    placement: "post_game",
    pageTarget: "play",
    format: "rectangle",
    width: 336,
    height: 280,
    deviceTarget: "ALL",
  },
];

export default function AdminAdsPage() {
  const [activeTab, setActiveTab] = useState<"standard" | "rewarded" | "slots" | "audit">("standard");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Global Flags & Configs
  const [googleAdsEnabled, setGoogleAdsEnabled] = useState(false);
  const [rewardedAdsEnabled, setRewardedAdsEnabled] = useState(false);
  const [publisherId, setPublisherId] = useState("");
  const [slots, setSlots] = useState<AdSlot[]>([]);
  const [editingSlot, setEditingSlot] = useState<AdSlot | null>(null);

  // Rewarded Config State
  const [rewardedConfig, setRewardedConfig] = useState({
    enabled: false,
    rewardAmount: 20,
    dailyCap: 5,
    cooldownSeconds: 60,
    eligiblePages: ["/play", "/daily", "/shop"],
    provider: "MockRewarded",
  });

  const [rewardedStats, setRewardedStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [flagsRes, settingsRes, slotsRes, rwdConfigRes, rwdStatsRes, auditRes] =
        await Promise.all([
          fetch(`${API_URL}/admin/features`, { credentials: "include" }),
          fetch(`${API_URL}/admin/marketing-settings`, { credentials: "include" }),
          fetch(`${API_URL}/admin/ads`, { credentials: "include" }),
          fetch(`${API_URL}/rewarded-ads/admin/config`, { credentials: "include" }),
          fetch(`${API_URL}/rewarded-ads/admin/stats`, { credentials: "include" }),
          fetch(`${API_URL}/admin/ads/audit-history`, { credentials: "include" }),
        ]);

      if (flagsRes.ok) {
        const flags = await flagsRes.json();
        const adsFlag = flags.find((f: any) => f.key === "ENABLE_ADS" || f.key === "ADS_ENABLED");
        setGoogleAdsEnabled(adsFlag?.enabled ?? false);
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setPublisherId(settings.ADSENSE_CLIENT_ID || settings.AD_NETWORK_CLIENT_ID || "");
      }

      if (slotsRes.ok) {
        const slotsData = await slotsRes.json();
        setSlots(slotsData || []);
        if (slotsData.length > 0 && !editingSlot) {
          setEditingSlot(slotsData[0]);
        }
      }

      if (rwdConfigRes.ok) {
        const rwd = await rwdConfigRes.json();
        setRewardedConfig(rwd);
        setRewardedAdsEnabled(rwd.enabled ?? false);
      }

      if (rwdStatsRes.ok) {
        setRewardedStats(await rwdStatsRes.json());
      }

      if (auditRes.ok) {
        setAuditLogs(await auditRes.json());
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du chargement des données publicitaires.");
    } finally {
      setLoading(false);
    }
  };

  // Master Google Ads Switch
  const toggleGoogleAds = async (enabled: boolean) => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/admin/features/ENABLE_ADS`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          description: "Master switch for standard Google Ads",
        }),
        credentials: "include",
      });

      await fetch(`${API_URL}/admin/features/ADS_ENABLED`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          description: "Legacy alias for standard Google Ads",
        }),
        credentials: "include",
      });

      setGoogleAdsEnabled(enabled);
      toast.success(
        enabled
          ? "Publicités Google Ads activées globalement."
          : "Publicités Google Ads désactivées (Mode Sécurisé).",
      );
    } catch {
      toast.error("Erreur lors de la mise à jour de l'interrupteur maître.");
    } finally {
      setSaving(false);
    }
  };

  // Master Rewarded Ads Switch
  const toggleRewardedAds = async (enabled: boolean) => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/rewarded-ads/admin/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rewardedConfig, enabled }),
        credentials: "include",
      });
      setRewardedAdsEnabled(enabled);
      setRewardedConfig((prev) => ({ ...prev, enabled }));
      toast.success(
        enabled
          ? "Vidéos Sponsorisées (Rewarded Ads) activées."
          : "Vidéos Sponsorisées désactivées.",
      );
    } catch {
      toast.error("Erreur lors de la mise à jour des Vidéos Sponsorisées.");
    } finally {
      setSaving(false);
    }
  };

  // Save Publisher ID
  const savePublisherId = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/admin/marketing-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ADSENSE_CLIENT_ID: publisherId,
            AD_NETWORK_CLIENT_ID: publisherId,
          },
        }),
        credentials: "include",
      });
      toast.success("Identifiant Éditeur Google AdSense enregistré !");
    } catch {
      toast.error("Erreur lors de l'enregistrement de l'identifiant éditeur.");
    } finally {
      setSaving(false);
    }
  };

  // Save Slot
  const saveSlot = async (slotData: AdSlot) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/ads/${slotData.slotName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slotData),
        credentials: "include",
      });

      if (res.ok) {
        toast.success(`Emplacement '${slotData.slotName}' enregistré avec succès !`);
        fetchInitialData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Erreur lors de la sauvegarde.");
      }
    } catch {
      toast.error("Erreur de communication API.");
    } finally {
      setSaving(false);
    }
  };

  // Save Rewarded Config
  const saveRewardedConfig = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/rewarded-ads/admin/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rewardedConfig),
        credentials: "include",
      });
      toast.success("Configuration des Vidéos Sponsorisées enregistrée !");
    } catch {
      toast.error("Erreur lors de la sauvegarde de la configuration.");
    } finally {
      setSaving(false);
    }
  };

  // 1-Click Master Disable All
  const handleDisableAll = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir désactiver TOUTES les publicités immédiatement ? (Vos configurations d'emplacements seront conservées).",
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/ads/disable-all`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setGoogleAdsEnabled(false);
        setRewardedAdsEnabled(false);
        toast.success("Toutes les publicités ont été désactivées instantanément.");
        fetchInitialData();
      }
    } catch {
      toast.error("Erreur lors de la désactivation globale.");
    } finally {
      setSaving(false);
    }
  };

  // Rollback Action
  const handleRollback = async (auditLogId: string) => {
    if (!confirm("Restaurer cet état de configuration précédent ?")) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/ads/rollback/${auditLogId}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Restauration effectuée avec succès !");
        fetchInitialData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Échec de la restauration.");
      }
    } catch {
      toast.error("Erreur réseau lors du rollback.");
    } finally {
      setSaving(false);
    }
  };

  const publisherStatus = !publisherId
    ? "NON CONFIGURÉ"
    : publisherId.startsWith("ca-pub-")
      ? "CONNECTÉ (VALIDE)"
      : "FORMAT INCORRECT";

  return (
    <div className="space-y-8 max-w-7xl pb-24 text-white">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Tv className="w-8 h-8 text-brand-gold" />
            <h1 className="text-3xl font-black tracking-tight">
              RÉGIE PUBLICITAIRE & MONÉTISATION
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-3xl">
            Centre de contrôle publicitaire No-Code. Activez ou désactivez Google AdSense et les
            vidéos sponsorisées en 1 clic sans toucher au code source.
          </p>
        </div>

        {/* Master Emergency Disable */}
        <button
          onClick={handleDisableAll}
          disabled={saving}
          className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg"
        >
          <PowerOff className="w-4 h-4" /> Désactiver Tout en 1 Clic
        </button>
      </div>

      {/* Safety Policy Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-brand-navy-light to-transparent border-2 border-brand-cyan/40 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <ShieldCheck className="w-7 h-7 text-brand-cyan shrink-0" />
          <div className="text-xs space-y-0.5">
            <p className="font-black text-brand-cyan text-sm uppercase tracking-wide">
              CONFORMITÉ STRICTE GOOGLE ADSENSE & POLITIQUES DE MONÉTISATION
            </p>
            <p className="text-gray-300">
              Les bannières standard génèrent des revenus classiques et{" "}
              <strong className="text-white">ne récompensent JAMAIS les utilisateurs en pièces</strong>
              . Les vidéos sponsorisées (Rewarded) sont un système strictement séparé avec validation
              côté serveur.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs font-bold bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
          <span className="text-gray-400">Statut Global :</span>
          <span className={googleAdsEnabled ? "text-green-400" : "text-amber-400"}>
            {googleAdsEnabled ? "PUBLICITÉS ACTIVES" : "PUBLICITÉS DÉSACTIVÉES"}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("standard")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "standard"
              ? "bg-brand-gold text-brand-navy shadow-lg"
              : "bg-white/5 hover:bg-white/10 text-gray-300"
          }`}
        >
          <Tv className="w-4 h-4" /> Google Ads (AdSense)
        </button>
        <button
          onClick={() => setActiveTab("slots")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "slots"
              ? "bg-brand-cyan text-brand-navy shadow-lg"
              : "bg-white/5 hover:bg-white/10 text-gray-300"
          }`}
        >
          <Layers className="w-4 h-4" /> Gestionnaire d'Emplacements ({slots.length})
        </button>
        <button
          onClick={() => setActiveTab("rewarded")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "rewarded"
              ? "bg-brand-orange text-white shadow-lg"
              : "bg-white/5 hover:bg-white/10 text-gray-300"
          }`}
        >
          <Coins className="w-4 h-4" /> Vidéos Sponsorisées (Rewarded)
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "audit"
              ? "bg-purple-600 text-white shadow-lg"
              : "bg-white/5 hover:bg-white/10 text-gray-300"
          }`}
        >
          <History className="w-4 h-4" /> Historique & Rollback
        </button>
      </div>

      {/* ─── TAB 1: GOOGLE ADS (ADSENSE) ─── */}
      {activeTab === "standard" && (
        <div className="space-y-6">
          {/* Master Toggle Card */}
          <div className="bg-card border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <h3 className="text-xl font-black">Interrupteur Maître Google Ads</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Contrôle l'affichage de toutes les bannières publicitaires standards sur la
                  plateforme.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400">
                  {googleAdsEnabled ? "ACTIVÉ" : "DÉSACTIVÉ"}
                </span>
                <button
                  onClick={() => toggleGoogleAds(!googleAdsEnabled)}
                  disabled={saving}
                  className={`w-16 h-9 rounded-full p-1 transition-colors cursor-pointer ${
                    googleAdsEnabled ? "bg-green-500" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full bg-white transition-transform ${
                      googleAdsEnabled ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Publisher ID & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Identifiant Éditeur Google AdSense (Publisher ID)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={publisherId}
                    onChange={(e) => setPublisherId(e.target.value)}
                    placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                    className="flex-1 bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-gold font-mono"
                  />
                  <button
                    onClick={savePublisherId}
                    disabled={saving}
                    className="px-5 bg-brand-gold text-brand-navy font-black rounded-xl text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Enregistrer
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Trouvez votre identifiant dans votre console Google AdSense &gt; Compte &gt;
                  Informations sur le compte.
                </p>
              </div>

              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Statut de connexion :</span>
                  <span className="font-bold text-brand-cyan">{publisherStatus}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Consentement RGPD / TCF :</span>
                  <span className="font-bold text-green-400">Actif (Bannière Obligatoire)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Emplacements configurés :</span>
                  <span className="font-bold text-white">{slots.length} emplacements</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: GESTIONNAIRE D'EMPLACEMENTS ─── */}
      {activeTab === "slots" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Slots List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex justify-between items-center bg-card border border-white/10 p-4 rounded-2xl">
              <div>
                <h4 className="font-black text-sm uppercase">Emplacements Sécurisés</h4>
                <p className="text-[11px] text-muted-foreground">Sélectionnez un slot à modifier</p>
              </div>
              <button
                onClick={() =>
                  setEditingSlot({
                    slotName: `slot_${Date.now()}`,
                    provider: "GoogleAdSense",
                    enabled: false,
                    deviceTarget: "ALL",
                    format: "horizontal",
                    placement: "in_content",
                    lazyLoad: true,
                    consentRequired: true,
                    priority: 0,
                    height: 90,
                  })
                }
                className="p-2 bg-brand-cyan text-brand-navy font-bold rounded-xl text-xs flex items-center gap-1 hover:brightness-110 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Nouveau
              </button>
            </div>

            <div className="space-y-2.5">
              {slots.map((slot) => {
                const isSelected = editingSlot?.slotName === slot.slotName;
                return (
                  <div
                    key={slot.slotName}
                    onClick={() => setEditingSlot(slot)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-brand-navy-light border-brand-cyan shadow-lg"
                        : "bg-card border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-brand-cyan">
                          {slot.slotName}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                            slot.enabled
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {slot.enabled ? "Actif" : "Inactif"}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase font-mono">
                        {slot.deviceTarget}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                      <span>Format : {slot.format}</span>
                      <span>Page : /{slot.pageTarget || "all"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Slot Form & Live Preview Frame */}
          <div className="lg:col-span-7 space-y-6">
            {editingSlot ? (
              <div className="bg-card border border-white/10 rounded-3xl p-6 space-y-5">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <h3 className="text-lg font-black text-white">
                    Configurer : {editingSlot.slotName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">
                      {editingSlot.enabled ? "Actif" : "Désactivé"}
                    </span>
                    <input
                      type="checkbox"
                      checked={editingSlot.enabled}
                      onChange={(e) =>
                        setEditingSlot({ ...editingSlot, enabled: e.target.checked })
                      }
                      className="w-5 h-5 rounded accent-brand-cyan cursor-pointer"
                    />
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-300">ID d'Emplacement Google (Slot ID)</label>
                    <input
                      type="text"
                      value={editingSlot.adSlotId || ""}
                      onChange={(e) =>
                        setEditingSlot({ ...editingSlot, adSlotId: e.target.value })
                      }
                      placeholder="1234567890"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 font-mono text-white focus:border-brand-cyan"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-300">Cible Appareil</label>
                    <select
                      value={editingSlot.deviceTarget}
                      onChange={(e) =>
                        setEditingSlot({ ...editingSlot, deviceTarget: e.target.value })
                      }
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white"
                    >
                      <option value="ALL">Tous les appareils (Desktop + Mobile)</option>
                      <option value="DESKTOP">Ordinateurs Uniquement</option>
                      <option value="MOBILE">Mobiles Uniquement</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-300">Format Publicitaire</label>
                    <select
                      value={editingSlot.format}
                      onChange={(e) =>
                        setEditingSlot({ ...editingSlot, format: e.target.value })
                      }
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white"
                    >
                      <option value="horizontal">Horizontal (728x90 / 970x90)</option>
                      <option value="rectangle">Pavé Rectangle (300x250 / 336x280)</option>
                      <option value="leaderboard">Grand Leaderboard (970x90)</option>
                      <option value="auto">Adaptatif Automatique</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-300">Hauteur Réservée (CLS Safe)</label>
                    <input
                      type="number"
                      value={editingSlot.height || 90}
                      onChange={(e) =>
                        setEditingSlot({
                          ...editingSlot,
                          height: parseInt(e.target.value, 10) || 90,
                        })
                      }
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => saveSlot(editingSlot)}
                    disabled={saving}
                    className="px-6 py-3 bg-brand-cyan text-brand-navy font-black rounded-xl text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                  >
                    <Save className="w-4 h-4" /> Enregistrer l'Emplacement
                  </button>
                </div>

                {/* Live Page Preview Frame */}
                <div className="pt-4 border-t border-white/10">
                  <AdPreviewFrame
                    slotName={editingSlot.slotName}
                    format={editingSlot.format}
                    placement={editingSlot.placement || "in_content"}
                    width={editingSlot.width}
                    height={editingSlot.height}
                    pageTarget={editingSlot.pageTarget}
                    deviceTarget={editingSlot.deviceTarget}
                  />
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground bg-card border border-white/10 rounded-3xl">
                Sélectionnez un emplacement publicitaire pour modifier ses paramètres.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: VIDÉOS SPONSORISÉES (REWARDED ADS) ─── */}
      {activeTab === "rewarded" && (
        <div className="space-y-6">
          <div className="bg-card border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <h3 className="text-xl font-black text-brand-orange flex items-center gap-2">
                  <Coins className="w-6 h-6" /> Vidéos Sponsorisées Récompensées
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Permet aux joueurs de regarder volontairement une vidéo pour obtenir des pièces de
                  jeu (Non monétaires, strictement internes à la plateforme).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400">
                  {rewardedAdsEnabled ? "ACTIVÉ" : "DÉSACTIVÉ"}
                </span>
                <button
                  onClick={() => toggleRewardedAds(!rewardedAdsEnabled)}
                  disabled={saving}
                  className={`w-16 h-9 rounded-full p-1 transition-colors cursor-pointer ${
                    rewardedAdsEnabled ? "bg-brand-orange" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full bg-white transition-transform ${
                      rewardedAdsEnabled ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Rewarded Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-black/30 border border-white/10 p-4 rounded-2xl space-y-2">
                <label className="text-xs font-bold uppercase text-gray-300">
                  Pièces par vidéo vue
                </label>
                <input
                  type="number"
                  value={rewardedConfig.rewardAmount}
                  onChange={(e) =>
                    setRewardedConfig({
                      ...rewardedConfig,
                      rewardAmount: parseInt(e.target.value, 10) || 20,
                    })
                  }
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
                <p className="text-[10px] text-gray-400">Recommandé : 20 pièces.</p>
              </div>

              <div className="bg-black/30 border border-white/10 p-4 rounded-2xl space-y-2">
                <label className="text-xs font-bold uppercase text-gray-300">
                  Plafond Quotidien (Par Joueur)
                </label>
                <input
                  type="number"
                  value={rewardedConfig.dailyCap}
                  onChange={(e) =>
                    setRewardedConfig({
                      ...rewardedConfig,
                      dailyCap: parseInt(e.target.value, 10) || 5,
                    })
                  }
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
                <p className="text-[10px] text-gray-400">Maximum de vidéos autorisées par 24h.</p>
              </div>

              <div className="bg-black/30 border border-white/10 p-4 rounded-2xl space-y-2">
                <label className="text-xs font-bold uppercase text-gray-300">
                  Délai d'attente (Cooldown en secondes)
                </label>
                <input
                  type="number"
                  value={rewardedConfig.cooldownSeconds}
                  onChange={(e) =>
                    setRewardedConfig({
                      ...rewardedConfig,
                      cooldownSeconds: parseInt(e.target.value, 10) || 60,
                    })
                  }
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
                <p className="text-[10px] text-gray-400">Temps d'attente minimal entre 2 vidéos.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={saveRewardedConfig}
                disabled={saving}
                className="px-6 py-3 bg-brand-orange text-white font-black rounded-xl text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer flex items-center gap-2 shadow-lg"
              >
                <Save className="w-4 h-4" /> Enregistrer la Configuration Rewarded
              </button>
            </div>

            {/* Real-Time Fraud & Performance Metrics */}
            {rewardedStats && (
              <div className="pt-6 border-t border-white/10 space-y-4">
                <h4 className="font-black text-sm uppercase tracking-wider text-gray-300">
                  Statistiques en Temps Réel & Sécurité Anti-Fraude
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-black/40 border border-white/10 p-3.5 rounded-xl text-center">
                    <p className="text-xl font-black text-white">{rewardedStats.optIns}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Demandes Joueurs</p>
                  </div>
                  <div className="bg-black/40 border border-white/10 p-3.5 rounded-xl text-center">
                    <p className="text-xl font-black text-green-400">{rewardedStats.completed}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Vidéos Complétées</p>
                  </div>
                  <div className="bg-black/40 border border-white/10 p-3.5 rounded-xl text-center">
                    <p className="text-xl font-black text-brand-gold">{rewardedStats.coinsGranted}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Pièces Distribuées</p>
                  </div>
                  <div className="bg-black/40 border border-white/10 p-3.5 rounded-xl text-center">
                    <p className="text-xl font-black text-red-400">{rewardedStats.fraudRejections}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Tentatives Bloquées</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: HISTORIQUE & ROLLBACK ─── */}
      {activeTab === "audit" && (
        <div className="bg-card border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
          <div>
            <h3 className="text-xl font-black flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" /> Historique des Modifications Publicitaires
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Chaque changement est consigné dans le journal d'audit et peut être restauré en 1 clic.
            </p>
          </div>

          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6 text-center">
                Aucune modification récente enregistrée.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-purple-300 font-mono">
                        {log.action}
                      </span>
                      {log.target && (
                        <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-gray-300">
                          {log.target}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Modifié le {new Date(log.createdAt).toLocaleString()} par l'administrateur
                    </p>
                  </div>

                  {log.oldValue && (
                    <button
                      onClick={() => handleRollback(log.id)}
                      disabled={saving}
                      className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/40 text-purple-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restaurer cet état
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
