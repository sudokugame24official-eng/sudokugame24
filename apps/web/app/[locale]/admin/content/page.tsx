"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { FileText, Plus, Edit, Eye, Archive } from "lucide-react";

export default function CMSAdmin() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Beginner");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("DRAFT");

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/content`, {
        credentials: "include",
      });
      if (res.ok) setArticles(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/admin/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          category,
          excerpt,
          content,
          status,
        }),
        credentials: "include",
      });
      if (res.ok) {
        setShowForm(false);
        fetchArticles();
      } else {
        alert("Erreur lors de la création");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black">Content Management (CMS)</h1>
          <p className="text-muted-foreground">
            Gérez l'Académie Sudoku, la FAQ et le Help Center.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
        >
          <Plus className="w-5 h-5" />
          {showForm ? "Annuler" : "Nouvel Article"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card/40 border border-white/10 rounded-2xl p-6 backdrop-blur-2xl space-y-4"
        >
          <h2 className="text-xl font-bold mb-4">Créer un Contenu</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1">
                Titre (H1)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1">
                Slug URL
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Competitive</option>
                <option>FAQ</option>
                <option>Help Center</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1">
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
              >
                <option>DRAFT</option>
                <option>REVIEW</option>
                <option>PUBLISHED</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-1">
              Extrait (SEO Meta Description)
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary h-20"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-1">
              Contenu (HTML/Markdown)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary h-64 font-mono text-sm"
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-primary px-8 py-2 rounded-xl font-bold text-white shadow-lg"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      )}

      <div className="bg-card/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-2xl">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">
                Titre de l'Article
              </th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">
                Catégorie
              </th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">
                Statut
              </th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground">
                Indexation
              </th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-muted-foreground"
                >
                  Chargement...
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr
                  key={article.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold">{article.title}</p>
                    <p className="text-xs text-muted-foreground">
                      /{article.slug}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold">
                      {article.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${article.status === "PUBLISHED" ? "bg-emerald-500/20 text-emerald-500" : "bg-orange-500/20 text-orange-500"}`}
                    >
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">
                    {article.indexable ? "INDEX" : "NOINDEX"}
                  </td>
                  <td className="px-6 py-4 flex items-center justify-end gap-2">
                    <button className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                      <Eye className="w-4 h-4 text-white" />
                    </button>
                    <button className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                      <Edit className="w-4 h-4 text-white" />
                    </button>
                    <button className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/40 transition-colors text-red-500">
                      <Archive className="w-4 h-4" />
                    </button>
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
