"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Image as ImageIcon, Upload, Trash2, RefreshCw } from "lucide-react";
import { API_URL } from "@/lib/api";

interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  altText?: string | null;
  createdAt: string;
}

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/media`, { credentials: "include" });
      if (res.ok) setAssets(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_URL}/media/upload`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Erreur ${res.status}`);
      }
      setSuccess("Fichier téléversé.");
      setTimeout(() => setSuccess(""), 3000);
      fetchAssets();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const setAlt = async (a: MediaAsset, altText: string) => {
    await fetch(`${API_URL}/media/${a.id}/alt`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ altText }),
    });
    fetchAssets();
  };

  const remove = async (a: MediaAsset) => {
    if (!confirm(`Supprimer « ${a.filename} » ?`)) return;
    await fetch(`${API_URL}/media/${a.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchAssets();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-primary" />
            Médiathèque
          </h1>
          <p className="text-muted-foreground mt-2">
            Images pour articles et pages (JPG/PNG/WebP/GIF/SVG sains, max 5 Mo).
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAssets} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <label className={`flex items-center gap-2 bg-primary text-white font-bold px-5 py-3 rounded-xl cursor-pointer ${uploading ? "opacity-50" : "hover:bg-primary/80"}`}>
            <Upload className="w-4 h-4" />
            {uploading ? "Envoi..." : "Téléverser"}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,.svg"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 text-sm">{error}</div>}
      {success && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm">{success}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          <p className="col-span-full text-center text-muted-foreground py-8">Chargement...</p>
        ) : assets.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-8">Aucun média.</p>
        ) : (
          assets.map((a) => (
            <div key={a.id} className="bg-card/40 border border-white/10 rounded-2xl overflow-hidden">
              <div className="h-32 bg-white/5 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.altText || a.filename} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs font-mono truncate" title={a.filename}>{a.filename}</p>
                <p className="text-[10px] text-muted-foreground">{(a.sizeBytes / 1024).toFixed(0)} Ko · {a.mimeType}</p>
                <input
                  defaultValue={a.altText || ""}
                  placeholder="Texte alternatif (accessibilité/SEO)"
                  onBlur={(e) => setAlt(a, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs"
                />
                <button
                  onClick={() => remove(a)}
                  className="w-full flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 rounded-lg py-1.5 text-xs font-bold hover:bg-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
