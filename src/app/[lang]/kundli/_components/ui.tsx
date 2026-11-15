"use client";

import { motion } from "framer-motion";
import { PiArrowClockwise, PiInfo, PiPlus, PiSignIn, PiWarningCircle } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localizeHref } from "@/i18n/paths";
import { fadeUp } from "@/lib/motion";

const text = defineMessages({
  hi: {
    retry: "फिर कोशिश करें",
    /** `what`: what the visitor wants to see, e.g. "कुंडली". */
    signInTitle: (what: string) => `${what} देखने के लिए लॉगिन करें`,
    signInBody: "ऐप वाले मोबाइल नंबर से लॉगिन करें। गणना मुफ़्त है, wallet से कोई पॉइंट नहीं कटते।",
    logIn: "लॉगिन करें",
    needTitle: (what: string) => `${what} के लिए पहले एक कुंडली जोड़ें`,
    needBody: "नाम, जन्म तिथि, समय और स्थान एक बार भरें। फिर कुंडली, गोचर और बाकी सब इसी से बनेंगे।",
    addKundli: "नई कुंडली जोड़ें",
    disclaimer:
      "पारंपरिक ज्योतिषीय गणना, मार्गदर्शन और चिंतन के लिए। चिकित्सा, कानूनी या वित्तीय सलाह का विकल्प नहीं। ग्रह स्थिति स्विस एफेमेरिस (लाहिड़ी अयनांश) से, AstroShrine के सर्वर पर।",
  },
  en: {
    retry: "Try again",
    signInTitle: (what) => `Log in to see ${what}`,
    signInBody: "Log in with the mobile number you use in the app. The calculation is free, and no points are taken from your wallet.",
    logIn: "Log in",
    needTitle: (what) => `To see ${what}, add a kundli first`,
    needBody: "Enter the name, date, time and place of birth once. The kundli, transits and every other tool are then made from it.",
    addKundli: "Add a new kundli",
    disclaimer:
      "Traditional Jyotish calculations, for guidance and reflection. Not a substitute for medical, legal or financial advice. Planet positions come from the Swiss Ephemeris (Lahiri ayanamsha), calculated on AstroShrine's servers.",
  },
});

// Building blocks shared by every /kundli page, on the site's design system (landing-page-design, Part B):
// semantic color tokens, named text styles, spacing from the scale, nested radii (card 24px, 16px padding,
// so shapes inside a card use 8px).

export const btnPrimary =
  "button-md inline-flex items-center justify-center gap-2 rounded-full bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover active:scale-98 disabled:pointer-events-none disabled:opacity-60";
export const btnSecondary =
  "button-md inline-flex items-center justify-center gap-2 rounded-full border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken active:scale-98 disabled:pointer-events-none disabled:opacity-60";
export const btnSmall =
  "button-sm inline-flex items-center justify-center gap-2 rounded-full border border-line-strong bg-surface-card px-3 py-2 text-ink transition hover:bg-surface-sunken active:scale-98 disabled:pointer-events-none disabled:opacity-60";
export const inputCls =
  "body-3 w-full rounded-lg border border-line-strong bg-surface-page px-3 py-2 text-ink transition placeholder:text-ink-muted hover:border-brand disabled:opacity-60";
export const labelCls = "title-4 mb-2 block text-ink";

