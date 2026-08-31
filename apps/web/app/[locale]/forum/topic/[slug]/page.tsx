import Link from "next/link";
import { extractContextualLinks } from "@/lib/related-links";
import type { Metadata } from "next";
import { API_URL } from "@/lib/api";
import ForumTopicClient from "../../[id]/ForumTopicClient";

interface Topic {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPinned: boolean;
  isClosed: boolean;
  isLocked: boolean;
  views: number;
  likes: number;
  createdAt: string;
  author: {
    profile?: { username?: string; level?: number; avatarUrl?: string; rating?: number };
    role?: string;
    perks?: any[];
  };
  category: { name: string; id: string };
  comments: {
    id: string;
    content: string;
    createdAt: string;
    likes: number;
    author: {
      profile?: { username?: string; level?: number; avatarUrl?: string; rating?: number };
      role?: string;
      perks?: any[];
    };
  }[];
  _count?: { comments: number };
}

async function fetchTopic(slug: string): Promise<Topic | null> {
  try {
    const res = await fetch(
      `${API_URL}/forum/posts/slug/${encodeURIComponent(slug)}?trackView=false`,
      {
        cache: "no-store",
      },
    );
    if (!res.ok) {
      // Fallback by ID if slug fetch didn't return 200
      const resById = await fetch(`${API_URL}/forum/posts/${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });
      if (!resById.ok) return null;
      return (await resById.json()) as Topic;
    }
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sudokupremium.com";
  const canonicalUrl = `${siteUrl}/${locale}/forum/topic/${topic.slug || topic.id}`;

  return {
    title: `${topic.title} | Forum Sudoku Premium`,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${siteUrl}/en/forum/topic/${topic.slug || topic.id}`,
        fr: `${siteUrl}/fr/forum/topic/${topic.slug || topic.id}`,
        de: `${siteUrl}/de/forum/topic/${topic.slug || topic.id}`,
      },
    },
    openGraph: {
      title: topic.title,
      description,
      type: "article",
      url: canonicalUrl,
    },
  };
}

export default async function ForumTopicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const topic = await fetchTopic(slug);
  if (!topic) {
    // Professional localized not-found page — no generic Next.js 404
    const defaultMsg = { title: "Topic not found", body: "This discussion may have been deleted or moved.", back: "Return to Forum" };
    const notFoundMessages: Record<string, { title: string; body: string; back: string }> = {
      fr: { title: "Sujet introuvable", body: "Cette discussion a peut-\u00eatre \u00e9t\u00e9 supprim\u00e9e ou d\u00e9plac\u00e9e.", back: "Retour au forum" },
      de: { title: "Thema nicht gefunden", body: "Diese Diskussion wurde m\u00f6glicherweise gel\u00f6scht oder verschoben.", back: "Zur\u00fcck zum Forum" },
      en: defaultMsg,
    };
    const msg = notFoundMessages[locale] || defaultMsg;
    return (
      <div className="min-h-screen bg-[#041E42] flex flex-col items-center justify-center text-white px-4 text-center">
        <svg className="w-16 h-16 text-white/20 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-3xl font-black mb-3">{msg.title}</h1>
        <p className="text-white/60 mb-8 max-w-sm">{msg.body}</p>
        <Link href={`/${locale}/forum`} className="inline-flex items-center gap-2 bg-[#FFCC00] text-[#041E42] font-black px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
          &larr; {msg.back}
        </Link>
      </div>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sudokupremium.com";
  const canonical = `${siteUrl}/${locale}/forum/topic/${topic.slug || topic.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: topic.title,
    articleBody: topic.content.slice(0, 5000),
    datePublished: topic.createdAt,
    url: canonical,
    author: {
      "@type": "Person",
      name: topic.author?.profile?.username || "Member",
    },
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
      {
        "@type": "ListItem",
        position: 3,
        name: topic.category?.name || "Topic",
        item: `${siteUrl}/${locale}/forum?category=${topic.category?.id || ""}`,
      },
      { "@type": "ListItem", position: 4, name: topic.title.slice(0, 60), item: canonical },
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
      <ForumTopicClient topic={topic} />
    </>
  );
}
