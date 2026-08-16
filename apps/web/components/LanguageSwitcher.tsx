"use client";
import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Globe, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const SUPPORTED_LOCALES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
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
  compact?: boolean; // For mobile: show only flag+chevron
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
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
    const newPath = switchPathLocale(pathname, code);
    setIsOpen(false);
    router.push(newPath);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Language: ${currentLang.label}. Change language.`}
        className={cn(
          "flex items-center gap-1.5 text-white hover:text-brand-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-lg p-2",
          isOpen && "text-brand-gold",
        )}
      >
        <Globe className="w-4 h-4 shrink-0" />
        {!compact && (
          <span className="text-sm font-bold hidden xl:inline">
            {currentLang.flag} {currentLang.label}
          </span>
        )}
        {compact && <span className="text-sm">{currentLang.flag}</span>}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 shrink-0 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            role="listbox"
            aria-label="Select language"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-12 w-44 bg-brand-navy-light border border-brand-gold/30 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden z-[100] flex flex-col py-1"
          >
            {SUPPORTED_LOCALES.map((locale) => (
              <li
                key={locale.code}
                role="option"
                aria-selected={locale.code === currentLocale}
              >
                <button
                  onClick={() => handleSelect(locale.code)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors text-left hover:bg-white/10",
                    locale.code === currentLocale
                      ? "text-brand-gold bg-brand-gold/5"
                      : "text-white",
                  )}
                >
                  <span className="text-base">{locale.flag}</span>
                  <span className="flex-1">{locale.label}</span>
                  {locale.code === currentLocale && (
                    <Check className="w-4 h-4 text-brand-gold shrink-0" />
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
