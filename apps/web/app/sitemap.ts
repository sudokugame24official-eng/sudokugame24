import { MetadataRoute } from "next";
import { SEO_LOCALES } from "../i18n";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sudokupremium.com";
  const locales = SEO_LOCALES;

  const getAlternates = (route: string) => {
    return {
      languages: locales.reduce(
        (acc, locale) => {
          acc[locale] = `${baseUrl}/${locale}${route}`;
          return acc;
        },
        {} as Record<string, string>,
      ),
    };
  };

  const staticRoutes = [
    "",
    "/regles-du-sudoku",
    "/sudoku-rules",
    "/sudoku-regeln",
    "/sudoku",
    "/sudoku/easy",
    "/sudoku/medium",
    "/sudoku/hard",
    "/sudoku/expert",
    "/sudoku/master",
    "/questions",
    "/play",
    "/daily",
    "/duel",
    "/leaderboard",
    "/forum",
    "/learn",
    "/learn/rules",
    "/learn/how-to-play",
    "/learn/naked-singles",
    "/learn/naked-pairs",
    "/learn/x-wing",
    "/chat",
    "/friends",
    "/help",
    "/faq",
    "/about",
    "/terms",
    "/privacy",
  ].map((route) => ({
    url: `${baseUrl}/en${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : route.includes("rules") || route.includes("regles") || route.includes("regeln") ? 0.95 : 0.8,
    alternates: getAlternates(route),
  }));

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  let articleRoutes: any[] = [];
  let topicRoutes: any[] = [];

  try {
    const [resArticles, resTopics] = await Promise.all([
      fetch(`${apiUrl}/content/articles?status=PUBLISHED`).catch(() => null),
      fetch(`${apiUrl}/forum/topics?limit=50`).catch(() => null),
    ]);

    if (resArticles && resArticles.ok) {
      const articles = await resArticles.json();
      articleRoutes = articles.map((article: any) => ({
        url: `${baseUrl}/en/learn/${article.slug}`,
        lastModified: article.publishedAt
          ? new Date(article.publishedAt)
          : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
        alternates: getAlternates(`/learn/${article.slug}`),
      }));
    }

    if (resTopics && resTopics.ok) {
      const topicsData = await resTopics.json();
      topicRoutes = topicsData.topics.map((topic: any) => ({
        url: `${baseUrl}/en/forum/${topic.id}`,
        lastModified: new Date(topic.updatedAt || topic.createdAt),
        changeFrequency: "daily" as const,
        priority: 0.6,
        alternates: getAlternates(`/forum/${topic.id}`),
      }));
    }
  } catch (error) {
    console.error("Failed to fetch dynamic routes for sitemap:", error);
  }

  return [...staticRoutes, ...articleRoutes, ...topicRoutes];
}
