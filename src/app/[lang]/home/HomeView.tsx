"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import {
  PiArrowClockwise,
  PiArrowRight,
  PiArrowUpRight,
  PiBookOpenText,
  PiCalendarCheck,
  PiCards,
  PiCaretRight,
  PiChatCircleDots,
  PiDiamond,
  PiFire,
  PiGift,
  PiGridNine,
  PiHandPalm,
  PiHash,
  PiHouseLine,
  PiIntersect,
  PiMagicWandFill,
  PiMagnifyingGlass,
  PiSignIn,
  PiSquaresFour,
  PiSun,
  PiSunHorizon,
  PiTag,
  PiUserCirclePlus,
} from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import AstrologerCard, { AstrologerCardSkeleton } from "@/components/AstrologerCard";
import { profileComplete } from "@/lib/endpoints";
import { getConsultConfig } from "@/lib/services/chat";
import { fadeUp, stagger } from "@/lib/motion";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { BLOG_URL, SERVICES, SITE_TEXT } from "@/lib/site";
import { useAstrologerDirectory } from "@/lib/useAstrologerDirectory";

/** How many astrologers the home page shows (online first). */
const HOME_ASTROLOGERS = 6;

const text = defineMessages({
  hi: {
    hello: "नमस्ते",
    helloName: (name: string) => `नमस्ते, ${name}`,
    guest: "AstroShrine में स्वागत है",
    search: "Astrologer, पूजा, रत्न खोजें",
    searchLabel: "खोजें",
    askTitle: "AI ज्योतिषी से पूछें",
    askBody: "करियर, प्रेम, सेहत और भी",
    start: "शुरू करें",
    quick: {
      horoscope: "दैनिक राशिफल",
      kundli: "फ्री कुंडली",
      milan: "कुंडली मिलान",
      muhurat: "मुहूर्त",
      gems: "रत्न",
      puja: "पूजा",
      offers: "ऑफ़र",
      blog: "ज्योतिष ब्लॉग",
      panchang: "पंचांग",
      numerology: "अंक ज्योतिष",
      tarot: "टैरो",
      palm: "हस्तरेखा",
      vastu: "वास्तु",
      tools: "सभी टूल",
    },
    quickLabel: "जल्दी पहुंचें",
    promoTitle: "अगले 5 सालों में मेरा भविष्य कैसा होगा?",
    promoBody: "ज्योतिषी से पूछें",
    chatNow: "अभी चैट करें",
    title: "आज क्या देखना चाहेंगे?",
    intro: "अपनी कुंडली देखें, astrologers से बात करें या wallet संभालें। सब कुछ उसी account से जो AstroShrine ऐप में है।",
    loginTitle: "ऐप वाले नंबर से लॉगिन करें",
    loginBody: "Wallet balance, chat और सेव की हुई जन्म जानकारी यहां दिखेगी।",
    login: "लॉगिन करें",
    gift: {
      firstChat: {
        kicker: "स्वागत उपहार",
        title: "आपकी पहली चैट फ्री है",
        body: (minutes: number) => `किसी भी ज्योतिषी से ${minutes} मिनट मुफ़्त चैट करें। रिचार्ज की ज़रूरत नहीं, कोई पॉइंट नहीं कटेंगे।`,
      },
      allFree: {
        kicker: "सीमित समय",
        title: "अभी सभी चैट फ्री हैं",
        body: "किसी भी ज्योतिषी से चैट करें, कोई पॉइंट नहीं कटेंगे।",
      },
      cta: "फ्री चैट शुरू करें",
    },
    details: {
      title: "अपनी जन्म जानकारी भरें",
      body: "Astrologer chat में आपकी कुंडली इसी से देखते हैं। एक बार भर दें, ऐप में भी दिखेगी।",
      cta: "अभी भरें",
    },
    services: "सेवाएं",
    open: "खोलें",
    newTab: "(नए टैब में खुलेगा)",
    astrologers: "Astrologers",
    onlineFirst: "Online astrologers पहले।",
    seeAll: "सभी देखें",
    listFailed: "Astrologers की सूची लोड नहीं हुई। Internet connection जांचें और फिर कोशिश करें।",
    tryAgain: "फिर कोशिश करें",
    loadingAstrologers: "Astrologers लोड हो रहे हैं",
    emptyTitle: "अभी कोई astrologer सूची में नहीं है",
    emptyBody: "थोड़ी देर बाद यह पेज फिर खोलें, तब तक अपनी कुंडली देखें।",
  },
  en: {
    hello: "Namaste",
    helloName: (name) => `Namaste, ${name}`,
    guest: "Welcome to AstroShrine",
    search: "Search astrologer, puja, gemstone",
    searchLabel: "Search",
    askTitle: "Ask an AI astrologer",
    askBody: "Career, love, health & more",
    start: "Start",
    quick: {
      horoscope: "Daily Horoscope",
      kundli: "Free Kundli",
      milan: "Kundli Matching",
      muhurat: "Muhurat",
      gems: "Gemstones",
      puja: "Puja",
      offers: "Offers",
      blog: "Astrology Blog",
      panchang: "Panchang",
      numerology: "Numerology",
      tarot: "Tarot",
      palm: "Palm Reading",
      vastu: "Vastu",
      tools: "All Tools",
    },
    quickLabel: "Quick links",
    promoTitle: "What will my future be in the next 5 years?",
    promoBody: "Ask an astrologer",
    chatNow: "Chat Now",
    title: "What would you like to do today?",
    intro: "See your Kundli, talk to astrologers or manage your wallet, all with the same account as the AstroShrine app.",
    loginTitle: "Log in with the number you use in the app",
    loginBody: "Your wallet balance, chats and saved birth details will show here.",
    login: "Log in",
    gift: {
      firstChat: {
        kicker: "Welcome gift",
        title: "Your first chat is free",
        body: (minutes) => `Chat with any astrologer for ${minutes} minutes, free. No recharge needed, and no points are deducted.`,
      },
      allFree: {
        kicker: "Limited time",
        title: "All chats are free right now",
        body: "Chat with any astrologer. No points will be deducted.",
      },
      cta: "Start a free chat",
    },
    details: {
      title: "Add your birth details",
      body: "Astrologers read your kundli from them in chat. Fill them in once; the app shows them too.",
      cta: "Add now",
    },
    services: "Services",
    open: "Open",
    newTab: "(opens in a new tab)",
    astrologers: "Astrologers",
    onlineFirst: "Online astrologers first.",
    seeAll: "See all",
    listFailed: "Could not load the list of astrologers. Check your internet connection and try again.",
    tryAgain: "Try again",
    loadingAstrologers: "Loading astrologers",
    emptyTitle: "No astrologers are listed right now",
    emptyBody: "Open this page again in a little while. Until then, take a look at your Kundli.",
  },
});

