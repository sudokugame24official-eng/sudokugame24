"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useAdContext } from "../../context/AdContext";
import { API_URL } from "@/lib/api";

const FORBIDDEN_PLACEMENTS = [
  "grid",
  "sudoku_grid",
  "numpad",
  "keypad",
  "timer",
  "pause_button",
  "mistake_counter",
  "hint_button",
  "duel_battle_bar",
  "duel_controls",
  "countdown",
  "auth_form",
  "checkout",
  "payment_confirmation",
  "chat_input",
  "primary_navigation",
  "language_selector",
];

const FORMAT_DIMS: Record<string, { minHeight: number }> = {
  leaderboard: { minHeight: 90 },
  horizontal: { minHeight: 90 },
  rectangle: { minHeight: 250 },
  vertical: { minHeight: 600 },
  auto: { minHeight: 120 },
};

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

interface AdSlotProps {
  slotName: string;
  className?: string;
  placementOverride?: string;
}

export default function AdSlot({
  slotName,
  className = "",
  placementOverride,
}: AdSlotProps) {
  const {
    hasConsent,
    isLoading,
    isAdAllowedOnCurrentPage,
    isUserEligibleForAds,
    publisherId: contextPublisherId,
  } = useAdContext();

  const [slotConfig, setSlotConfig] = useState<any>(null);
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pushed, setPushed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Safety Check: Reject forbidden placements immediately
  const activePlacement = (
    placementOverride || slotConfig?.placement || slotName
  ).toLowerCase();

  const isForbidden = FORBIDDEN_PLACEMENTS.some((forbidden) =>
    activePlacement.includes(forbidden),
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/monetization/ad-config?slotName=${encodeURIComponent(slotName)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setGlobalEnabled(!!data.globalAdsEnabled);
        setSlotConfig(data.slotConfig || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slotName]);

  // Lazy loading observer
  useEffect(() => {
    if (!ref.current) return;
    if (slotConfig?.lazyLoad === false) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [slotConfig]);

  const client =
    slotConfig?.publisherId ||
    contextPublisherId ||
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isTablet =
    typeof window !== "undefined" &&
    window.innerWidth >= 768 &&
    window.innerWidth < 1024;

  const device = slotConfig?.deviceTarget || "ALL";
  const deviceOk =
    device === "ALL" ||
    (device === "MOBILE" && isMobile) ||
    (device === "TABLET" && isTablet) ||
    (device === "DESKTOP" && !isMobile && !isTablet);

  const consentOk = slotConfig?.consentRequired === false || hasConsent;

  const isEnabled =
    !isLoading &&
    !isForbidden &&
    isAdAllowedOnCurrentPage &&
    isUserEligibleForAds &&
    globalEnabled &&
    slotConfig?.enabled === true &&
    deviceOk &&
    consentOk &&
    !!client &&
    !!slotConfig?.adSlotId &&
    slotConfig?.provider === "GoogleAdSense";

  useEffect(() => {
    if (!isEnabled || !visible || pushed) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setPushed(true);
    } catch (e) {
      console.error("AdSense push failed", e);
    }
  }, [isEnabled, visible, pushed]);

  if (!isEnabled) return null;

  const dims = FORMAT_DIMS[slotConfig.format] ?? { minHeight: 120 };
  const reservedHeight = slotConfig.height || dims.minHeight;

  return (
    <div
      ref={ref}
      className={`ad-container w-full flex flex-col justify-center items-center my-6 relative overflow-hidden transition-all ${className}`}
      style={{
        minHeight: reservedHeight + 20,
        ...(slotConfig.width ? { maxWidth: slotConfig.width } : {}),
      }}
      aria-label="advertisement"
    >
      {/* Clear Policy Compliant Label */}
      <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mb-1 select-none">
        Publicité
      </span>

      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          minHeight: reservedHeight,
          width: slotConfig.width ? `${slotConfig.width}px` : "100%",
        }}
        data-ad-client={client}
        data-ad-slot={slotConfig.adSlotId}
        data-ad-format={slotConfig.format || "auto"}
        data-full-width-responsive="true"
      />

      <Script
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
    </div>
  );
}
