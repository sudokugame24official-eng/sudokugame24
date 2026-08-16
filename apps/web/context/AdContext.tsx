"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

interface AdContextState {
  globalAdsEnabled: boolean;
  slots: Record<string, any>;
  hasConsent: boolean;
  setConsent: (consent: boolean) => void;
  isLoading: boolean;
}

const AdContext = createContext<AdContextState>({
  globalAdsEnabled: false,
  slots: {},
  hasConsent: false,
  setConsent: () => {},
  isLoading: true,
});

export const useAdContext = () => useContext(AdContext);

export function AdProvider({ children }: { children: React.ReactNode }) {
  const [globalAdsEnabled, setGlobalAdsEnabled] = useState(false);
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
    async function fetchConfigs() {
      try {
        const res = await fetch(`${API_URL}/config/features`);
        if (res.ok) {
          const data = await res.json();
          setGlobalAdsEnabled(data.ADS_ENABLED);
          setSlots({}); // Handled per-slot locally or via future CMS
        }
      } catch (error) {
        console.error("Failed to fetch ad configs", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfigs();
  }, []);

  return (
    <AdContext.Provider
      value={{ globalAdsEnabled, slots, hasConsent, setConsent, isLoading }}
    >
      {children}
    </AdContext.Provider>
  );
}