const reveal = { initial: "hidden", whileInView: "show", viewport: { once: true, amount: 0.2 } } as const;

const secondaryButton =
  "button-sm inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken motion-safe:active:scale-98";

/**
 * The app home, laid out like the Android app's: navy greeting and search, the ask banner, four quick tiles,
 * the astrologer promo, the new user's free chat, services and astrologers, all from the shared backend. The wallet balance is not repeated here: it is always in the header (both on phones and desktop).
 */
export default function HomeView() {
  const { status, user } = useAuth();
  const signedIn = status === "signedIn";
  const signedOut = status === "signedOut";
  const name = user?.name?.trim();

  return (
    <>
      <HomeHeader name={signedIn ? name : undefined} />
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 md:px-8 md:pt-8">
        {signedOut && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-6">
            <LoginCard />
          </motion.div>
        )}
        {signedIn && user && !profileComplete(user) && <CompleteProfileCard />}
        <AskBanner />
        <QuickTiles />
        {signedIn && <WelcomeGiftSection />}
        <ServicesSection />
        <AstrologersSection />
      </div>
    </>
  );
}

/**
 * The app home's navy top: the greeting with the gold wand badge, then the search box. It continues the navy
 * header bar above it and ends in rounded corners, as in the app. The search opens the astrologer list with the
 * words filled in (the website's only searchable list).
 */
