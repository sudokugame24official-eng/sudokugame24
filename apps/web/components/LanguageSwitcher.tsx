"use client";
import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Globe, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const SUPPORTED_LOCALES = [
  { code: "en", label: "English", short: "EN", flag: "🇬🇧" },
  { code: "fr", label: "Français", short: "FR", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", short: "DE", flag: "🇩🇪" },
] as const;

type LocaleCode = (typeof SUPPORTED_LOCALES)[number]["code"];

function getCurrentLocale(pathname: string): LocaleCode {
  const segment = pathname.split("/")[1];
  const found = SUPPORTED_LOCALES.find((l) => l.code === segment);
  return found ? found.code : "en";
}

function switchPathLocale(pathname: string, newLocale: string): string {
  const segments = pathname.split("/");
  const firstSegment = segments[1];
  const isLocaleSegment = SUPPORTED_LOCALES.some(
    (l) => l.code === firstSegment,
  );
  if (isLocaleSegment) {
    segments[1] = newLocale;
    return segments.join("/");
  }
  return `/${newLocale}${pathname}`;
}

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSwitcher({ compact = false, className }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLocale = getCurrentLocale(pathname);
  const currentLang =
    SUPPORTED_LOCALES.find((l) => l.code === currentLocale) ||
    SUPPORTED_LOCALES[0];

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  function handleSelect(code: string) {
    try {
      document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
    const newPath = switchPathLocale(pathname, code);
    setIsOpen(false);
    router.push(newPath);
  }

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Langue : ${currentLang.label} (${currentLang.flag}). Changer de langue.`}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-brand-gold/50 text-white transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold cursor-pointer",
          isOpen && "border-brand-gold bg-brand-gold/10 text-brand-gold",
        )}
      >
        <span className="text-base leading-none select-none">{currentLang.flag}</span>
        <span className="text-xs font-black uppercase tracking-wider text-white/90">
          {compact ? currentLang.short : currentLang.label}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-brand-gold",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            role="listbox"
            aria-label="Sélectionner une langue"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-48 bg-[#0A2A5C] border-2 border-brand-gold/30 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] overflow-hidden z-[100] flex flex-col p-1.5"
          >
            <div className="px-3 py-1.5 border-b border-white/10 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-brand-gold" /> Langues
              </span>
              <span className="text-[9px] font-bold bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded">3</span>
            </div>
            {SUPPORTED_LOCALES.map((locale) => {
              const isSelected = locale.code === currentLocale;
              return (
                <li
                  key={locale.code}
                  role="option"
                  aria-selected={isSelected}
                >
                  <button
                    onClick={() => handleSelect(locale.code)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer",
                      isSelected
                        ? "text-white bg-brand-gold/20 border border-brand-gold/40 shadow-sm"
                        : "text-gray-200 hover:text-white hover:bg-white/10",
                    )}
                  >
                    <span className="text-lg leading-none select-none">{locale.flag}</span>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-bold">{locale.label}</span>
                      <span className="text-[10px] font-mono font-black uppercase text-gray-400 ml-2">
                        {locale.short}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-brand-gold shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
