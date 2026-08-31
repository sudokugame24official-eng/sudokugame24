import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import localFont from "next/font/local";
import "../globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale, namespace: "seo" });
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sudokupremium.com";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("defaultTitle"),
      template: `%s | ${t("siteName")}`,
    },
    description: t("defaultDesc"),
    keywords: t("keywords")
      .split(",")
      .map((k) => k.trim()),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: t("defaultTitle"),
      description: t("defaultDesc"),
      url: siteUrl,
      siteName: t("siteName"),
      locale: locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("defaultTitle"),
      description: t("defaultDesc"),
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        fr: "/fr",
        de: "/de",
      },
    },
  };
}

import { Header } from "@/components/Header";
import TrackPageView from "@/components/analytics/TrackPageView";
import { Footer } from "@/components/Footer";
import { ChatPanel } from "@/components/ChatPanel";
import { AuthProvider } from "@/components/AuthProvider";
import { AdProvider } from "@/context/AdContext";
import MarketingPixels from "@/components/MarketingPixels";
import { MobileNav } from "@/components/MobileNav";
import { LiveStatsTicker } from "@/components/LiveStatsTicker";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import Script from "next/script";

import { DuelChallengeListener } from "@/components/DuelChallengeListener";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages({ locale: locale });

  // P1-X: DB-driven theme — published theme overrides the CSS variables.
  // No stored theme = defaults identical to globals.css (zero visual change).
  let themeVars = "";
  try {
    const themeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/config/theme`, {
      next: { revalidate: 60 },
    });
    if (themeRes.ok) {
      const theme = await themeRes.json();
      themeVars = `:root{--primary:${theme.colors.primary};--primary-foreground:${theme.colors.primaryForeground};--background:${theme.colors.background};--accent:${theme.colors.accent};--radius:${theme.radius};}`;
    }
  } catch {
    // API unreachable -> keep hardcoded defaults
  }

  return (
    <html lang={locale}>
      <head>
        {themeVars && <style dangerouslySetInnerHTML={{ __html: themeVars }} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://sudokupremium.com/#website",
                  "url": "https://sudokupremium.com/",
                  "name": "Sudoku Premium",
                  "description": "Plateforme mondiale de Sudoku gratuit en ligne, défis quotidiens et duels multijoueurs 1v1.",
                  "inLanguage": ["fr-FR", "en-US", "de-DE"]
                },
                {
                  "@type": "WebApplication",
                  "@id": "https://sudokupremium.com/#game",
                  "name": "Sudoku Premium Online Game",
                  "url": "https://sudokupremium.com/",
                  "applicationCategory": "GameApplication",
                  "operatingSystem": "All (Web, iOS, Android, Desktop)",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.9",
                    "ratingCount": "12845",
                    "bestRating": "5",
                    "worstRating": "1"
                  }
                },
                {
                  "@type": "Organization",
                  "@id": "https://sudokupremium.com/#organization",
                  "name": "Sudoku Premium International",
                  "url": "https://sudokupremium.com/",
                  "logo": "https://sudokupremium.com/favicon.ico"
                }
              ]
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} overflow-x-hidden`}
        suppressHydrationWarning
      >
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-9SRGVP7C4W" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9SRGVP7C4W');
          `}
        </Script>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AdProvider>
            <AuthProvider>
              <div className="flex min-h-screen bg-brand-black text-foreground flex-col">
                {/* Ambient background orbs */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                  <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #FF4500, transparent)', filter: 'blur(80px)' }} />
                  <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.02]" style={{ background: 'radial-gradient(circle, #FFCC00, transparent)', filter: 'blur(60px)' }} />
                </div>
                <Header />
                <LiveStatsTicker />
                <main className="flex-1 w-full max-w-[1400px] mx-auto min-h-screen pb-16 md:pb-0 relative z-10">
                  {/* P1-V: page_view analytics (client, fire-and-forget) */}
                  <TrackPageView locale={locale} />
                  {children}
                </main>
                <Footer />
                <ChatPanel />
                <DuelChallengeListener />
                <MobileNav />
                <Toaster richColors position="top-right" />
              </div>
            </AuthProvider>
            <MarketingPixels />
          </AdProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
