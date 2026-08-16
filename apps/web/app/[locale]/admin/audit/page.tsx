"use client";
import React, { useEffect, useState } from "react";
import { ShieldCheck, Search } from "lucide-react";

export default function AuditAdmin() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fake fetch for MVP since we didn't expose /admin/audit endpoint
    setTimeout(() => {
      setLogs([
        {
          id: "1",
          actorRole: "SUPER_ADMIN",
          action: "UPDATE_FEATURE_FLAG",
          target: "MAINTENANCE_MODE",
          newValue: "true",
          date: new Date().toISOString(),
        },
        {
          id: "2",
          actorRole: "SUPER_ADMIN",
          action: "UPDATE_FEATURE_FLAG",
          target: "SHOP_ENABLED",
          newValue: "false",
          date: new Date().toISOString(),
        },
        {
          id: "3",
          actorRole: "ADMIN",
          action: "BAN_USER",
          target: "user_123",
          newValue: "Spamming",
          date: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "4",
          actorRole: "SUPER_ADMIN",
          action: "UPDATE_ROLE",
          target: "user_456",
          newValue: "MODERATOR",
          date: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-2">
            Historique immuable de toutes les actions administratives.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une action..."
            className="w-80 bg-card/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="bg-card/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-2xl">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">
                Date
              </th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">
                Acteur (Rôle)
              </th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">
                Action
              </th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">
                Cible
              </th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">
                Nouvelle Valeur
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm font-mono">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-muted-foreground font-sans"
                >
                  Chargement...
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(log.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-primary/20 text-primary rounded font-bold">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 text-orange-400">{log.target}</td>
                  <td className="px-6 py-4 text-emerald-400 break-all">
                    {log.newValue}
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
