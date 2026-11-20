"use client";

import type { IconType } from "react-icons";
import PageHero from "@/components/PageHero";
import SubTabs from "@/components/SubTabs";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { usePathname } from "@/i18n/navigation";
import { SITE_TEXT } from "@/lib/site";
import { ChartArt, GocharArt, KpArt, ListArt, MilanArt, PanchangArt, SheetArt } from "./illustrations";
import { KUNDLI_PAGES, KUNDLI_PAGE_TEXT, type KundliPageKey } from "./pages";

const text = defineMessages({
  hi: {
    tabs: "कुंडली के टूल",
    breadcrumb: "ब्रेडक्रंब",
    start: "शुरू करें",
    deva: {
      list: "मेरी कुंडलियाँ",
      chart: "जन्म कुंडली",
      gochar: "ग्रह गोचर",
      panchang: "पंचांग",
      kp: "केपी प्रश्न",
      milan: "कुंडली मिलान",
      sheet: "विस्तृत कुंडली",
    },
    desc: {
      list: "अपनी और परिवार की कुंडलियाँ एक जगह सहेजें, और किसी को भी चुनकर कुंडली, गोचर और पंचांग देखें।",
      chart: "जन्म विवरण भरें और अपना लग्न चार्ट, राशि, नक्षत्र और ग्रह स्थिति देखें।",
      gochar: "ग्रह अभी कहाँ हैं, और आपकी चंद्र राशि से वे कैसे पड़ते हैं।",
      panchang: "किसी भी दिन और जगह की तिथि, नक्षत्र, योग, करण, राहुकाल और चौघड़िया।",
      kp: "1 से 249 के बीच एक अंक चुनें और इसी पल की प्रश्न कुंडली देखें।",
      milan: "वर और कन्या का अष्टकूट गुण मिलान, दोष और परिहार।",
      sheet: "खाते में सहेजे विवरण से पूरी शीट: चार्ट, शड्बल, अष्टकवर्ग और पूरी दशा।",
    },
  },
  en: {
    tabs: "Kundli tools",
    breadcrumb: "Breadcrumb",
    start: "Get started",
    deva: {
      list: "मेरी कुंडलियाँ",
      chart: "जन्म कुंडली",
      gochar: "ग्रह गोचर",
      panchang: "पंचांग",
      kp: "केपी प्रश्न",
      milan: "कुंडली मिलान",
      sheet: "विस्तृत कुंडली",
    },
    desc: {
      list: "Keep kundlis for yourself and your family in one place, and open any of them for its chart, transits and panchang.",
      chart: "Enter your birth details to see your Lagna chart, rashi, nakshatra and planet positions.",
      gochar: "Where the planets are right now, and how they fall from your moon sign.",
      panchang: "Tithi, nakshatra, yoga, karana, Rahu Kaal and Choghadiya for any day and place.",
      kp: "Pick a number between 1 and 249 and get a horary chart for this very moment.",
      milan: "Ashtakoot Guna Milan for the groom and bride, with doshas and their cancellations.",
      sheet: "The full sheet from the details saved in your account: charts, Shadbala, Ashtakavarga and the complete dasha.",
    },
  },
});

const ART: Record<KundliPageKey, () => React.JSX.Element> = {
  list: ListArt,
  chart: ChartArt,
  gochar: GocharArt,
  panchang: PanchangArt,
  kp: KpArt,
  milan: MilanArt,
  sheet: SheetArt,
};

/** Target of the hero's "Get started" button: the page's content (the hub points it at the birth-details form). */
export const CONTENT_ID = "kundli-content";

/** The banner and tab bar over every /kundli page: the hero is chosen by the current page. */
export default function KundliChrome() {
  const pathname = usePathname();
  const t = useT(text);
  const names = useT(KUNDLI_PAGE_TEXT);
  const site = useT(SITE_TEXT);
  const page = KUNDLI_PAGES.find((p) => p.href === pathname) ?? KUNDLI_PAGES[0];
  const Art = ART[page.key];
  const Icon: IconType = page.icon;

  return (
    <>
      <PageHero
        breadcrumbLabel={t.breadcrumb}
        breadcrumb={[
          { label: site.nav.home, href: "/" },
          { label: site.nav.kundli, href: "/kundli" },
          { label: names[page.key] },
        ]}
        icon={Icon}
        devaKicker={t.deva[page.key]}
        title={names[page.key]}
        description={t.desc[page.key]}
        cta={{ label: t.start, href: `#${CONTENT_ID}` }}
        illustration={<Art />}
      />
      <SubTabs
        label={t.tabs}
        items={KUNDLI_PAGES.map(({ href, key, carriesProfile }) => ({ href, label: names[key], keepHash: carriesProfile }))}
      />
    </>
  );
}
