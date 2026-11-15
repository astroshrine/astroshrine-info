"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PiArrowClockwise, PiArrowRight, PiArrowUpRight, PiChatCircleDots, PiGift, PiSignIn } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import AstrologerCard, { AstrologerCardSkeleton } from "@/components/AstrologerCard";
import { getConsultConfig } from "@/lib/services/chat";
import { fadeUp, stagger } from "@/lib/motion";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { SERVICES, SITE_TEXT } from "@/lib/site";
import { useAstrologerDirectory } from "@/lib/useAstrologerDirectory";

/** How many astrologers the home page shows (online first). */
const HOME_ASTROLOGERS = 6;

const text = defineMessages({
  hi: {
    hello: "नमस्ते",
    helloName: (name: string) => `नमस्ते, ${name}`,
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
  "button-sm inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken motion-safe:active:scale-98";

/**
 * The signed-in app home: greeting, the new user's free chat, services and astrologers, all from the shared
 * backend. The wallet balance is not repeated here: it is always in the header (both on phones and desktop).
 */
export default function HomeView() {
  const { status, user } = useAuth();
  const t = useT(text);
  const signedIn = status === "signedIn";
  const signedOut = status === "signedOut";
  const name = user?.name?.trim();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
      {/* Signed out, a login card sits beside the greeting (top-aligned; md:pt-6 matches its padding). */}
      <section
        aria-labelledby="home-title"
        className={`grid grid-cols-1 gap-8 pb-16 pt-8 md:pt-12 ${signedOut ? "md:grid-cols-5 md:items-start" : ""}`}
      >
        <motion.div variants={stagger} initial="hidden" animate="show" className={signedOut ? "md:col-span-3 md:pt-6" : ""}>
          <motion.p variants={fadeUp} className="caption-3 text-brand-strong">
            {signedIn && name ? t.helloName(name) : t.hello}
          </motion.p>
          <motion.h1 variants={fadeUp} id="home-title" className="heading-4 md:heading-3 mt-3 max-w-[680px] text-ink">
            {t.title}
          </motion.h1>
          <motion.p variants={fadeUp} className="body-3 mt-4 max-w-[680px] text-ink-soft">
            {t.intro}
          </motion.p>
        </motion.div>
        {signedOut && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="md:col-span-2">
            <LoginCard />
          </motion.div>
        )}
      </section>

      {signedIn && <WelcomeGiftSection />}
      <ServicesSection />
      <AstrologersSection />
    </div>
  );
}

function LoginCard() {
  const t = useT(text);
  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl border border-line bg-surface-card p-6">
      <div>
        <p className="title-3 text-ink">{t.loginTitle}</p>
        <p className="caption-2 mt-1 text-ink-soft">{t.loginBody}</p>
      </div>
      <Link
        href="/login?next=/home"
        className="button-md inline-flex items-center gap-2 rounded-full bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98"
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
      <div className="flex flex-col gap-6 rounded-3xl border border-line bg-brand-soft p-6 md:flex-row md:items-center md:justify-between md:gap-8 md:p-8">
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
          className="button-md inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-surface-inverse px-3 py-2 text-ink-inverse transition hover:bg-surface-inverse-raised motion-safe:active:scale-98"
        >
          <PiChatCircleDots className="h-5 w-5" aria-hidden />
          {t.gift.cta}
        </Link>
      </div>
    </motion.section>
  );
}

// ─── Services ───────────────────────────────────────────────────────────────

function ServicesSection() {
  const site = useT(SITE_TEXT);
  const t = useT(text);
  return (
    <section aria-labelledby="services-title" className="pb-16">
      <motion.h2 {...reveal} variants={fadeUp} id="services-title" className="heading-5 text-ink">
        {t.services}
      </motion.h2>

      <motion.ul {...reveal} variants={stagger} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map(({ key, icon: Icon, mark: Mark, href, external }) => {
          const { title, subtitle } = site.services[key];
          const tile = "flex h-full items-center gap-4 rounded-2xl border border-line-strong bg-surface-card p-4 transition motion-safe:hover:-translate-y-0.5 hover:bg-surface-sunken motion-safe:active:scale-98 sm:flex-col sm:items-start";
          const body = (
            <>
              {/* A service with its own logo (AstroGems) shows it in place of the gold icon tile, at the same size. */}
              {Mark ? (
                <Mark size={40} />
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="title-3 block text-ink">{title}</span>
                <span className="caption-5 mt-1 block text-ink-soft">{subtitle}</span>
              </span>
              <span className="caption-3 inline-flex items-center gap-1 text-brand-strong sm:mt-auto">
                {t.open}
                {external ? <PiArrowUpRight className="h-4 w-4" aria-hidden /> : <PiArrowRight className="h-4 w-4" aria-hidden />}
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
          <h2 id="astrologers-title" className="heading-5 text-ink">
            {t.astrologers}
          </h2>
          <p className="body-6 mt-2 text-ink-soft">{t.onlineFirst}</p>
        </div>
        <Link href="/astrologers" className={secondaryButton}>
          {t.seeAll}
          <PiArrowRight className="h-4 w-4" aria-hidden />
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
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-busy="true" aria-label={t.loadingAstrologers}>
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
          <motion.ul variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
