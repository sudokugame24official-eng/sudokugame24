"use client";
import { API_URL } from "@/lib/api";
import React, { useState, useEffect } from "react";
import { Trash2, MessageSquare, Eye, Loader2, Plus, Pin, Lock } from "lucide-react";
import { Link } from "@/navigation";
import { toast } from "sonner";

export default function AdminForumPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/forum/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/forum/categories`);
      if (res.ok) {
        const cats = await res.json();
        setCategories(cats);
        if (cats.length > 0) setSelectedCategory(cats[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const handleCreateOfficialPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !selectedCategory) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/forum/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          categoryId: selectedCategory,
        }),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Sujet officiel créé avec succès !");
        setShowModal(false);
        setNewTitle("");
        setNewContent("");
        fetchPosts();
      } else {
        toast.error("Erreur lors de la publication du sujet.");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce topic ?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/forum/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Sujet supprimé.");
        fetchPosts();
      } else {
        toast.error("Erreur lors de la suppression.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-brand-orange" />
            Forum & Sujets Officiels
          </h1>
          <p className="text-muted-foreground font-medium">
            Gérez et modérez les discussions ou publiez un sujet officiel directement sans code.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Publier un Sujet Officiel
        </button>
      </div>

      <div className="bg-card/40 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30 flex justify-between items-center">
          <h2 className="font-bold">Sujets Récents ({posts.length})</h2>
        </div>

        <div className="divide-y divide-border/50">
          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Aucun sujet trouvé.
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="p-6 hover:bg-secondary/20 transition-colors flex flex-col md:flex-row gap-6 items-center"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{post.title}</h3>
                      {post.isPinned && (
                        <span className="flex items-center gap-1 text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-black">
                          <Pin className="w-3 h-3" /> Épinglé
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 bg-background/50 p-3 rounded-lg border border-border">
                    "{post.content.substring(0, 120)}..."
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                    Auteur:{" "}
                    <span className="text-foreground">
                      {post.author?.profile?.username || "Inconnu"}
                    </span>
                    <span className="ml-4 text-xs text-muted-foreground">
                      {post._count?.comments || 0} Réponses
                    </span>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2 justify-center shrink-0 w-full md:w-auto">
                  <Link
                    href={`/forum/${post.id}`}
                    className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-xl transition-colors text-sm font-bold w-full"
                  >
                    <Eye className="w-4 h-4" /> Voir
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-xl transition-colors text-sm font-bold w-full"
                  >
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Création de Sujet Officiel */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A2A5C] border border-brand-gold/30 rounded-3xl p-6 md:p-8 w-full max-w-xl shadow-2xl">
            <h2 className="text-2xl font-black uppercase text-brand-gold mb-4">
              Créer un Sujet Officiel
            </h2>
            <form onSubmit={handleCreateOfficialPost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">
                  Catégorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-orange"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">
                  Titre du sujet
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="ex: Annonce de la Saison 2 de Duel"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">
                  Contenu du sujet
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Écrivez votre message officiel ici..."
                  className="w-full h-36 bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-orange resize-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-brand-orange text-white font-black uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 disabled:opacity-50"
                >
                  {isSubmitting ? "Publication..." : "Publier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
