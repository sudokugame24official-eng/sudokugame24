"use client";
import React, { useState, useEffect } from "react";
import {
  Bell,
  User,
  Menu,
  X,
  Trophy,
  BookOpen,
  HelpCircle,
  Users as UsersIcon,
  LogOut,
  Settings as SettingsIcon,
  Swords,
  Play,
  Calendar,
  MessageSquare,
  ChevronDown,
  Star,
  Zap,
  Home,
  Globe,
  Search,
} from "lucide-react";
import { Link } from "@/navigation";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

/* ---------- Animated Sudoku Grid Logo Icon ---------- */
const SudokuLogoIcon = () => (
  <motion.div
    whileHover={{ scale: 1.1, rotate: 5 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="w-9 h-9 rounded-xl relative overflow-hidden shadow-[0_0_15px_rgba(255,69,0,0.5)]"
    style={{ background: "linear-gradient(135deg, #FF4500, #FF6B33)" }}
  >
    <div className="absolute inset-0.5 grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5">
      {[...Array(9)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 2,
            delay: i * 0.15,
            repeat: Infinity,
            repeatDelay: 1.5,
          }}
          className="rounded-[2px]"
          style={{ background: i % 3 === 1 ? "rgba(255,204,0,0.9)" : "rgba(255,255,255,0.7)" }}
        />
      ))}
    </div>
  </motion.div>
);

