"use client";
import React from "react";
import { Home, Play, Calendar, Swords, Users, Trophy } from "lucide-react";
import { Link } from "@/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

export const MobileNav = () => {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const navItems = [
    { href: "/", icon: Home, label: "Accueil" },
    { href: "/play", icon: Play, label: t("play") },
    { href: "/daily", icon: Calendar, label: t("daily") },
    { href: "/duel", icon: Swords, label: t("duel"), badge: true },
    { href: "/leaderboard", icon: Trophy, label: "Classement" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* Top gradient border */}
      <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, transparent, #FF4500 30%, #FFCC00 70%, transparent)" }} />

      <div
        className="flex items-center justify-around h-16 px-1 relative"
        style={{
          background: "linear-gradient(180deg, rgba(4,30,66,0.97) 0%, rgba(5,5,5,0.99) 100%)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {navItems.map((item, index) => {
          const isActive =
            item.href === "/"
              ? pathname === item.href || pathname === "/en" || pathname === "/fr"
              : pathname.includes(item.href);

          // Center FAB for "Play"
          if (item.href === "/daily") {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 relative -mt-5"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,69,0,0.5)]"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #FFCC00, #FF4500)"
                      : "linear-gradient(135deg, #FF4500, #FF6B33)",
                  }}
                >
                  <item.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </motion.div>
                <span
                  className="text-[9px] font-black uppercase tracking-widest mt-0.5"
                  style={{ color: isActive ? "#FFCC00" : "rgba(255,255,255,0.5)" }}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-1 relative py-1"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="relative flex items-center justify-center"
              >
                {/* Active background pill */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-active"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute inset-0 -mx-3 -my-1.5 rounded-xl"
                      style={{ background: "rgba(255,69,0,0.12)" }}
                    />
                  )}
                </AnimatePresence>

                <item.icon
                  className={`w-5 h-5 relative z-10 transition-all duration-200 ${
                    isActive ? "text-brand-orange" : "text-gray-600"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                {/* Notification badge for Duel */}
                {item.badge && (
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-brand-orange rounded-full border border-black z-20"
                  />
                )}
              </motion.div>

              {/* Active orange dot indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg, #FF4500, #FFCC00)" }}
                  />
                )}
              </AnimatePresence>

              <span
                className="text-[9px] font-black uppercase tracking-wide transition-colors duration-200"
                style={{ color: isActive ? "#FF4500" : "rgba(156,163,175,0.7)" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
