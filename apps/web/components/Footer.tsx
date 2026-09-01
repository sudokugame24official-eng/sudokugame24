"use client";
import React, { useState } from "react";
import { Link } from "@/navigation";
import {
  MessageCircle,
  Users,
  Code,
  Globe,
  Send,
  Shield,
  Award,
  Star,
  Gamepad2,
  BookOpen,
  HelpCircle,
  Mail,
  AlertCircle,
  Info,
  FileText,
  Cookie,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SUPPORTED_LOCALES } from "./LanguageSwitcher";
import { motion } from "framer-motion";

const SudokuLogoIcon = () => (
  <div
    className="w-8 h-8 rounded-xl relative overflow-hidden shrink-0"
    style={{ background: "linear-gradient(135deg, #FF4500, #FF6B33)" }}
  >
    <div className="absolute inset-0.5 grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5">
      {[...Array(9)].map((_, i) => (
        <div
          key={i}
          className="rounded-[2px]"
          style={{
            background:
              i % 3 === 1 ? "rgba(255,204,0,0.9)" : "rgba(255,255,255,0.7)",
          }}
        />
      ))}
    </div>
  </div>
);

const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link href={href}>
    <motion.span
      whileHover={{ x: 3 }}
      className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm cursor-pointer"
    >
      {children}
    </motion.span>
  </Link>
);

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  const stats = [
    { value: "127K+", label: t("statGamesMonth") },
    { value: "3.2K", label: t("statOnline") },
    { value: "4.9★", label: t("statRating") },
    { value: String(SUPPORTED_LOCALES.length), label: t("statLanguages") },
  ];

  return (
    <footer className="w-full text-white mt-auto relative overflow-hidden" style={{ background: "#050505" }}>
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,69,0,0.04) 0%, transparent 70%)", filter: "blur(40px)" }}
      />
      <div
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,204,0,0.03) 0%, transparent 70%)", filter: "blur(40px)" }}
      />

      {/* Top gradient separator */}
      <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, transparent, #FF4500, #FFCC00, #FF4500, transparent)" }} />

      {/* Live Stats Strip */}
      <div className="border-b border-white/5" style={{ background: "rgba(10,42,92,0.4)" }}>
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center md:items-start"
              >
                <span
                  className="text-2xl font-black"
                  style={{ background: "linear-gradient(135deg, #FF4500, #FFCC00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  {stat.value}
                </span>
                <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-14">
        <div className="grid grid-cols-1 gap-10 md:gap-8 md:grid-cols-2 lg:grid-cols-5">

          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <Link href="/">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2.5 w-fit origin-left"
              >
                <SudokuLogoIcon />
                <div className="flex flex-col leading-none">
                  <span className="font-black text-xl uppercase tracking-widest text-white">Sudoku</span>
                  <span className="text-[9px] text-brand-gold tracking-[0.2em] font-bold uppercase">Premium</span>
                </div>
              </motion.div>
            </Link>

            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
              {t("tagline")}
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { href: "https://twitter.com/SudokuPremium", icon: Globe, label: "Twitter", color: "hover:bg-[#1d9bf0]" },
                { href: "https://discord.gg/sudoku", icon: MessageCircle, label: "Discord", color: "hover:bg-[#5865F2]" },
                { href: "https://reddit.com/r/sudoku", icon: Users, label: "Reddit", color: "hover:bg-[#FF4500]" },
                { href: "https://github.com", icon: Code, label: "GitHub", color: "hover:bg-white hover:text-black" },
              ].map((s) => (
                <motion.a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-9 h-9 rounded-full bg-white/6 border border-white/8 flex items-center justify-center transition-all ${s.color} group`}
                  title={s.label}
                >
                  <s.icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </motion.a>
              ))}
            </div>

            {/* Newsletter */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                {t("newsletterTitle")}
              </p>
              {subscribed ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 text-green-400 text-sm font-bold"
                >
                  <Star className="w-4 h-4" /> {t("newsletterThanks")}
                </motion.div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("newsletterPlaceholder")}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/20 transition-all min-w-0"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-3 py-2 rounded-xl text-white transition-all shrink-0"
                    style={{ background: "linear-gradient(135deg, #FF4500, #FF6B33)" }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </form>
              )}
            </div>
          </div>

          {/* Sudoku Section */}
          <div className="flex flex-col gap-3">
            <h4 className="font-black text-white uppercase tracking-widest text-xs mb-1 flex items-center gap-2">
              <Gamepad2 className="w-3.5 h-3.5 text-brand-orange" />
              {t("sectionSudoku")}
            </h4>
            <FooterLink href="/play">{t("playSudoku")}</FooterLink>
            <FooterLink href="/daily">{t("dailyChallenge")}</FooterLink>
            <FooterLink href="/duel">{t("duel")}</FooterLink>
            <FooterLink href="/leaderboard">{t("leaderboard")}</FooterLink>
            <FooterLink href="/learn">{t("sudokuAcademy")}</FooterLink>
            <FooterLink href="/blog">Blog & Actus</FooterLink>
          </div>

          {/* Community Section */}
          <div className="flex flex-col gap-3">
            <h4 className="font-black text-white uppercase tracking-widest text-xs mb-1 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-brand-cyan" />
              {t("sectionCommunity")}
            </h4>
            <FooterLink href="/forum">{t("forum")}</FooterLink>
            <FooterLink href="/friends">{t("friends")}</FooterLink>
            <FooterLink href="/messages">{t("messages")}</FooterLink>
            <FooterLink href="/guidelines">{t("guidelines")}</FooterLink>
          </div>

          {/* Help & Company Section */}
          <div className="flex flex-col gap-3">
            <h4 className="font-black text-white uppercase tracking-widest text-xs mb-1 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-brand-gold" />
              {t("sectionHelp")}
            </h4>
            <FooterLink href="/help">{t("helpCenter")}</FooterLink>
            <FooterLink href="/faq">{t("faq")}</FooterLink>
            <FooterLink href="/contact">{t("contactUs")}</FooterLink>
            <FooterLink href="/about">{t("aboutUs")}</FooterLink>
            <FooterLink href="/privacy">{t("privacy")}</FooterLink>
            <FooterLink href="/terms">{t("terms")}</FooterLink>
          </div>
        </div>
      </div>

      {/* Trust Signals Strip */}
      <div className="border-t border-white/5 bg-white/2">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { icon: Shield, text: t("trustSsl") },
              { icon: Star, text: t("trustStars") },
              { icon: Award, text: t("trustFairPlay") },
              { icon: Globe, text: t("trustLanguages", { count: SUPPORTED_LOCALES.length }) },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-gray-600 text-xs">
                <item.icon className="w-3 h-3 text-brand-gold/50" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <LanguageSwitcher compact />
          </div>
          <p className="text-gray-600 text-xs text-center">
            {t("copyright", { year: currentYear })}
          </p>
          <p className="text-gray-700 text-xs flex items-center gap-1">
            {t("builtFor")}
          </p>
        </div>
      </div>
    </footer>
  );
};