/* ---------- Top Gradient Accent Bar ---------- */
const TopAccentBar = () => (
  <div className="h-[3px] w-full overflow-hidden">
    <motion.div
      animate={{ x: ["-100%", "100%"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      className="h-full w-1/2"
      style={{
        background:
          "linear-gradient(90deg, transparent, #FF4500, #FFCC00, #FF4500, transparent)",
      }}
    />
  </div>
);

/* ---------- Mega Dropdown Item ---------- */
/* ---------- Mega Dropdown Item ---------- */
const MegaItem = ({
  href,
  icon: Icon,
  label,
  desc,
  color = "text-white",
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  desc?: string;
  color?: string;
}) => (
  <Link href={href}>
    <motion.div
      whileHover={{ x: 6, backgroundColor: "rgba(255,255,255,0.08)" }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group/item"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner transition-transform duration-200 group-hover/item:scale-110"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className={`text-sm font-black tracking-wide transition-colors ${color}`}>{label}</p>
        {desc && <p className="text-[11px] text-gray-400 font-medium">{desc}</p>}
      </div>
    </motion.div>
  </Link>
);

/* ---------- Nav Dropdown Wrapper ---------- */
const NavDropdown = ({
  label,
  href,
  children,
  isActive,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
  isActive: boolean;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative py-5"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={href}
        className={`group relative px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[14px] font-black uppercase tracking-wider transition-all duration-200 ${
          isActive
            ? "text-brand-gold bg-brand-gold/10"
            : "text-white/85 hover:text-brand-gold hover:bg-white/5"
        }`}
      >
        <span>{label}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/60 group-hover:text-brand-gold transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
      </Link>

      {/* Active / Hover Glow Underline */}
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute bottom-2 left-3 right-3 h-0.5 rounded-full shadow-[0_0_8px_#FFCC00]"
          style={{ background: "linear-gradient(90deg, #FF4500, #FFCC00)" }}
        />
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="absolute top-full left-0 pt-2 z-50"
          >
            <div
              className="rounded-2xl border border-brand-gold/20 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden min-w-[240px] backdrop-blur-2xl"
              style={{
                background:
                  "linear-gradient(155deg, rgba(10,42,92,0.98) 0%, rgba(4,30,66,0.99) 100%)",
              }}
            >
              <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, #FF4500, #FFCC00, #00BFFF)" }} />
              <div className="p-2 space-y-0.5">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ---------- Simple Nav Link ---------- */
const NavLink = ({ href, label, isActive }: { href: string; label: string; isActive: boolean }) => (
  <div className="relative py-5">
    <Link
      href={href}
      className={`group px-3 py-1.5 rounded-lg text-[14px] font-black uppercase tracking-wider transition-all duration-200 flex items-center ${
        isActive
          ? "text-brand-gold bg-brand-gold/10"
          : "text-white/85 hover:text-brand-gold hover:bg-white/5"
      }`}
    >
      {label}
    </Link>
    {isActive && (
      <motion.div
        layoutId="nav-indicator"
        className="absolute bottom-2 left-3 right-3 h-0.5 rounded-full shadow-[0_0_8px_#FFCC00]"
        style={{ background: "linear-gradient(90deg, #FF4500, #FFCC00)" }}
      />
    )}
  </div>
);

/* ---------- MAIN HEADER ---------- */
export const Header = () => {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const isActive = (path: string) =>
    path === "/" ? pathname === path || pathname === "/en" || pathname === "/fr"
      : pathname.includes(path);

  return (
    <>
      <TopAccentBar />
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          scrolled
            ? "bg-brand-navy/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-brand-gold/15"
            : "bg-brand-navy border-b border-brand-gold/20"
        }`}
      >
        <div className="flex h-[68px] items-center justify-between px-4 md:px-8 max-w-[1400px] mx-auto">

          {/* ---- Mobile Menu & Logo ---- */}
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden p-2 -ml-2 text-white/80 hover:text-brand-gold transition-colors"
            >
              <Menu className="w-6 h-6" />
            </motion.button>

            <Link href="/">
              <div className="flex items-center gap-2.5 cursor-pointer group">
                <SudokuLogoIcon />
                <div className="flex flex-col leading-none">
                  <span className="font-black text-[19px] uppercase tracking-[0.12em] text-white group-hover:text-brand-gold transition-colors">
                    Sudoku
                  </span>
                  <span className="text-[9px] text-brand-gold tracking-[0.2em] font-bold uppercase">
                    Play Games
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* ---- Desktop Navigation ---- */}
          <nav className="hidden lg:flex items-center gap-5 ml-6 flex-1">
            <NavLink href="/play" label={t("play")} isActive={isActive("/play")} />

            <NavLink href="/daily" label={t("daily")} isActive={isActive("/daily")} />

            <NavDropdown label={t("duel")} href="/duel" isActive={isActive("/duel")}>
              <MegaItem href="/duel" icon={Swords} label={t("findOpponent")} desc={t("findOpponentDesc")} color="text-brand-orange" />
              <MegaItem href="/duel" icon={Star} label={t("createTable")} desc={t("createTableDesc")} color="text-brand-gold" />
              <MegaItem href="/leaderboard" icon={Trophy} label={t("duelRanking")} desc={t("duelRankingDesc")} color="text-brand-cyan" />
            </NavDropdown>

            <NavLink href="/leaderboard" label={t("leaderboard")} isActive={isActive("/leaderboard")} />

            <NavDropdown label={t("learn")} href="/learn" isActive={isActive("/learn")}>
              <MegaItem href="/learn" icon={BookOpen} label={t("academy")} desc={t("allStrategies")} color="text-brand-gold" />
              <MegaItem href="/learn/beginner" icon={Zap} label={t("beginner")} desc={t("beginnerDesc")} color="text-green-400" />
              <MegaItem href="/learn/intermediate" icon={Zap} label={t("intermediate")} desc={t("intermediateDesc")} color="text-yellow-400" />
              <MegaItem href="/learn/advanced" icon={Zap} label={t("advanced")} desc={t("advancedDesc")} color="text-brand-orange" />
              <div className="h-px bg-white/8 my-1 mx-2" />
              <MegaItem href="/faq" icon={HelpCircle} label={t("faq")} color="text-gray-400" />
            </NavDropdown>

            <NavDropdown label={t("community")} href="/forum" isActive={isActive("/forum") || isActive("/friends")}>
              <MegaItem href="/forum" icon={MessageSquare} label={t("forum")} desc={t("forumDesc")} color="text-purple-400" />
              <MegaItem href="/friends" icon={UsersIcon} label={t("friends")} desc={t("friendsDesc")} color="text-blue-400" />
              <MegaItem href="/messages" icon={Bell} label={t("messages")} color="text-gray-400" />
            </NavDropdown>
          </nav>

          {/* ---- Right Actions ---- */}
          <div className="flex items-center gap-3 relative">

            {/* CTA Button with shimmer */}
            <div className="hidden lg:flex items-center gap-2">
              <Link href="/chat">
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative overflow-hidden px-4 py-2 rounded-full font-black text-[13px] uppercase tracking-wider text-brand-navy shadow-[0_4px_15px_rgba(0,191,255,0.4)]"
                  style={{ background: "linear-gradient(135deg, #00BFFF 0%, #33CCFF 100%)" }}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" /> {t("liveChat")}
                  </span>
                  {/* Shimmer sweep */}
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.5 }}
                    className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                  />
                </motion.button>
              </Link>
              
              <Link href="/play">
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative overflow-hidden px-5 py-2 rounded-full font-black text-[13px] uppercase tracking-wider text-white shadow-[0_4px_15px_rgba(255,69,0,0.4)]"
                  style={{ background: "linear-gradient(135deg, #FF4500 0%, #FF6B33 100%)" }}
                >
                  <span className="relative z-10">⚡ {t("play")}</span>
                  {/* Shimmer sweep */}
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2 }}
                    className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                </motion.button>
              </Link>
            </div>

            {/* Language */}
            <div className="hidden xl:block">
              <LanguageSwitcher />
            </div>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-white/70 hover:text-brand-gold transition-colors"
            >
              <Bell className="w-5 h-5" />
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-orange rounded-full border border-brand-navy"
              />
            </button>

            {/* Notifications Panel */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute top-[56px] right-12 w-80 rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden z-50"
                  style={{ background: "linear-gradient(145deg, #0A2A5C, #041E42)" }}
                >
                  <div className="px-4 py-3 border-b border-white/8 flex justify-between items-center">
                    <span className="font-black text-sm">{t("notifications")}</span>
                    <span className="bg-brand-orange text-[10px] px-2 py-0.5 rounded-full font-bold">2 {t("newBadge")}</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {[
                      { avatar: "E", color: "bg-pink-500", name: "Elena99", text: t("notifChallenge"), time: "2 min" },
                      { avatar: "🏆", color: "bg-brand-gold", name: null, text: t("notifLeague"), time: "1h" },
                    ].map((n, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                        className="p-4 cursor-pointer flex gap-3"
                      >
                        <div className={`w-9 h-9 rounded-full ${n.color} flex items-center justify-center font-bold text-sm shrink-0 text-brand-navy`}>
                          {n.avatar}
                        </div>
                        <div>
                          <p className="text-sm">
                            {n.name && <span className="font-bold text-pink-400">{n.name} </span>}
                            {n.text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="p-2 text-center text-xs text-gray-500 hover:text-white cursor-pointer transition-colors">
                    {t("seeAll")} →
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile Menu */}
            <div className="relative group">
              <Link href="/auth">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-9 h-9 rounded-full border-2 border-brand-gold/40 hover:border-brand-gold flex items-center justify-center cursor-pointer transition-all overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #0A2A5C, #133A7C)" }}
                >
                  <User className="w-4 h-4 text-white/80" />
                </motion.div>
              </Link>

              <AnimatePresence>
                <motion.div
                  initial={false}
                  className="absolute top-full right-0 mt-2 w-56 rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                  style={{ background: "linear-gradient(145deg, #0A2A5C, #041E42)" }}
                >
                  <div className="p-3 border-b border-white/8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-black">G</div>
                    <div>
                      <p className="font-bold text-sm">{t("guest")}</p>
                      <Link href="/auth" className="text-[11px] text-brand-gold hover:underline">{t("signInCta")} →</Link>
                    </div>
                  </div>
                  <div className="py-2">
                    {[
                      { href: "/profile", label: t("profile"), icon: User },
                      { href: "/profile?tab=stats", label: t("stats"), icon: Trophy },
                      { href: "/profile?tab=achievements", label: t("achievements"), icon: Star },
                      { href: "/settings", label: t("settings"), icon: SettingsIcon },
                    ].map((item) => (
                      <Link key={item.href} href={item.href}>
                        <motion.div
                          whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.05)" }}
                          className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                        >
                          <item.icon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-bold">{item.label}</span>
                        </motion.div>
                      </Link>
                    ))}
                    <div className="h-px bg-white/8 my-1 mx-3" />
                    <Link href="/friends">
                      <motion.div whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.05)" }} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer">
                        <UsersIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-bold">{t("friends")}</span>
                      </motion.div>
                    </Link>
                    <div className="h-px bg-white/8 my-1 mx-3" />
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-white/5 transition-colors">
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-bold">{t("logout")}</span>
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ---- Mobile Drawer ---- */}
        <AnimatePresence>
          {showMobileMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileMenu(false)}
                className="fixed inset-0 bg-black/70 z-[100] md:hidden backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 250 }}
                className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm z-[101] md:hidden flex flex-col shadow-2xl overflow-hidden"
                style={{ background: "linear-gradient(160deg, #0A2A5C 0%, #041E42 50%, #050505 100%)" }}
              >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-white/8">
                  <div className="flex items-center gap-2.5">
                    <SudokuLogoIcon />
                    <span className="font-black text-lg uppercase tracking-widest text-white">{t("menu")}</span>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowMobileMenu(false)} className="p-2 bg-white/5 rounded-full text-gray-400">
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Guest Profile Banner */}
                <div className="mx-4 my-4 p-4 rounded-2xl flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(255,69,0,0.15), rgba(255,204,0,0.05))", border: "1px solid rgba(255,69,0,0.2)" }}>
                  <div className="w-12 h-12 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-xl font-black">G</div>
                  <div>
                    <p className="font-black text-white">{t("guest")}</p>
                    <Link href="/auth" onClick={() => setShowMobileMenu(false)}>
                      <span className="text-xs text-brand-gold font-bold">{t("signInOrRegister")} →</span>
                    </Link>
                  </div>
                </div>

                {/* Nav sections */}
                <div className="flex-1 overflow-y-auto py-2 px-4">
                  {[
                    {
                      label: t("play"),
                      items: [
                        { href: "/", icon: Home, label: t("home") },
                        { href: "/play", icon: Play, label: t("play") },
                        { href: "/daily", icon: Calendar, label: t("daily") },
                        { href: "/duel", icon: Swords, label: t("duel") },
                        { href: "/leaderboard", icon: Trophy, label: t("leaderboard") },
                      ],
                    },
                    {
                      label: t("learn"),
                      items: [
                        { href: "/learn", icon: BookOpen, label: t("academy") },
                        { href: "/faq", icon: HelpCircle, label: t("faq") },
                        { href: "/help", icon: HelpCircle, label: t("helpCenter") },
                      ],
                    },
                    {
                      label: t("community"),
                      items: [
                        { href: "/forum", icon: MessageSquare, label: t("forum") },
                        { href: "/questions", icon: HelpCircle, label: "Q&A" },
                        { href: "/friends", icon: UsersIcon, label: t("friends") },
                        { href: "/messages", icon: Bell, label: t("messages") },
                      ],
                    },
                    {
                      label: t("account"),
                      items: [
                        { href: "/profile", icon: User, label: t("profile") },
                        { href: "/settings", icon: SettingsIcon, label: t("settings") },
                      ],
                    },
                  ].map((section) => (
                    <div key={section.label} className="mb-6">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 px-1">{section.label}</p>
                      <div className="space-y-0.5">
                        {section.items.map((item) => (
                          <Link key={item.href} href={item.href} onClick={() => setShowMobileMenu(false)}>
                            <motion.div
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5 transition-colors"
                            >
                              <item.icon className="w-5 h-5 text-brand-gold/70" />
                              <span className="font-bold text-white/90">{item.label}</span>
                            </motion.div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="h-px bg-white/5 my-3" />
                  <button className="w-full flex items-center gap-3 py-3 px-3 text-red-400 hover:bg-white/5 rounded-xl transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span className="font-bold">{t("logout")}</span>
                  </button>
                </div>

                {/* Language footer */}
                <div className="p-4 border-t border-white/8 bg-black/20">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">{t("language")}</p>
                  <LanguageSwitcher />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};
