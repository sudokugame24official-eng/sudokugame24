import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { API_URL } from "@/lib/api";
import QuestionInteractions from "./QuestionInteractions";
import QuestionAnswerForm from "./QuestionAnswerFormClient";
import { CheckCircle2, Eye, Lock, MessageCircle, Pin } from "lucide-react";

interface Answer {
  id: string; body: string; score: number; isAccepted: boolean; createdAt: string;
  author: { profile?: { username?: string } };
}
interface Question {
  id: string; slug: string; title: string; body: string; tags: string[];
  views: number; score: number; answerCount: number; hasAccepted: boolean;
  isClosed: boolean; isLocked: boolean; isPinned: boolean; createdAt: string;
  author: { profile?: { username?: string } };
  answers: Answer[];
  _count?: { followers: number };
}

async function getQuestion(slug: string): Promise<Question | null> {
  try {
    // trackView=false: SSR (including crawler fetches) must not inflate views
    const res = await fetch(`${API_URL}/questions/${slug}?trackView=false`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const q = await getQuestion(slug);
  if (!q) return { title: "Question not found" };
  const desc = (q.body || "").slice(0, 155);
  return {
    title: `${q.title} — Sudoku Q&A`,
    description: desc,
    alternates: { canonical: `/${locale}/questions/${q.slug}` },
    robots: q.isClosed ? { index: false, follow: true } : undefined,
    openGraph: { title: q.title, description: desc, type: "article" },
  };
}

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const q = await getQuestion(slug);
  if (!q) notFound();

  const t = (en: string, fr: string) => (locale === "fr" ? fr : en);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sudoku-premium.example.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: q.title,
      text: q.body,
      dateCreated: q.createdAt,
      author: { "@type": "Person", name: q.author?.profile?.username || "Anonymous" },
      answerCount: q.answerCount,
      upvoteCount: q.score,
      acceptedAnswer: q.answers.find((a) => a.isAccepted)
        ? {
            "@type": "Answer",
            text: q.answers.find((a) => a.isAccepted)!.body.slice(0, 1000),
            url: `${siteUrl}/${locale}/questions/${q.slug}`,
            upvoteCount: q.answers.find((a) => a.isAccepted)!.score,
          }
        : undefined,
      suggestedAnswer: q.answers.filter((a) => !a.isAccepted).slice(0, 3).map((a) => ({
        "@type": "Answer",
        text: a.body.slice(0, 1000),
        url: `${siteUrl}/${locale}/questions/${q.slug}`,
        upvoteCount: a.score,
      })),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Q&A", item: `${siteUrl}/${locale}/questions` },
      { "@type": "ListItem", position: 3, name: q.title.slice(0, 60), item: `${siteUrl}/${locale}/questions/${q.slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-[#020F24] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <ol className="flex gap-2 flex-wrap">
            <li><Link href={`/${locale}`} className="hover:text-white">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href={`/${locale}/questions`} className="hover:text-white">Q&A</Link></li>
            <li aria-hidden>/</li>
            <li className="text-white font-medium truncate max-w-56">{q.title.slice(0, 40)}…</li>
          </ol>
        </nav>

        <article>
          <div className="flex items-center gap-3 text-xs mb-3">
            {q.isPinned && <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded font-bold"><Pin className="w-3 h-3" />{t("Pinned", "Épinglée")}</span>}
            {q.isClosed && <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded font-bold">{t("Closed", "Fermée")}</span>}
            {q.isLocked && <span className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-1 rounded font-bold"><Lock className="w-3 h-3" />{t("Locked", "Verrouillée")}</span>}
            <span className="flex items-center gap-1 text-muted-foreground"><Eye className="w-3.5 h-3.5" />{q.views}</span>
            <span className="text-muted-foreground">
              {t("asked by", "posée par")} <strong>{q.author?.profile?.username || t("unknown", "inconnu")}</strong>{" "}
              <time dateTime={q.createdAt}>{new Date(q.createdAt).toLocaleDateString(locale)}</time>
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">{q.title}</h1>

          <div className="prose prose-invert max-w-none mb-6">
            <p className="whitespace-pre-wrap text-white/90">{q.body}</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8 text-xs">
            {q.tags.map((tag) => (
              <a key={tag} href={`/${locale}/questions?tag=${encodeURIComponent(tag)}`} className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-medium">
                #{tag}
              </a>
            ))}
          </div>

          {/* Client-side interactions (vote, follow, report, share) */}
          <QuestionInteractions questionId={q.id} slug={q.slug} score={q.score} followers={q._count?.followers ?? 0} />

          {/* Answers */}
          <section className="mt-12">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-primary" />
              {t(`${q.answerCount} answer${q.answerCount === 1 ? "" : "s"}`, `${q.answerCount} réponse${q.answerCount === 1 ? "" : "s"}`)}
            </h2>

            {q.answers.length === 0 ? (
              <div className="bg-card/40 border border-white/10 rounded-2xl p-8 text-center">
                <p className="text-muted-foreground">
                  {t("No answer yet — share your knowledge!", "Pas encore de réponse — partagez votre savoir !")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {q.answers.map((a) => (
                  <div key={a.id} className={`bg-card/40 border rounded-2xl p-5 ${a.isAccepted ? "border-emerald-500/40" : "border-white/10"}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-2 shrink-0 w-14">
                        <span className="font-black text-lg">{a.score}</span>
                        {a.isAccepted && (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold" title={t("Accepted answer", "Réponse acceptée")}>
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-wrap text-white/90">{a.body}</p>
                        <p className="text-xs text-muted-foreground mt-3">
                          — <strong>{a.author?.profile?.username || t("unknown", "inconnu")}</strong>,{" "}
                          <time dateTime={a.createdAt}>{new Date(a.createdAt).toLocaleDateString(locale)}</time>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Answer form is a client island inside QuestionInteractions via answer target */}
            <AnswerForm questionId={q.id} closed={q.isClosed || q.isLocked} locale={locale} />
          </section>

          {/* Semantic graph links */}
          <aside className="mt-12 bg-card/30 border border-white/10 rounded-2xl p-6">
            <h2 className="font-black mb-3">{t("Keep practicing", "Continuez à jouer")}</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href={`/${locale}/learn`} className="bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary/20">{t("Sudoku Academy", "Académie Sudoku")}</Link>
              <Link href={`/${locale}/play`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">{t("Play free", "Jouer gratuitement")}</Link>
              <Link href={`/${locale}/daily`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">{t("Daily challenge", "Défi du jour")}</Link>
              <Link href={`/${locale}/duel`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">Duel</Link>
              <Link href={`/${locale}/forum`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">Forum</Link>
            </div>
          </aside>
        </article>
      </div>
    </div>
  );
}

function AnswerForm({ questionId, closed, locale }: { questionId: string; closed: boolean; locale: string }) {
  const t = (en: string, fr: string) => (locale === "fr" ? fr : en);
  return (
    <div className="mt-8 bg-card/40 border border-white/10 rounded-2xl p-6">
      <h3 className="font-black mb-4">{t("Your answer", "Votre réponse")}</h3>
      <QuestionAnswerForm questionId={questionId} closed={closed} t={t} />
    </div>
  );
}
