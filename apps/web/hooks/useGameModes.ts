"use client";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

/**
 * P1-P: client view of enabled game modes. A disabled mode disappears from
 * the UI entirely (nav + play mode selector).
 */
export function useGameModes() {
  const [modes, setModes] = useState<Record<string, { enabled: boolean; minLevel: number; description: string; maxWager?: number }> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/config/game-modes`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => { if (!cancelled) setModes(data); })
      .catch(() => { if (!cancelled) setModes({}); });
    return () => { cancelled = true; };
  }, []);

  const isEnabled = (mode: string) => modes === null || !!modes[mode]; // fail-open while loading (default modes are on)
  return { modes, isEnabled };
}
