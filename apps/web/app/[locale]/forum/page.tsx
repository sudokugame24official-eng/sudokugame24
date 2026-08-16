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

  return {
    title: "Forum Sudoku Premium | Communauté & Stratégies",
    description:
      "Rejoignez la plus grande communauté Sudoku. Discutez de stratégies, trouvez des adversaires pour vos duels, et participez aux challenges quotidiens.",
    openGraph: {
      title: "Forum Sudoku Premium",
      description: "Rejoignez la communauté Sudoku",
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
