import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SEO_LOCALES } from "../../../i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "seo" });
  
  // Custom title for the Duel page
  const title = locale === "fr" ? "Multijoueur & Duels de Sudoku en Ligne" : "Multiplayer & Online Sudoku Duels";
  const desc = locale === "fr" 
    ? "Affrontez des joueurs du monde entier dans des duels de Sudoku chronométrés. Montez en grade et devenez un Maître Sudoku !" 
    : "Compete against players worldwide in timed Sudoku duels. Climb the ranks and become a Sudoku Master!";

  return {
    title: title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "website",
    },
    alternates: {
      canonical: `/${locale}/duel`,
      languages: Object.fromEntries(
        SEO_LOCALES.map((l: string) => [l, `/${l}/duel`])
      ),
    },
  };
}

export default function DuelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
