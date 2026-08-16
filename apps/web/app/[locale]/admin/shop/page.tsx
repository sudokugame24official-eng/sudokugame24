"use client";
import React, { useCallback, useEffect, useState } from "react";
import { ShoppingCart, Plus, Pencil, Trash2, X, RefreshCw } from "lucide-react";
import { API_URL } from "@/lib/api";

interface ShopProduct {
  id: string;
  name: string;
  description?: string;
  priceCoins: number;
  type: string;
  entitlement?: string;
  category?: string;
  durationDays?: number;
  quantity?: number;
  maxPerUser?: number;
  stock?: number;
  isActive: boolean;
  isFeatured?: boolean;
  startDate?: string;
  endDate?: string;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  priceCoins: 100,
  type: "perk",
  entitlement: "EXTRA_HINTS",
  category: "utility",
  durationDays: "",
  quantity: "",
  maxPerUser: "",
  stock: "",
  isActive: true,
  isFeatured: false,
};

export default function AdminShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/shop/admin/products`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setProducts(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (p: ShopProduct) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      priceCoins: p.priceCoins,
      type: p.type,
      entitlement: p.entitlement || "EXTRA_HINTS",
      category: p.category || "utility",
      durationDays: p.durationDays ?? "",
      quantity: p.quantity ?? "",
      maxPerUser: p.maxPerUser ?? "",
      stock: p.stock ?? "",
      isActive: p.isActive,
      isFeatured: p.isFeatured ?? false,
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload: any = {
        name: form.name,
        description: form.description || undefined,
        priceCoins: Number(form.priceCoins),
        type: form.type,
        entitlement: form.type === "perk" ? form.entitlement : undefined,
        category: form.category,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
      };
      if (form.durationDays !== "") payload.durationDays = Number(form.durationDays);
      if (form.quantity !== "") payload.quantity = Number(form.quantity);
      if (form.maxPerUser !== "") payload.maxPerUser = Number(form.maxPerUser);
      if (form.stock !== "") payload.stock = Number(form.stock);

      const url = editing
        ? `${API_URL}/shop/admin/products/${editing.id}`
        : `${API_URL}/shop/admin/products`;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Erreur ${res.status}`);
      }
      flash(editing ? "Produit mis à jour." : "Produit créé.");
      setShowForm(false);
      fetchProducts();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p: ShopProduct) => {
    setBusy(true);
    try {
      await fetch(`${API_URL}/shop/admin/products/${p.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      fetchProducts();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: ShopProduct) => {
    if (!confirm(`Supprimer définitivement « ${p.name} » ?`)) return;
    setBusy(true);
    try {
      await fetch(`${API_URL}/shop/admin/products/${p.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      flash("Produit supprimé.");
      fetchProducts();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            Boutique
          </h1>
          <p className="text-muted-foreground mt-2">
            Produits achetables avec des coins — 100 % pilotable ici, sans code.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchProducts} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-bold px-5 py-3 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Nouveau produit
          </button>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 text-sm">{error}</div>}
      {success && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm">{success}</div>}

      <div className="bg-card/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-2xl">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Produit</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Prix</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Type</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Stock / Limite</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Statut</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Chargement...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun produit. Créez le premier !</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-bold">{p.name} {p.isFeatured && <span className="text-yellow-400">★</span>}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{p.description || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-yellow-400 font-bold">{p.priceCoins} 🪙</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">{p.type}</span>
                    {p.entitlement && <p className="text-xs text-muted-foreground mt-1">{p.entitlement}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {p.stock !== null && p.stock !== undefined ? `Stock: ${p.stock}` : "Illimité"}
                    {p.maxPerUser ? <p className="text-xs text-muted-foreground">Max/user: {p.maxPerUser}</p> : null}
                    {p.durationDays ? <p className="text-xs text-muted-foreground">{p.durationDays} jours</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(p)}
                      disabled={busy}
                      className={`px-2 py-1 rounded text-xs font-bold ${p.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground"}`}
                    >
                      {p.isActive ? "ACTIF" : "INACTIF"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20" title="Modifier">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(p)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-[#0A1E3F] border border-white/10 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black">{editing ? "Modifier le produit" : "Nouveau produit"}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Nom *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2} className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Prix (coins) *</label>
                <input required type="number" min={0} value={form.priceCoins}
                  onChange={(e) => setForm({ ...form, priceCoins: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Type *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full mt-1 bg-card/50 border border-white/10 rounded-xl p-3 text-sm">
                  <option value="perk">perk (avantage permanent/durée)</option>
                  <option value="consumable">consumable (utilisable)</option>
                </select>
              </div>
            </div>

            {form.type === "perk" && (
              <div>
                <label className="text-sm text-muted-foreground">Entitlement (perk)</label>
                <select value={form.entitlement} onChange={(e) => setForm({ ...form, entitlement: e.target.value })}
                  className="w-full mt-1 bg-card/50 border border-white/10 rounded-xl p-3 text-sm">
                  <option value="EXTRA_HINTS">EXTRA_HINTS</option>
                  <option value="NO_ADS">NO_ADS</option>
                  <option value="CHAT_VIP">CHAT_VIP</option>
                  <option value="CUSTOM_BADGE">CUSTOM_BADGE</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Catégorie</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full mt-1 bg-card/50 border border-white/10 rounded-xl p-3 text-sm">
                  <option value="utility">utility</option>
                  <option value="cosmetic">cosmetic</option>
                  <option value="privilege">privilege</option>
                  <option value="pack">pack</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Durée (jours, vide = permanent)</label>
                <input type="number" min={1} max={365} value={form.durationDays}
                  onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Qté (consommable)</label>
                <input type="number" min={1} value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Max / utilisateur</label>
                <input type="number" min={0} value={form.maxPerUser}
                  onChange={(e) => setForm({ ...form, maxPerUser: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Stock</label>
                <input type="number" min={0} value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm" />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Actif (visible en boutique)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                Mis en avant
              </label>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={busy}
                className="flex-1 bg-primary hover:bg-primary/80 disabled:opacity-40 text-white font-bold py-3 rounded-xl">
                {busy ? "..." : editing ? "Enregistrer" : "Créer le produit"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 font-bold py-3 rounded-xl">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
