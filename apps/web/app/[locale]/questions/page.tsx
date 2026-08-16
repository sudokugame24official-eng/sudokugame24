import { Metadata } from "next";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { MessageCircle, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

interface Q {
  id: string; slug: string; title: string; body: string; tags: string[];
  views: number; score: number; answerCount: number; hasAccepted: boolean;
  isPinned: boolean; createdAt: string; lastActivityAt: string;
  author?: { profile?: { username?: string } };
}

async function getQuestions(search: string | undefined, sort: string | undefined, page: number, unanswered: boolean) {
  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (search) params.set("search", search);
  if (sort) params.set("sort", sort);
  if (unanswered) params.set("unanswered", "true");
  try {
    const res = await fetch(`${API_URL}/questions?${params}`, { next: { revalidate: 60 } });
    if (!res.ok) return { questions: [] as Q[], total: 0, page: 1, pageCount: 1 };
    const data = (await res.json()) as { questions: Q[]; total: number; page: number; pageCount: number };
    return data;
  } catch {
    return { questions: [] as Q[], total: 0, page: 1, pageCount: 1 };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === "fr"
    ? "Questions & Réponses Sudoku — Communauté d'entraide"
    : "Sudoku Q&A — Community Help & Answers";
  const description = locale === "fr"
    ? "Posez vos questions sur le Sudoku : règles, techniques, grilles bloquées, duels. La communauté répond."
    : "Ask anything about Sudoku: rules, solving techniques, stuck grids, duels. Real answers from the community.";
  return {
    title,
    description,
    alternates: { canonical: `/${locale}/questions` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function QuestionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; sort?: string; page?: string; unanswered?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const unanswered = sp.unanswered === "true";
  const data = await getQuestions(sp.q, sp.sort, page, unanswered);

  const t = (en: string, fr: string) => (locale === "fr" ? fr : en);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("Sudoku Q&A", "Questions & Réponses Sudoku"),
    description: t("Community questions about Sudoku", "Questions de la communauté sur le Sudoku"),
    inLanguage: locale,
  };

  return (
    <div className="min-h-screen bg-[#020F24] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <ol className="flex gap-2">
            <li><Link href={`/${locale}`} className="hover:text-white">Home</Link></li>
            <li aria-hidden>/</li>
            <li className="text-white font-medium">{t("Q&A", "Questions")}</li>
          </ol>
        </nav>

        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            {t("Sudoku Questions & Answers", "Questions & Réponses Sudoku")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            {t(
              "Stuck on a grid? Unsure when to use X-Wing or Swordfish? Ask the community and get real answers from players of every level.",
              "Bloqué sur une grille ? Vous ne savez pas quand utiliser le X-Wing ou le Swordfish ? Posez votre question et obtenez des réponses de joueurs de tous niveaux."
            )}
          </p>

          <div className="flex flex-wrap gap-3 items-center">
            <Link
              href={`/${locale}/questions/ask`}
              className="bg-primary hover:bg-primary/80 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              {t("Ask a question", "Poser une question")}
            </Link>
            <form action={`/${locale}/questions`} method="GET" className="flex gap-2 flex-1 min-w-64">
              <input
                type="search" name="q" defaultValue={sp.q || ""}
                placeholder={t("Search questions…", "Rechercher une question…")}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
              <button type="submit" className="bg-white/10 hover:bg-white/20 px-5 rounded-xl font-bold text-sm">
                {t("Search", "Rechercher")}
              </button>
            </form>
          </div>

          <div className="flex gap-2 mt-4 text-sm">
            {[
              { key: undefined, label: t("Newest", "Récentes") },
              { key: "votes", label: t("Top voted", "Mieux notées") },
              { key: "activity", label: t("Active", "Actives") },
            ].map((s) => (
              <a
                key={s.label}
                href={`/${locale}/questions?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(s.key ? { sort: s.key } : {}) })}`}
                className={`px-4 py-2 rounded-lg font-medium ${(!sp.sort && !s.key) || sp.sort === s.key ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}
              >
                {s.label}
              </a>
            ))}
            <a
              href={`/${locale}/questions?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), unanswered: "true" })}`}
              className={`px-4 py-2 rounded-lg font-medium ${unanswered ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}
            >
              {t("Unanswered", "Sans réponse")}
            </a>
          </div>
        </header>

        {/* Internal links (semantic graph) */}
        <section className="mb-10 text-sm text-muted-foreground">
          <p>
            {t("Learn the fundamentals in the ", "Apprenez les bases dans l'")}
            <Link href={`/${locale}/learn`} className="text-primary hover:underline">{t("Academy", "Académie")}</Link>
            {" · "}
            <Link href={`/${locale}/play`} className="text-primary hover:underline">{t("practice free", "entraînez-vous")}</Link>
            {" · "}
            <Link href={`/${locale}/daily`} className="text-primary hover:underline">{t("daily challenge", "défi du jour")}</Link>
            {" · "}
            <Link href={`/${locale}/duel`} className="text-primary hover:underline">duel</Link>
            {" · "}
            <Link href={`/${locale}/forum`} className="text-primary hover:underline">forum</Link>
          </p>
        </section>

        {/* Question list */}
        <div className="space-y-4">
          {data.questions.length === 0 ? (
            <div className="bg-card/40 border border-white/10 rounded-2xl p-10 text-center">
              <p className="text-xl font-bold mb-2">{t("No questions yet", "Aucune question pour le moment")}</p>
              <p className="text-muted-foreground mb-6">
                {t("Be the first to ask — every good question helps future players.", "Sois le premier à demander — chaque bonne question aide les joueurs futurs.")}
              </p>
              <Link href={`/${locale}/questions/ask`} className="inline-block bg-primary hover:bg-primary/80 text-white font-bold px-6 py-3 rounded-xl">
                {t("Ask the first question", "Poser la première question")}
              </Link>
            </div>
          ) : (
            data.questions.map((q) => (
              <article key={q.id} className="bg-card/40 border border-white/10 rounded-2xl p-5 hover:border-primary/30 transition-colors">
                <div className="flex gap-5">
                  <div className="flex flex-col items-center gap-1 text-sm shrink-0 w-16">
                    <div className="font-black text-lg">{q.score}</div>
                    <div className="text-muted-foreground text-xs">{t("votes", "votes")}</div>
                    <div className={`flex items-center gap-1 mt-1 font-bold ${q.hasAccepted ? "text-emerald-400" : q.answerCount > 0 ? "text-blue-400" : "text-muted-foreground"}`}>
                      <MessageCircle className="w-4 h-4" /> {q.answerCount}
                    </div>
                    {q.hasAccepted && <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-label={t("accepted", "acceptée")} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/${locale}/questions/${q.slug}`} className="text-lg font-bold hover:text-primary transition-colors block">
                      {q.isPinned && <span className="text-yellow-400 mr-2" title={t("pinned", "épinglée")}>📌</span>}
                      {q.title}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{q.body.slice(0, 220)}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                      {q.tags.map((tag) => (
                        <a key={tag} href={`/${locale}/questions?tag=${encodeURIComponent(tag)}`} className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-medium">
                          #{tag}
                        </a>
                      ))}
                      <span className="text-muted-foreground ml-auto">
                        {q.author?.profile?.username || t("unknown", "inconnu")} ·{" "}
                        {t(`${q.views} views`, `${q.views} vues`)} ·{" "}
                        <time dateTime={q.createdAt}>{new Date(q.createdAt).toLocaleDateString(locale)}</time>
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Pagination */}
        {data.pageCount > 1 && (
          <nav className="flex items-center justify-between mt-8" aria-label="Pagination">
            {page > 1 ? (
              <Link href={`/${locale}/questions?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.sort ? { sort: sp.sort } : {}), page: String(page - 1) })}`} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/10">
                <ChevronLeft className="w-4 h-4" /> {t("Previous", "Précédent")}
              </Link>
            ) : <span />}
            <span className="text-sm text-muted-foreground">{data.page} / {data.pageCount}</span>
            {page < data.pageCount ? (
              <Link href={`/${locale}/questions?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.sort ? { sort: sp.sort } : {}), page: String(page + 1) })}`} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/10">
                {t("Next", "Suivant")} <ChevronRight className="w-4 h-4" />
              </Link>
            ) : <span />}
          </nav>
        )}
      </div>
    </div>
  );
}