/** A page section: a card that rises into view once (B7 scroll reveal). */
export function Card({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      // A printed sheet must not depend on having scrolled every card into view.
      className={`rounded-3xl border border-line bg-surface-card p-4 print:transform-none! print:opacity-100! ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="heading-6 text-ink">{title}</h2>}
            {description && <p className="caption-2 mt-1 text-ink-soft">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.section>
  );
}

/** Label and value rows. */
export function KV({ rows }: { rows: [React.ReactNode, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2">
          <dt className="caption-1 text-ink-soft">{k}</dt>
          <dd className="body-5 min-w-0 text-right text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warning"; children: React.ReactNode }) {
  const Icon = tone === "warning" ? PiWarningCircle : PiInfo;
  return (
    <p
      role="note"
      className={`body-6 flex items-start gap-2 rounded-2xl p-3 ${
        tone === "warning" ? "bg-warning-soft text-warning" : "bg-surface-sunken text-ink-soft"
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useT(text);
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-danger-soft p-4">
      <p className="body-5 flex min-w-0 items-start gap-2 text-danger">
        <PiWarningCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <span>{message}</span>
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={btnSmall}>
          <PiArrowClockwise className="h-4 w-4" aria-hidden /> {t.retry}
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`block animate-pulse rounded-lg bg-surface-sunken ${className}`} />;
}

/** A card shaped skeleton: a title bar and a few rows. */
export function CardSkeleton({ rows = 4, chart = false }: { rows?: number; chart?: boolean }) {
  return (
    <div aria-hidden className="rounded-3xl border border-line bg-surface-card p-4">
      <Skeleton className="h-6 w-40" />
      {chart && <Skeleton className="mx-auto mt-4 aspect-square w-full max-w-sm" />}
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * A login link that comes back to this exact view: path, query (?k=, ?new=1, ?varga=) and hash (the kundli).
 * The href holds the path alone, for opening in a new tab; a plain click carries the whole URL. Both keep the
 * page's language in `next`, so the visitor comes back to the same language.
 */
export function LoginLink({ className, children }: { className: string; children: React.ReactNode }) {
  const pathname = localizeHref(useLocale(), usePathname());
  const router = useRouter();
  return (
    <Link
      href={`/login?next=${encodeURIComponent(pathname)}`}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        const here = window.location.pathname + window.location.search + window.location.hash;
        router.push(`/login?next=${encodeURIComponent(here)}`);
      }}
      className={className}
    >
      {children}
    </Link>
  );
}

/**
 * The engine needs a signed in account: this replaces a tool's results until the visitor logs in. `what` is
 * the thing to see, in the page's language: "कुंडली" reads "कुंडली देखने के लिए लॉगिन करें", "the kundli"
 * reads "Log in to see the kundli".
 */
export function SignInPrompt({ what }: { what: string }) {
  const t = useT(text);
  return (
    <div className="rounded-3xl border border-line bg-surface-card p-6 text-center">
      <p className="title-2 text-ink">{t.signInTitle(what)}</p>
      <p className="body-6 mx-auto mt-2 max-w-md text-ink-soft">{t.signInBody}</p>
      <LoginLink className={`${btnPrimary} mt-4`}>
        <PiSignIn className="h-5 w-5" aria-hidden /> {t.logIn}
      </LoginLink>
    </div>
  );
}

/**
 * Shown on a tool that needs saved birth details when there are none yet. `what` is the tool's subject in the
 * page's language: "कुंडली" reads "कुंडली के लिए पहले एक कुंडली जोड़ें", "the chart" reads "To see the chart, add a
 * kundli first".
 */
export function NeedProfile({ what }: { what: string }) {
  const t = useT(text);
  return (
    <div className="rounded-3xl border border-line bg-surface-card p-6 text-center">
      {/* The page's only heading in this state (no profile, so no profile header). */}
      <h1 className="heading-6 text-ink">{t.needTitle(what)}</h1>
      <p className="body-6 mx-auto mt-2 max-w-md text-ink-soft">{t.needBody}</p>
      <Link href="/kundli?new=1" className={`${btnPrimary} mt-4`}>
        <PiPlus className="h-5 w-5" aria-hidden /> {t.addKundli}
      </Link>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <motion.header variants={fadeUp} initial="hidden" animate="show" className="max-w-2xl">
      <p className="caption-4 text-brand-strong">{eyebrow}</p>
      <h1 className="heading-5 mt-1 text-ink md:heading-4">{title}</h1>
      {children && <div className="body-6 mt-2 text-ink-soft">{children}</div>}
    </motion.header>
  );
}

export function Disclaimer() {
  return <p className="caption-5 text-ink-muted">{useT(text).disclaimer}</p>;
}
