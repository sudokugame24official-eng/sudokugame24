import Link from "next/link";
import { extractContextualLinks } from "@/lib/related-links";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { API_URL } from "@/lib/api";
import { MessageCircle, Eye, Pin, Lock, CheckCircle2 } from "lucide-react";

interface Topic {
  id: string; slug: string; title: string; content: string;
  isPinned: boolean; isClosed: boolean; isLocked: boolean; views: number;
  createdAt: string;
  author: { profile?: { username?: string; level?: number } };
  category: { name: string; id: string };
  comments: {
    id: string; content: string; createdAt: string;
    author: { profile?: { username?: string } };
  }[];
  _count?: { comments: number };
}

async function fetchTopic(slug: string): Promise<Topic | null> {
  try {
    // trackView=false on SSR: crawlers must not inflate view counts
    const res = await fetch(`${API_URL}/forum/posts/slug/${encodeURIComponent(slug)}?trackView=false`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Topic;
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
  const topic = await fetchTopic(slug);
  if (!topic) return { title: "Topic not found" };
  const description = (topic.content || "").slice(0, 155);
  return {
    title: `${topic.title} | Forum Sudoku`,
    description,
    alternates: { canonical: `/${locale}/forum/topic/${topic.slug}` },
    robots: (topic.comments.length === 0 && topic.content.length < 100)
      ? { index: false, follow: true } // thin content: keep out of the index
      : undefined,
    openGraph: { title: topic.title, description, type: "article" },
  };
}

export default async function ForumTopicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const topic = await fetchTopic(slug);
  if (!topic) notFound();

  const t = (en: string, fr: string, de?: string) =>
    locale === "fr" ? fr : locale === "de" ? de || en : en;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sudokupremium.com";
  const canonical = `${siteUrl}/${locale}/forum/topic/${topic.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: topic.title,
    articleBody: topic.content.slice(0, 5000),
    datePublished: topic.createdAt,
    url: canonical,
    author: { "@type": "Person", name: topic.author?.profile?.username || "Member" },
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/CommentAction",
      userInteractionCount: topic._count?.comments ?? topic.comments.length,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Forum", item: `${siteUrl}/${locale}/forum` },
      { "@type": "ListItem", position: 3, name: topic.category.name, item: `${siteUrl}/${locale}/forum?category=${topic.category.id}` },
      { "@type": "ListItem", position: 4, name: topic.title.slice(0, 60), item: canonical },
    ],
  };

  const totalComments = topic._count?.comments ?? topic.comments.length;

  return (
    <div className="min-h-screen bg-[#020F24] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <ol className="flex gap-2 flex-wrap">
            <li><Link href={`/${locale}`} className="hover:text-white">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href={`/${locale}/forum`} className="hover:text-white">Forum</Link></li>
            <li aria-hidden>/</li>
            <li className="text-white font-medium">{topic.category.name}</li>
          </ol>
        </nav>

        <article>
          <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
            {topic.isPinned && <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded font-bold"><Pin className="w-3 h-3" />{t("Pinned", "Épinglé", "Angeheftet")}</span>}
            {topic.isClosed && <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded font-bold">{t("Closed", "Fermé", "Geschlossen")}</span>}
            {topic.isLocked && <span className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-1 rounded font-bold"><Lock className="w-3 h-3" />{t("Locked", "Verrouillé", "Gesperrt")}</span>}
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">{topic.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{topic.views} {t("views", "vues", "Aufrufe")}</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{totalComments} {t("replies", "réponses", "Antworten")}</span>
            <span>{t("by", "par", "von")} <strong className="text-white/80">{topic.author?.profile?.username || t("Member", "Membre", "Mitglied")}</strong></span>
            <time dateTime={topic.createdAt}>{new Date(topic.createdAt).toLocaleDateString(locale)}</time>
          </div>

          <div className="bg-card/40 border border-white/10 rounded-2xl p-6 mb-8">
            <p className="whitespace-pre-wrap text-white/90">{topic.content}</p>
          </div>

          <section>
            <h2 className="text-2xl font-black mb-6">
              {totalComments} {t("replies", "réponses", "Antworten")}
            </h2>
            <div className="space-y-3">
              {topic.comments.map((c) => (
                <div key={c.id} className="bg-card/30 border border-white/10 rounded-xl p-4">
                  <p className="whitespace-pre-wrap text-white/85 text-sm">{c.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    — <strong>{c.author?.profile?.username || t("Member", "Membre", "Mitglied")}</strong>,{" "}
                    <time dateTime={c.createdAt}>{new Date(c.createdAt).toLocaleDateString(locale)}</time>
                  </p>
                </div>
              ))}
              {topic.comments.length === 0 && (
                <p className="text-muted-foreground text-sm">{t("No replies yet.", "Pas encore de réponse.", "Noch keine Antworten.")}</p>
              )}
            </div>
          </section>
        </article>

        {/* Semantic graph: contextual links (techniques mentioned → Academy, game modes → their pages) */}
        <aside className="mt-12 bg-card/30 border border-white/10 rounded-2xl p-6 text-sm">
          <h2 className="font-black mb-3">{t("Explore", "Explorer", "Erkunden")}</h2>
          {(() => {
            // P1-U: links derived from what THIS topic actually mentions
            const ctx = extractContextualLinks(
              `${topic.title} ${topic.content}`,
              locale,
            );
            return ctx.length > 0 ? (
              <div className="flex flex-wrap gap-3 mb-4">
                {ctx.map((l) => (
                  <Link key={l.href} href={l.href} className="bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/30">
                    {l.label}
                  </Link>
                ))}
              </div>
            ) : null;
          })()}
          <div className="flex flex-wrap gap-3">
            <Link href={`/${locale}/learn`} className="bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary/20">{t("Sudoku Academy", "Académie Sudoku", "Sudoku-Akademie")}</Link>
            <Link href={`/${locale}/questions`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">Q&A</Link>
            <Link href={`/${locale}/play`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">{t("Play free", "Jouer", "Spielen")}</Link>
            <Link href={`/${locale}/daily`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">{t("Daily challenge", "Défi du jour", "Tägliche Herausforderung")}</Link>
            <Link href={`/${locale}/duel`} className="bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">Duel</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
