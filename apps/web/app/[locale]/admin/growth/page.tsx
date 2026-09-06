"use client";

import React, { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { toast } from "sonner";
import {
  Globe,
  Link2,
  Plus,
  RefreshCw,
  Search,
  Mail,
  FileDown,
  Wand2,
  ShieldCheck,
  Trash2,
  ExternalLink,
  MessageSquare,
  Activity,
  Users,
} from "lucide-react";

const STATUSES = [
  "PROSPECT",
  "QUALIFIED",
  "CONTACTED",
  "FOLLOW_UP",
  "NEGOTIATING",
  "PLACED",
  "VERIFIED",
  "LOST",
  "REJECTED",
] as const;

type Status = (typeof STATUSES)[number];

interface Prospect {
  id: string;
  domain: string;
  url?: string;
  niche?: string;
  relevanceScore: number;
  authorityScore: number;
  contactEmail?: string;
  contactName?: string;
  status: Status;
  targetPage?: string;
  proposedAnchor?: string;
  placedUrl?: string;
  verifiedAt?: string;
  lastCheckedAt?: string;
  notes?: string;
  outreachDraft?: string;
  followUpAt?: string;
  contactedAt?: string;
  createdAt?: string;
}

const statusColors: Record<Status, string> = {
  PROSPECT: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  QUALIFIED: "bg-sky-500/20 text-sky-300 border-sky-500/40",
  CONTACTED: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  FOLLOW_UP: "bg-violet-500/20 text-violet-300 border-violet-500/40",
  NEGOTIATING: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  PLACED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  VERIFIED: "bg-green-500/20 text-green-300 border-green-500/40",
  LOST: "bg-red-500/20 text-red-300 border-red-500/40",
  REJECTED: "bg-rose-500/20 text-rose-300 border-rose-500/40",
};

const emptyForm = {
  domain: "",
  url: "",
  niche: "",
  relevanceScore: 50,
  authorityScore: 50,
  contactEmail: "",
  contactName: "",
  targetPage: "",
  proposedAnchor: "",
  notes: "",
};

export default function GrowthAdmin() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/growth/stats`, {
        credentials: "include",
      });
      if (res.ok) setStats(await res.json());
    } catch {
      // non-fatal
    }
  }, []);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${API_URL}/admin/growth/prospects?${params}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setProspects(data.items || []);
        setTotal(data.total || 0);
      } else {
        toast.error("Erreur lors du chargement des prospects.");
      }
    } catch {
      toast.error("Erreur de connexion serveur.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/growth/prospects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Prospect créé avec succès !");
        setForm(emptyForm);
        setShowForm(false);
        fetchProspects();
        fetchStats();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.message || "Échec de la création.");
      }
    } catch {
      toast.error("Erreur lors de la communication avec l'API.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, patch: Partial<Prospect>) => {
    try {
      const res = await fetch(`${API_URL}/admin/growth/prospects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Prospect mis à jour.");
        fetchProspects();
        fetchStats();
      } else {
        toast.error("Échec de la mise à jour.");
      }
    } catch {
      toast.error("Erreur de communication.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer définitivement ce prospect ?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/growth/prospects/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Prospect supprimé.");
        fetchProspects();
        fetchStats();
      } else {
        toast.error("Échec de la suppression.");
      }
    } catch {
      toast.error("Erreur de communication.");
    }
  };

  const handleGenerateOutreach = async (id: string) => {
    try {
      const res = await fetch(
        `${API_URL}/admin/growth/prospects/${id}/generate-outreach`,
        { method: "POST", credentials: "include" },
      );
      if (res.ok) {
        const data = await res.json();
        toast.success("Brouillon d'outreach généré.");
        setExpanded(id);
        setProspects((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, outreachDraft: data.outreachDraft } : p,
          ),
        );
      } else {
        toast.error("Échec de la génération.");
      }
    } catch {
      toast.error("Erreur de communication.");
    }
  };

  const handleSetStatus = async (id: string, status: Status) => {
    await handleUpdate(id, { status });
  };

  const handleVerify = async (id: string) => {
    try {
      const res = await fetch(
        `${API_URL}/admin/growth/prospects/${id}/verify`,
        { method: "POST", credentials: "include" },
      );
      if (res.ok) {
        toast.success("Vérification lancée.");
        fetchProspects();
      } else {
        toast.error("Aucun placedUrl à vérifier.");
      }
    } catch {
      toast.error("Erreur de communication.");
    }
  };

  const handleExport = () => {
    const header = [
      "domain",
      "url",
      "niche",
      "relevanceScore",
      "authorityScore",
      "contactEmail",
      "contactName",
      "status",
      "targetPage",
      "proposedAnchor",
      "placedUrl",
      "notes",
    ].join(",");
    const rows = prospects.map((p) =>
      [
        p.domain,
        p.url || "",
        p.niche || "",
        p.relevanceScore,
        p.authorityScore,
        p.contactEmail || "",
        p.contactName || "",
        p.status,
        p.targetPage || "",
        p.proposedAnchor || "",
        p.placedUrl || "",
        (p.notes || "").replace(/[\n,]/g, " "),
      ].join(","),
    );
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backlink-prospects.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCount = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8 max-w-7xl pb-24">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link2 className="w-8 h-8 text-brand-cyan" />
          <h1 className="text-3xl font-black tracking-tight">
            SEO &amp; Growth — Backlink Control Center
          </h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-3xl">
          Gestion white-hat des backlinks : prospection, qualification, outreach,
          suivi, placement et vérification. L'automatisation assiste le
          propriétaire et ne fabrique jamais artificiellement de liens.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
        <div className="bg-card border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <Globe className="w-6 h-6 text-brand-cyan" />
          <div>
            <div className="text-2xl font-black">{stats.PROSPECT || 0}</div>
            <div className="text-xs text-muted-foreground">Prospects</div>
          </div>
        </div>
        <div className="bg-card border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <Activity className="w-6 h-6 text-amber-400" />
          <div>
            <div className="text-2xl font-black">
              {(stats.CONTACTED || 0) + (stats.FOLLOW_UP || 0) + (stats.NEGOTIATING || 0)}
            </div>
            <div className="text-xs text-muted-foreground">En prospection</div>
          </div>
        </div>
        <div className="bg-card border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <div>
            <div className="text-2xl font-black">
              {(stats.PLACED || 0) + (stats.VERIFIED || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Placés / Vérifiés</div>
          </div>
        </div>
        <div className="bg-card border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <Users className="w-6 h-6 text-violet-400" />
          <div>
            <div className="text-2xl font-black">
              {(stats.REJECTED || 0) + (stats.LOST || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Perdus / Rejetés</div>
          </div>
        </div>
        <div className="bg-card border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <Link2 className="w-6 h-6 text-brand-gold" />
          <div>
            <div className="text-2xl font-black">{totalCount}</div>
            <div className="text-xs text-muted-foreground">Total suivi</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2.5 bg-brand-orange hover:brightness-110 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Nouveau Prospect
        </button>
        <div className="flex-1 relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher (domaine, email, niche)..."
            className="w-full bg-secondary/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-brand-cyan outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-secondary/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-brand-cyan outline-none"
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setPage(1);
            fetchProspects();
            fetchStats();
          }}
          className="px-3 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-sm flex items-center gap-2 transition-colors"
          title="Rafraîchir"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={handleExport}
          className="px-3 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-sm flex items-center gap-2 transition-colors"
          title="Exporter CSV"
        >
          <FileDown className="w-4 h-4" /> CSV
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-card border border-white/15 rounded-3xl p-6 shadow-xl space-y-4"
        >
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-gold" /> Nouveau Prospect de Backlink
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Domaine *
              </label>
              <input
                required
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                placeholder="ex: sudoku-cours.com"
                className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">URL</label>
              <input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
                className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-brand-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Niche</label>
              <input
                value={form.niche}
                onChange={(e) => setForm({ ...form, niche: e.target.value })}
                placeholder="ex: jeux de logique"
                className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Email de contact
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="contact@..."
                className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Nom du contact
              </label>
              <input
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                placeholder="ex: Marie Dupont"
                className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Page cible (notre URL)
              </label>
              <input
                value={form.targetPage}
                onChange={(e) => setForm({ ...form, targetPage: e.target.value })}
                placeholder="https://sudokugame24.com/sudoku"
                className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-brand-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Ancre proposée
              </label>
              <input
                value={form.proposedAnchor}
                onChange={(e) => setForm({ ...form, proposedAnchor: e.target.value })}
                placeholder="ex: jouer au sudoku en ligne"
                className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Scores de pertinence
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.relevanceScore}
                  onChange={(e) =>
                    setForm({ ...form, relevanceScore: Number(e.target.value) })
                  }
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-cyan outline-none"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.authorityScore}
                  onChange={(e) =>
                    setForm({ ...form, authorityScore: Number(e.target.value) })
                  }
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-cyan outline-none"
                />
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Pertinence | Autorité (0-100)
              </span>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-300 mb-1">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Contexte, contenu accepté..."
                className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-cyan outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-brand-orange hover:brightness-110 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Créer le Prospect
            </button>
          </div>
        </form>
      )}

      {/* Prospects List */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">
          Chargement des prospects...
        </div>
      ) : prospects.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card/30 border border-white/10 rounded-3xl">
          Aucun prospect. Créez votre premier prospect de backlink.
        </div>
      ) : (
        <div className="space-y-4">
          {prospects.map((p) => (
            <div
              key={p.id}
              className="bg-card border border-white/10 rounded-2xl p-5 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-white truncate">
                        {p.domain}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[p.status]}`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      {p.niche && <span>{p.niche}</span>}
                      {p.contactEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {p.contactEmail}
                        </span>
                      )}
                      <span>Relevance: {p.relevanceScore}/100</span>
                      <span>Authority: {p.authorityScore}/100</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={p.status}
                    onChange={(e) =>
                      handleSetStatus(p.id, e.target.value as Status)
                    }
                    className="bg-secondary/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-brand-cyan outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleGenerateOutreach(p.id)}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    title="Générer un brouillon d'outreach"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Outreach
                  </button>
                  <button
                    onClick={() => handleVerify(p.id)}
                    className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    title="Vérifier le lien placé"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Vérifier
                  </button>
                  <button
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors"
                  >
                    Détails
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {expanded === p.id && (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-cyan flex items-center gap-1.5 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> {p.url}
                    </a>
                  )}
                  {p.targetPage && (
                    <div className="text-xs text-muted-foreground">
                      Page cible :{" "}
                      <span className="text-white font-mono">{p.targetPage}</span>
                    </div>
                  )}
                  {p.proposedAnchor && (
                    <div className="text-xs text-muted-foreground">
                      Ancre :{" "}
                      <span className="text-white">&ldquo;{p.proposedAnchor}&rdquo;</span>
                    </div>
                  )}
                  {p.placedUrl && (
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" /> Placé : {p.placedUrl}
                      {p.lastCheckedAt && (
                        <span className="text-muted-foreground">
                          (dernière vérif :{" "}
                          {new Date(p.lastCheckedAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  )}
                  {p.notes && (
                    <div className="text-xs text-muted-foreground bg-white/5 rounded-lg p-3">
                      {p.notes}
                    </div>
                  )}
                  {p.outreachDraft && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="text-xs font-bold text-brand-gold flex items-center gap-1.5 mb-2">
                        <MessageSquare className="w-3.5 h-3.5" /> Brouillon d'outreach
                      </div>
                      <pre className="text-xs text-white whitespace-pre-wrap font-sans leading-relaxed">
                        {p.outreachDraft}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {total} prospect(s) — page {page}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-sm disabled:opacity-40 transition-colors"
            >
              Précédent
            </button>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-sm disabled:opacity-40 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
