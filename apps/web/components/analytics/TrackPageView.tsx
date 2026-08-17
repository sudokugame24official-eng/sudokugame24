"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { API_URL } from "@/lib/api";

/**
 * P1-V: page_view tracking. Fires once per route change, never blocks
 * rendering, and degrades silently if the endpoint is unreachable.
 */
export default function TrackPageView({ locale }: { locale: string }) {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    let sid = "";
    try {
      sid = sessionStorage.getItem("analytics_sid") || "";
      if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem("analytics_sid", sid);
      }
    } catch {
      // sessionStorage unavailable (private mode) — track without session
    }
    fetch(`${API_URL}/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: "page_view",
        sessionId: sid,
        locale,
        page: pathname,
        referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname, locale]);

  return null;
}
