import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/navigation";
import AdSlot from "@/components/monetization/AdSlot";
import {
  ACADEMY_ARTICLES,
  ARTICLE_SLUG_ALIASES,
} from "@/lib/academy-articles";
import {
  BookOpen,
  Target,
  Zap,
  ArrowLeft,
  Clock,
  Share2,
  Sparkles,
  Play,
  Shield,
} from "lucide-react";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

async function getArticle(slug: string, locale: string) {
  // 1. First check built-in Academy repository
  const normalizedSlug = ARTICLE_SLUG_ALIASES[slug] || slug;
  const builtIn = ACADEMY_ARTICLES[normalizedSlug];

  if (builtIn) {
    const lang = (locale === "fr" || locale === "de" || locale === "en") ? locale : "en";
    const translation = builtIn.translations[lang] || builtIn.translations.en;
    return {
      title: translation.title,
      excerpt: translation.excerpt,
      content: translation.contentHtml,
      metaTitle: translation.metaTitle,
      metaDescription: translation.metaDescription,
      readingTime: builtIn.readingTime,
      level: builtIn.level,
      status: "PUBLISHED",
      publishedAt: "2026-01-01T00:00:00.000Z",
      indexable: true,
      author: {
        profile: {
          username: "Sudoku Academy Team",
        },
      },
    };
  }

  // 2. Fallback to API / Database
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const res = await fetch(
      `${apiUrl}/content/articles/${slug}?locale=${locale}`,
      {
        next: { revalidate: 3600 },
      },
    );

    if (!res.ok) {
      if (res.status === 404) return null;
      return null;
    }

    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale: lang, slug } = await params;
  const article = await getArticle(slug, lang);

  if (!article || article.status !== "PUBLISHED") {
    return {
      title: "Article Not Found | Sudoku Academy",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: article.metaTitle || `${article.title} | Sudoku Academy`,
    description:
      article.metaDescription ||
      article.excerpt ||
      `Apprenez ${article.title} sur notre Académie Sudoku.`,
    alternates: {
      canonical: `/${lang}/learn/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author?.profile?.username || "Sudoku Academy Team"],
    },
    robots: {
      index: article.indexable !== false,
      follow: article.indexable !== false,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { locale: lang, slug } = await params;
  const article = await getArticle(slug, lang);

  if (!article || article.status !== "PUBLISHED") {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription || article.excerpt,
    datePublished: article.publishedAt,
    author: {
      "@type": "Person",
      name: article.author?.profile?.username || "Sudoku Academy Team",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: lang === "fr" ? "Accueil" : lang === "de" ? "Startseite" : "Home",
        item: `/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: lang === "fr" ? "Académie" : lang === "de" ? "Akademie" : "Academy",
        item: `/${lang}/learn`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `/${lang}/learn/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="min-h-screen bg-brand-navy text-foreground pb-20">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-b from-[#0A2A5C] to-transparent border-b border-white/10 py-8 px-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-gold hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {lang === "fr" ? "Retour à l'Académie" : lang === "de" ? "Zurück zur Akademie" : "Back to Academy"}
            </Link>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="px-3 py-1 bg-brand-gold/20 text-brand-gold border border-brand-gold/30 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {article.level === "advanced"
                  ? (lang === "fr" ? "Niveau Avancé" : lang === "de" ? "Fortgeschritten" : "Advanced Level")
                  : article.level === "intermediate"
                  ? (lang === "fr" ? "Niveau Intermédiaire" : lang === "de" ? "Mittelstufe" : "Intermediate Level")
                  : (lang === "fr" ? "Niveau Débutant" : lang === "de" ? "Anfänger" : "Beginner Level")}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1.5 font-bold">
                <Clock className="w-3.5 h-3.5 text-brand-cyan" />
                {article.readingTime || 5} {lang === "fr" ? "min de lecture" : lang === "de" ? "Min. Lesezeit" : "min read"}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-base md:text-lg text-gray-300 font-medium leading-relaxed max-w-3xl border-l-2 border-brand-gold/60 pl-4 py-1">
                {article.excerpt}
              </p>
            )}
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-10">
          <AdSlot slotName="LEARN_CONTENT_TOP" className="my-2" />

          {/* Article Main Body */}
          <div
            className="prose prose-invert max-w-none prose-headings:font-black prose-headings:text-white prose-p:text-gray-300 prose-p:leading-relaxed prose-strong:text-brand-gold"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <AdSlot slotName="LEARN_CONTENT_BOTTOM" className="my-4" />

          {/* Practice Callout Box */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0A2A5C] via-[#0D387A] to-[#0A2A5C] border-2 border-brand-gold/30 shadow-2xl space-y-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-gold/20 text-brand-gold mb-2">
              <Play className="w-7 h-7 fill-brand-gold" />
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <h2 className="text-2xl font-black text-white">
                {lang === "fr"
                  ? "Prêt à mettre en pratique cette règle ?"
                  : lang === "de"
                  ? "Bereit, diese Regel anzuwenden?"
                  : "Ready to practice this rule?"}
              </h2>
              <p className="text-sm text-gray-300">
                {lang === "fr"
                  ? "Lancez une partie immédiate ou défiez un ami en duel 1v1 pour tester vos compétences !"
                  : lang === "de"
                  ? "Starten Sie ein Spiel oder fordern Sie einen Freund zum 1v1-Duell heraus!"
                  : "Start a quick game or challenge a friend in a 1v1 duel to test your skills!"}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/sudoku/easy"
                className="px-6 py-3.5 bg-brand-gold text-brand-navy font-black text-sm uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                {lang === "fr" ? "Jouer une Grille Facile" : lang === "de" ? "Einfaches Sudoku spielen" : "Play Easy Sudoku"}
              </Link>
              <Link
                href="/duel"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-black text-sm uppercase tracking-wider rounded-xl border border-white/15 transition-all flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-brand-orange" />
                {lang === "fr" ? "Lancer un Duel 1v1" : lang === "de" ? "1v1 Duell starten" : "Start 1v1 Duel"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
