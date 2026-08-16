import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "help" });
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sudokupremium.com";
  const url = `${siteUrl}/${locale}/help`;

  return {
    title: t("pageTitle"),
    description: t("pageDesc"),
    alternates: {
      canonical: url,
      languages: {
        en: "/en/help",
        fr: "/fr/help",
        de: "/de/help",
        es: "/es/help",
        it: "/it/help",
      },
    },
    openGraph: {
      title: t("pageTitle"),
      description: t("pageDesc"),
      url,
    },
  };
}

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
