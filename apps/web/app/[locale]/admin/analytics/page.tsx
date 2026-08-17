"use client";
import React, { useCallback, useEffect, useState } from "react";
import { BarChart3, Activity, Users, Swords, Eye, RefreshCw, Zap } from "lucide-react";
import { API_URL } from "@/lib/api";

interface Totals { [metric: string]: number }
interface Realtime {
  onlineUsers: number | null;
  activeDuels: number | null;
  pageViewsToday: number | null;
  registrationsToday: number | null;
  health: { db: boolean | null; redis: boolean | null };
  measuredAt: string;
}
interface SeriesPoint { day: string; value: number }

const PERIODS = [
  { days: 7, en: "7 days", fr: "7 jours" },
  { days: 30, en: "30 days", fr: "30 jours" },
  { days: 90, en: "90 days", fr: "90 jours" },
];

function Sparkline({ points }: { points: SeriesPoint[] }) {
  if (points.length < 2) return <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">—</div>;
  const max = Math.max(...points.map((p) => p.value), 1);
  const w = 560;
  const h = 96;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - (p.value / max) * (h - 8) - 4).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" role="img" aria-label="chart">
      <path d={`${path} L${w},${h} L0,${h} Z`} fill="currentColor" opacity="0.12" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function AdminAnalyticsPage() {
  const [locale, setLocale] = useState("fr");
  const [days, setDays] = useState(30);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [realtime, setRealtime] = useState<Realtime | null>(null);
  const [series, setSeries] = useState<Record<string, SeriesPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const l = window.location.pathname.split("/")[1];
    setLocale(l === "en" ? "en" : "fr");
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [t, i, r, dau, games] = await Promise.all([
        fetch(`${API_URL}/analytics/totals?days=${days}`, { credentials: "include" }).then((x) => (x.ok ? x.json() : null)),
        fetch(`${API_URL}/analytics/insights?locale=${locale}`, { credentials: "include" }).then((x) => (x.ok ? x.json() : { insights: [] })),
        fetch(`${API_URL}/analytics/realtime`, { credentials: "include" }).then((x) => (x.ok ? x.json() : null)),
        fetch(`${API_URL}/analytics/series?metric=dau&days=${days}`, { credentials: "include" }).then((x) => (x.ok ? x.json() : null)),
        fetch(`${API_URL}/analytics/series?metric=game_complete&days=${days}`, { credentials: "include" }).then((x) => (x.ok ? x.json() : null)),
      ]);
      if (t) setTotals(t.totals);
      setInsights(i.insights || []);
      setRealtime(r);
      setSeries({ dau: dau?.points || [], game_complete: games?.points || [] });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [days, locale]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Live counters refresh every 30s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const r = await fetch(`${API_URL}/analytics/realtime`, { credentials: "include" });
        if (r.ok) setRealtime(await r.json());
      } catch { /* keep last value */ }
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const t = (en: string, fr: string) => (locale === "fr" ? fr : en);

  const kpis: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: "dau", label: t("Daily active users (sum)", "Utilisateurs actifs (somme)"), icon: <Users className="w-4 h-4" /> },
    { key: "page_view", label: t("Page views", "Vues de pages"), icon: <Eye className="w-4 h-4" /> },
    { key: "registration", label: t("Registrations", "Inscriptions"), icon: <Users className="w-4 h-4" /> },
    { key: "game_complete", label: t("Games completed", "Parties terminées"), icon: <BarChart3 className="w-4 h-4" /> },
    { key: "daily_complete", label: t("Daily challenges", "Défis quotidiens"), icon: <Activity className="w-4 h-4" /> },
    { key: "duel_complete", label: t("Duels completed", "Duels terminés"), icon: <Swords className="w-4 h-4" /> },
    { key: "forum_post", label: t("Forum posts", "Sujets forum"), icon: <BarChart3 className="w-4 h-4" /> },
    { key: "question_ask", label: t("Questions asked", "Questions posées"), icon: <BarChart3 className="w-4 h-4" /> },
    { key: "purchase", label: t("Purchases", "Achats"), icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            {t("Analytics", "Statistiques")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t(
              "All numbers are measured from real events — no estimates. Insights compare this week with last week.",
              "Tous les chiffres sont mesurés sur des événements réels — aucune estimation. Les insights comparent cette semaine à la précédente."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={`px-4 py-2 rounded-xl font-bold text-sm ${days === p.days ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}
            >
              {locale === "fr" ? p.fr : p.en}
            </button>
          ))}
          <button onClick={fetchAll} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 text-sm">{error}</div>}

      {/* Realtime row */}
      {realtime && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-card/40 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground uppercase font-bold">{t("Online now", "En ligne")}</p>
            <p className="text-2xl font-black text-emerald-400">{realtime.onlineUsers ?? "—"}</p>
          </div>
          <div className="bg-card/40 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground uppercase font-bold">{t("Active duels", "Duels actifs")}</p>
            <p className="text-2xl font-black text-primary">{realtime.activeDuels ?? "—"}</p>
          </div>
          <div className="bg-card/40 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground uppercase font-bold">{t("Views today", "Vues aujourd'hui")}</p>
            <p className="text-2xl font-black">{realtime.pageViewsToday ?? "—"}</p>
          </div>
          <div className="bg-card/40 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground uppercase font-bold">{t("Signups today", "Inscriptions aujourd'hui")}</p>
            <p className="text-2xl font-black">{realtime.registrationsToday ?? "—"}</p>
          </div>
          <div className="bg-card/40 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground uppercase font-bold">{t("Health", "Santé")}</p>
            <p className="text-sm font-black mt-1">
              <span className={realtime.health.db ? "text-emerald-400" : "text-red-500"}>DB {realtime.health.db ? "✓" : "✗"}</span>{" "}
              <span className={realtime.health.redis ? "text-emerald-400" : "text-red-500"}>Redis {realtime.health.redis ? "✓" : "✗"}</span>
            </p>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-card/40 border border-white/10 rounded-2xl p-6">
        <h2 className="font-black mb-3">{t("What the data says", "Ce que disent les données")}</h2>
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t(
              "Not enough events yet to draw comparisons — insights appear once enough real activity accumulates (minimum ~20 events per metric per week).",
              "Pas encore assez d'événements pour comparer — les insights apparaîtront dès que l'activité réelle sera suffisante (minimum ~20 événements par métrique et par semaine)."
            )}
          </p>
        ) : (
          <ul className="space-y-2">
            {insights.map((ins, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-primary font-black">•</span> {ins}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <div key={k.key} className="bg-card/40 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-1.5">{k.icon}{k.label}</p>
            <p className="text-2xl font-black mt-1">{totals ? (totals[k.key] ?? 0) : "—"}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card/40 border border-white/10 rounded-2xl p-6">
          <h2 className="font-black mb-2 text-primary">{t("Active users", "Utilisateurs actifs")}</h2>
          <Sparkline points={series.dau || []} />
        </div>
        <div className="bg-card/40 border border-white/10 rounded-2xl p-6">
          <h2 className="font-black mb-2 text-primary">{t("Games completed", "Parties terminées")}</h2>
          <Sparkline points={series.game_complete || []} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t(
          "Note: events start accumulating from the moment this version is deployed; historical days before deployment show zero.",
          "Note : les événements s'accumulent à partir du déploiement de cette version ; les jours antérieurs affichent zéro."
        )}
      </p>
    </div>
  );
}
