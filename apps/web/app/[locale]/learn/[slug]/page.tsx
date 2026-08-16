import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdSlot from "@/components/monetization/AdSlot";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

async function getArticle(slug: string, locale: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const res = await fetch(
    `${apiUrl}/content/articles/${slug}?locale=${locale}`,
    {
      next: { revalidate: 3600 }, // Cache for 1 hour
    },
  );

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch article");
  }

  return res.json();
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
      `Learn about ${article.title} at Sudoku Premium.`,
    alternates: {
      canonical: `/${lang}/learn/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author?.profile?.username || "Sudoku Premium Team"],
    },
    robots: {
      index: article.indexable,
      follow: article.indexable,
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
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: article.author?.profile?.username || "Sudoku Premium Team",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://sudokupremium.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Learn",
        item: `https://sudokupremium.com/${lang}/learn`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `https://sudokupremium.com/${lang}/learn/${slug}`,
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

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <nav className="text-sm text-muted-foreground flex gap-2">
          <Link href={`/${lang}`} className="hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <Link href={`/${lang}/learn`} className="hover:text-primary">
            Academy
          </Link>
          <span>/</span>
          <span className="text-foreground">{article.title}</span>
        </nav>

        <AdSlot slotName="LEARN_CONTENT_TOP" className="my-8" />

        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              By {article.author?.profile?.username || "Sudoku Premium Team"}
            </span>
            <span>•</span>
            <span>{article.readingTime} min read</span>
            {article.publishedAt && (
              <>
                <span>•</span>
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleDateString(
                    lang === "fr" ? "fr-FR" : "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </time>
              </>
            )}
          </div>
        </header>

        {article.excerpt && (
          <p className="text-xl text-muted-foreground font-medium border-l-4 border-primary pl-4">
            {article.excerpt}
          </p>
        )}

        {/* Since content is rich text or markdown, you would use a safe HTML renderer or Markdown component here. For now, we dangerouslySetInnerHTML */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <AdSlot slotName="LEARN_CONTENT_BOTTOM" className="my-8" />

        <footer className="mt-12 p-8 bg-muted rounded-2xl text-center space-y-6">
          <h3 className="text-2xl font-bold">Ready to apply this technique?</h3>
          <div className="flex justify-center gap-4">
            <Link
              href={`/${lang}/sudoku/hard`}
              className="px-6 py-3 bg-background text-foreground border rounded-lg font-medium hover:bg-accent transition-colors"
            >
              Play Hard Sudoku
            </Link>
            <Link
              href={`/${lang}/duel`}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Challenge a Friend
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
