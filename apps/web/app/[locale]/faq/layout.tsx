import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "faq" });
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sudokupremium.com";
  const url = `${siteUrl}/${locale}/faq`;

  return {
    title: t("pageTitle"),
    description: t("pageDesc"),
    alternates: {
      canonical: url,
      languages: {
        en: "/en/faq",
        fr: "/fr/faq",
        de: "/de/faq",
        es: "/es/faq",
        it: "/it/faq",
      },
    },
    openGraph: {
      title: t("pageTitle"),
      description: t("pageDesc"),
      url,
    },
  };
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
