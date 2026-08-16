"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Ban,
  RotateCcw,
  Shield,
  X,
} from "lucide-react";
import { API_URL } from "@/lib/api";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  isBanned: boolean;
  banReason: string | null;
  createdAt: string;
  profile: {
    username: string;
    level: number;
    xp: number;
    coins: number;
    rating: number;
    currentStreak: number;
  } | null;
}

interface UserDetail {
  user: AdminUser & {
    _count?: Record<string, number>;
  };
  purchases: any[];
  recentTransactions: any[];
  recentReports: any[];
  auditTrail: any[];
  aggregates: Record<string, number>;
}

const ROLES = ["", "MEMBER", "PREMIUM_MEMBER", "SUPPORT_AGENT", "CONTENT_MANAGER", "ANALYST", "MODERATOR", "ADMIN", "SUPER_ADMIN"];

export default function AdminUsersPage() {
  const [data, setData] = useState<{ users: AdminUser[]; total: number; page: number; pageCount: number }>({
    users: [],
    total: 0,
    page: 1,
    pageCount: 1,
  });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [banned, setBanned] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionTarget, setActionTarget] = useState<AdminUser | null>(null);
  const [actionKind, setActionKind] = useState<"ban" | "role" | null>(null);
  const [reason, setReason] = useState("");
  const [newRole, setNewRole] = useState("MEMBER");
  const [busy, setBusy] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      if (banned) params.set("banned", banned);
      const res = await fetch(`${API_URL}/admin/users?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, role, banned]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openDetail = async (u: AdminUser) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`${API_URL}/admin/users/${u.id}`, {
        credentials: "include",
      });
      if (res.ok) setDetail(await res.json());
    } finally {
      setDetailLoading(false);
    }
  };

  const doBan = async (u: AdminUser, banReason: string) => {
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${u.id}/ban`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: banReason }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      fetchUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
      setActionTarget(null);
      setReason("");
      setActionKind(null);
    }
  };

  const doUnban = async (u: AdminUser) => {
    setBusy(true);
    try {
      await fetch(`${API_URL}/admin/users/${u.id}/unban`, {
        method: "PATCH",
        credentials: "include",
      });
      fetchUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const doRole = async (u: AdminUser, r: string) => {
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${u.id}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: r }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      fetchUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
      setActionTarget(null);
      setActionKind(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Utilisateurs
          </h1>
          <p className="text-muted-foreground mt-2">
            {data.total} comptes — recherche, filtres, détails et modération.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchUsers();
          }}
          className="relative flex-1 min-w-64"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Email ou nom d'utilisateur..."
            className="w-full bg-card/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-primary"
          />
        </form>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="bg-card/50 border border-white/10 rounded-xl px-4 py-2"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r || "Tous les rôles"}
            </option>
          ))}
        </select>
        <select
          value={banned}
          onChange={(e) => {
            setBanned(e.target.value);
            setPage(1);
          }}
          className="bg-card/50 border border-white/10 rounded-xl px-4 py-2"
        >
          <option value="">Tous</option>
          <option value="false">Actifs</option>
          <option value="true">Bannis</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-2xl">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Utilisateur</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Rôle</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Niveau</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Coins</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Statut</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">Chargement...</td>
              </tr>
            ) : data.users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun utilisateur trouvé.</td>
              </tr>
            ) : (
              data.users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(u)} className="text-left hover:underline">
                      <p className="font-bold">{u.profile?.username || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-bold">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">{u.profile?.level ?? "—"}</td>
                  <td className="px-4 py-3 text-yellow-400 font-bold">{u.profile?.coins ?? "—"}</td>
                  <td className="px-4 py-3">
                    {u.isBanned ? (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold">BANNI</span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold">Actif</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {u.isBanned ? (
                        <button
                          onClick={() => doUnban(u)}
                          disabled={busy}
                          title="Débannir"
                          className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setActionTarget(u);
                            setActionKind("ban");
                          }}
                          title="Bannir"
                          className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setActionTarget(u);
                          setActionKind("role");
                          setNewRole(u.role);
                        }}
                        title="Changer le rôle"
                        className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {data.page} / {data.pageCount} — {data.total} utilisateurs
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 bg-white/5 rounded-lg border border-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(data.pageCount, p + 1))}
            disabled={page >= data.pageCount}
            className="p-2 bg-white/5 rounded-lg border border-white/10 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detail modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-[#0A1E3F] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            {detailLoading || !detail ? (
              <p className="text-center text-muted-foreground py-8">Chargement du profil...</p>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black">{detail.user.profile?.username || detail.user.email}</h2>
                    <p className="text-sm text-muted-foreground">{detail.user.email} — inscrit le {new Date(detail.user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => setDetail(null)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    ["Parties", detail.aggregates?.gameSessions],
                    ["Posts forum", detail.aggregates?.forumPosts],
                    ["Achats", detail.aggregates?.purchases],
                    ["Transactions", detail.aggregates?.coinTransactions],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-primary">{value ?? 0}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {detail.user.isBanned && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6 text-sm">
                    <span className="font-bold text-red-400">Banni</span>
                    {detail.user.banReason ? ` — motif : ${detail.user.banReason}` : ""}
                  </div>
                )}

                <h3 className="font-bold mb-2">Dernières transactions de coins</h3>
                <div className="bg-white/5 rounded-xl p-3 mb-6 text-xs font-mono space-y-1">
                  {detail.recentTransactions.length === 0 ? (
                    <p className="text-muted-foreground">Aucune transaction.</p>
                  ) : (
                    detail.recentTransactions.map((t: any) => (
                      <div key={t.id} className="flex justify-between">
                        <span>{new Date(t.createdAt).toLocaleString()} — {t.type}</span>
                        <span className={t.amount > 0 ? "text-emerald-400" : "text-red-400"}>
                          {t.amount > 0 ? "+" : ""}{t.amount} (→ {t.balanceAfter})
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <h3 className="font-bold mb-2">Historique d&apos;audit lié</h3>
                <div className="bg-white/5 rounded-xl p-3 text-xs font-mono space-y-1">
                  {detail.auditTrail.length === 0 ? (
                    <p className="text-muted-foreground">Aucune entrée.</p>
                  ) : (
                    detail.auditTrail.map((a: any) => (
                      <p key={a.id}>
                        {new Date(a.createdAt).toLocaleString()} — {a.action} {a.target ? `→ ${a.target}` : ""}
                      </p>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Ban / Role action modal */}
      {actionTarget && actionKind && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#0A1E3F] border border-white/10 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-black mb-4">
              {actionKind === "ban" ? "Bannir" : "Nouveau rôle"} — {actionTarget.profile?.username || actionTarget.email}
            </h3>
            {actionKind === "ban" ? (
              <>
                <label className="text-sm text-muted-foreground">Motif (obligatoire, conservé dans l&apos;audit) :</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
                  rows={3}
                  placeholder="Ex: triche répétée détectée"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => doBan(actionTarget, reason)}
                    disabled={busy || reason.trim().length < 3}
                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl"
                  >
                    Confirmer le ban
                  </button>
                  <button onClick={() => { setActionTarget(null); setActionKind(null); }} className="flex-1 bg-white/10 hover:bg-white/20 font-bold py-3 rounded-xl">
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="text-sm text-muted-foreground">Rôle :</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full mt-2 bg-card/50 border border-white/10 rounded-xl px-4 py-3"
                >
                  {ROLES.filter(Boolean).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => doRole(actionTarget, newRole)}
                    disabled={busy}
                    className="flex-1 bg-primary hover:bg-primary/80 disabled:opacity-40 text-white font-bold py-3 rounded-xl"
                  >
                    Confirmer
                  </button>
                  <button onClick={() => { setActionTarget(null); setActionKind(null); }} className="flex-1 bg-white/10 hover:bg-white/20 font-bold py-3 rounded-xl">
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
