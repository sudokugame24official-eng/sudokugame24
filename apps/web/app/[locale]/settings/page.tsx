"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "@/navigation";
import {
  Settings as SettingsIcon,
  Lock,
  Bell,
  Volume2,
  VolumeX,
  Globe,
  Shield,
  Save,
  CheckCircle2,
  Moon,
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

export default function SettingsPage() {
  const { user, isLoading, checkAuth } = useAuth();
  const router = useRouter();

  // Settings State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [duelInvitesEnabled, setDuelInvitesEnabled] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const savedSound = localStorage.getItem("sudoku_sound_enabled");
    if (savedSound !== null) setSoundEnabled(savedSound === "true");

    const savedNotifs = localStorage.getItem("sudoku_notifs_enabled");
    if (savedNotifs !== null) setNotificationsEnabled(savedNotifs === "true");

    const savedDuel = localStorage.getItem("sudoku_duel_invites_enabled");
    if (savedDuel !== null) setDuelInvitesEnabled(savedDuel === "true");
  }, []);

  const handleSavePreferences = () => {
    setSavingSettings(true);
    localStorage.setItem("sudoku_sound_enabled", String(soundEnabled));
    localStorage.setItem("sudoku_notifs_enabled", String(notificationsEnabled));
    localStorage.setItem("sudoku_duel_invites_enabled", String(duelInvitesEnabled));

    setTimeout(() => {
      setSavingSettings(false);
      toast.success("Préférences sauvegardées avec succès !");
    }, 400);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit comporter au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(`${API_URL}/users/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Erreur lors du changement de mot de passe.");
      } else {
        toast.success("Mot de passe modifié avec succès !");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-navy flex items-center justify-center text-white">
        <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brand-navy text-foreground p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-brand-gold" />
          Paramètres du Compte & Préférences
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gérez votre mot de passe, les notifications et le comportement audio de vos parties de Sudoku.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Game & UI Preferences */}
        <div className="bg-[#0A2A5C]/80 border border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">Préférences de Jeu</h2>
              <p className="text-xs text-gray-400">Audio, notifications et défis</p>
            </div>
            <button
              onClick={handleSavePreferences}
              disabled={savingSettings}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-gold text-brand-navy font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {savingSettings ? "Enregistrement..." : "Sauvegarder"}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 className="w-5 h-5 text-brand-gold" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
                <div>
                  <h3 className="font-bold text-white text-sm">Effets Sonores & Musique</h3>
                  <p className="text-xs text-gray-400">Bruitages de placement de chiffres et victoires</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                  soundEnabled ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/5 text-gray-500"
                }`}
              >
                {soundEnabled ? "Activé" : "Désactivé"}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-brand-cyan" />
                <div>
                  <h3 className="font-bold text-white text-sm">Notifications en Direct</h3>
                  <p className="text-xs text-gray-400">Réception des réponses support, messages et alertes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                  notificationsEnabled ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/5 text-gray-500"
                }`}
              >
                {notificationsEnabled ? "Activé" : "Désactivé"}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-brand-orange" />
                <div>
                  <h3 className="font-bold text-white text-sm">Invitations aux Duels 1v1</h3>
                  <p className="text-xs text-gray-400">Autoriser les amis à vous envoyer des défis en temps réel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDuelInvitesEnabled(!duelInvitesEnabled)}
                className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                  duelInvitesEnabled ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/5 text-gray-500"
                }`}
              >
                {duelInvitesEnabled ? "Activé" : "Désactivé"}
              </button>
            </div>
          </div>
        </div>

        {/* Security & Password */}
        <div className="bg-[#0A2A5C]/80 border border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-gold" />
              Sécurité & Changement de Mot de Passe
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Assurez la sécurité de votre compte Sudoku</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
                Mot de Passe Actuel
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-brand-gold"
                placeholder="••••••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
                Nouveau Mot de Passe (min. 8 caractères)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-brand-gold"
                placeholder="••••••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
                Confirmer le Nouveau Mot de Passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-brand-gold"
                placeholder="••••••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="px-6 py-2.5 bg-brand-gold text-brand-navy font-black rounded-xl text-xs uppercase tracking-wider shadow-lg hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {savingPassword ? "Mise à jour..." : "Modifier le Mot de Passe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
