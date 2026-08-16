"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  LifeBuoy,
  FileText,
  Palette,
  DollarSign,
  Settings,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  BarChart,
  Gamepad2,
  MessageSquare,
  ShoppingCart,
  Coins,
  Trophy,
  Megaphone,
  Search,
  Image as ImageIcon,
  Bell,
  ToggleLeft,
  Plug,
  Lock,
  Server,
  ChevronDown,
  ChevronRight
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const lang = params?.locale || "en";

  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    'Sudoku': false,
    'Community': false,
    'Content': false,
    'Monetization': false,
    'Security': false,
    'System': false,
  });

  const toggleSection = (name: string) => {
    setExpandedSections(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const menuSections = [
    {
      title: "Main",
      items: [
        { name: "Dashboard", path: "", icon: LayoutDashboard },
        { name: "Analytics", path: "/analytics", icon: BarChart },
        { name: "Users", path: "/users", icon: Users },
        { name: "Moderation", path: "/moderation", icon: ShieldAlert },
      ]
    },
    {
      title: "Sudoku",
      icon: Gamepad2,
      subItems: [
        { name: "Games", path: "/sudoku/games" },
        { name: "Daily Challenge", path: "/sudoku/daily" },
        { name: "Duel", path: "/sudoku/duel" },
        { name: "Puzzles", path: "/sudoku/puzzles" },
        { name: "Difficulty", path: "/sudoku/difficulty" },
      ]
    },
    {
      title: "Community",
      icon: MessageSquare,
      subItems: [
        { name: "Chat", path: "/community/chat" },
        { name: "Forum", path: "/community/forum" },
        { name: "Q&A", path: "/community/qa" },
        { name: "Reports", path: "/community/reports" },
        { name: "Rankings", path: "/community/rankings" },
      ]
    },
    {
      title: "Content",
      icon: FileText,
      subItems: [
        { name: "Pages", path: "/content/pages" },
        { name: "Blog", path: "/content/blog" },
        { name: "Tutorials", path: "/content/tutorials" },
        { name: "Knowledge Hub", path: "/content/knowledge" },
        { name: "FAQ", path: "/content/faq" },
        { name: "Help", path: "/content/help" },
      ]
    },
    {
      title: "Economy",
      items: [
        { name: "Shop", path: "/shop", icon: ShoppingCart },
        { name: "Coins & Economy", path: "/economy", icon: Coins },
        { name: "Achievements", path: "/achievements", icon: Trophy },
      ]
    },
    {
      title: "Monetization",
      icon: DollarSign,
      subItems: [
        { name: "Stripe", path: "/monetization/stripe" },
        { name: "Google Ads", path: "/monetization/ads" },
        { name: "Ad Slots", path: "/monetization/ad-slots" },
      ]
    },
    {
      title: "Platform",
      items: [
        { name: "SEO", path: "/seo", icon: Search },
        { name: "Media", path: "/media", icon: ImageIcon },
        { name: "Themes", path: "/themes", icon: Palette },
        { name: "Notifications", path: "/notifications", icon: Bell },
        { name: "Features", path: "/features", icon: ToggleLeft },
        { name: "Settings", path: "/settings", icon: Settings },
        { name: "Integrations", path: "/integrations", icon: Plug },
      ]
    },
    {
      title: "Security",
      icon: Lock,
      subItems: [
        { name: "Roles", path: "/security/roles" },
        { name: "Permissions", path: "/security/permissions" },
        { name: "Audit Logs", path: "/security/audit" },
      ]
    },
    {
      title: "System",
      icon: Server,
      subItems: [
        { name: "Health", path: "/system/health" },
        { name: "Jobs", path: "/system/jobs" },
        { name: "Cache", path: "/system/cache" },
        { name: "Backups", path: "/system/backups" },
        { name: "Maintenance", path: "/system/maintenance" },
      ]
    }
  ];

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
              {section.items ? (
                <>
                  {section.title !== "Main" && (
                    <div className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                      {section.title}
                    </div>
                  )}
                  {section.items.map((item) => {
                    const isActive = pathname === `/${lang}/admin${item.path}`;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        href={`/${lang}/admin${item.path}`}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? "bg-primary/20 text-white border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                            : "text-muted-foreground hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${isActive ? "text-primary" : ""}`}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </>
              ) : (
                <>
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {section.icon && <section.icon className="w-5 h-5" />}
                      {section.title}
                    </div>
                    {expandedSections[section.title] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {expandedSections[section.title] && (
                    <div className="ml-9 mt-1 space-y-1">
                      {section.subItems?.map((subItem) => {
                        const isActive = pathname === `/${lang}/admin${subItem.path}`;
                        return (
                          <Link
                            key={subItem.path}
                            href={`/${lang}/admin${subItem.path}`}
                            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              isActive
                                ? "bg-primary/20 text-white border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                                : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shrink-0" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">Admin User</p>
              <p className="text-xs text-primary truncate font-medium">
                SUPER_ADMIN
              </p>
            </div>
          </div>
          <Link
            href={`/${lang}/`}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" /> Quitter l'Admin
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-card/40 border-b border-white/10 backdrop-blur-2xl flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black hidden md:block">
              Owner Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Recherche globale..."
                className="w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 cursor-pointer hover:bg-white/10 transition-colors relative">
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
              <ShieldAlert className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
