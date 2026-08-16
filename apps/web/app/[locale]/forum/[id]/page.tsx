import { API_URL } from "@/lib/api";
import React from "react";
import { Metadata } from "next";
import ForumTopicClient from "./ForumTopicClient";

async function fetchTopic(id: string) {
  try {
    const res = await fetch(`${API_URL}/forum/posts/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch topic");
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// 1. DYNAMIC METADATA
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale: lang } = await params;
  const topic = await fetchTopic(id);
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sudokupremium.com";

  if (!topic) {
    return { title: "Topic not found" };
  }

  // Create a truncated description for SEO
  const description = topic.content.substring(0, 160) + "...";

  return {
    title: `${topic.title} | Forum Sudoku Premium`,
    description: description,
    openGraph: {
      title: topic.title,
      description: description,
      url: `${baseUrl}/forum/${id}`,
      type: "article",
      publishedTime: topic.createdAt,
      authors: [topic.author?.profile?.username || "Unknown"],
      tags: topic.category ? [topic.category.name] : [],
      siteName: "Sudoku Premium",
    },
    twitter: {
      card: "summary_large_image",
      title: topic.title,
      description: description,
    },
    alternates: {
      canonical: `${baseUrl}/${lang}/forum/${id}`,
      languages: {
        en: `/en/forum/${id}`,
        fr: `/fr/forum/${id}`,
        de: `/de/forum/${id}`,
        es: `/es/forum/${id}`,
        it: `/it/forum/${id}`,
      },
    },
  };
}

export default async function ForumTopicPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale: lang } = await params;
  const topic = await fetchTopic(id);
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sudokupremium.com";

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#041E42]">
        Topic introuvable
      </div>
    );
  }

  // 2. STRUCTURED DATA (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: topic.title,
    articleBody: topic.content,
    datePublished: topic.createdAt,
    author: {
      "@type": "Person",
      name: topic.author?.profile?.username || "Unknown",
    },
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/ReplyAction",
      userInteractionCount: topic.comments?.length || 0,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/${lang}/forum/${id}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl}/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Forum",
        item: `${baseUrl}/${lang}/forum`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: topic.title,
        item: `${baseUrl}/${lang}/forum/${id}`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ForumTopicClient topic={topic} />
    </>
  );
}
