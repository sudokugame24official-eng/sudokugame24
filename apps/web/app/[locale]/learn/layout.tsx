import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "learn" });
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sudokupremium.com";
  const url = `${siteUrl}/${locale}/learn`;

  return {
    title: t("pageTitle"),
    description: t("pageDesc"),
    alternates: {
      canonical: url,
      languages: {
        en: "/en/learn",
        fr: "/fr/learn",
        de: "/de/learn",
        es: "/es/learn",
        it: "/it/learn",
      },
    },
    openGraph: {
      title: t("pageTitle"),
      description: t("pageDesc"),
      url,
    },
  };
}

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
