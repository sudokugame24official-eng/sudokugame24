"use client";
import React, { useState } from "react";
import Image from "next/image";
import { m, LazyMotion, domAnimation } from "framer-motion";
import { Crown, Sparkles, ChevronRight } from "lucide-react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const AnimatedSudokuGrid = dynamic(() => import("./AnimatedSudokuGrid"), { ssr: false });

export function HeroShowcase() {
  const t = useTranslations("home");
  const [activeVisualTab, setActiveVisualTab] = useState<"art" | "grid">("art");

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative w-full max-w-[460px] group">
        {/* Outer Radiant Glow */}
        <div className="absolute -inset-2 bg-gradient-to-r from-brand-orange via-brand-gold to-brand-cyan rounded-3xl blur-2xl opacity-40 group-hover:opacity-70 transition duration-700 animate-pulse" />

        {/* Showcase Container */}
        <div className="relative rounded-3xl bg-brand-navy-light/95 border-2 border-brand-gold/40 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden">
          
          {/* Visual Mode Selector Tabs */}
          <div className="flex items-center justify-between pb-3 px-1 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-ping" />
              <span className="text-xs font-black uppercase tracking-widest text-brand-gold">
                {t("showcaseBadge")}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveVisualTab("art")}
                aria-label="Afficher l'illustration"
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeVisualTab === "art"
                    ? "bg-brand-orange text-white shadow"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {t("tabArt")}
              </button>
              <button
                onClick={() => setActiveVisualTab("grid")}
                aria-label="Afficher la grille interactive"
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeVisualTab === "grid"
                    ? "bg-brand-cyan text-brand-navy shadow"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {t("tabGrid")}
              </button>
            </div>
          </div>

          {/* Content Area */}
          {activeVisualTab === "art" ? (
            <div
              key="art"
              className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-inner group/art"
            >
              <Image
                src="/hero1.webp"
                alt="Sudoku Masters - Master Your Mind"
                width={440}
                height={440}
                priority
                fetchPriority="high"
                decoding="async"
                quality={75}
                className="w-full h-auto object-cover rounded-2xl transition-transform duration-700 group-hover/art:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 440px"
              />
              
              {/* Gradient Overlay & Tag */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

              {/* Floating Hero Badge 1 */}
              <m.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-3 left-3 bg-brand-navy/90 border border-brand-gold/60 px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2"
              >
                <Crown className="w-4 h-4 text-brand-gold" />
                <span className="text-xs font-black text-brand-gold uppercase tracking-wider">{t("heroBadge2")}</span>
              </m.div>

              {/* Floating Hero Badge 2 */}
              <m.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-3 right-3 bg-brand-orange/90 text-white px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 border border-white/20"
              >
                <Sparkles className="w-4 h-4 text-brand-gold" />
                <span className="text-xs font-black uppercase tracking-wider">{t("heroBadge3")}</span>
              </m.div>
            </div>
          ) : (
            <m.div
              key="grid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="p-2"
            >
              <AnimatedSudokuGrid />
            </m.div>
          )}

          {/* Footer caption */}
          <div className="mt-3 pt-2 px-1 flex items-center justify-between text-xs text-gray-300 font-medium">
            <span>{t("showcaseJoin")}</span>
            <Link href="/learn" className="text-brand-cyan hover:text-brand-gold font-bold flex items-center gap-1 transition-colors">
              {t("showcaseExplore")} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
