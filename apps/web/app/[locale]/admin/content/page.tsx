"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Pencil,
  X,
  RefreshCw,
  Copy,
  History,
  Eye,
  Send,
  EyeOff,
  Archive,
  RotateCcw,
  CalendarClock,
} from "lucide-react";
import { API_URL } from "@/lib/api";

interface Article {
  id: string;
  slug: string;
  title: string;
  status: string;
  type: string;
  locale: string;
  updatedAt: string;
  publishedAt?: string | null;
  scheduledAt?: string | null;
}

interface Revision {
  id: string;
  revisionNumber: number;
  title: string;
  editorId: string;
  createdAt: string;
}

const STATUSES = ["DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"];

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-white/10 text-muted-foreground",
  IN_REVIEW: "bg-yellow-500/20 text-yellow-400",
  SCHEDULED: "bg-blue-500/20 text-blue-400",
  PUBLISHED: "bg-emerald-500/20 text-emerald-400",
  UNPUBLISHED: "bg-orange-500/20 text-orange-400",
  ARCHIVED: "bg-red-500/20 text-red-400",
};

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  type: "BLOG",
  locale: "en",
  category: "",
  tags: "",
  metaTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  coverImage: "",
  schemaType: "Article",
};

export default function AdminContentPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);

  const [revisionsFor, setRevisionsFor] = useState<Article | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);

  const [preview, setPreview] = useState<any>(null);

  const flash = (m: string) => {
    setSuccess(m);
    setTimeout(() => setSuccess(""), 3000);
  };

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/content/admin/articles`, { credentials: "include" });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setArticles(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = async (a: Article) => {
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/content/articles/${a.id}/preview`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Chargement impossible");
      const art = await res.json();
      setEditingId(a.id);
      setForm({
        title: art.title || "",
        slug: art.slug || "",
        excerpt: art.excerpt || "",
        content: art.content || "",
        type: art.type || "BLOG",
        locale: art.locale || "en",
        category: art.category || "",
        tags: (art.tags || []).join(", "),
        metaTitle: art.metaTitle || "",
        metaDescription: art.metaDescription || "",
        canonicalUrl: art.canonicalUrl || "",
        ogTitle: art.ogTitle || "",
        ogDescription: art.ogDescription || "",
        coverImage: art.coverImage || "",
        schemaType: art.schemaType || "Article",
      });
      setEditorOpen(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || undefined,
        content: form.content,
        type: form.type,
        locale: form.locale,
        category: form.category || undefined,
        tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        canonicalUrl: form.canonicalUrl || undefined,
        ogTitle: form.ogTitle || undefined,
        ogDescription: form.ogDescription || undefined,
        coverImage: form.coverImage || undefined,
        schemaType: form.schemaType || undefined,
      };
      const res = await fetch(
        editingId ? `${API_URL}/content/articles/${editingId}` : `${API_URL}/content/articles`,
        {
          method: editingId ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Erreur ${res.status}`);
      }
      flash(editingId ? "Article enregistré (révision créée)." : "Brouillon créé.");
      setEditorOpen(false);
      fetchArticles();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (a: Article, status: string) => {
    let scheduledAt: string | undefined;
    if (status === "SCHEDULED") {
      const input = prompt("Date et heure de publication (UTC, format 2026-12-01T10:00:00Z) :");
      if (!input) return;
      scheduledAt = input;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/content/articles/${a.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, scheduledAt }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      flash(`Statut: ${status}`);
      fetchArticles();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async (a: Article) => {
    setBusy(true);
    try {
      await fetch(`${API_URL}/content/articles/${a.id}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      flash("Copie créée en brouillon.");
      fetchArticles();
    } finally {
      setBusy(false);
    }
  };

  const openRevisions = async (a: Article) => {
    setRevisionsFor(a);
    setRevisions([]);
    try {
      const res = await fetch(`${API_URL}/content/articles/${a.id}/revisions`, {
        credentials: "include",
      });
      if (res.ok) setRevisions(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const rollback = async (a: Article, revId: string) => {
    if (!confirm("Restaurer cette révision ? L'état actuel sera aussi archivé en révision.")) return;
    setBusy(true);
    try {
      await fetch(`${API_URL}/content/articles/${a.id}/revisions/${revId}/rollback`, {
        method: "POST",
        credentials: "include",
      });
      flash("Révision restaurée.");
      openRevisions(a);
    } finally {
      setBusy(false);
    }
  };

  const openPreview = async (a: Article) => {
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/content/articles/${a.id}/preview`, {
        credentials: "include",
      });
      if (res.ok) setPreview(await res.json());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Contenu (CMS)
          </h1>
          <p className="text-muted-foreground mt-2">
            Blog, pages, aide, FAQ — workflow complet : brouillon → relecture → publication
            (immédiate ou programmée), révisions et retour arrière.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchArticles} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-bold px-5 py-3 rounded-xl">
            <Plus className="w-4 h-4" /> Nouvel article
          </button>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 text-sm">{error}</div>}
      {success && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm">{success}</div>}

      <div className="bg-card/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-2xl">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Titre</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Type</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Statut</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">MAJ</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Chargement...</td></tr>
            ) : articles.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aucun contenu.</td></tr>
            ) : (
              articles.map((a) => (
                <tr key={a.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-bold">{a.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">/{a.slug} · {a.locale}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{a.type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${STATUS_STYLE[a.status] || ""}`}>
                      {a.status}
                      {a.status === "SCHEDULED" && a.scheduledAt
                        ? ` · ${new Date(a.scheduledAt).toLocaleDateString()}`
                        : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(a.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => openEdit(a)} disabled={busy} title="Éditer" className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => openPreview(a)} disabled={busy} title="Prévisualiser" className="p-2 bg-white/5 text-muted-foreground rounded-lg hover:bg-white/10">
                        <Eye className="w-4 h-4" />
                      </button>
                      {a.status !== "PUBLISHED" && (
                        <button onClick={() => setStatus(a, "PUBLISHED")} disabled={busy} title="Publier" className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20">
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {a.status === "PUBLISHED" && (
                        <button onClick={() => setStatus(a, "UNPUBLISHED")} disabled={busy} title="Dépublier" className="p-2 bg-orange-500/10 text-orange-400 rounded-lg hover:bg-orange-500/20">
                          <EyeOff className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setStatus(a, "SCHEDULED")} disabled={busy} title="Programmer" className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20">
                        <CalendarClock className="w-4 h-4" />
                      </button>
                      <button onClick={() => setStatus(a, "IN_REVIEW")} disabled={busy} title="Soumettre en relecture" className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button onClick={() => openRevisions(a)} disabled={busy} title="Révisions" className="p-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20">
                        <History className="w-4 h-4" />
                      </button>
                      <button onClick={() => duplicate(a)} disabled={busy} title="Dupliquer" className="p-2 bg-white/5 text-muted-foreground rounded-lg hover:bg-white/10">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => setStatus(a, "ARCHIVED")} disabled={busy} title="Archiver" className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Editor modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-[#0A1E3F] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[88vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black">{editingId ? "Modifier l'article" : "Nouvel article"}</h3>
              <button type="button" onClick={() => setEditorOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Titre *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Slug * (URL)</label>
                <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full mt-1 bg-card/50 border border-white/10 rounded-xl p-3 text-sm">
                  {["BLOG", "PAGE", "HELP", "FAQ", "ACADEMY"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Langue</label>
                <select value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })}
                  className="w-full mt-1 bg-card/50 border border-white/10 rounded-xl p-3 text-sm">
                  {["en", "fr", "de"].map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Catégorie</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Extrait (résumé)</label>
              <textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Contenu (Markdown) *</label>
              <textarea required rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-mono" />
            </div>

            <details className="bg-white/5 rounded-xl p-4">
              <summary className="cursor-pointer font-bold text-sm">SEO & OpenGraph</summary>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <label className="text-xs text-muted-foreground">Meta title</label>
                  <input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Canonical URL</label>
                  <input value={form.canonicalUrl} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm font-mono" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">Meta description</label>
                  <textarea rows={2} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">OG title</label>
                  <input value={form.ogTitle} onChange={(e) => setForm({ ...form, ogTitle: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Image de couverture / OG image</label>
                  <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm font-mono" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">OG description</label>
                  <textarea rows={2} value={form.ogDescription} onChange={(e) => setForm({ ...form, ogDescription: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Schema type</label>
                  <select value={form.schemaType} onChange={(e) => setForm({ ...form, schemaType: e.target.value })}
                    className="w-full mt-1 bg-card/50 border border-white/10 rounded-xl p-2.5 text-sm">
                    {["Article", "BlogPosting", "FAQPage", "WebPage"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tags (séparés par des virgules)</label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm" />
                </div>
              </div>
            </details>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={busy}
                className="flex-1 bg-primary hover:bg-primary/80 disabled:opacity-40 text-white font-bold py-3 rounded-xl">
                {busy ? "..." : "Enregistrer (révision automatique)"}
              </button>
              <button type="button" onClick={() => setEditorOpen(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 font-bold py-3 rounded-xl">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Revisions modal */}
      {revisionsFor && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setRevisionsFor(null)}>
          <div className="bg-[#0A1E3F] border border-white/10 rounded-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black">Révisions — {revisionsFor.title}</h3>
              <button onClick={() => setRevisionsFor(null)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            {revisions.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">Aucune révision enregistrée.</p>
            ) : (
              <div className="space-y-2">
                {revisions.map((r) => (
                  <div key={r.id} className="bg-white/5 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm">Révision #{r.revisionNumber} — {r.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={() => rollback(revisionsFor, r.id)} disabled={busy}
                      className="flex items-center gap-1.5 bg-purple-500/20 text-purple-300 px-3 py-2 rounded-lg text-xs font-bold hover:bg-purple-500/30">
                      <RotateCcw className="w-3.5 h-3.5" /> Restaurer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white text-black rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <span className="px-2 py-1 bg-gray-200 rounded text-xs font-bold uppercase">{preview.status}</span>
              <button onClick={() => setPreview(null)} className="p-1 hover:bg-gray-200 rounded"><X className="w-5 h-5" /></button>
            </div>
            <h1 className="text-3xl font-black mb-2">{preview.title}</h1>
            <p className="text-sm text-gray-500 mb-6 font-mono">/{preview.slug}</p>
            {preview.excerpt && <p className="text-lg text-gray-700 mb-6 italic">{preview.excerpt}</p>}
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">{preview.content}</div>
          </div>
        </div>
      )}
    </div>
  );
}
