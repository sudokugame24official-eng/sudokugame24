import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "seo" });
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sudokupremium.com";
  const url = `${siteUrl}/${locale}/forum`;

  return {
    title: t("defaultTitle"),
    description: t("defaultDesc"),
    alternates: {
      canonical: url,
      languages: {
        en: "/en/forum",
        fr: "/fr/forum",
        de: "/de/forum",
        es: "/es/forum",
        it: "/it/forum",
      },
    },
    openGraph: {
      title: t("defaultTitle"),
      description: t("defaultDesc"),
      url,
    },
  };
}

export default function ForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
