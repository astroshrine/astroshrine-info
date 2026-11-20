"use client";

import { PiLock } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { SignInPrompt, Skeleton, btnPrimary } from "../../kundli/_components/ui";

const text = defineMessages({
  hi: {
    only: "यह टूल केवल सत्यापित ज्योतिषियों के लिए है",
    onlyBody: "AstroShrine ऐप में भी यह टूल ज्योतिषी खाते में ही खुलता है। अपने ज्योतिषी खाते से लॉगिन करें, या ज्योतिषी के रूप में जुड़ें।",
    join: "ज्योतिषी के रूप में जुड़ें",
    all: "सभी टूल",
  },
  en: {
    only: "This tool is for verified astrologers",
    onlyBody: "In the AstroShrine app too, this tool opens only for an astrologer account. Log in with your astrologer account, or join as an astrologer.",
    join: "Join as an astrologer",
    all: "All tools",
  },
});

/**
 * Wraps a tool page. Signed-out visitors get the login prompt; `astrologerOnly` tools (the backend answers 403 to
 * anyone else, as the app hides them) show an explanation to a customer account instead of a form that cannot work.
 */
export default function ToolGate({ what, astrologerOnly = true, children }: { what: string; astrologerOnly?: boolean; children: React.ReactNode }) {
  const { status, user } = useAuth();
  const t = useT(text);
  if (status === "loading" || (status === "signedIn" && !user)) {
    return (
      <div aria-hidden className="space-y-3 rounded-2xl border border-line bg-surface-card p-5">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }
  if (status === "signedOut") return <SignInPrompt what={what} />;
  if (astrologerOnly && user?.role !== "ASTROLOGER") {
    return (
      <div className="rounded-2xl border border-line bg-surface-card p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-surface-sunken text-brand-strong">
          <PiLock className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="heading-6 mt-3 text-ink">{t.only}</h2>
        <p className="body-6 mx-auto mt-2 max-w-md text-ink-soft">{t.onlyBody}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/astrologer/join" className={btnPrimary}>
            {t.join}
          </Link>
          <Link href="/tools" className="button-md inline-flex items-center rounded-xl border border-ink px-4 py-2 text-ink transition hover:bg-surface-sunken">
            {t.all}
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
