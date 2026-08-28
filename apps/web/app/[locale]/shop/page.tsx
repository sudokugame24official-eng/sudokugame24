"use client";
import { API_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Coins,
  Crown,
  Shield,
  Star,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  Zap,
  Play,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

export default function ShopPage() {
  const t = useTranslations("shop");
  const { user, checkAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<"COINS" | "PERKS">("PERKS");
  const [coinPacks, setCoinPacks] = useState<any[]>([]);
  const [perks, setPerks] = useState<any[]>([]);
  const [myPerks, setMyPerks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [shopEnabled, setShopEnabled] = useState(false);
  const [adsEnabled, setAdsEnabled] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    checkAuth(); // Refresh user balance when navigating back to the shop
  }, []);

  const fetchData = async () => {
    try {
      const [packsRes, productsRes, configRes] = await Promise.all([
        fetch(`${API_URL}/shop/coin-packs`),
        fetch(`${API_URL}/shop/products`),
        fetch(`${API_URL}/config/features`),
      ]);
      setCoinPacks(await packsRes.json());
      setPerks(await productsRes.json());

      const config = await configRes.json();
      setShopEnabled(config.SHOP_ENABLED);
      setAdsEnabled(config.ADS_ENABLED);

      if (user) {
        const myPerksRes = await fetch(`${API_URL}/shop/my-perks`, {
          credentials: "include",
        });
        if (myPerksRes.ok) {
          setMyPerks(await myPerksRes.json());
        }
      }
    } catch (e) {
      console.error("Error fetching shop data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCoins = async (packId: string) => {
    if (!user) {
      toast.error(t("loginToBuyCoins"));
      return;
    }
    try {
      const res = await fetch(`${API_URL}/shop/buy-coins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
      toast.error(t("paymentInitError"));
    }
  };

  const handleWatchAd = async () => {
    if (!user) {
      toast.error(t("loginToEarnCoins"));
      return;
    }
    setIsWatchingAd(true);
    // Simulate watching an ad
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/shop/watch-ad`, {
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(data.message);
          checkAuth(); // Refresh user coins
        } else {
          toast.error(t("errorPrefix") + data.message);
        }
      } catch (e) {
        console.error(e);
        toast.error(t("genericError"));
      } finally {
        setIsWatchingAd(false);
      }
    }, 2000);
  };

  const handleBuyPerk = async (productId: string) => {
    if (!user) {
      toast.error(t("loginToBuyPerks"));
      return;
    }
    if (confirm(t("purchaseConfirm"))) {
      try {
        const res = await fetch(`${API_URL}/shop/buy-product`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(data.message);
          fetchData(); // Refresh my perks
          checkAuth(); // Refresh user coins
        } else {
          toast.error(t("errorPrefix") + data.message);
        }
      } catch (e) {
        toast.error(t("genericError"));
      }
    }
  };

  const hasPerk = (type: string) => {
    return myPerks.some((p) => p.perkType === type);
  };

  const getPerkIcon = (iconStr?: string | null) => {
    switch (iconStr) {
      case "shield":
        return <Shield className="w-6 h-6 text-blue-400" />;
      case "crown":
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case "lightbulb":
        return <Lightbulb className="w-6 h-6 text-green-400" />;
      case "star":
        return <Star className="w-6 h-6 text-purple-400" />;
      default:
        return <Zap className="w-6 h-6 text-orange-400" />;
    }
  };

  if (!loading && !shopEnabled) {
    return (
      <main className="min-h-screen pt-24 pb-12 px-4 flex flex-col items-center justify-center text-center">
        <Crown className="w-24 h-24 text-[#FFCC00] mb-8 opacity-50" />
        <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
          {t("title")}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFCC00] to-[#FF4500]">
            {t("accentSoon")}
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          {t("comingSoonDesc")}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-12 px-4 relative flex flex-col items-center">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#FF4500]/10 to-transparent -z-10" />

      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight"
          >
            {t("title")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFCC00] to-[#FF4500]">
              {t("accentPremium")}
            </span>
          </motion.h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* User Balance */}
        {user && (
          <div className="flex justify-center mb-8">
            <div className="bg-card/50 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex items-center gap-3 shadow-lg">
              <span className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">
                {t("yourBalance")}
              </span>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="font-black text-xl">
                  {(user as any).profile?.coins || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-card/30 p-1 rounded-2xl flex gap-1 border border-border">
            <button
              onClick={() => setActiveTab("PERKS")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "PERKS" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t("tabPerks")}
            </button>
            <button
              onClick={() => setActiveTab("COINS")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "COINS" ? "bg-[#FFCC00] text-black shadow-[0_0_15px_rgba(255,204,0,0.5)]" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Coins className="w-4 h-4" /> {t("tabCoins")}
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full"
          >
            {activeTab === "PERKS" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {perks.map((perk) => {
                  const owned =
                    perk.type === "perk" && hasPerk(perk.entitlement);
                  return (
                    <div
                      key={perk.id}
                      className={`bg-card/40 backdrop-blur-md border ${owned ? "border-green-500/50" : "border-white/10"} p-6 rounded-3xl shadow-xl flex flex-col`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${owned ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"}`}
                          >
                            {getPerkIcon(perk.iconUrl)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{perk.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {perk.durationDays
                                ? t("validDays", { days: perk.durationDays })
                                : t("permanent")}
                            </p>
                          </div>
                        </div>
                        {owned && (
                          <div className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {t("activeBadge")}
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-6 flex-1">
                        {perk.description}
                      </p>

                      <button
                        onClick={() => handleBuyPerk(perk.id)}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                          owned && perk.durationDays === null
                            ? "bg-secondary text-muted-foreground cursor-not-allowed"
                            : "bg-white/5 hover:bg-primary hover:text-white border border-white/10"
                        }`}
                        disabled={owned && perk.durationDays === null}
                      >
                        {owned && perk.durationDays === null ? (
                          t("ownedBtn")
                        ) : (
                          <>
                            {t("activateFor")}{" "}
                            <Coins className="w-4 h-4 text-yellow-400" />{" "}
                            {perk.priceCoins}
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "COINS" && (
              <div className="space-y-8">
                {/* Free Coins Option */}
                {adsEnabled && (
                  <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Play className="w-8 h-8 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl mb-1 text-white">
                          {t("freeCoinsTitle")}
                        </h3>
                        <p className="text-sm text-blue-200/70">
                          {t("freeCoinsDesc")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleWatchAd}
                      disabled={isWatchingAd}
                      className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] disabled:opacity-50 flex items-center gap-2"
                    >
                      {isWatchingAd ? t("watchingAd") : t("watchVideo")}
                    </button>
                  </div>
                )}

                {/* Coin Packs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {coinPacks.map((pack) => (
                    <div
                      key={pack.id}
                      className={`relative bg-card/40 backdrop-blur-md border ${pack.popular ? "border-[#FFCC00] shadow-[0_0_30px_rgba(255,204,0,0.15)]" : "border-white/10"} p-8 rounded-3xl shadow-xl flex flex-col items-center text-center transition-transform hover:-translate-y-2`}
                    >
                      {pack.popular && (
                        <div className="absolute -top-4 bg-[#FFCC00] text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
                          {t("popularBadge")}
                        </div>
                      )}

                      {/* Placeholder for coin image */}
                      <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-[#FFCC00]/20 rounded-full blur-xl animate-pulse" />
                        <Coins
                          className={`w-16 h-16 ${pack.popular ? "text-[#FFCC00]" : "text-yellow-500"}`}
                        />
                      </div>

                      <h3 className="font-bold text-xl mb-1">{pack.name}</h3>
                      <div className="flex items-center gap-2 mb-6">
                        <span className="font-black text-3xl text-yellow-400">
                          {pack.coins}
                        </span>
                        <span className="text-muted-foreground font-semibold">
                          {t("coinsUnit")}
                        </span>
                      </div>

                      <button
                        onClick={() => handleBuyCoins(pack.id)}
                        className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                          pack.popular
                            ? "bg-[#FFCC00] text-black hover:bg-yellow-400 shadow-[0_0_20px_rgba(255,204,0,0.4)]"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        {pack.priceEur.toFixed(2)} €{" "}
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
