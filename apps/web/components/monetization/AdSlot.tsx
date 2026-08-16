"use client";
import { useAdContext } from "../../context/AdContext";

interface AdSlotProps {
  slotName: string;
  className?: string;
}

export default function AdSlot({ slotName, className = "" }: AdSlotProps) {
  const { globalAdsEnabled, slots, hasConsent, isLoading } = useAdContext();

  if (isLoading) return null;

  const slotConfig = slots[slotName];
  const isEnabled = globalAdsEnabled && slotConfig?.enabled && hasConsent;

  if (!isEnabled) {
    // FAIL-SAFE: If Ads are disabled or no consent, render nothing.
    return null;
  }

  const provider = slotConfig.provider;

  // Future Google AdSense Integration
  if (provider === "GoogleAdSense") {
    return (
      <div
        className={`ad-container w-full flex justify-center items-center my-4 ${className}`}
      >
        {/*
          IMPORTANT: The real Google AdSense code will go here in the future.
          Example:
          <ins className="adsbygoogle"
               style={{ display: 'block' }}
               data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
               data-ad-slot={slotName}
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
          <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        */}
        <div className="bg-gray-800 text-gray-500 text-sm py-8 px-4 rounded border border-gray-700 w-full text-center">
          [AdSlot: {slotName}] - Provider: GoogleAdSense
        </div>
      </div>
    );
  }

  return null;
}
