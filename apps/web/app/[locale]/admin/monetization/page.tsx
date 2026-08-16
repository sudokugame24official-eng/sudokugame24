"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import {
  DollarSign,
  ShieldAlert,
  ShoppingCart,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";

export default function MonetizationAdmin() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/features`, {
        credentials: "include",
      });
      if (res.ok) setFlags(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (key: string, current: boolean) => {
    try {
      await fetch(`${API_URL}/admin/features/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !current }),
        credentials: "include",
      });
      fetchFlags();
    } catch (e) {
      alert("Erreur lors de la modification du Feature Flag");
    }
  };

  const monetizationFlags = flags.filter((f) =>
    [
      "SHOP_ENABLED",
      "ADS_ENABLED",
      "PAYMENTS_ENABLED",
      "COINS_ENABLED",
    ].includes(f.key),
  );
  const gameFlags = flags.filter((f) =>
    ["SOLO_MODE_ENABLED", "MULTIPLAYER_ENABLED"].includes(f.key),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Monétisation & Fonctionnalités</h1>
        <p className="text-muted-foreground">
          Contrôlez les revenus, la boutique et l'économie de la plateforme.
        </p>
      </div>

      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-bold text-red-500">
            Zone Sécurisée (Owner / Admin Only)
          </h2>
          <p className="text-sm text-muted-foreground">
            La modification de ces variables a un impact direct sur la
            plateforme et les revenus de l'entreprise. Toute modification est
            journalisée (Audit Log).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Monetization Flags */}
        <div className="bg-card/40 border border-white/10 rounded-2xl p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold">Monétisation (Stripe & Ads)</h2>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground">Chargement...</p>
            ) : (
              monetizationFlags.map((flag) => (
                <div
                  key={flag.key}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div>
                    <p className="font-bold">{flag.key}</p>
                    <p className="text-xs text-muted-foreground">
                      {flag.description || "Contrôle la monétisation"}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFlag(flag.key, flag.enabled)}
                    className={`transition-colors ${flag.enabled ? "text-green-500" : "text-muted-foreground hover:text-white"}`}
                  >
                    {flag.enabled ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Game Mode Flags */}
        <div className="bg-card/40 border border-white/10 rounded-2xl p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingCart className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold">Modes de Jeu</h2>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground">Chargement...</p>
            ) : (
              gameFlags.map((flag) => (
                <div
                  key={flag.key}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div>
                    <p className="font-bold">{flag.key}</p>
                    <p className="text-xs text-muted-foreground">
                      {flag.description || "Active/désactive un mode de jeu"}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFlag(flag.key, flag.enabled)}
                    className={`transition-colors ${flag.enabled ? "text-green-500" : "text-muted-foreground hover:text-white"}`}
                  >
                    {flag.enabled ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
