import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DIFFICULTIES, getDifficulty } from "@/lib/sudoku-seo-content";

export function generateStaticParams() {
  return DIFFICULTIES.map((d) => ({ difficulty: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; difficulty: string }>;
}): Promise<Metadata> {
  const { locale, difficulty } = await params;
  const d = getDifficulty(difficulty);
  if (!d) return { title: "Not found" };
  const title = locale === "fr" ? d.metaTitle.fr : d.metaTitle.en;
  const description = locale === "fr" ? d.metaDescription.fr : d.metaDescription.en;
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/sudoku/${d.slug}`,
      // Only complete locales get hreflang signals (P1-T rule)
      languages: { en: `/en/sudoku/${d.slug}`, fr: `/fr/sudoku/${d.slug}` },
    },
    openGraph: { title, description, type: "article" },
  };
}

export default async function DifficultyPage({
  params,
}: {
  params: Promise<{ locale: string; difficulty: string }>;
}) {
  const { locale, difficulty } = await params;
  const d = getDifficulty(difficulty);
  if (!d) notFound();

  const fr = locale === "fr";
  const t = <T,>(obj: { en: T; fr: T }): T => (fr ? obj.fr : obj.en);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sudokupremium.com";

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: d.faq.map((f) => ({
      "@type": "Question",
      name: t(f.q),
      acceptedAnswer: { "@type": "Answer", text: t(f.a) },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Sudoku", item: `${siteUrl}/${locale}/sudoku` },
      { "@type": "ListItem", position: 3, name: t(d.h1), item: `${siteUrl}/${locale}/sudoku/${d.slug}` },
    ],
  };

  const idx = DIFFICULTIES.findIndex((x) => x.slug === d.slug);
  const prev = DIFFICULTIES[idx - 1];
  const next = DIFFICULTIES[idx + 1];

  return (
    <div className="min-h-screen bg-[#020F24] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <ol className="flex gap-2 flex-wrap">
            <li><Link href={`/${locale}`} className="hover:text-white">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href={`/${locale}/sudoku`} className="hover:text-white">Sudoku</Link></li>
            <li aria-hidden>/</li>
            <li className="text-white font-medium capitalize">{d.slug}</li>
          </ol>
        </nav>

        <article>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-5">{t(d.h1)}</h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">{t(d.intro)}</p>

          <div className="flex flex-wrap gap-3 mb-12">
            <Link href={`/${locale}/play`} className="bg-primary hover:bg-primary/80 text-white font-bold px-6 py-3 rounded-xl">
              {fr ? "Jouer gratuitement" : "Play free now"}
            </Link>
            <Link href={`/${locale}/daily`} className="bg-white/5 hover:bg-white/10 font-bold px-6 py-3 rounded-xl">
              {fr ? "Défi du jour" : "Daily Challenge"}
            </Link>
            <Link href={`/${locale}/duel`} className="bg-white/5 hover:bg-white/10 font-bold px-6 py-3 rounded-xl">
              {fr ? "Duel en ligne" : "Online duel"}
            </Link>
          </div>

          <section className="mb-10">
            <h2 className="text-2xl font-black mb-4">{fr ? `Qu'est-ce qu'un sudoku ${d.slug} ?` : `What is ${d.slug} sudoku?`}</h2>
            {t(d.whatIs).map((p, i) => (
              <p key={i} className="text-white/85 mb-3 leading-relaxed">{p}</p>
            ))}
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black mb-4">{fr ? "À qui s'adresse ce niveau ?" : "Who should play this level?"}</h2>
            <ul className="space-y-2">
              {t(d.who).map((p, i) => (
                <li key={i} className="flex gap-2 text-white/85">
                  <span className="text-primary font-black">▸</span> {p}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black mb-4">{fr ? "À quel point est-ce difficile ?" : "How hard is it?"}</h2>
            <p className="text-white/85 leading-relaxed">{t(d.difficultyExplained)}</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black mb-4">{fr ? "Comment résoudre" : "How to solve"}</h2>
            <ol className="space-y-3">
              {t(d.howToSolve).map((p, i) => (
                <li key={i} className="flex gap-3 text-white/85">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center">{i + 1}</span>
                  <span className="leading-relaxed">{p}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black mb-4">{fr ? "Techniques recommandées" : "Recommended techniques"}</h2>
            <div className="space-y-3">
              {d.techniques.map((tech) => (
                <div key={tech.name} className="bg-card/40 border border-white/10 rounded-xl p-4">
                  <h3 className="font-black text-primary mb-1">{tech.name}</h3>
                  <p className="text-sm text-white/85 leading-relaxed">{t(tech.desc)}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {fr ? "Leçons détaillées dans l'" : "Full lessons in the "}
              <Link href={`/${locale}/learn`} className="text-primary hover:underline">{fr ? "Académie" : "Academy"}</Link>.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black mb-4">{fr ? "Erreurs courantes" : "Common mistakes"}</h2>
            <ul className="space-y-2">
              {t(d.mistakes).map((p, i) => (
                <li key={i} className="flex gap-2 text-white/85">
                  <span className="text-red-400 font-black">✕</span> {p}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black mb-4">{fr ? "Conseils de progression" : "Progress tips"}</h2>
            <ul className="space-y-2">
              {t(d.tips).map((p, i) => (
                <li key={i} className="flex gap-2 text-white/85">
                  <span className="text-emerald-400 font-black">✓</span> {p}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10" id="faq">
            <h2 className="text-2xl font-black mb-4">{fr ? "Questions fréquentes" : "Frequently asked questions"}</h2>
            <div className="space-y-4">
              {d.faq.map((f, i) => (
                <details key={i} className="bg-card/40 border border-white/10 rounded-xl p-4" open={i === 0}>
                  <summary className="font-bold cursor-pointer">{t(f.q)}</summary>
                  <p className="text-white/85 mt-2 leading-relaxed text-sm">{t(f.a)}</p>
                </details>
              ))}
            </div>
          </section>

          <nav className="flex justify-between gap-4 mb-8" aria-label={fr ? "Niveaux liés" : "Related levels"}>
            {prev ? (
              <Link href={`/${locale}/sudoku/${prev.slug}`} className="flex-1 bg-card/40 border border-white/10 rounded-xl p-4 hover:border-primary/30">
                <span className="text-xs text-muted-foreground uppercase font-bold">← {fr ? "Plus facile" : "Easier"}</span>
                <p className="font-black capitalize">{prev.slug}</p>
              </Link>
            ) : <span className="flex-1" />}
            {next ? (
              <Link href={`/${locale}/sudoku/${next.slug}`} className="flex-1 bg-card/40 border border-white/10 rounded-xl p-4 text-right hover:border-primary/30">
                <span className="text-xs text-muted-foreground uppercase font-bold">{fr ? "Plus dur" : "Harder"} →</span>
                <p className="font-black capitalize">{next.slug}</p>
              </Link>
            ) : <span className="flex-1" />}
          </nav>

          <aside className="bg-card/30 border border-white/10 rounded-2xl p-6 text-sm">
            <h2 className="font-black mb-3">{fr ? "Entraînez-vous aussi" : "Keep practicing"}</h2>
            <div className="flex flex-wrap gap-3">
              <Link href={`/${locale}/questions`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">Q&A</Link>
              <Link href={`/${locale}/forum`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">Forum</Link>
              <Link href={`/${locale}/leaderboard`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">{fr ? "Classement" : "Leaderboard"}</Link>
            </div>
          </aside>
        </article>
      </div>
    </div>
  );
}
