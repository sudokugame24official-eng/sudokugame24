"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { MessageSquare, Trash2, ShieldAlert } from "lucide-react";

export default function ForumAdmin() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/forum/categories`);
      if (res.ok) {
        const categories = await res.json();
        let allPosts: any[] = [];
        for (const cat of categories) {
          if (cat.posts) {
            allPosts = [...allPosts, ...cat.posts.map((p: any) => ({ ...p, category: cat.name }))];
          }
        }
        // Sort by newest
        allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(allPosts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce sujet définitivement ?")) return;
    
    await fetch(`${API_URL}/admin/forum/posts/${id}`, {
        credentials: "include",
      method: "DELETE",
      headers: {
      },
    });
    fetchPosts();
  };

  if (loading) return <div className="text-center mt-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <MessageSquare className="text-primary" /> Modération du Forum
        </h1>
        <p className="text-muted-foreground mt-2">
          Surveillez les discussions et supprimez les sujets inappropriés.
        </p>
      </div>

      <div className="bg-card/40 border border-white/10 rounded-[2rem] p-8 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground text-sm">
                <th className="pb-4 font-bold">Titre du sujet</th>
                <th className="pb-4 font-bold">Auteur</th>
                <th className="pb-4 font-bold">Catégorie</th>
                <th className="pb-4 font-bold">Date</th>
                <th className="pb-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 font-medium max-w-xs truncate">{p.title}</td>
                  <td className="py-4 text-sm">{p.author?.profile?.username || "Inconnu"}</td>
                  <td className="py-4 text-sm">
                    <span className="bg-white/5 px-2 py-1 rounded-md">{p.category}</span>
                  </td>
                  <td className="py-4 text-sm text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Aucun sujet trouvé dans le forum.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
