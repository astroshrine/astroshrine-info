import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import AppShell from "@/components/AppShell";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

// One typeface for the whole site (B1). Poppins is on the approved list and, unlike Geist, also covers
// Devanagari, so Hindi and English text share one face instead of Hindi falling back to a system font.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600"],
});

const description =
  "जन्म तिथि, समय और स्थान से मुफ़्त जन्म कुंडली: लग्न, नवांश, ग्रह स्थिति और विंशोत्तरी दशा। उसी account से जो AstroShrine ऐप में है।";

export const metadata: Metadata = {
  // Absolute URLs for the share image. Set NEXT_PUBLIC_SITE_URL to the deployed origin.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "AstroShrine",
  description,
  applicationName: "AstroShrine",
  openGraph: {
    type: "website",
    siteName: "AstroShrine",
    locale: "hi_IN",
    title: "AstroShrine",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "AstroShrine",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#fdfbf5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hi" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full bg-surface-page font-sans text-ink">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
