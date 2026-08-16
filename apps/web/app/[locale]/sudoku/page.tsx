import { Metadata } from "next";
import Link from "next/link";
import { DIFFICULTIES } from "@/lib/sudoku-seo-content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === "fr" ? "Sudoku Gratuit en Ligne — Jouez par Niveau" : "Free Online Sudoku — Play by Difficulty";
  const description = locale === "fr"
    ? "Jouez au sudoku gratuit en ligne : facile, moyen, difficile, expert, extrême. Chaque niveau expliqué avec techniques, erreurs à éviter et défis quotidiens."
    : "Play free online sudoku: easy, medium, hard, expert, extreme. Every level explained with techniques, common mistakes and daily challenges.";
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/sudoku`,
      languages: { en: "/en/sudoku", fr: "/fr/sudoku" },
    },
    openGraph: { title, description, type: "website" },
  };
}

export default async function SudokuHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = (en: string, fr: string) => (locale === "fr" ? fr : en);

  return (
    <div className="min-h-screen bg-[#020F24] text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <ol className="flex gap-2">
            <li><Link href={`/${locale}`} className="hover:text-white">Home</Link></li>
            <li aria-hidden>/</li>
            <li className="text-white font-medium">Sudoku</li>
          </ol>
        </nav>

        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            {t("Free Online Sudoku — Choose Your Level", "Sudoku Gratuit en Ligne — Choisissez votre niveau")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {t(
              "Five difficulties, from a relaxing 45-clue scan to under-22-clue chains. Every grid is logic-solvable, verified server-side, and free — no download, no account needed to play.",
              "Cinq difficultés, du balayage détente à 45 indices jusqu'aux chaînes sous les 22 indices. Chaque grille est résoluble par logique, vérifiée côté serveur, gratuite — sans téléchargement ni compte."
            )}
          </p>
        </header>

        <div className="grid gap-4">
          {DIFFICULTIES.map((d) => (
            <article key={d.slug} className="bg-card/40 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-colors">
              <h2 className="text-2xl font-black mb-2">
                <Link href={`/${locale}/sudoku/${d.slug}`} className="hover:text-primary transition-colors">
                  {locale === "fr" ? d.h1.fr : d.h1.en}
                </Link>
              </h2>
              <p className="text-muted-foreground mb-4">{locale === "fr" ? d.intro.fr : d.intro.en}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link href={`/${locale}/sudoku/${d.slug}`} className="bg-primary hover:bg-primary/80 text-white font-bold px-4 py-2 rounded-lg">
                  {t("Learn & play", "Apprendre & jouer")}
                </Link>
                <Link href={`/${locale}/play`} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg">
                  {t("Play now", "Jouer maintenant")}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-12 bg-card/30 border border-white/10 rounded-2xl p-6">
          <h2 className="font-black mb-3">{t("Also on the platform", "Aussi sur la plateforme")}</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={`/${locale}/daily`} className="bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary/20">{t("Daily Challenge", "Défi du jour")}</Link>
            <Link href={`/${locale}/duel`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">Duel</Link>
            <Link href={`/${locale}/leaderboard`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">{t("Leaderboard", "Classement")}</Link>
            <Link href={`/${locale}/learn`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">{t("Academy", "Académie")}</Link>
            <Link href={`/${locale}/questions`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">Q&A</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
