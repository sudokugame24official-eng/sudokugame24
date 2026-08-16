"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { AlertTriangle, ShieldCheck, Siren } from "lucide-react";

export default function EmergencyAdmin() {
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/features`, {
        credentials: "include",
      });
      if (res.ok) {
        const flags = await res.json();
        const m = flags.find((f: any) => f.key === "MAINTENANCE_MODE");
        setMaintenance(m?.enabled || false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async (enabled: boolean) => {
    if (
      !confirm(
        `ATTENTION: Êtes-vous sûr de vouloir ${enabled ? "ACTIVER" : "DÉSACTIVER"} le mode maintenance global ?`,
      )
    )
      return;
    try {
      await fetch(`${API_URL}/admin/features/MAINTENANCE_MODE`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
        credentials: "include",
      });
      fetchFlags();
    } catch (e) {
      alert("Erreur lors de la modification du mode maintenance");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-red-500 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8" />
          Emergency Control Center
        </h1>
        <p className="text-muted-foreground mt-2">
          Zone critique : Coupez instantanément l'accès à la plateforme en cas
          d'attaque ou de problème majeur.
        </p>
      </div>

      <div
        className={`border-2 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all ${maintenance ? "bg-red-500/10 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.2)]" : "bg-card/40 border-white/10"}`}
      >
        {maintenance ? (
          <div className="mb-6">
            <Siren className="w-24 h-24 text-red-500 animate-pulse mx-auto mb-4" />
            <h2 className="text-4xl font-black text-red-500">
              MAINTENANCE ACTIVE
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              La plateforme affiche actuellement une page de maintenance à tous
              les utilisateurs (sauf les Super Admins).
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <ShieldCheck className="w-24 h-24 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-emerald-500">
              PLATEFORME EN LIGNE
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              Tout fonctionne normalement. Activez le Lockdown uniquement en cas
              de faille critique.
            </p>
          </div>
        )}

        {maintenance ? (
          <button
            onClick={() => toggleMaintenance(false)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all"
          >
            Désactiver le Lockdown
          </button>
        ) : (
          <button
            onClick={() => toggleMaintenance(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all"
          >
            ACTIVER LE LOCKDOWN IMMÉDIAT
          </button>
        )}
      </div>
    </div>
  );
}
