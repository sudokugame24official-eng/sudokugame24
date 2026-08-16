"use client";
import { API_URL } from "@/lib/api";
import React, { useState, useEffect } from "react";
import { Trash2, AlertTriangle, Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/navigation";

export default function AdminForumPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/forum/posts`);
      if (res.ok) {
        setPosts(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce topic ?")) {
      try {
        const res = await fetch(`${API_URL}/admin/forum/posts/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          fetchPosts();
        } else {
          alert("Erreur lors de la suppression.");
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
          Forum Modération
        </h1>
        <p className="text-muted-foreground font-medium">
          Gérez le contenu du forum.
        </p>
      </div>

      <div className="bg-card/40 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30 flex justify-between items-center">
          <h2 className="font-bold">Sujets Récents</h2>
        </div>

        <div className="divide-y divide-border/50">
          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF4500]" />
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
                    <h3 className="text-lg font-bold">{post.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 bg-background/50 p-3 rounded-lg border border-border">
                    "{post.content.substring(0, 100)}..."
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

                <div className="flex flex-row md:flex-col gap-2 justify-center shrink-0">
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
    </div>
  );
}