function HomeHeader({ name }: { name?: string }) {
  const t = useT(text);
  const router = useRouter();
  const searchId = useId();
  const [q, setQ] = useState("");
  return (
    <section aria-labelledby="home-title" className="on-inverse rounded-b-sheet bg-surface-inverse text-ink-inverse">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 pb-6 pt-2 md:px-8 md:pb-8 md:pt-6 lg:grid-cols-2 lg:items-center lg:gap-10">
        <div className="min-w-0">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-brand-ink">
            <PiMagicWandFill className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="caption-2 text-ink-inverse-soft">{t.hello}</p>
            <h1 id="home-title" className="heading-6 md:heading-5 truncate text-ink-inverse">
              {name || t.guest}
            </h1>
          </div>
        </motion.div>
        <form
          role="search"
          className="mt-5 flex h-12 items-center gap-2 rounded-input bg-surface-card px-4 text-ink shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            const words = q.trim().slice(0, 60);
            router.push(words ? `/astrologers?q=${encodeURIComponent(words)}` : "/astrologers");
          }}
        >
          <label htmlFor={searchId} className="sr-only">
            {t.searchLabel}
          </label>
          <input
            id={searchId}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.search}
            className="body-6 min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-muted focus:outline-none"
          />
          <button type="submit" aria-label={t.searchLabel} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-surface-sunken hover:text-ink">
            <PiMagnifyingGlass className="h-5 w-5" aria-hidden />
          </button>
        </form>
        </div>
        {/* The "ask an astrologer" card sits in the navy band: beside the greeting on wide screens, under it on phones. */}
        <PromoCard />
      </div>
    </section>
  );
}

/** The app's navy "ask" banner: a gold wand badge, the offer and a gold "Start". Opens the AI astrologers. */
function AskBanner() {
  const t = useT(text);
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <Link
        href="/ai-astrologers"
        className="on-inverse group flex items-center gap-4 rounded-card bg-surface-inverse px-5 py-5 text-ink-inverse shadow-card transition hover:bg-surface-inverse-raised motion-safe:active:scale-98"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-brand-ink">
          <PiMagicWandFill className="h-6 w-6" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="title-2 block font-bold">{t.askTitle}</span>
          <span className="caption-2 mt-0.5 block text-ink-inverse-soft">{t.askBody}</span>
        </span>
        <span className="button-md inline-flex shrink-0 items-center gap-1 text-brand-on-inverse">
          {t.start}
          <PiArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </Link>
    </motion.div>
  );
}

type QuickKey = keyof (typeof text)["en"]["quick"];
/**
 * The app's home quick actions, in its order (Daily Horoscope, Free Kundli, Kundli Matching, Muhurat, Gemstones,
 * Puja, Offers, Astrology Blog), then the website's other popular tools. The blog is the sister site.
 */
const QUICK: { key: QuickKey; href: string; icon: IconType; external?: boolean }[] = [
  { key: "horoscope", href: "/#rashifal", icon: PiSunHorizon },
  { key: "kundli", href: "/kundli", icon: PiGridNine },
  { key: "milan", href: "/kundli/milan", icon: PiIntersect },
  { key: "muhurat", href: "/tools/muhurat", icon: PiCalendarCheck },
  { key: "gems", href: "/store?tab=gems", icon: PiDiamond },
  { key: "puja", href: "/store", icon: PiFire },
  { key: "offers", href: "/offers", icon: PiTag },
  { key: "blog", href: BLOG_URL, icon: PiBookOpenText, external: true },
  { key: "panchang", href: "/kundli/panchang", icon: PiSun },
  { key: "numerology", href: "/tools/numerology", icon: PiHash },
  { key: "tarot", href: "/tools/tarot", icon: PiCards },
  { key: "palm", href: "/tools/palm-reading", icon: PiHandPalm },
  { key: "vastu", href: "/tools/vastu", icon: PiHouseLine },
  { key: "tools", href: "/tools", icon: PiSquaresFour },
];

