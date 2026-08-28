import { Metadata } from "next";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { Trophy, Medal, Award, Flame } from "lucide-react";

interface Row {
  rank?: number;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  level: number;
  rating: number;
  streak?: number;
  games?: number;
  wins?: number;
  winRate?: number;
}

async function getRows(period: string): Promise<Row[]> {
  const url =
    period === "global"
      ? `${API_URL}/leaderboard/global?limit=50`
      : `${API_URL}/leaderboard/period/${period}?limit=50`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return (await res.json()) as Row[];
  } catch {
    return [];
  }
}

const PERIODS = [
  { key: "global", en: "Global", fr: "Global" },
  { key: "daily", en: "Today", fr: "Aujourd'hui" },
  { key: "weekly", en: "This week", fr: "Cette semaine" },
  { key: "monthly", en: "This month", fr: "Ce mois" },
  { key: "yearly", en: "This year", fr: "Cette année" },
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === "fr" ? "Classement Sudoku — Top joueurs" : "Sudoku Leaderboard — Top Players";
  const description = locale === "fr"
    ? "Le classement officiel des meilleurs joueurs de Sudoku : rating, victoires, séries et niveau, par jour, semaine, mois ou année."
    : "The official Sudoku leaderboard: rating, wins, streaks and levels — daily, weekly, monthly, yearly and all-time.";
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/leaderboard`,
      languages: { en: "/en/leaderboard", fr: "/fr/leaderboard", de: "/de/leaderboard" },
    },
    openGraph: { title, description, type: "website" },
  };
}

export default async function LeaderboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const period = PERIODS.some((p) => p.key === sp.period) ? sp.period! : "global";
  const rows = await getRows(period);

  const t = (en: string, fr: string) => (locale === "fr" ? fr : en);
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("Sudoku Leaderboard", "Classement Sudoku"),
    numberOfItems: rows.length,
    itemListElement: rows.slice(0, 10).map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: r.username,
    })),
  };

  return (
    <div className="min-h-screen bg-[#020F24] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <ol className="flex gap-2">
            <li><Link href={`/${locale}`} className="hover:text-white">Home</Link></li>
            <li aria-hidden>/</li>
            <li className="text-white font-medium">{t("Leaderboard", "Classement")}</li>
          </ol>
        </nav>

        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 flex flex-wrap items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-400" />
            {t("Sudoku Leaderboard", "Classement Sudoku")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {t(
              "The best sudoku duel players, ranked by rating and wins. Climb the ranks by winning duels and daily challenges.",
              "Les meilleurs joueurs de sudoku en duel, classés par rating et victoires. Grimpez en gagnant des duels et des défis quotidiens."
            )}
          </p>
        </header>

        {/* Period tabs */}
        <nav className="flex flex-wrap gap-2 mb-8" aria-label="Période">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/${locale}/leaderboard?period=${p.key}`}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                period === p.key
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10"
              }`}
            >
              {locale === "fr" ? p.fr : p.en}
            </Link>
          ))}
        </nav>

        {rows.length === 0 ? (
          <div className="bg-card/40 border border-white/10 rounded-2xl p-12 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl font-bold mb-2">{t("No ranked players yet", "Aucun joueur classé pour le moment")}</p>
            <p className="text-muted-foreground mb-6">
              {t("Play duels to appear here first.", "Jouez des duels pour apparaître ici en premier.")}
            </p>
            <Link href={`/${locale}/duel`} className="inline-block bg-primary hover:bg-primary/80 text-white font-bold px-6 py-3 rounded-xl">
              {t("Play a duel", "Jouer un duel")}
            </Link>
          </div>
        ) : (
          <>
            {/* Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {[1, 0, 2].map((idx) => {
                const r = podium[idx];
                const orderClass = idx === 0 ? "order-1 md:order-none" : idx === 1 ? "order-2 md:order-none" : "order-3 md:order-none";
                if (!r) return <div key={idx} className={orderClass} />;
                const medal = idx === 0 ? <Trophy className="w-8 h-8 text-yellow-400" /> : idx === 1 ? <Medal className="w-8 h-8 text-gray-300" /> : <Award className="w-8 h-8 text-amber-600" />;
                return (
                  <div
                    key={r.userId}
                    className={`bg-card/40 border rounded-2xl p-4 sm:p-5 text-center min-w-0 flex flex-col items-center justify-center ${idx === 0 ? "border-yellow-400/40 md:-mt-4" : "border-white/10"} ${orderClass}`}
                  >
                    <div className="flex justify-center mb-3">{medal}</div>
                    <p className="font-black truncate w-full">{r.username}</p>
                    <p className="text-2xl font-black text-primary mt-1">{r.rating}</p>
                    <p className="text-xs text-muted-foreground truncate w-full">
                      {t("Level", "Niveau")} {r.level}
                      {typeof r.winRate === "number" ? ` · ${r.winRate}% ${t("wins", "victoires")}` : ""}
                      {r.streak ? <span className="flex items-center justify-center gap-1 mt-1"><Flame className="w-3 h-3 text-orange-400 shrink-0" />{r.streak}</span> : null}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Table */}
            <div className="bg-card/40 border border-white/10 rounded-2xl overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">#</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">{t("Player", "Joueur")}</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">{t("Rating", "Rating")}</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase hidden sm:table-cell">{t("Level", "Niveau")}</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase hidden md:table-cell">{period === "global" ? t("Wins", "Victoires") : t("Games", "Parties")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {rest.map((r, i) => (
                    <tr key={r.userId} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-muted-foreground">{i + 4}</td>
                      <td className="px-4 py-3 font-bold">{r.username}</td>
                      <td className="px-4 py-3 text-primary font-black">{r.rating}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">{r.level}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {period === "global" ? `${r.wins ?? 0}` : `${r.wins ?? 0}/${r.games ?? 0}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-10 flex flex-wrap gap-3 text-sm">
          <Link href={`/${locale}/duel`} className="bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary/20">{t("Play duels", "Jouer en duel")}</Link>
          <Link href={`/${locale}/daily`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">{t("Daily challenge", "Défi du jour")}</Link>
          <Link href={`/${locale}/learn`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">{t("Academy", "Académie")}</Link>
        </div>
      </div>
    </div>
  );
}
