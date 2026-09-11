import { MetadataRoute } from "next";
import { SEO_LOCALES } from "../i18n";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sudokugame24.com";
  const locales = SEO_LOCALES;

  const getAlternates = (route: string) => {
    const languages: Record<string, string> = {};
    for (const locale of locales) {
      languages[locale] = `${baseUrl}/${locale}${route}`;
    }
    languages["x-default"] = `${baseUrl}/en${route}`;
    return { languages };
  };

  const routes = [
    "",
    "/sudoku",
    "/sudoku/easy",
    "/sudoku/medium",
    "/sudoku/hard",
    "/sudoku/expert",
    "/sudoku/master",
    "/sudoku-rules",
    "/sudoku-regeln",
    "/regles-du-sudoku",
    "/questions",
    "/play",
    "/daily",
    "/duel",
    "/leaderboard",
    "/forum",
    "/learn",
    "/learn/rules",
    "/learn/how-to-play",
    "/learn/candidates",
    "/learn/naked-singles",
    "/learn/hidden-singles",
    "/learn/naked-pairs",
    "/learn/hidden-pairs",
    "/learn/naked-triples",
    "/learn/pointing-pairs",
    "/learn/box-line",
    "/learn/x-wing",
    "/learn/swordfish",
    "/learn/xy-wing",
    "/learn/unique-rectangle",
    "/learn/chains",
    "/chat",
    "/friends",
    "/help",
    "/faq",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/guidelines",
    "/disclaimer",
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // 1. Static & Academy Routes across all 3 locales (explicit <loc> per language)
  for (const route of routes) {
    for (const locale of locales) {
      const isHome = route === "";
      const isHighVal = route.includes("rules") || route.includes("play") || route.includes("sudoku");
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: isHome ? "daily" : "weekly",
        priority: isHome ? 1.0 : isHighVal ? 0.9 : 0.75,
        alternates: getAlternates(route),
      });
    }
  }

  // 2. Dynamic Content (Articles, Forum Topics, Courses)
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  try {
    const [resArticles, resTopics, resCourses] = await Promise.all([
      fetch(`${apiUrl}/content/articles?status=PUBLISHED`, { next: { revalidate: 3600 } }).catch(() => null),
      fetch(`${apiUrl}/forum/topics?limit=100`, { next: { revalidate: 3600 } }).catch(() => null),
      fetch(`${apiUrl}/academy/courses`, { next: { revalidate: 3600 } }).catch(() => null),
    ]);

    if (resArticles && resArticles.ok) {
      const articles = await resArticles.json();
      for (const article of articles) {
        for (const locale of locales) {
          sitemapEntries.push({
            url: `${baseUrl}/${locale}/learn/${article.slug}`,
            lastModified: article.publishedAt ? new Date(article.publishedAt) : new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
            alternates: getAlternates(`/learn/${article.slug}`),
          });
        }
      }
    }

    if (resTopics && resTopics.ok) {
      const topicsData = await resTopics.json();
      const topics = Array.isArray(topicsData) ? topicsData : topicsData.topics || [];
      for (const topic of topics) {
        for (const locale of locales) {
          sitemapEntries.push({
            url: `${baseUrl}/${locale}/forum/${topic.id}`,
            lastModified: new Date(topic.updatedAt || topic.createdAt),
            changeFrequency: "daily",
            priority: 0.6,
            alternates: getAlternates(`/forum/${topic.id}`),
          });
        }
      }
    }

    if (resCourses && resCourses.ok) {
      const coursesData = await resCourses.json();
      for (const course of coursesData) {
        for (const locale of locales) {
          sitemapEntries.push({
            url: `${baseUrl}/${locale}/learn/courses/${course.slug}`,
            lastModified: new Date(course.updatedAt || course.createdAt),
            changeFrequency: "weekly",
            priority: 0.85,
            alternates: getAlternates(`/learn/courses/${course.slug}`),
          });

          if (course.modules) {
            for (const mod of course.modules) {
              if (mod.lessons) {
                for (const lesson of mod.lessons) {
                  sitemapEntries.push({
                    url: `${baseUrl}/${locale}/learn/courses/${course.slug}/lessons/${lesson.slug}`,
                    lastModified: new Date(lesson.updatedAt || lesson.createdAt),
                    changeFrequency: "weekly",
                    priority: 0.8,
                    alternates: getAlternates(`/learn/courses/${course.slug}/lessons/${lesson.slug}`),
                  });
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch dynamic routes for sitemap:", error);
  }

  return sitemapEntries;
}
