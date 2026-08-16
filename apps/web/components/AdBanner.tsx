"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AdBannerProps {
  adSlot?: string; // e.g. '1234567890' (from AdSense)
  adFormat?: "auto" | "fluid" | "rectangle";
  className?: string;
}

export default function AdBanner({
  adSlot = "DEMO_SLOT_ID",
  adFormat = "auto",
  className = "",
}: AdBannerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      // In production, Google AdSense requires push to process the ins tag
      if (typeof window !== "undefined" && adSlot !== "DEMO_SLOT_ID") {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
      // Simulate loading for the demo or if Adblock is active, it might fail/timeout
      const timer = setTimeout(() => setIsLoaded(true), 1500);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error("AdSense error:", e);
      setHasError(true);
    }
  }, [adSlot]);

  // Si on est en local ou si le slot est le slot de démo, on affiche un joli placeholder
  const isDemo =
    adSlot === "DEMO_SLOT_ID" || process.env.NODE_ENV === "development";

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-[#0A2A5C]/50 border border-white/5 min-h-[100px] flex items-center justify-center ${className}`}
    >
      {!isLoaded && !hasError && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
      )}

      {hasError ? (
        <div className="text-sm text-gray-500 font-medium">
          Publicité bloquée (AdBlock)
        </div>
      ) : isDemo ? (
        <div className="text-center p-4">
          <p className="text-[#FFCC00] font-black tracking-widest uppercase text-sm mb-1">
            Espace Publicitaire
          </p>
          <p className="text-gray-400 text-xs">(Google Ads apparaîtra ici)</p>
        </div>
      ) : (
        <ins
          className="adsbygoogle w-full"
          style={{ display: "block" }}
          data-ad-client={
            process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID ||
            "ca-pub-XXXXXXXXXXXXXXXX"
          } // À remplacer dans le .env
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}