/**
 * The app's gold quick-action tiles under the banner: one sideways-scrolling row on phones (as in the app), a grid
 * that fills the width on tablets and computers.
 */
function QuickTiles() {
  const t = useT(text);
  const tile = "group relative flex w-[76px] shrink-0 flex-col items-center gap-2 rounded-tile p-1 text-center transition motion-safe:active:scale-95 md:w-auto";
  const body = (key: QuickKey, Icon: IconType) => (
    <>
      <span className="grid h-14 w-14 place-items-center rounded-tile bg-brand-soft text-brand-strong transition group-hover:bg-brand group-hover:text-brand-ink md:h-16 md:w-16">
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <span className="caption-4 font-bold leading-tight text-ink md:text-sm">{t.quick[key]}</span>
    </>
  );
  return (
    <nav aria-label={t.quickLabel} className="-mx-4 mt-6 pb-10 md:mx-0">
      <motion.ul
        variants={stagger}
        initial="hidden"
        animate="show"
        className="no-scrollbar flex gap-2 overflow-x-auto px-4 md:grid md:grid-cols-7 md:gap-y-5 md:overflow-visible md:px-0 xl:grid-cols-[repeat(14,minmax(0,1fr))]"
      >
        {QUICK.map(({ key, href, icon: Icon, external }) => (
          <motion.li key={key} variants={fadeUp} className="shrink-0 md:shrink">
            {external ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className={tile}>
                {body(key, Icon)}
                <span className="sr-only">{t.newTab}</span>
              </a>
            ) : (
              <Link href={href} className={tile}>
                {body(key, Icon)}
              </Link>
            )}
          </motion.li>
        ))}
      </motion.ul>
    </nav>
  );
}

/** The app's "ask an astrologer" card: the pandit drawing on white, the question and a gold Chat Now. */
function PromoCard() {
  const t = useT(text);
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <Link
        href="/astrologers?filter=online"
        className="group flex items-center gap-3 overflow-hidden rounded-card bg-surface-card p-3 shadow-[0_10px_28px_rgb(0_0_0/0.25)] transition motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-98 sm:gap-5 sm:p-4"
      >
        {/* The drawing at its own shape (900×614, transparent), so it is never cropped and always takes its space. */}
        <Image
          src="/pandit-app.webp"
          alt=""
          width={900}
          height={614}
          sizes="(min-width: 1024px) 360px, 45vw"
          className="h-auto w-[45%] max-w-[360px] shrink-0"
        />
        {/* Same look at every width (the phone card is the model): big question over three short lines, then the button. */}
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:gap-2">
          <span className="max-w-[11em] text-lg leading-snug font-medium text-ink sm:text-2xl lg:text-[1.7rem]">{t.promoTitle}</span>
          <span className="caption-2 text-ink-soft sm:text-lg">{t.promoBody}</span>
          <span className="button-md mt-2 inline-flex h-11 items-center rounded-full bg-brand px-6 text-brand-ink transition group-hover:bg-brand-hover sm:h-14 sm:px-8 sm:text-xl">
            {t.chatNow}
          </span>
        </span>
      </Link>
    </motion.div>
  );
}

