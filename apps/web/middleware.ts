import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  // A list of all locales that are supported
  locales: ["en", "fr", "de", "es", "it"],

  // Used when no locale matches
  defaultLocale: "en",

  // Create /en, /fr prefix for all routes automatically
  localePrefix: "always",
});

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(fr|en|de|es|it)/:path*"],
};
