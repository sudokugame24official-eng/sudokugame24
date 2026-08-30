"use client";

import React, { useState } from "react";
import { Monitor, Tablet, Smartphone, Eye, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";

interface AdPreviewFrameProps {
  slotName: string;
  format: string;
  placement: string;
  width?: number;
  height?: number;
  pageTarget?: string;
  deviceTarget?: string;
}

const VIEWPORT_SIZES = [
  { label: "375px (Mobile SE)", width: 375, icon: Smartphone },
  { label: "390px (iPhone 14)", width: 390, icon: Smartphone },
  { label: "412px (Pixel 7)", width: 412, icon: Smartphone },
  { label: "768px (iPad Mini)", width: 768, icon: Tablet },
  { label: "1024px (iPad Pro)", width: 1024, icon: Tablet },
  { label: "1280px (Laptop)", width: 1280, icon: Monitor },
  { label: "1440px (Desktop)", width: 1440, icon: Monitor },
];

export function AdPreviewFrame({
  slotName,
  format,
  placement,
  width,
  height,
  pageTarget = "home",
  deviceTarget = "ALL",
}: AdPreviewFrameProps) {
  const [selectedWidth, setSelectedWidth] = useState(768);

  const displayHeight = height || (format === "leaderboard" ? 90 : format === "rectangle" ? 250 : 120);

  return (
    <div className="space-y-4 bg-black/40 border border-white/10 rounded-2xl p-5 text-white">
      {/* Top Controls: Viewport selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-brand-cyan" />
          <span className="font-black text-sm uppercase tracking-wide">
            Simulateur d'Emplacement en Direct
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/10">
          {VIEWPORT_SIZES.map((size) => {
            const Icon = size.icon;
            const active = selectedWidth === size.width;
            return (
              <button
                key={size.width}
                type="button"
                onClick={() => setSelectedWidth(size.width)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-brand-cyan text-brand-navy shadow"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{size.width}px</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notice Banner */}
      <div className="flex items-center justify-between bg-brand-gold/10 border border-brand-gold/30 px-3.5 py-2 rounded-xl text-xs text-brand-gold">
        <span className="font-bold flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4" /> AD PREVIEW — AUCUNE REQUÊTE RÉELLE ENVOYÉE
        </span>
        <span className="text-[10px] bg-brand-gold/20 px-2 py-0.5 rounded font-black uppercase">
          CLS Réservé : {displayHeight}px
        </span>
      </div>

      {/* Interactive Frame Container */}
      <div className="overflow-x-auto p-4 bg-[#050C1A] rounded-xl flex justify-center border border-white/5">
        <div
          style={{ width: `${selectedWidth}px`, maxWidth: "100%" }}
          className="bg-[#0A1A38] border border-white/20 rounded-xl p-4 space-y-3 transition-all duration-300 shadow-2xl"
        >
          {/* Mock Header */}
          <div className="h-8 bg-white/5 rounded-lg flex items-center justify-between px-3 text-[11px] text-gray-400">
            <span className="font-bold text-white">SUDOKU PREMIUM</span>
            <span>Page: /{pageTarget}</span>
          </div>

          {/* Mock Content Before */}
          <div className="space-y-2 py-2">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-full" />
            <div className="h-3 bg-white/5 rounded w-5/6" />
          </div>

          {/* THE AD CONTAINER SIMULATOR */}
          <div
            className="my-3 border-2 border-dashed border-brand-cyan/60 bg-brand-cyan/10 rounded-xl flex flex-col items-center justify-center relative overflow-hidden transition-all"
            style={{
              minHeight: `${displayHeight}px`,
              ...(width ? { maxWidth: `${width}px`, margin: "0 auto" } : {}),
            }}
          >
            <span className="text-[9px] uppercase font-black tracking-widest text-brand-cyan/80 mb-1">
              Publicité ({format.toUpperCase()})
            </span>
            <div className="text-center space-y-0.5">
              <p className="text-xs font-black text-white">{slotName}</p>
              <p className="text-[10px] text-gray-300">
                Emplacement : <span className="text-brand-gold">{placement}</span> • Cible : {deviceTarget}
              </p>
              <p className="text-[9px] text-gray-400">
                Dimensions réservées : {width || "Auto"} x {displayHeight}px (Zéro décalage de mise en page CLS)
              </p>
            </div>
          </div>

          {/* Mock Content After */}
          <div className="space-y-2 py-2">
            <div className="h-4 bg-white/10 rounded w-2/3" />
            <div className="h-3 bg-white/5 rounded w-full" />
            <div className="h-3 bg-white/5 rounded w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
