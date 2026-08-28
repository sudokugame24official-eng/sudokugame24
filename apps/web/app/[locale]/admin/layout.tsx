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

  // 10 Logical Admin Groups matching Owner Control Center architecture
  const menuSections = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", path: "", icon: LayoutDashboard },
        { name: "Analytics", path: "/analytics", icon: BarChart },
        { name: "System Health", path: "/system/health", icon: Server },
      ],
    },
    {
      title: "Play & Games",
      items: [
        { name: "Game Modes", path: "/modes", icon: Gamepad2 },
        { name: "Daily Challenge", path: "/daily", icon: CalendarDays },
      ],
    },
    {
      title: "Community & Support",
      items: [
        { name: "Users", path: "/users", icon: Users },
        { name: "Moderation", path: "/moderation", icon: ShieldAlert },
        { name: "Forum", path: "/forum", icon: MessageSquare },
        { name: "Support Tickets", path: "/support", icon: LifeBuoy },
      ],
    },
    {
      title: "Content & Media",
      items: [
        { name: "CMS Articles", path: "/content", icon: FileText },
        { name: "Media Library", path: "/media", icon: ImageIcon },
      ],
    },
    {
      title: "Monetization & Growth",
      items: [
        { name: "Shop & Perks", path: "/shop", icon: ShoppingCart },
        { name: "Monetization & Ads", path: "/monetization", icon: DollarSign },
        { name: "SEO Control", path: "/seo", icon: Megaphone },
      ],
    },
    {
      title: "Appearance & Settings",
      items: [
        { name: "Theme Studio", path: "/theme", icon: Palette },
        { name: "Homepage Builder", path: "/homepage", icon: LayoutDashboard },
        { name: "Feature Flags", path: "/features", icon: ToggleLeft },
        { name: "Audit Logs", path: "/audit", icon: ScrollText },
        { name: "Settings", path: "/settings", icon: Settings },
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
        <p className="text-muted-foreground animate-pulse">Chargement…</p>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-[#020F24] text-white flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-black mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">
            Cette section est réservée à l&apos;équipe d&apos;administration.
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/20 text-white border border-primary/30"
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
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
                {user?.profile?.username || user?.email || "Inconnu"}
              </p>
              <p className="text-xs text-primary truncate font-medium">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-card/40 border-b border-white/10 backdrop-blur-2xl flex items-center justify-between px-8 shrink-0">
          <h2 className="text-xl font-black hidden md:block">Owner Dashboard</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
