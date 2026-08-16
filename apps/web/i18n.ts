import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

// Can be imported from a shared config
const locales = ["en", "fr", "de", "es", "it"];

/**
 * P1-T: locales that get hreflang/sitemap SEO signals. es/it have stub
 * translations (1 namespace vs 16) and must NOT be exposed to search engines
 * until their message catalogs are complete. Routing still works for humans.
 */
export const SEO_LOCALES = ["en", "fr", "de"];
const defaultLocale = "en";

export default getRequestConfig(async ({ locale }) => {
  const finalLocale = locale || defaultLocale;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(finalLocale as any)) {
    console.log("notFound() called because finalLocale is", finalLocale);
    notFound();
  }

  return {
    locale: finalLocale as string,
    messages: (await import(`./messages/${finalLocale}.json`)).default,
  };
});
