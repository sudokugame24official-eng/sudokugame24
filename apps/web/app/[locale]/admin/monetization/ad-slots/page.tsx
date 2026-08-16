"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { Edit, Save, X, Plus, ToggleRight, ToggleLeft } from "lucide-react";

export default function AdSlotsAdmin() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<any>(null);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/ads`, {
        credentials: "include",
      });
      if (res.ok) setSlots(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    try {
      await fetch(`${API_URL}/admin/ads/${editingSlot.slotName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSlot),
        credentials: "include",
      });
      setEditingSlot(null);
      fetchSlots();
    } catch (e) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  const toggleStatus = async (slot: any) => {
    try {
      await fetch(`${API_URL}/admin/ads/${slot.slotName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...slot, enabled: !slot.enabled }),
        credentials: "include",
      });
      fetchSlots();
    } catch (e) {
      alert("Erreur");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black">Ad Management Center</h1>
          <p className="text-muted-foreground">
            Gérez vos emplacements publicitaires Google AdSense sans modifier le code.
          </p>
        </div>
        <button
          onClick={() => setEditingSlot({
            slotName: "", provider: "GoogleAdSense", enabled: false,
            deviceTarget: "ALL"
          })}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvel Emplacement
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <p>Chargement...</p>
        ) : (
          slots.map((slot) => (
            <div
              key={slot.slotName}
              className="bg-card border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg font-mono text-primary">{slot.slotName}</h3>
                  <span className="px-2 py-1 bg-white/5 rounded text-xs text-muted-foreground uppercase">
                    {slot.deviceTarget}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Provider: {slot.provider} <br/>
                  Client ID: {slot.publisherId || 'Non défini'} | Slot ID: {slot.adSlotId || 'Non défini'}
                </p>
                {slot.pageTarget && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cible: {slot.pageTarget}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleStatus(slot)}
                  className={`transition-colors ${slot.enabled ? "text-green-500" : "text-muted-foreground hover:text-white"}`}
                >
                  {slot.enabled ? (
                    <ToggleRight className="w-10 h-10" />
                  ) : (
                    <ToggleLeft className="w-10 h-10" />
                  )}
                </button>
                <button
                  onClick={() => setEditingSlot(slot)}
                  className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <Edit className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editingSlot && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-white/10 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                {editingSlot.slotName ? "Modifier l'emplacement" : "Nouvel emplacement"}
              </h3>
              <button onClick={() => setEditingSlot(null)} className="text-muted-foreground hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Nom du Slot (ex: homepage_banner)</label>
                <input
                  type="text"
                  required
                  disabled={!!slots.find(s => s.slotName === editingSlot.slotName)} // disable if editing existing
                  value={editingSlot.slotName}
                  onChange={(e) => setEditingSlot({...editingSlot, slotName: e.target.value})}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Provider</label>
                  <select
                    value={editingSlot.provider}
                    onChange={(e) => setEditingSlot({...editingSlot, provider: e.target.value})}
                    className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="GoogleAdSense">Google AdSense</option>
                    <option value="Custom">Custom HTML</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Appareils</label>
                  <select
                    value={editingSlot.deviceTarget}
                    onChange={(e) => setEditingSlot({...editingSlot, deviceTarget: e.target.value})}
                    className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="ALL">Tous</option>
                    <option value="DESKTOP">Desktop Uniquement</option>
                    <option value="MOBILE">Mobile Uniquement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Publisher ID (ex: ca-pub-XXXXX)</label>
                <input
                  type="text"
                  value={editingSlot.publisherId || ""}
                  onChange={(e) => setEditingSlot({...editingSlot, publisherId: e.target.value})}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Ad Slot ID</label>
                <input
                  type="text"
                  value={editingSlot.adSlotId || ""}
                  onChange={(e) => setEditingSlot({...editingSlot, adSlotId: e.target.value})}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Page Cible (Regex ou Path optionnel)</label>
                <input
                  type="text"
                  value={editingSlot.pageTarget || ""}
                  placeholder="ex: ^/sudoku/.*"
                  onChange={(e) => setEditingSlot({...editingSlot, pageTarget: e.target.value})}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Placement</label>
                  <select
                    value={editingSlot.placement || "leaderboard"}
                    onChange={(e) => setEditingSlot({...editingSlot, placement: e.target.value})}
                    className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="leaderboard">leaderboard</option>
                    <option value="in_content">in_content</option>
                    <option value="sidebar">sidebar</option>
                    <option value="post_game">post_game</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Format</label>
                  <select
                    value={editingSlot.format || "auto"}
                    onChange={(e) => setEditingSlot({...editingSlot, format: e.target.value})}
                    className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="auto">auto</option>
                    <option value="horizontal">horizontal</option>
                    <option value="rectangle">rectangle</option>
                    <option value="vertical">vertical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">Largeur (px)</label>
                  <input
                    type="number" min={0} max={2000}
                    value={editingSlot.width ?? ""}
                    onChange={(e) => setEditingSlot({...editingSlot, width: e.target.value === "" ? undefined : Number(e.target.value)})}
                    className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Hauteur (px, anti-CLS)</label>
                  <input
                    type="number" min={0} max={2000}
                    value={editingSlot.height ?? ""}
                    onChange={(e) => setEditingSlot({...editingSlot, height: e.target.value === "" ? undefined : Number(e.target.value)})}
                    className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Cap fréquence/session</label>
                  <input
                    type="number" min={0} max={1000}
                    value={editingSlot.frequencyCap ?? ""}
                    onChange={(e) => setEditingSlot({...editingSlot, frequencyCap: e.target.value === "" ? undefined : Number(e.target.value)})}
                    className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editingSlot.lazyLoad !== false}
                    onChange={(e) => setEditingSlot({...editingSlot, lazyLoad: e.target.checked})}
                  />
                  Lazy loading (chargement à l&apos;apparition)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editingSlot.consentRequired !== false}
                    onChange={(e) => setEditingSlot({...editingSlot, consentRequired: e.target.checked})}
                  />
                  Consentement RGPD requis
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
