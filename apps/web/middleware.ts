import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["en", "fr", "de"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: false,
});

export default function middleware(req: NextRequest) {
  // es/it are not supported product languages: legacy links are permanently
  // redirected to the English equivalent (documented in the i18n decision).
  const { pathname } = req.nextUrl;
  const legacy = pathname.match(/^\/(es|it)(\/.*)?$/);
  if (legacy) {
    const url = req.nextUrl.clone();
    url.pathname = `/en${legacy[2] ?? ""}`;
    return NextResponse.redirect(url, 308);
  }
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
