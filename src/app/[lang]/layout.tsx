import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Epilogue, Inter, Noto_Sans_Devanagari } from "next/font/google";
import AppShell from "@/components/AppShell";
import AuthProvider from "@/components/AuthProvider";
import { LOCALES, OG_LOCALE, isLocale } from "@/i18n/config";
import LocaleProvider from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import "../globals.css";

// Design system fonts: Inter for text, Epilogue for headings, Noto Sans Devanagari so Hindi keeps the same weight and feel.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const epilogue = Epilogue({ variable: "--font-epilogue", subsets: ["latin"], weight: ["500", "600", "700"] });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], weight: ["400", "500", "600", "700"] });

const text = defineMessages({
  hi: {
    description:
      "जन्म तिथि, समय और स्थान से मुफ़्त जन्म कुंडली: लग्न, नवांश, ग्रह स्थिति और विंशोत्तरी दशा। उसी account से जो AstroShrine ऐप में है।",
  },
  en: {
    description:
      "A free birth chart from your date, time and place of birth: Ascendant, Navamsha, planet positions and Vimshottari Dasha. With the same account as the AstroShrine app.",
  },
});

/** Both languages are prerendered. Cache Components needs at least one value for the root [lang] segment. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { description } = text[locale];
  return {
    // Absolute URLs for the share image and the canonical and hreflang links. Set NEXT_PUBLIC_SITE_URL to the
    // site's own domain; on Railway, the service's public domain is the fallback.
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "http://localhost:3000"),
    ),
    title: "AstroShrine",
    description,
    applicationName: "AstroShrine",
    openGraph: {
      type: "website",
      siteName: "AstroShrine",
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      title: "AstroShrine",
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: "AstroShrine",
      description,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#fbf6ec",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  // The proxy gives every page path a language first. Paths it skips because their last segment looks like a file
  // (/ads.txt, /apple-touch-icon-precomposed.png) land here with that as `lang` and get Next's plain 404.
  if (!isLocale(lang)) notFound();

  return (
    <html lang={lang} className={`${inter.variable} ${epilogue.variable} ${deva.variable} h-full antialiased`}>
      <body className="min-h-full bg-surface-page font-sans text-ink">
        <LocaleProvider locale={lang}>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
