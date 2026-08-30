"use client";
import React, { useEffect, useState, useRef } from "react";
import { API_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Activity,
  Clock,
  Shield,
  PlayCircle,
  Settings as SettingsIcon,
  Trophy,
  Star,
  Lock,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  Coins,
  Flame,
  Swords,
  Sparkles,
  Globe,
  MapPin,
  Calendar,
  Ruler,
  Weight,
  Heart,
  Share2,
  Upload,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { PlayerIdentity } from "@/components/PlayerIdentity";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, Link } from "@/navigation";
import { toast } from "sonner";

const AVATAR_PRESETS = [
  { id: "grandmaster", url: "/avatars/avatar_grandmaster.svg", name: "Grand Maître", tag: "Élite" },
  { id: "champion", url: "/avatars/avatar_champion.svg", name: "Champion", tag: "Trophée" },
  { id: "neon", url: "/avatars/avatar_neon.svg", name: "Cyber Ninja", tag: "Vitesse" },
  { id: "tactician", url: "/avatars/avatar_tactician.svg", name: "Tacticien", tag: "Stratégie" },
  { id: "samurai", url: "/avatars/avatar_samurai.svg", name: "Samouraï", tag: "Honneur" },
  { id: "cyber", url: "/avatars/avatar_cyber.svg", name: "Quantum", tag: "Logique" },
  { id: "zen", url: "/avatars/avatar_zen.svg", name: "Maître Zen", tag: "Sérénité" },
  { id: "wizard", url: "/avatars/avatar_wizard.svg", name: "Sorcier", tag: "Magie" },
];

