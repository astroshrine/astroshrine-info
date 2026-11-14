import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PiArrowRight } from "react-icons/pi";
import ActiveKundli from "./ActiveKundli";
import KundliList from "./KundliList";
import { KUNDLI_PAGES } from "./_components/pages";
import { Card, Disclaimer, Skeleton } from "./_components/ui";

export const metadata: Metadata = {
  title: "मुफ़्त जन्म कुंडली · AstroShrine",
  description:
    "अपनी और परिवार की कुंडलियाँ सहेजें: लग्न और सभी 16 वर्ग चार्ट, ग्रह स्थिति, विंशोत्तरी दशा, गोचर, पंचांग, KP प्रश्न और कुंडली मिलान।",
  openGraph: {
    title: "मुफ़्त जन्म कुंडली · AstroShrine",
    description: "अपनी और परिवार की कुंडलियाँ, सभी 16 वर्ग चार्ट, दशा, गोचर, पंचांग और गुण मिलान। उसी खाते से जो AstroShrine ऐप में है।",
  },
};

const TOOL_TEXT: Record<string, string> = {
  "/kundli/chart": "लग्न से षष्ट्यंश तक सभी 16 वर्ग चार्ट, ग्रह स्थिति, विंशोत्तरी और योगिनी दशा, योग और दोष",
  "/kundli/gochar": "अगले 36 महीने गुरु, शनि, राहु और केतु कहाँ रहेंगे, साढ़ेसाती और ढैय्या",
  "/kundli/panchang": "किसी भी दिन और जगह की तिथि, नक्षत्र, योग, करण, राहुकाल और चौघड़िया",
  "/kundli/kp": "1 से 249 के बीच एक अंक से इसी पल की प्रश्न कुंडली",
  "/kundli/milan": "वर और कन्या का अष्टकूट गुण मिलान, दोष और परिहार, नवांश मिलान",
  "/kundli/sheet": "खाते में सहेजे विवरण से पूरी शीट: भाव चलित, चंद्र और नवांश चार्ट, शड्बल, अष्टकवर्ग, पूरी दशा",
};

export default function KundliHubPage() {
  const tools = KUNDLI_PAGES.filter((p) => p.href !== "/kundli");

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <header className="max-w-2xl">
          <p className="caption-4 text-brand-strong">Kundli · Jyotish</p>
          <h1 className="heading-4 hero-gradient-text mt-1 lg:heading-3">मुफ़्त जन्म कुंडली, वही खाता जो ऐप में है</h1>
          <p className="body-3 mt-3 text-ink-soft">
            अपनी और परिवार की कुंडलियाँ सहेजें, फिर किसी को भी चुनकर कुंडली, गोचर, पंचांग और KP प्रश्न देखें, उसी गणना इंजन से जो
            AstroShrine ऐप इस्तेमाल करता है।
          </p>
        </header>

        <Card>
          <div id="janm-vivran" className="scroll-mt-24">
            <Suspense fallback={<PanelSkeleton />}>
              <ActiveKundli />
            </Suspense>
          </div>
        </Card>

        <Card>
          <Suspense fallback={<PanelSkeleton />}>
            <KundliList />
          </Suspense>
        </Card>
      </div>

      <aside className="lg:col-span-2">
        <section aria-labelledby="tools-title">
          <h2 id="tools-title" className="heading-6 text-ink">
            कुंडली के टूल
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {tools.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex h-full items-start gap-3 rounded-2xl border border-line bg-surface-card p-4 transition hover:border-line-strong hover:bg-surface-sunken active:scale-98"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-sunken text-brand-strong transition group-hover:bg-surface-card">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="title-3 flex items-center justify-between gap-2 text-ink">
                      {label}
                      <PiArrowRight
                        className="h-4 w-4 shrink-0 text-ink-muted transition group-hover:translate-x-1 group-hover:text-ink"
                        aria-hidden
                      />
                    </span>
                    <span className="caption-2 mt-1 block text-ink-soft">{TOOL_TEXT[href]}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Disclaimer />
          </div>
        </section>
      </aside>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div aria-hidden className="space-y-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-10 w-36 rounded-full" />
    </div>
  );
}
