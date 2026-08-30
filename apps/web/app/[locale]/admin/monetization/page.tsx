"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import {
  DollarSign,
  CreditCard,
  Tv,
  Save,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Code,
  ShieldCheck,
  Zap,
  HelpCircle,
  ToggleRight,
  ToggleLeft,
  Layout,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function MonetizationAdmin() {
  const [activeTab, setActiveTab] = useState<"stripe" | "google_ads" | "slots" | "overview">("stripe");
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  // Stripe & Payment Config State
  const [paymentConfig, setPaymentConfig] = useState({
    STRIPE_ENABLED: false,
    STRIPE_MODE: "test", // "test" | "live"
    STRIPE_PUBLISHABLE_KEY: "",
    STRIPE_SECRET_KEY: "",
    STRIPE_WEBHOOK_SECRET: "",
    PAYMENT_CURRENCY: "EUR",
    ALLOW_COIN_PURCHASES: true,
    ALLOW_PRO_SUBSCRIPTION: true,
  });

  // Google Ads / AdSense Config State
  const [adConfig, setAdConfig] = useState({
    ADS_ENABLED: false,
    ADSENSE_CLIENT_ID: "",
    ADSENSE_AUTO_ADS_SCRIPT: "",
    ADS_TEST_MODE: true,
    ADS_GDPR_CONSENT_REQUIRED: true,
    ADS_HEADER_SCRIPT: "",
    SLOT_HEADER_LEADERBOARD: true,
    SLOT_FORUM_SIDEBAR: true,
    SLOT_POST_GAME: true,
    SLOT_ACADEMY_BANNER: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [flagsRes, settingsRes] = await Promise.all([
        fetch(`${API_URL}/admin/features`, { credentials: "include" }),
        fetch(`${API_URL}/admin/marketing-settings`, { credentials: "include" }),
      ]);

      if (flagsRes.ok) setFlags(await flagsRes.json());
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setPaymentConfig((prev) => ({
          ...prev,
          STRIPE_ENABLED: data.STRIPE_ENABLED ?? false,
          STRIPE_MODE: data.STRIPE_MODE || "test",
          STRIPE_PUBLISHABLE_KEY: data.STRIPE_PUBLISHABLE_KEY || "",
          STRIPE_SECRET_KEY: data.STRIPE_SECRET_KEY || "",
          STRIPE_WEBHOOK_SECRET: data.STRIPE_WEBHOOK_SECRET || "",
          PAYMENT_CURRENCY: data.PAYMENT_CURRENCY || "EUR",
          ALLOW_COIN_PURCHASES: data.ALLOW_COIN_PURCHASES ?? true,
          ALLOW_PRO_SUBSCRIPTION: data.ALLOW_PRO_SUBSCRIPTION ?? true,
        }));

        setAdConfig((prev) => ({
          ...prev,
          ADS_ENABLED: data.ADS_ENABLED ?? false,
          ADSENSE_CLIENT_ID: data.ADSENSE_CLIENT_ID || data.AD_NETWORK_CLIENT_ID || "",
          ADSENSE_AUTO_ADS_SCRIPT: data.ADSENSE_AUTO_ADS_SCRIPT || "",
          ADS_TEST_MODE: data.ADS_TEST_MODE ?? true,
          ADS_GDPR_CONSENT_REQUIRED: data.ADS_GDPR_CONSENT_REQUIRED ?? true,
          ADS_HEADER_SCRIPT: data.ADS_HEADER_SCRIPT || "",
          SLOT_HEADER_LEADERBOARD: data.SLOT_HEADER_LEADERBOARD ?? true,
          SLOT_FORUM_SIDEBAR: data.SLOT_FORUM_SIDEBAR ?? true,
          SLOT_POST_GAME: data.SLOT_POST_GAME ?? true,
          SLOT_ACADEMY_BANNER: data.SLOT_ACADEMY_BANNER ?? true,
        }));
      }
    } catch (e) {
      console.error("Failed to load monetization data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const mergedSettings = {
        ...paymentConfig,
        ...adConfig,
      };

      const res = await fetch(`${API_URL}/admin/marketing-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: mergedSettings }),
        credentials: "include",
      });

      // Also sync master feature flags
      await Promise.all([
        fetch(`${API_URL}/admin/features/PAYMENTS_ENABLED`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: paymentConfig.STRIPE_ENABLED }),
          credentials: "include",
        }),
        fetch(`${API_URL}/admin/features/ADS_ENABLED`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: adConfig.ADS_ENABLED }),
          credentials: "include",
        }),
        fetch(`${API_URL}/admin/features/ENABLE_ADS`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: adConfig.ADS_ENABLED }),
          credentials: "include",
        }),
      ]);

      if (res.ok) {
        toast.success("Paramètres de monétisation & publicités enregistrés avec succès !");
      } else {
        toast.error("Erreur lors de la sauvegarde.");
      }
    } catch {
      toast.error("Erreur de connexion au serveur");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié dans le presse-papier !`);
  };

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin.replace(":3000", ":3001")}/api/monetization/webhook`
    : "https://votre-domaine.com/api/monetization/webhook";

  return (
    <div className="space-y-8 pb-16">
      {/* Header with Save Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-brand-gold" />
            Centre de Monétisation & Revenus
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez Stripe, connectez Google Ads / AdSense et suivez les flux de revenus de la plateforme.
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-gold text-brand-navy font-black rounded-xl uppercase tracking-wider shadow-lg hover:brightness-110 transition-all text-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Sauvegarde..." : "Enregistrer les Réglages"}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {[
          { id: "stripe", label: "Paiements Stripe & Passerelle", icon: CreditCard },
          { id: "google_ads", label: "Google Ads & AdSense Script", icon: Tv },
          { id: "slots", label: "Emplacements Publicitaires", icon: Layout },
          { id: "overview", label: "Indicateurs Financiers", icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? "bg-brand-orange text-white shadow-lg"
                  : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: STRIPE & PAYMENTS */}
      {activeTab === "stripe" && (
        <div className="space-y-6">
          {/* Guide Card for Owner */}
          <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border border-blue-500/30 rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white">Comment connecter votre compte Stripe ?</h3>
                <p className="text-sm text-gray-300">
                  Suivez ces 4 étapes simples sans aucune ligne de code pour commencer à recevoir des paiements par carte bancaire :
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 text-xs">
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <strong className="text-brand-gold block mb-1">1. Compte Stripe</strong>
                    Créez un compte gratuit sur <span className="underline">dashboard.stripe.com</span>.
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <strong className="text-brand-gold block mb-1">2. Clés API</strong>
                    Copiez votre <em>Clé Publiable</em> et votre <em>Clé Secrète</em> ci-dessous.
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <strong className="text-brand-gold block mb-1">3. Webhook</strong>
                    Collez l'URL de Webhook ci-dessous dans votre tableau de bord Stripe.
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <strong className="text-brand-gold block mb-1">4. Activation</strong>
                    Activez l'interrupteur pour ouvrir la boutique aux paiements réels.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Settings */}
            <div className="lg:col-span-2 bg-[#0A2A5C]/80 border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white">Configuration de la Passerelle</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Identifiants et clés de sécurité</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300">Statut des Paiements :</span>
                  <button
                    type="button"
                    onClick={() => setPaymentConfig({ ...paymentConfig, STRIPE_ENABLED: !paymentConfig.STRIPE_ENABLED })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      paymentConfig.STRIPE_ENABLED
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {paymentConfig.STRIPE_ENABLED ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-red-400" />}
                    {paymentConfig.STRIPE_ENABLED ? "Activé" : "Désactivé (Sécurité)"}
                  </button>
                </div>
              </div>

              {/* Mode & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    Mode d'Environnement
                  </label>
                  <select
                    value={paymentConfig.STRIPE_MODE}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, STRIPE_MODE: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-bold focus:outline-none focus:border-brand-gold"
                  >
                    <option value="test">Mode Test (Clés pk_test_ / sk_test_)</option>
                    <option value="live">Mode Production Réel (Clés pk_live_ / sk_live_)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    Devise de Facturation
                  </label>
                  <select
                    value={paymentConfig.PAYMENT_CURRENCY}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, PAYMENT_CURRENCY: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-bold focus:outline-none focus:border-brand-gold"
                  >
                    <option value="EUR">Euro (€ EUR)</option>
                    <option value="USD">Dollar US ($ USD)</option>
                    <option value="GBP">Livre Sterling (£ GBP)</option>
                    <option value="CAD">Dollar Canadien (CAD)</option>
                  </select>
                </div>
              </div>

              {/* Stripe Publishable Key */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Clé Publique Stripe (Publishable Key)
                </label>
                <input
                  type="text"
                  placeholder="pk_test_51NxXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={paymentConfig.STRIPE_PUBLISHABLE_KEY}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, STRIPE_PUBLISHABLE_KEY: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-brand-gold"
                />
              </div>

              {/* Stripe Secret Key (Masked) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Clé Secrète Stripe (Secret Key)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="text-xs text-brand-gold flex items-center gap-1 font-bold"
                  >
                    {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showSecretKey ? "Masquer" : "Afficher"}
                  </button>
                </div>
                <input
                  type={showSecretKey ? "text" : "password"}
                  placeholder="sk_test_51NxXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={paymentConfig.STRIPE_SECRET_KEY}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, STRIPE_SECRET_KEY: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-brand-gold"
                />
              </div>

              {/* Webhook Secret */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Secret de Signature Webhook (Signing Secret)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="text-xs text-brand-gold flex items-center gap-1 font-bold"
                  >
                    {showWebhookSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showWebhookSecret ? "Masquer" : "Afficher"}
                  </button>
                </div>
                <input
                  type={showWebhookSecret ? "text" : "password"}
                  placeholder="whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={paymentConfig.STRIPE_WEBHOOK_SECRET}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, STRIPE_WEBHOOK_SECRET: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>

            {/* Webhook URL Endpoint Card */}
            <div className="space-y-6">
              <div className="bg-[#0A2A5C]/80 border border-brand-gold/30 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-base">URL du Webhook Stripe</h4>
                    <p className="text-xs text-gray-400">À coller dans Stripe &gt; Développeurs &gt; Webhooks</p>
                  </div>
                </div>

                <div className="p-3 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-gray-300 break-all">
                  {webhookUrl}
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(webhookUrl, "URL Webhook")}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Copy className="w-4 h-4" /> Copier l'URL du Webhook
                </button>

                <div className="pt-2 border-t border-white/10">
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Événements recommandés à écouter dans Stripe : <br />
                    • <code className="text-brand-gold">checkout.session.completed</code><br />
                    • <code className="text-brand-gold">customer.subscription.updated</code><br />
                    • <code className="text-brand-gold">customer.subscription.deleted</code>
                  </p>
                </div>
              </div>

              {/* Diagnostic / Test connection */}
              <div className="bg-black/30 border border-white/10 rounded-3xl p-6 space-y-3">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  Diagnostic Passerelle
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Clé Publique :</span>
                    <span className={paymentConfig.STRIPE_PUBLISHABLE_KEY ? "text-green-400 font-bold" : "text-yellow-400"}>
                      {paymentConfig.STRIPE_PUBLISHABLE_KEY ? "Configurée ✓" : "En attente"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Clé Secrète :</span>
                    <span className={paymentConfig.STRIPE_SECRET_KEY ? "text-green-400 font-bold" : "text-yellow-400"}>
                      {paymentConfig.STRIPE_SECRET_KEY ? "Configurée ✓" : "En attente"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Secret Webhook :</span>
                    <span className={paymentConfig.STRIPE_WEBHOOK_SECRET ? "text-green-400 font-bold" : "text-yellow-400"}>
                      {paymentConfig.STRIPE_WEBHOOK_SECRET ? "Configuré ✓" : "En attente"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE ADS & ADSENSE SCRIPT */}
      {activeTab === "google_ads" && (
        <div className="space-y-6">
          {/* Guide Card */}
          <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/20 border border-amber-500/30 rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                <Tv className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Comment intégrer Google Ads / Google AdSense ?</h3>
                <p className="text-sm text-gray-300">
                  Collez simplement le script fourni par Google dans l'encadré ci-dessous. Le système l'injectera proprement et en conformité RGPR dès que vous activerez les publicités.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Script Input & Master Toggles */}
            <div className="lg:col-span-2 bg-[#0A2A5C]/80 border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white">Script Principal AdSense</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Code automatique ou script d'en-tête</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300">Affichage des Pubs :</span>
                  <button
                    type="button"
                    onClick={() => setAdConfig({ ...adConfig, ADS_ENABLED: !adConfig.ADS_ENABLED })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      adConfig.ADS_ENABLED
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {adConfig.ADS_ENABLED ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-red-400" />}
                    {adConfig.ADS_ENABLED ? "En Ligne" : "Désactivé (Par Défaut)"}
                  </button>
                </div>
              </div>

              {/* Publisher ID */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Identifiant Éditeur Google (Publisher ID)
                </label>
                <input
                  type="text"
                  placeholder="ca-pub-1234567890123456"
                  value={adConfig.ADSENSE_CLIENT_ID}
                  onChange={(e) => setAdConfig({ ...adConfig, ADSENSE_CLIENT_ID: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-brand-orange"
                />
              </div>

              {/* Script Paste Area */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Script Complet AdSense (Copier-Coller Direct)
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">Balise &lt;script&gt; acceptée</span>
                </div>
                <textarea
                  rows={6}
                  placeholder={`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456" crossorigin="anonymous"></script>`}
                  value={adConfig.ADSENSE_AUTO_ADS_SCRIPT}
                  onChange={(e) => setAdConfig({ ...adConfig, ADSENSE_AUTO_ADS_SCRIPT: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-mono text-green-400 focus:outline-none focus:border-brand-orange resize-none"
                />
              </div>

              {/* Compliance & Safety Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-white block">Mode Test Publicités</span>
                    <span className="text-[10px] text-gray-400">Évite les clics accidentels sur votre compte</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdConfig({ ...adConfig, ADS_TEST_MODE: !adConfig.ADS_TEST_MODE })}
                    className={adConfig.ADS_TEST_MODE ? "text-green-400" : "text-gray-500"}
                  >
                    {adConfig.ADS_TEST_MODE ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-white block">Bannière Consentement RGPD</span>
                    <span className="text-[10px] text-gray-400">N'affiche les pubs qu'après consentement</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdConfig({ ...adConfig, ADS_GDPR_CONSENT_REQUIRED: !adConfig.ADS_GDPR_CONSENT_REQUIRED })}
                    className={adConfig.ADS_GDPR_CONSENT_REQUIRED ? "text-green-400" : "text-gray-500"}
                  >
                    {adConfig.ADS_GDPR_CONSENT_REQUIRED ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Visual Placement Preview */}
            <div className="bg-[#0A2A5C]/80 border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
              <h4 className="font-black text-white text-base flex items-center gap-2">
                <Layout className="w-4 h-4 text-brand-orange" />
                Aperçu Visuel des Emplacements
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Les bannières s'insèrent uniquement dans les zones non intrusives pour garantir une expérience de jeu de niveau e-sport.
              </p>

              <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-3 text-center text-xs">
                <div className="p-2 border border-dashed border-amber-500/40 bg-amber-500/10 rounded-lg text-amber-300 font-bold">
                  Bannière Haut de Page (Header)
                </div>
                <div className="h-20 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 font-bold">
                  Grille Sudoku & Commandes (Zone Sanctuaire Sans Pub)
                </div>
                <div className="p-2 border border-dashed border-amber-500/40 bg-amber-500/10 rounded-lg text-amber-300 font-bold">
                  Bannière Écran de Victoire (Post-Game)
                </div>
              </div>

              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-300">
                ⚠️ <strong>Règle d'or :</strong> Aucune publicité n'est affichée au-dessus des cases de la grille ni pendant les matchs de duel compétitif.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SLOTS MANAGEMENT */}
      {activeTab === "slots" && (
        <div className="bg-[#0A2A5C]/80 border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
          <div>
            <h3 className="text-xl font-black text-white">Gestion des Emplacements Individuels</h3>
            <p className="text-xs text-gray-400 mt-0.5">Activez ou désactivez chaque position publicitaire selon vos préférences.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: "SLOT_HEADER_LEADERBOARD",
                title: "Bannière Header (Leaderboard)",
                desc: "Format 728x90 sous le menu principal sur desktop & mobile.",
                value: adConfig.SLOT_HEADER_LEADERBOARD,
              },
              {
                key: "SLOT_FORUM_SIDEBAR",
                title: "Colonne Latérale du Forum (Sidebar)",
                desc: "Format carré 300x250 visible sur les pages de discussions du forum.",
                value: adConfig.SLOT_FORUM_SIDEBAR,
              },
              {
                key: "SLOT_POST_GAME",
                title: "Écran de Victoire (Post-Game)",
                desc: "S'affiche uniquement après la résolution complète d'une grille.",
                value: adConfig.SLOT_POST_GAME,
              },
              {
                key: "SLOT_ACADEMY_BANNER",
                title: "Articles & Académie Sudoku",
                desc: "Bannière insérée au bas des tutoriels et leçons stratégiques.",
                value: adConfig.SLOT_ACADEMY_BANNER,
              },
            ].map((slot) => (
              <div
                key={slot.key}
                className="p-5 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-white text-sm">{slot.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{slot.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdConfig({ ...adConfig, [slot.key]: !slot.value })}
                  className={slot.value ? "text-green-400" : "text-gray-600"}
                >
                  {slot.value ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FINANCIAL OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-3xl border border-white/10 p-6 rounded-3xl shadow-xl">
            <span className="text-xs font-bold text-gray-400 uppercase">Revenus Boutique (Total)</span>
            <p className="text-3xl font-black text-green-400 mt-2">0.00 €</p>
            <span className="text-[11px] text-gray-500 mt-2 block">Connectez Stripe pour enregistrer des ventes réelles.</span>
          </div>

          <div className="bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-3xl border border-white/10 p-6 rounded-3xl shadow-xl">
            <span className="text-xs font-bold text-gray-400 uppercase">Revenus Publicités (AdSense)</span>
            <p className="text-3xl font-black text-amber-400 mt-2">0.00 €</p>
            <span className="text-[11px] text-gray-500 mt-2 block">Données agrégées via Google AdSense API.</span>
          </div>

          <div className="bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-3xl border border-white/10 p-6 rounded-3xl shadow-xl">
            <span className="text-xs font-bold text-gray-400 uppercase">Abonnements Sudoku Pro</span>
            <p className="text-3xl font-black text-indigo-400 mt-2">0 Actifs</p>
            <span className="text-[11px] text-gray-500 mt-2 block">Prêt pour les paiements récurrents Stripe.</span>
          </div>
        </div>
      )}
    </div>
  );
}