const POPULAR_COUNTRIES = [
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "BE", name: "Belgique", flag: "🇧🇪" },
  { code: "CH", name: "Suisse", flag: "🇨🇭" },
  { code: "US", name: "États-Unis", flag: "🇺🇸" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪" },
  { code: "ES", name: "Espagne", flag: "🇪🇸" },
  { code: "IT", name: "Italie", flag: "🇮🇹" },
  { code: "JP", name: "Japon", flag: "🇯🇵" },
  { code: "MA", name: "Maroc", flag: "🇲🇦" },
  { code: "DZ", name: "Algérie", flag: "🇩🇿" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳" },
  { code: "BR", name: "Brésil", flag: "🇧🇷" },
];

export default function ProfilePage() {
  const { user, isLoading: authLoading, checkAuth } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"profile" | "edit" | "security" | "stats">("profile");
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Edit Profile form state
  const [editUsername, setEditUsername] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editAge, setEditAge] = useState<string | number>("");
  const [editHeight, setEditHeight] = useState<string | number>("");
  const [editWeight, setEditWeight] = useState<string | number>("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.id) {
      setEditUsername(user.profile?.username || "");
      setEditAvatarUrl(user.profile?.avatarUrl || "");
      setEditBio(user.profile?.bio || "");
      setEditCountry(user.profile?.country || "");
      setEditAge(user.profile?.age ?? "");
      setEditHeight(user.profile?.height ?? "");
      setEditWeight(user.profile?.weight ?? "");

      fetch(`${API_URL}/users/stats/${user.id}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
          setStatsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load stats", err);
          setStatsLoading(false);
        });
    }
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image valide (PNG, JPG, WEBP, SVG).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (maximum 2 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setEditAvatarUrl(dataUrl);
        toast.success("Photo chargée avec succès ! Cliquez sur 'Sauvegarder mon Profil'.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearAvatar = () => {
    setEditAvatarUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsername.trim()) {
      toast.error("Le pseudo ne peut pas être vide.");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch(`${API_URL}/users/profile/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editUsername.trim(),
          avatarUrl: editAvatarUrl.trim(),
          bio: editBio.trim(),
          country: editCountry.trim(),
          age: editAge === "" ? null : editAge,
          height: editHeight === "" ? null : editHeight,
          weight: editWeight === "" ? null : editWeight,
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Erreur lors de la mise à jour du profil.");
      } else {
        toast.success("Profil social mis à jour avec succès !");
        if (checkAuth) await checkAuth();
        setActiveTab("profile");
      }
    } catch {
      toast.error("Erreur de connexion avec le serveur.");
    } finally {
      setSavingProfile(false);
    }
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
        setActiveTab("profile");
      }
    } catch {
      toast.error("Erreur de connexion avec le serveur.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-navy flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brand-navy text-foreground p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-20">
      {/* ─── TOP HERO PROFILE BANNER ─── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-6 md:p-8 bg-gradient-to-r from-[#0A2A5C] via-[#041E42] to-[#020F24]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar with preset quick selector */}
            <div className="relative group">
              <UserAvatar
                avatarUrl={user.profile?.avatarUrl || editAvatarUrl}
                username={user.profile?.username || user.email}
                size="2xl"
                borderClassName="border-4 border-brand-gold/70 shadow-[0_0_25px_rgba(255,204,0,0.3)]"
              />
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className="absolute bottom-0 right-0 p-2.5 bg-brand-gold text-brand-navy rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                title="Modifier mon profil & photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {user.profile?.username || user.email?.split("@")[0] || "Joueur"}
                </h1>
                <span className="px-3 py-1 bg-brand-gold/20 text-brand-gold border border-brand-gold/30 rounded-full text-xs font-black uppercase tracking-wider">
                  Niveau {stats?.level || user.profile?.level || 1}
                </span>
                {user.profile?.country && (
                  <span className="px-3 py-1 bg-white/10 text-white border border-white/15 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
                    {user.profile.country}
                  </span>
                )}
                {user.role === "SUPER_ADMIN" || user.role === "ADMIN" ? (
                  <span className="px-3 py-1 bg-brand-orange/20 text-brand-orange border border-brand-orange/30 rounded-full text-xs font-black uppercase">
                    Admin
                  </span>
                ) : null}
              </div>

              {/* Bio snippet if available */}
              {user.profile?.bio && (
                <p className="text-xs text-gray-300 italic max-w-lg leading-relaxed line-clamp-2">
                  "{user.profile.bio}"
                </p>
              )}

              <p className="text-xs text-gray-400 font-mono">{user.email}</p>

              {/* Badges / Economy */}
              <div className="flex flex-wrap gap-2.5 pt-1 text-xs justify-center md:justify-start">
                <span className="flex items-center gap-1.5 text-brand-gold font-bold bg-white/5 border border-white/5 px-3 py-1 rounded-xl">
                  <Coins className="w-4 h-4" /> {user.profile?.coins ?? 1000} Pièces
                </span>
                <span className="flex items-center gap-1.5 text-amber-400 font-bold bg-white/5 border border-white/5 px-3 py-1 rounded-xl">
                  <Flame className="w-4 h-4" /> Série : {user.profile?.currentStreak ?? 0} jours
                </span>
                <span className="flex items-center gap-1.5 text-brand-cyan font-bold bg-white/5 border border-white/5 px-3 py-1 rounded-xl">
                  <Swords className="w-4 h-4" /> Elo Duel : {Math.round(stats?.rating || user.profile?.rating || 1500)}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("edit")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "edit"
                  ? "bg-brand-gold text-brand-navy shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <SettingsIcon className="w-4 h-4" /> Modifier Profil
            </button>
          </div>
        </div>
      </div>

      {/* ─── NAVIGATION TABS ─── */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-2">
        {[
          { id: "profile", label: "Aperçu Communauté", icon: User },
          { id: "edit", label: "Modifier Profil & Identité", icon: SettingsIcon },
          { id: "security", label: "Sécurité & Mot de Passe", icon: Lock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? "bg-brand-gold text-brand-navy shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Player Card Info */}
        <div className="col-span-1 space-y-6">
          {/* Social Bio & Details Card */}
          <div className="bg-[#0A2A5C]/80 border border-white/10 p-6 rounded-3xl shadow-xl space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-brand-gold flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Fiche du Joueur
            </h2>

            {user.profile?.bio ? (
              <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5">
                <p className="text-xs text-gray-300 leading-relaxed italic">
                  "{user.profile.bio}"
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                Aucune biographie rédigée. Cliquez sur "Modifier Profil" pour vous présenter à la communauté.
              </p>
            )}

            <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-cyan" /> Pays :
                </span>
                <span className="font-bold text-white">
                  {user.profile?.country || "Non renseigné"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-orange" /> Âge :
                </span>
                <span className="font-bold text-white">
                  {user.profile?.age ? `${user.profile.age} ans` : "Non renseigné"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-green-400" /> Taille :
                </span>
                <span className="font-bold text-white">
                  {user.profile?.height ? `${user.profile.height} cm` : "Non renseigné"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Weight className="w-3.5 h-3.5 text-purple-400" /> Poids :
                </span>
                <span className="font-bold text-white">
                  {user.profile?.weight ? `${user.profile.weight} kg` : "Non renseigné"}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="bg-[#0A2A5C]/80 border border-white/10 p-6 rounded-3xl shadow-xl space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-brand-gold flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Statistiques Compétitives
            </h2>

            <div className="space-y-3 divide-y divide-white/5 text-sm">
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-400 text-xs">Score Elo Duel :</span>
                <span className="font-mono font-bold text-brand-gold">
                  {Math.round(stats?.rating || user.profile?.rating || 1500)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-400 text-xs">Parties Jouées :</span>
                <span className="font-mono font-bold text-white">
                  {stats?.gamesPlayed || user.profile?.gamesPlayed || 0}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-400 text-xs">Victoires en Duel :</span>
                <span className="font-mono font-bold text-green-400">
                  {stats?.gamesWon || user.profile?.gamesWon || 0}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-400 text-xs">Taux de Réussite :</span>
                <span className="font-mono font-bold text-green-400">
                  {Math.round(stats?.winRate || 0)}%
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-400 text-xs">Meilleur Temps :</span>
                <span className="font-mono font-bold text-brand-cyan">
                  {stats?.bestTimeSec
                    ? `${Math.floor(stats.bestTimeSec / 60)
                        .toString()
                        .padStart(2, "0")}:${(stats.bestTimeSec % 60)
                        .toString()
                        .padStart(2, "0")}`
                    : "--:--"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Tabs */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0A2A5C]/80 border border-white/10 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
                  <div className="w-12 h-12 bg-brand-gold/20 rounded-2xl flex items-center justify-center text-brand-gold">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Temps Moyen</p>
                    <p className="text-xl font-bold font-mono text-white mt-0.5">
                      {stats?.averageTimeSec
                        ? `${Math.floor(stats.averageTimeSec / 60)}m ${stats.averageTimeSec % 60}s`
                        : "En cours de calcul"}
                    </p>
                  </div>
                </div>

                <div className="bg-[#0A2A5C]/80 border border-white/10 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Ligue Actuelle</p>
                    <p className="text-xl font-bold text-white mt-0.5">
                      {stats?.rating > 2000 ? "Grand Maître" : stats?.rating > 1700 ? "Diamant" : stats?.rating > 1500 ? "Or" : "Argent"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Play Banner */}
              <div className="bg-[#0A2A5C]/80 border border-white/10 p-8 rounded-3xl shadow-xl text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                  <PlayCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">Prêt pour votre prochaine partie ?</h3>
                <p className="text-xs text-gray-300 max-w-md mx-auto">
                  Résolvez votre défi quotidien, lancez une grille solo ou défiez vos amis dans l'arène 1v1.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Link
                    href="/daily"
                    className="px-6 py-2.5 bg-brand-gold text-brand-navy font-black text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition-all shadow-lg"
                  >
                    Défi Quotidien
                  </Link>
                  <Link
                    href="/duel"
                    className="px-6 py-2.5 bg-brand-orange text-white font-black text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition-all shadow-lg"
                  >
                    Arène de Duel 1v1
                  </Link>
                  <Link
                    href="/friends"
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-white/10"
                  >
                    Communauté & Amis
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT SOCIAL PROFILE */}
          {activeTab === "edit" && (
            <div className="bg-[#0A2A5C]/80 border border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-gold" />
                  Personnaliser mon Profil & Réseau Social
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Mettez à jour vos informations publiques, votre avatar et votre bio pour les classements mondiaux.
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
                    Pseudo Public (3 à 25 caractères)
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white font-bold focus:outline-none focus:border-brand-gold"
                    placeholder="Votre pseudo"
                    required
                  />
                </div>

                {/* Avatar Presets & Custom Photo */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-300 uppercase">
                      Avatar / Photo de Profil
                    </label>
                    {editAvatarUrl && (
                      <button
                        type="button"
                        onClick={handleClearAvatar}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Retirer l'avatar
                      </button>
                    )}
                  </div>

                  {/* Active Avatar Selection Preview */}
                  <div className="p-4 bg-black/40 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <UserAvatar
                        avatarUrl={editAvatarUrl}
                        username={editUsername || user.profile?.username || user.email}
                        size="lg"
                        borderClassName="border-2 border-brand-gold shadow-[0_0_15px_rgba(255,204,0,0.3)]"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">
                          {AVATAR_PRESETS.find((p) => p.url === editAvatarUrl)
                            ? `Avatar Officiel : ${AVATAR_PRESETS.find((p) => p.url === editAvatarUrl)?.name}`
                            : editAvatarUrl
                            ? "Photo / Image Personnalisée"
                            : "Initiale par défaut"}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {editAvatarUrl
                            ? "✓ Prêt à être sauvegardé sur votre profil"
                            : "Sélectionnez un avatar ci-dessous ou importez votre propre photo"}
                        </p>
                      </div>
                    </div>

                    {/* File Upload Trigger */}
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow"
                      >
                        <Upload className="w-4 h-4 text-brand-gold" />
                        Importer une photo
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Official Avatars Grid */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-2.5">
                      Ou choisissez un Avatar Officiel (1 clic, aucune URL requise) :
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {AVATAR_PRESETS.map((preset) => {
                        const isSelected = editAvatarUrl === preset.url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setEditAvatarUrl(preset.url)}
                            className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 relative group cursor-pointer ${
                              isSelected
                                ? "border-brand-gold bg-brand-gold/15 shadow-[0_0_20px_rgba(255,204,0,0.3)] scale-102"
                                : "border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/5"
                            }`}
                          >
                            <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center p-1 bg-black/50 border border-white/10">
                              <img src={preset.url} alt={preset.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-bold text-white group-hover:text-brand-gold transition-colors">{preset.name}</p>
                              <span className="text-[10px] text-gray-400 font-mono">{preset.tag}</span>
                            </div>
                            {isSelected && (
                              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-gold rounded-full ring-4 ring-brand-gold/20" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* External Image Link (Optional, type="text" to prevent HTML5 URL error) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">
                      Ou coller une URL d'image externe (Optionnel) :
                    </label>
                    <input
                      type="text"
                      value={editAvatarUrl.startsWith("data:") ? "" : editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-gold placeholder-gray-500"
                      placeholder="https://exemple.com/mon-image.jpg ou laisser vide"
                    />
                  </div>
                </div>

                {/* Biography */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-2 flex justify-between">
                    <span>Biographie & Description Personnelle</span>
                    <span className="text-gray-500 font-normal">{editBio.length}/500</span>
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-brand-gold leading-relaxed"
                    placeholder="Parlez de votre passion pour le Sudoku, vos tactiques favorites ou vos objectifs compétitifs..."
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
                    Pays d'Origine
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-brand-gold"
                      placeholder="Ex: France, Canada, Belgique, Suisse, Maroc..."
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {POPULAR_COUNTRIES.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setEditCountry(`${c.flag} ${c.name}`)}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-xs text-gray-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>{c.flag}</span>
                          <span>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Social & Physical Attributes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-orange" /> Âge
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                      placeholder="Ex: 25"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-2 flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-green-400" /> Taille (cm)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={260}
                      value={editHeight}
                      onChange={(e) => setEditHeight(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                      placeholder="Ex: 175"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-2 flex items-center gap-1.5">
                      <Weight className="w-3.5 h-3.5 text-purple-400" /> Poids (kg)
                    </label>
                    <input
                      type="number"
                      min={20}
                      max={300}
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                      placeholder="Ex: 70"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 bg-brand-gold text-brand-navy font-black rounded-xl text-xs uppercase tracking-wider shadow-lg hover:brightness-110 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {savingProfile ? "Enregistrement..." : "Sauvegarder mon Profil"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: SECURITY & PASSWORD */}
          {activeTab === "security" && (
            <div className="bg-[#0A2A5C]/80 border border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-brand-gold" />
                  Sécurité & Mot de Passe
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Modifiez votre mot de passe pour sécuriser votre compte Sudoku.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-6 py-2.5 bg-brand-gold text-brand-navy font-black rounded-xl text-xs uppercase tracking-wider shadow-lg hover:brightness-110 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    {savingPassword ? "Mise à jour..." : "Modifier le Mot de Passe"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
