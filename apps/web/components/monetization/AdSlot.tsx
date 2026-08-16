"use client";
import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useAdContext } from "../../context/AdContext";
import { API_URL } from "@/lib/api";

/**
 * P1-F/G: real, DB-driven ad slot.
 *
 * - Renders NOTHING unless: global flag on + slot enabled + consent (if
 *   required) + AdSense client id configured (NEXT_PUBLIC_ADSENSE_CLIENT) +
 *   the slot has an ad unit id. No fake placeholder ads, ever.
 * - CLS-safe: the container reserves dimensions before the ad loads.
 * - Lazy: the AdSense push happens only when the slot enters the viewport
 *   (IntersectionObserver) unless lazyLoad=false on the slot config.
 * - Device targeting honored client-side (ALL/DESKTOP/MOBILE).
 */

// Default reserved heights per format (CLS-safe when slot has no explicit dims)
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

export default function AdSlot({ slotName, className = "" }: { slotName: string; className?: string }) {
  const { hasConsent, isLoading } = useAdContext();
  const [slotConfig, setSlotConfig] = useState<any>(null);
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pushed, setPushed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch this slot's live configuration (flag + slot) from the public API
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/monetization/ad-config/${encodeURIComponent(slotName)}`)
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

  // Lazy loading: observe visibility once we know the slot will render
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

  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT; // e.g. "ca-pub-XXXX..."
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const device = slotConfig?.deviceTarget || "ALL";
  const deviceOk = device === "ALL" || (device === "MOBILE" && isMobile) || (device === "DESKTOP" && !isMobile);
  const consentOk = slotConfig?.consentRequired === false || hasConsent;

  const enabled =
    !isLoading &&
    globalEnabled &&
    slotConfig?.enabled === true &&
    deviceOk &&
    consentOk &&
    !!client &&
    !!slotConfig?.adSlotId &&
    slotConfig?.provider === "GoogleAdSense";

  // Push to AdSense exactly once, when visible
  useEffect(() => {
    if (!enabled || !visible || pushed) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setPushed(true);
    } catch (e) {
      console.error("AdSense push failed", e);
    }
  }, [enabled, visible, pushed]);

  if (!enabled) return null;

  const dims = FORMAT_DIMS[slotConfig.format] ?? FORMAT_DIMS.auto;
  const reservedHeight = slotConfig.height || dims.minHeight;

  return (
    <div
      ref={ref}
      className={`ad-container w-full flex justify-center items-center my-4 ${className}`}
      style={{ minHeight: reservedHeight, ...(slotConfig.width ? { maxWidth: slotConfig.width } : {}) }}
      aria-label="advertisement"
    >
      {/* Real AdSense unit — rendered only with a configured publisher + unit id */}
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: reservedHeight }}
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
