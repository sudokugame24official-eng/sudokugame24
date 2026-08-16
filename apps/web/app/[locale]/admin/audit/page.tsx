"use client";
import React, { useEffect, useState } from "react";
import { ShieldCheck, Search, RefreshCw } from "lucide-react";
import { API_URL } from "@/lib/api";

interface AuditEntry {
  id: string;
  source: "action" | "audit";
  actorId: string | null;
  action: string;
  target: string | null;
  details: any;
  createdAt: string;
}

export default function AuditAdmin() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/admin/audit?limit=200`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setLogs(await res.json());
    } catch (e: any) {
      setError(e.message || "Échec du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      !filter ||
      l.action?.toLowerCase().includes(filter.toLowerCase()) ||
      (l.target || "").toLowerCase().includes(filter.toLowerCase()) ||
      (l.actorId || "").toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-2">
            Historique réel de toutes les actions administratives (journaux
            intercepteurs + écritures explicites).
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Rechercher une action..."
              className="w-80 bg-card/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={fetchLogs}
            className="bg-white/5 border border-white/10 rounded-xl px-4 hover:bg-white/10 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="bg-card/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-2xl">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">Date</th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">Source</th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">Acteur (ID)</th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">Action</th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">Cible</th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm font-mono">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground font-sans">
                  Chargement...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground font-sans">
                  Aucune entrée d&apos;audit pour le moment.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={`${log.source}-${log.id}`} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded font-bold ${
                        log.source === "action"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      {log.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/80 break-all">
                    {log.actorId || "—"}
                  </td>
                  <td className="px-6 py-4 font-bold text-white">{log.action}</td>
                  <td className="px-6 py-4 text-orange-400 break-all">{log.target || "—"}</td>
                  <td className="px-6 py-4 text-emerald-400 break-all max-w-xs">
                    {log.details ? JSON.stringify(log.details).slice(0, 120) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