function LoginCard() {
  const t = useT(text);
  return (
    <div className="flex flex-col items-start gap-4 rounded-card border border-line bg-surface-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="title-3 text-ink">{t.loginTitle}</p>
        <p className="caption-2 mt-1 text-ink-soft">{t.loginBody}</p>
      </div>
      <Link
        href="/login?next=/home"
        className="button-md inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98"
      >
        <PiSignIn className="h-5 w-5" aria-hidden />
        {t.login}
      </Link>
    </div>
  );
}

// ─── Welcome gift (signed in; the server decides who gets it) ─────────────────────

type Gift = { kind: "allFree" } | { kind: "firstChat"; minutes: number };

/**
 * New users' one free chat, the same server feature as the app's "1 फ्री चैट" badge and welcome card
 * (GET /v1/booking/consult-config → freeChat). Shown only while the server says this account still has it,
 * so the site never promises "free" when the chat would be charged. If the admin has made every chat free
 * (free_consultations), that is shown instead. Otherwise the section is not rendered at all.
 */
function WelcomeGiftSection() {
  const [gift, setGift] = useState<Gift | null>(null);
  const t = useT(text);

  useEffect(() => {
    const controller = new AbortController();
    getConsultConfig(controller.signal).then((config) => {
      if (controller.signal.aborted) return;
      if (config.free) setGift({ kind: "allFree" });
      else if (config.freeChat.available) setGift({ kind: "firstChat", minutes: config.freeChat.minutes });
    });
    return () => controller.abort();
  }, []);

  if (!gift) return null;

  const copy = gift.kind === "firstChat" ? { ...t.gift.firstChat, body: t.gift.firstChat.body(gift.minutes) } : t.gift.allFree;

  return (
    <motion.section {...reveal} variants={fadeUp} aria-labelledby="gift-title" className="pb-16">
      <div className="flex flex-col gap-6 rounded-card border border-line bg-surface-sunken p-6 shadow-card md:flex-row md:items-center md:justify-between md:gap-8 md:p-8">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand text-brand-ink">
            <PiGift className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="caption-3 text-brand-strong">{copy.kicker}</p>
            <h2 id="gift-title" className="heading-5 mt-1 text-ink">
              {copy.title}
            </h2>
            <p className="body-6 mt-2 max-w-[680px] text-ink-soft">{copy.body}</p>
          </div>
        </div>
        <Link
          href="/astrologers?filter=online"
          className="button-md inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-surface-inverse px-3 py-2 text-ink-inverse transition hover:bg-surface-inverse-raised motion-safe:active:scale-98"
        >
          <PiChatCircleDots className="h-5 w-5" aria-hidden />
          {t.gift.cta}
        </Link>
      </div>
    </motion.section>
  );
}

// ─── Missing details ────────────────────────────────────────────────────────

/** For an account signed in before the website asked for details at login: the same nudge to fill them in. */
function CompleteProfileCard() {
  const t = useT(text);
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="show"
      aria-labelledby="details-title"
      className="mb-6 flex flex-col gap-4 rounded-card border border-brand/40 bg-surface-card p-5 shadow-card sm:flex-row sm:items-center md:p-6"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand/15 text-brand-strong">
        <PiUserCirclePlus className="h-6 w-6" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="details-title" className="title-3 text-ink">
          {t.details.title}
        </h2>
        <p className="caption-2 mt-1 text-ink-soft">{t.details.body}</p>
      </div>
      <Link
        href="/profile/edit?next=/home"
        className="button-sm inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-brand px-4 py-2 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98"
      >
        {t.details.cta}
        <PiArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </motion.section>
  );
}

// ─── Services ───────────────────────────────────────────────────────────────

