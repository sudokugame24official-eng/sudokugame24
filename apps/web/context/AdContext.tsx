"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

interface AdContextState {
  globalAdsEnabled: boolean;
  rewardedAdsEnabled: boolean;
  slots: Record<string, any>;
  hasConsent: boolean;
  setConsent: (consent: boolean) => void;
  isLoading: boolean;
  isAdAllowedOnCurrentPage: boolean;
  isUserEligibleForAds: boolean;
  publisherId: string;
}

const AdContext = createContext<AdContextState>({
  globalAdsEnabled: false,
  rewardedAdsEnabled: false,
  slots: {},
  hasConsent: false,
  setConsent: () => {},
  isLoading: true,
  isAdAllowedOnCurrentPage: true,
  isUserEligibleForAds: true,
  publisherId: "",
});

export const useAdContext = () => useContext(AdContext);

// Default hard-coded excluded routes for gameplay safety & policy compliance
const DEFAULT_EXCLUDED_ROUTES = [
  "/auth",
  "/checkout",
  "/payment",
  "/duel",
  "/chat",
  "/settings",
];

export function AdProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [globalAdsEnabled, setGlobalAdsEnabled] = useState(false);
  const [rewardedAdsEnabled, setRewardedAdsEnabled] = useState(false);
  const [publisherId, setPublisherId] = useState("");
  const [slots, setSlots] = useState<Record<string, any>>({});
  const [hasConsent, setConsentState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load consent from local storage on mount
  useEffect(() => {
    const savedConsent = localStorage.getItem("gdpr_ads_consent");
    if (savedConsent === "true") {
      setConsentState(true);
    }
  }, []);

  const setConsent = (consent: boolean) => {
    setConsentState(consent);
    localStorage.setItem("gdpr_ads_consent", consent ? "true" : "false");
  };

  useEffect(() => {
    let isCancelled = false;
    async function fetchConfigs() {
      try {
        const [featuresRes, settingsRes, slotsRes] = await Promise.all([
          fetch(`${API_URL}/config/features`).catch(() => null),
          fetch(`${API_URL}/admin/marketing-settings`).catch(() => null),
          fetch(`${API_URL}/monetization/ad-config/all`).catch(() => null),
        ]);

        if (isCancelled) return;

        if (featuresRes && featuresRes.ok) {
          const data = await featuresRes.json();
          setGlobalAdsEnabled(!!data.ENABLE_ADS || !!data.ADS_ENABLED);
          setRewardedAdsEnabled(!!data.ENABLE_REWARDED_ADS);
        }

        if (settingsRes && settingsRes.ok) {
          const settings = await settingsRes.json();
          setPublisherId(settings.ADSENSE_CLIENT_ID || settings.AD_NETWORK_CLIENT_ID || "");
        }

        if (slotsRes && slotsRes.ok) {
          const slotData = await slotsRes.json();
          if (slotData.slots) {
            setSlots(slotData.slots);
          }
        }
      } catch (error) {
        console.error("Failed to fetch ad configs", error);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchConfigs();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Check if current route is excluded
  const isExcludedRoute = DEFAULT_EXCLUDED_ROUTES.some((route) =>
    pathname?.includes(route),
  );

  // Check if user has NO_ADS perk or is Premium
  const hasNoAdsPerk =
    user?.perks?.some(
      (p: any) =>
        p.perkType === "NO_ADS" &&
        (!p.expiresAt || new Date(p.expiresAt) > new Date()),
    ) ||
    user?.profile?.perks?.some(
      (p: any) =>
        p.perkType === "NO_ADS" &&
        (!p.expiresAt || new Date(p.expiresAt) > new Date()),
    );

  const isUserEligibleForAds = !hasNoAdsPerk;
  const isAdAllowedOnCurrentPage = !isExcludedRoute && isUserEligibleForAds;

  return (
    <AdContext.Provider
      value={{
        globalAdsEnabled,
        rewardedAdsEnabled,
        slots,
        hasConsent,
        setConsent,
        isLoading,
        isAdAllowedOnCurrentPage,
        isUserEligibleForAds,
        publisherId,
      }}
    >
      {children}
    </AdContext.Provider>
  );
}
