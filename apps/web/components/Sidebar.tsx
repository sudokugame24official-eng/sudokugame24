"use client";
import React from "react";
import { Link } from "@/navigation";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Play,
  Users,
  Trophy,
  MessageSquare,
  BookOpen,
  User,
  Settings,
  Grid3X3,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Jouer", href: "/play", icon: Play },
  { name: "Multijoueur", href: "/multiplayer", icon: Users },
  { name: "Classement", href: "/leaderboard", icon: Trophy },
  { name: "Boutique", href: "/shop", icon: Store },
  { name: "Forum", href: "/forum", icon: MessageSquare },
  { name: "Apprendre", href: "/learn", icon: BookOpen },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 border-r border-border bg-card/50 backdrop-blur-xl z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-xl ring-1 ring-primary/50">
            <Grid3X3 className="w-8 h-8 text-primary" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
            Sudoku
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                    isActive
                      ? "text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-primary rounded-xl"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <item.icon className="w-6 h-6 relative z-10" />
                  <span className="text-lg relative z-10">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Link href="/profile">
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
              <User className="w-6 h-6" />
              <span className="text-lg">Profil</span>
            </div>
          </Link>
          <Link href="/settings">
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
              <Settings className="w-6 h-6" />
              <span className="text-lg">Paramètres</span>
            </div>
          </Link>
        </div>

        {/* Liens Légaux */}
        <div className="px-6 pb-6 pt-2 flex flex-col gap-2 text-xs text-muted-foreground/60">
          <Link
            href="/privacy"
            className="hover:text-primary transition-colors"
          >
            Confidentialité
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Conditions (CGU)
          </Link>
          <Link
            href="/disclaimer"
            className="hover:text-primary transition-colors"
          >
            Mentions Légales
          </Link>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-card/80 backdrop-blur-xl z-50 flex items-center justify-around px-2 pb-2">
        {navItems.slice(0, 4).map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href} className="flex-1">
              <div className="flex flex-col items-center justify-center py-1">
                <div
                  className={cn(
                    "p-1.5 rounded-full transition-all relative",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-active"
                      className="absolute inset-0 bg-primary/20 rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <item.icon className="w-6 h-6 relative z-10" />
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1 font-medium",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
        <Link href="/profile" className="flex-1">
          <div className="flex flex-col items-center justify-center py-1">
            <User className="w-6 h-6 text-muted-foreground p-1.5" />
            <span className="text-[10px] mt-1 font-medium text-muted-foreground">
              Profil
            </span>
          </div>
        </Link>
      </div>
    </>
  );
};