function ServicesSection() {
  const site = useT(SITE_TEXT);
  const t = useT(text);
  return (
    <section aria-labelledby="services-title" className="pb-12">
      <motion.h2 {...reveal} variants={fadeUp} id="services-title" className="heading-6 text-ink">
        {t.services}
      </motion.h2>

      <motion.ul {...reveal} variants={stagger} className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-10">
        {SERVICES.map(({ key, icon: Icon, mark: Mark, href, external }) => {
          const { title, subtitle } = site.services[key];
          // The app's service tiles: a gold-cream icon tile over the name, on a white card.
          const tile = "group flex h-full flex-col items-center gap-2 rounded-card border border-line bg-surface-card px-2 pb-3 pt-4 text-center shadow-card sm:px-3 sm:pb-4 sm:pt-5 transition motion-safe:hover:-translate-y-0.5 hover:border-line-strong motion-safe:active:scale-98";
          const body = (
            <>
              {/* A service with its own logo (AstroGems) shows it in place of the gold icon tile, at the same size. */}
              {Mark ? (
                <Mark size={48} />
              ) : (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-tile bg-brand-soft sm:h-14 sm:w-14 text-brand-strong transition group-hover:bg-brand group-hover:text-brand-ink">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
              )}
              <span className="mt-1 min-w-0 flex-1">
                <span className="caption-1 sm:title-4 block font-display font-bold leading-tight text-ink">{title}</span>
                <span className="caption-5 mt-1 hidden text-ink-soft sm:block">{subtitle}</span>
              </span>
              <span className="caption-3 hidden items-center gap-1 text-brand-strong sm:inline-flex">
                {t.open}
                {external ? <PiArrowUpRight className="h-4 w-4" aria-hidden /> : <PiCaretRight className="h-4 w-4" aria-hidden />}
              </span>
            </>
          );
          return (
            <motion.li key={href} variants={fadeUp}>
              {/* Sister sites (puja booking, blog) open in a new tab; the arrow points out to say so. */}
              {external ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className={tile}>
                  {body}
                  <span className="sr-only">{t.newTab}</span>
                </a>
              ) : (
                <Link href={href} className={tile}>
                  {body}
                </Link>
              )}
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}

// ─── Astrologers ────────────────────────────────────────────────────────────

function AstrologersSection() {
  const { list, failed, retry } = useAstrologerDirectory();
  const t = useT(text);
  const shown = list?.slice(0, HOME_ASTROLOGERS) ?? null;

  return (
    <section aria-labelledby="astrologers-title" className="pb-16">
      <motion.div {...reveal} variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="astrologers-title" className="heading-6 text-ink">
            {t.astrologers}
          </h2>
          <p className="caption-2 mt-1 text-ink-soft">{t.onlineFirst}</p>
        </div>
        {/* The app's gold "View All ›" link. */}
        <Link href="/astrologers" className="button-sm inline-flex items-center gap-0.5 rounded-sm text-brand-strong transition hover:text-ink">
          {t.seeAll}
          <PiCaretRight className="h-4 w-4" aria-hidden />
        </Link>
      </motion.div>

      <div className="mt-6">
        {failed ? (
          <div role="alert" className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-surface-card p-6">
            <p className="body-6 text-ink">{t.listFailed}</p>
            <button type="button" onClick={retry} className={secondaryButton}>
              <PiArrowClockwise className="h-4 w-4" aria-hidden />
              {t.tryAgain}
            </button>
          </div>
        ) : !shown ? (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]" aria-busy="true" aria-label={t.loadingAstrologers}>
            {Array.from({ length: HOME_ASTROLOGERS }, (_, i) => (
              <li key={i}>
                <AstrologerCardSkeleton />
              </li>
            ))}
          </ul>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-start gap-2 rounded-2xl border border-line bg-surface-card p-6">
            <p className="title-3 text-ink">{t.emptyTitle}</p>
            <p className="body-6 text-ink-soft">{t.emptyBody}</p>
          </div>
        ) : (
          // grid-cols-1: an auto column would grow to the longest name or expertise line and overflow phones.
          <motion.ul variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]">
            {shown.map((a) => (
              <motion.li key={a.id} variants={fadeUp}>
                <AstrologerCard astrologer={a} />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </section>
  );
}
