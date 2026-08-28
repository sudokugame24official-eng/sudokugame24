import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

// Official product languages: EN/FR/DE only. es/it were never launched and
// stay unroutable (middleware permanently redirects legacy /es, /it to /en).
const locales = ["en", "fr", "de"];

export const SEO_LOCALES = ["en", "fr", "de"];
const defaultLocale = "en";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate that the incoming `locale` parameter is valid or fallback to default
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
