import React from "react";
import { Metadata } from "next";
import ForumClient from "./ForumClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sudokupremium.com";
  const isFr = locale === "fr";
  const isDe = locale === "de";

  const title = isFr
    ? "Forum Sudoku Premium | Communauté & Stratégies"
    : isDe
      ? "Sudoku-Premium-Forum | Community & Strategien"
      : "Sudoku Premium Forum | Community & Strategies";
  const description = isFr
    ? "Rejoignez la plus grande communauté Sudoku. Discutez de stratégies, trouvez des adversaires pour vos duels, et participez aux challenges quotidiens."
    : isDe
      ? "Treten Sie der größten Sudoku-Community bei. Diskutieren Sie Strategien, finden Sie Gegner für Duelle und nehmen Sie an täglichen Challenges teil."
      : "Join the largest Sudoku community. Discuss strategies, find opponents for your duels, and take part in daily challenges.";
  const ogTitle = isFr
    ? "Forum Sudoku Premium"
    : isDe
      ? "Sudoku-Premium-Forum"
      : "Sudoku Premium Forum";
  const ogDesc = isFr
    ? "Rejoignez la communauté Sudoku"
    : isDe
      ? "Treten Sie der Sudoku-Community bei"
      : "Join the Sudoku community";

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      url: `${baseUrl}/${locale}/forum`,
      type: "website",
      siteName: "Sudoku Premium",
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/forum`,
      languages: {
        en: `/en/forum`,
        fr: `/fr/forum`,
        de: `/de/forum`,
      },
    },
  };
}

export default async function ForumPage() {
  return <ForumClient />;
}
