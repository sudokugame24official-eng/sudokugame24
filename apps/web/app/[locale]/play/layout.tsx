import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "play" });
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sudokupremium.com";
  const url = `${siteUrl}/${locale}/play`;

  return {
    title: t("pageTitle"),
    description: t("pageDesc"),
    alternates: {
      canonical: url,
      languages: {
        en: "/en/play",
        fr: "/fr/play",
        de: "/de/play",
        es: "/es/play",
        it: "/it/play",
      },
    },
    openGraph: {
      title: t("pageTitle"),
      description: t("pageDesc"),
      url,
    },
  };
}

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
