"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { ShieldAlert, UserX, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";

export default function ModerationAdmin() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/reports`, {
        credentials: "include",
      });
      if (res.ok) setReports(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId: string) => {
    if (!confirm("Voulez-vous vraiment bannir cet utilisateur ?")) return;
    try {
      const reason = prompt("Raison du bannissement :");
      if (!reason) return;
      await fetch(`${API_URL}/admin/users/${userId}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
        credentials: "include",
      });
      alert("Utilisateur banni.");
      fetchReports();
    } catch (e) {
      alert("Erreur lors du bannissement.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Moderation Center</h1>
        <p className="text-muted-foreground">
          Gérez les signalements (reports), modérez le chat, et protégez la communauté.
        </p>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-card border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold">Aucun signalement</h2>
              <p className="text-muted-foreground">La communauté se porte bien !</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="bg-card border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0 mt-1">
                    <ShieldAlert className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <div className="flex gap-2 items-center">
                      <span className="font-bold text-lg text-white">
                        {report.reported?.profile?.username || "Inconnu"}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-500 font-bold rounded">
                        {report.reason}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Signalé par: <span className="text-white">{report.reporter?.profile?.username}</span> le {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                    {report.details && (
                      <p className="mt-4 p-3 bg-white/5 rounded-lg text-sm italic">
                        "{report.details}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => handleBan(report.reportedId)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 font-bold rounded-xl transition-colors"
                  >
                    <UserX className="w-4 h-4" /> Bannir
                  </button>
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors">
                    <AlertTriangle className="w-4 h-4" /> Avertir
                  </button>
                  <button className="flex-1 md:flex-none flex items-center justify-center p-2 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
