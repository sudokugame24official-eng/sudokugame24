import { getTranslations } from "next-intl/server";
import HomeClient from "@/components/home/HomeClient";
import { SEO_LOCALES } from "../../i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const title = t("heroTitle");
  const description = t("heroDesc");
  const languages: Record<string, string> = {};
  for (const l of SEO_LOCALES) languages[l] = `/${l}`;
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages,
    },
    openGraph: { title, description, type: "website" },
  };
}

export default async function HomePage() {
  return <HomeClient />;
}
