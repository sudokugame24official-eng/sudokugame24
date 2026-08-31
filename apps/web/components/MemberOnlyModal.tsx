"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, LogIn, UserPlus, Play, X, ShieldAlert, Sparkles, Swords, Trophy, Flame } from "lucide-react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

interface MemberOnlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function MemberOnlyModal({
  isOpen,
  onClose,
  title,
  description,
}: MemberOnlyModalProps) {
  const t = useTranslations("auth.memberOnly");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-gradient-to-br from-[#061838] via-[#041E42] to-[#0A2A5C] border-2 border-brand-gold/40 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.85)] overflow-hidden text-white z-10"
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-gold/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-orange/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-gold flex items-center justify-center shadow-[0_0_25px_rgba(255,69,0,0.5)] mb-4">
                <Lock className="w-8 h-8 text-brand-navy" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-2">
                {title || t("title")}
              </h2>
              <p className="text-gray-200 text-sm sm:text-base leading-relaxed max-w-md">
                {description || t("description")}
              </p>
            </div>

            {/* Features Highlight */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mb-6 space-y-2">
              <p className="text-xs font-black uppercase tracking-wider text-brand-gold flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                {t("memberBenefits")}
              </p>
              <ul className="space-y-2.5">
                {[
                  { icon: Swords, text: t("benefitDuel") || "Play 1v1 Duels" },
                  { icon: Trophy, text: t("benefitRank") || "Climb the global Leaderboard" },
                  { icon: Flame, text: t("benefitDaily") || "Compete in Daily Challenges" },
                ].map((Item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-200">
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                      <Item.icon className="w-3.5 h-3.5 text-brand-gold" />
                    </div>
                    <span>{Item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link href="/auth?mode=register" onClick={onClose} className="block w-full">
                <button className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-brand-orange to-brand-orange-light hover:brightness-110 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-[0_10px_25px_rgba(255,69,0,0.4)] transition-all cursor-pointer">
                  <UserPlus className="w-5 h-5" />
                  <span>{t("register")}</span>
                </button>
              </Link>

              <Link href="/auth" onClick={onClose} className="block w-full">
                <button className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm uppercase tracking-wider rounded-2xl transition-all cursor-pointer">
                  <LogIn className="w-4 h-4 text-brand-gold" />
                  <span>{t("login")}</span>
                </button>
              </Link>

              <button
                onClick={onClose}
                className="w-full py-2.5 text-xs text-gray-400 hover:text-white font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {t("continueAsGuest")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
