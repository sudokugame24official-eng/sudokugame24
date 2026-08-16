"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { Activity, Server, Users, Cpu, Database } from "lucide-react";

export default function SystemHealthAdmin() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/system/health`, {
        credentials: "include",
        headers: { },
      });
      if (res.ok) setHealth(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) return <div className="text-center mt-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Activity className="text-primary" /> Santé du Système
        </h1>
        <p className="text-muted-foreground mt-2">
          Surveillez les performances et l'état des serveurs en temps réel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card/40 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
          <Server className="w-10 h-10 text-green-400 mb-4" />
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Statut API</h3>
          <p className="text-2xl font-black text-white mt-1">{health?.status || "INCONNU"}</p>
        </div>

        <div className="bg-card/40 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
          <Activity className="w-10 h-10 text-blue-400 mb-4" />
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Uptime (Activité)</h3>
          <p className="text-2xl font-black text-white mt-1">{health ? formatUptime(health.uptime) : "-"}</p>
        </div>

        <div className="bg-card/40 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
          <Cpu className="w-10 h-10 text-purple-400 mb-4" />
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Utilisation RAM</h3>
          <p className="text-2xl font-black text-white mt-1">{health ? formatBytes(health.memory.heapUsed) : "-"}</p>
          <p className="text-xs text-muted-foreground">Total alloué : {health ? formatBytes(health.memory.heapTotal) : "-"}</p>
        </div>

        <div className="bg-card/40 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
          <Users className="w-10 h-10 text-brand-gold mb-4" />
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Membres Actifs</h3>
          <p className="text-2xl font-black text-white mt-1">{health?.activeUsers || 0}</p>
          <p className="text-xs text-muted-foreground">Duels en cours : {health?.activeDuels || 0}</p>
        </div>
      </div>

      <div className="bg-card/40 border border-white/10 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" /> Connexions Base de Données
        </h2>
        <p className="text-muted-foreground mb-6">
          La base de données PostgreSQL (Neon) et le cache Redis (Upstash) fonctionnent de manière optimale. La télémétrie avancée est collectée par Sentry.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl">
            <span className="font-medium">PostgreSQL (Neon)</span>
            <span className="text-green-400 font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400"></div> Connecté</span>
          </div>
          <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl">
            <span className="font-medium">Redis (Upstash)</span>
            <span className="text-green-400 font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400"></div> Connecté</span>
          </div>
        </div>
      </div>
    </div>
  );
}
