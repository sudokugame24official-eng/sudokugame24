"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { API_URL } from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  LifeBuoy,
  FileText,
  Palette,
  Settings,
  LogOut,
  BarChart,
  MessageSquare,
  ToggleLeft,
  Lock,
  Server,
  ScrollText,
  Megaphone,
  DollarSign,
  ShoppingCart,
  Image as ImageIcon,
  CalendarDays,
  Gamepad2,
} from "lucide-react";

// Staff roles allowed into the admin panel. The API enforces permissions
// per-endpoint; this gate only hides the UI from non-staff users.
const STAFF_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "CONTENT_MANAGER",
  "MODERATOR",
  "ANALYST",
  "SUPPORT_AGENT",
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const { user, isLoading: loading } = useAuth();
  const lang = params?.locale || "en";

  const isStaff = !!user && STAFF_ROLES.includes(user.role);

  React.useEffect(() => {
    if (!loading && !isStaff) {
      router.replace(`/${lang}/auth`);
    }
  }, [loading, isStaff, lang, router]);

  // 11 Logical Owner Groups matching World-Class Owner Control Center architecture
  const adminLabels: Record<string, Record<string, string>> = {
    fr: {
      "Overview": "1. Vue d'Ensemble",
      "Dashboard": "Tableau de bord",
      "Analytics": "Statistiques Globales",
      "Live Activity": "Activité en Direct",
      "System Health": "Santé Système",
      "Play & Games": "2. Jeux & Modes",
      "Game Modes": "Modes de Jeu",
      "Daily Challenge": "Défi Quotidien",
      "Duel Settings": "Paramètres de Duel",
      "Community": "3. Communauté & Joueurs",
      "Users": "Gestion des Utilisateurs",
      "Moderation": "Modération & Signalements",
      "Forum": "Forum & Sujets Officiels",
      "Support Tickets": "Support & Tickets",
      "Content": "4. Contenu & Médias",
      "CMS Articles": "Articles & Blog",
      "Media Library": "Médiathèque",
      "SEO & Growth": "5. SEO & Croissance",
      "SEO Control": "Contrôle SEO & Métas",
      "Marketing": "6. Marketing & Tracking",
      "Marketing Integrations": "Pixels & Intégrations",
      "Monetization": "7. Monétisation & Boutique",
      "Shop & Products": "Boutique & Produits",
      "Coin Economy": "Économie de Pièces",
      "Google Ads": "Publicités Google Ads",
      "Communication": "8. Communication & Emails",
      "Email Templates": "Modèles d'Emails",
      "Appearance": "9. Apparence & Marque",
      "Theme Studio": "Studio de Thème",
      "Homepage Builder": "Constructeur d'Accueil",
      "Security & Governance": "10. Sécurité & Gouvernance",
      "Roles & Permissions": "Rôles & Permissions",
      "Audit Logs": "Journaux d'Audit",
      "System": "11. Système & Maintenance",
      "Feature Flags": "Fonctionnalités & Flags",
      "Settings": "Paramètres Généraux",
      "logout": "Déconnexion",
      "ownerDashboard": "Owner Control Center — Sudoku Business OS",
      "unknown": "Inconnu",
      "loading": "Chargement du Control Center…",
      "accessDenied": "Accès réservé au Propriétaire",
      "accessDeniedDesc": "Cette section nécessite les privilèges d'administration."
    },
    de: {
      "Overview": "1. Übersicht",
      "Dashboard": "Dashboard",
      "Analytics": "Globale Analytik",
      "Live Activity": "Live-Aktivität",
      "System Health": "Systemstatus",
      "Play & Games": "2. Spiele & Modi",
      "Game Modes": "Spielmodi",
      "Daily Challenge": "Tägliche Herausforderung",
      "Duel Settings": "Duell-Einstellungen",
      "Community": "3. Community & Spieler",
      "Users": "Benutzerverwaltung",
      "Moderation": "Moderation & Berichte",
      "Forum": "Forum & Themen",
      "Support Tickets": "Support-Tickets",
      "Content": "4. Inhalt & Medien",
      "CMS Articles": "CMS-Artikel & Blog",
      "Media Library": "Medienbibliothek",
      "SEO & Growth": "5. SEO & Wachstum",
      "SEO Control": "SEO-Verwaltung & Metas",
      "Marketing": "6. Marketing & Tracking",
      "Marketing Integrations": "Pixel & Integrationen",
      "Monetization": "7. Monetarisierung & Shop",
      "Shop & Products": "Shop & Produkte",
      "Coin Economy": "Münzwirtschaft",
      "Google Ads": "Google Ads Werbung",
      "Communication": "8. Kommunikation & E-Mails",
      "Email Templates": "E-Mail-Vorlagen",
      "Appearance": "9. Erscheinungsbild & Marke",
      "Theme Studio": "Theme-Studio",
      "Homepage Builder": "Startseiten-Builder",
      "Security & Governance": "10. Sicherheit & Governance",
      "Roles & Permissions": "Rollen & Berechtigungen",
      "Audit Logs": "Audit-Protokolle",
      "System": "11. System & Wartung",
      "Feature Flags": "Feature-Flags",
      "Settings": "Allgemeine Einstellungen",
      "logout": "Abmelden",
      "ownerDashboard": "Owner Control Center — Sudoku Business OS",
      "unknown": "Unbekannt",
      "loading": "Wird geladen…",
      "accessDenied": "Zugriff verweigert",
      "accessDeniedDesc": "Dieser Bereich ist dem Administrationsteam vorbehalten."
    },
    en: {
      "Overview": "1. Overview",
      "Dashboard": "Dashboard",
      "Analytics": "Global Analytics",
      "Live Activity": "Live Activity",
      "System Health": "System Health",
      "Play & Games": "2. Play & Games",
      "Game Modes": "Game Modes",
      "Daily Challenge": "Daily Challenge",
      "Duel Settings": "Duel Settings",
      "Community": "3. Community & Players",
      "Users": "Users Management",
      "Moderation": "Moderation & Reports",
      "Forum": "Forum & Official Topics",
      "Support Tickets": "Support Tickets",
      "Content": "4. Content & Media",
      "CMS Articles": "CMS Articles & Blog",
      "Media Library": "Media Library",
      "SEO & Growth": "5. SEO & Growth",
      "SEO Control": "SEO Control & Metas",
      "Marketing": "6. Marketing & Tracking",
      "Marketing Integrations": "Pixels & Integrations",
      "Monetization": "7. Monetization & Shop",
      "Shop & Products": "Shop & Products",
      "Coin Economy": "Coin Economy",
      "Google Ads": "Google Ads",
      "Communication": "8. Communication & Emails",
      "Email Templates": "Email Templates",
      "Appearance": "9. Appearance & Branding",
      "Theme Studio": "Theme Studio",
      "Homepage Builder": "Homepage Builder",
      "Security & Governance": "10. Security & Governance",
      "Roles & Permissions": "Roles & Permissions",
      "Audit Logs": "Audit Logs",
      "System": "11. System & Maintenance",
      "Feature Flags": "Feature Flags",
      "Settings": "General Settings",
      "logout": "Log Out",
      "ownerDashboard": "Owner Control Center — Sudoku Business OS",
      "unknown": "Unknown",
      "loading": "Loading Control Center…",
      "accessDenied": "Access Denied",
      "accessDeniedDesc": "This section is restricted to the administration team."
    }
  };

  const tAdmin = (key: string) =>
    adminLabels[lang]?.[key] || adminLabels["en"]?.[key] || key;

  // 11 Complete Owner Control Center Navigation Groups
  const menuSections = [
    {
      title: tAdmin("Overview"),
      items: [
        { name: tAdmin("Dashboard"), path: "", icon: LayoutDashboard },
        { name: tAdmin("Analytics"), path: "/analytics", icon: BarChart },
        { name: tAdmin("System Health"), path: "/system/health", icon: Server },
      ],
    },
    {
      title: tAdmin("Play & Games"),
      items: [
        { name: tAdmin("Game Modes"), path: "/modes", icon: Gamepad2 },
        { name: tAdmin("Daily Challenge"), path: "/daily", icon: CalendarDays },
      ],
    },
    {
      title: tAdmin("Community"),
      items: [
        { name: tAdmin("Users"), path: "/users", icon: Users },
        { name: tAdmin("Moderation"), path: "/moderation", icon: ShieldAlert },
        { name: tAdmin("Forum"), path: "/forum", icon: MessageSquare },
        { name: tAdmin("Support Tickets"), path: "/support", icon: LifeBuoy },
      ],
    },
    {
      title: tAdmin("Content"),
      items: [
        { name: tAdmin("CMS Articles"), path: "/content", icon: FileText },
        { name: tAdmin("Media Library"), path: "/media", icon: ImageIcon },
      ],
    },
    {
      title: tAdmin("SEO & Growth"),
      items: [
        { name: tAdmin("SEO Control"), path: "/seo", icon: Megaphone },
      ],
    },
    {
      title: tAdmin("Marketing"),
      items: [
        { name: tAdmin("Marketing Integrations"), path: "/marketing", icon: DollarSign },
      ],
    },
    {
      title: tAdmin("Monetization"),
      items: [
        { name: tAdmin("Google Ads"), path: "/ads", icon: DollarSign },
        { name: tAdmin("Coin Economy"), path: "/monetization", icon: DollarSign },
        { name: tAdmin("Shop & Products"), path: "/shop", icon: ShoppingCart },
      ],
    },
    {
      title: tAdmin("Appearance"),
      items: [
        { name: tAdmin("Theme Studio"), path: "/theme", icon: Palette },
        { name: tAdmin("Homepage Builder"), path: "/homepage", icon: LayoutDashboard },
      ],
    },
    {
      title: tAdmin("Security & Governance"),
      items: [
        { name: tAdmin("Audit Logs"), path: "/audit", icon: ScrollText },
      ],
    },
    {
      title: tAdmin("System"),
      items: [
        { name: tAdmin("Feature Flags"), path: "/features", icon: ToggleLeft },
        { name: tAdmin("Settings"), path: "/settings", icon: Settings },
      ],
    },
  ];

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error(e);
    }
    router.push(`/${lang}/`);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020F24] text-white flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">{tAdmin("loading")}</p>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-[#020F24] text-white flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-black mb-2">{tAdmin("accessDenied")}</h1>
          <p className="text-muted-foreground">
            {tAdmin("accessDeniedDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020F24] text-white flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-card/40 border-r border-white/10 backdrop-blur-2xl flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/10">
          <Link href={`/${lang}/admin`} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/50">
              <span className="text-xl font-black text-primary">SP</span>
            </div>
            <div>
              <h1 className="font-black tracking-tight text-lg leading-tight">
                SUDOKU
                <br />
                PREMIUM
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Control Center
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {menuSections.map((section, idx) => (
            <div key={idx} className="mb-4">
              <div className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === `/${lang}/admin${item.path}`;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={`/${lang}/admin${item.path}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-180 ${
                      isActive
                        ? "bg-gradient-to-r from-brand-orange/20 to-brand-gold/10 text-white border border-brand-orange/40 shadow-[0_0_20px_rgba(255,69,0,0.15)]"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-100 hover:translate-x-1"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-brand-orange" : "text-slate-400"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          {/* Real identity from the authenticated session */}
          <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shrink-0 flex items-center justify-center text-sm font-black">
              {(user?.profile?.username || user?.email || "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">
                {user?.profile?.username || user?.email || tAdmin("unknown")}
              </p>
              <p className="text-xs text-primary truncate font-medium">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" /> {tAdmin("logout")}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-card/40 border-b border-white/10 backdrop-blur-2xl flex items-center justify-between px-8 shrink-0">
          <h2 className="text-xl font-black hidden md:block">{tAdmin("ownerDashboard")}</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
