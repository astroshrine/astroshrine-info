"use client";

import { Suspense } from "react";
import { PiLock, PiWallet } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { rechargeHref } from "@/lib/services/chat";
import { PageHeader, SignInPrompt, Skeleton, btnPrimary } from "../../kundli/_components/ui";

const text = defineMessages({
  hi: {
    astrologerTitle: "यह टूल ज्योतिषियों के लिए है",
    astrologerBody: "इसे AstroShrine के ज्योतिषी खाते से ही खोला जा सकता है। ऐप वाले ज्योतिषी नंबर से लॉगिन करें।",
    joinLink: "ज्योतिषी बनने के लिए",
    lowTitle: "वॉलेट में पॉइंट कम हैं",
    lowBody: (need?: number) => (need ? `इसके लिए ${need} पॉइंट चाहिए। रिचार्ज करके फिर कोशिश करें।` : "रिचार्ज करके फिर कोशिश करें। पॉइंट कटे नहीं हैं।"),
    recharge: "वॉलेट रिचार्ज करें",
  },
  en: {
    astrologerTitle: "This tool is for astrologers",
    astrologerBody: "It opens only with an AstroShrine astrologer account. Log in with the astrologer number you use in the app.",
    joinLink: "Become an astrologer",
    lowTitle: "Not enough points in your wallet",
    lowBody: (need) => (need ? `This needs ${need} points. Recharge and try again.` : "Recharge and try again. No points were taken."),
    recharge: "Recharge wallet",
  },
});

/** The page frame of every tool in this section: the same width and header as the kundli pages. */
export function ToolPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-8 md:pt-10">
      <PageHeader eyebrow={eyebrow} title={title}>
        {intro}
      </PageHeader>
      <div className="mt-6 md:mt-8">{children}</div>
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div aria-hidden className="space-y-3 rounded-2xl border border-line bg-surface-card p-5">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-36 rounded-full" />
    </div>
  );
}

/**
 * Who may see the tool: a signed in account, and (`astrologerOnly`) an astrologer, which is what the app and the
 * backend require for these tools. Everyone else is told what to do, with nothing hidden behind a blank page.
 */
export function Gate({ what, astrologerOnly = false, children }: { what: string; astrologerOnly?: boolean; children: React.ReactNode }) {
  const { status, user } = useAuth();
  const t = useT(text);
  if (status === "loading" || (status === "signedIn" && !user)) return <PanelSkeleton />;
  if (status === "signedOut") return <SignInPrompt what={what} />;
  if (astrologerOnly && user?.role !== "ASTROLOGER") {
    return (
      <div className="rounded-2xl border border-line bg-surface-card p-6 text-center">
        <PiLock className="mx-auto h-6 w-6 text-brand-strong" aria-hidden />
        <h2 className="title-2 mt-2 text-ink">{t.astrologerTitle}</h2>
        <p className="body-6 mx-auto mt-2 max-w-md text-ink-soft">{t.astrologerBody}</p>
        <Link href="/astrologer/join" className={`${btnPrimary} mt-4`}>
          {t.joinLink}
        </Link>
      </div>
    );
  }
  return <Suspense fallback={<PanelSkeleton />}>{children}</Suspense>;
}

/** Shown when the wallet could not pay for a charged step (402); nothing was taken. */
export function LowBalance({ need }: { need?: number }) {
  const t = useT(text);
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-warning-soft p-4">
      <div className="min-w-0">
        <p className="title-3 flex items-center gap-2 text-warning">
          <PiWallet className="h-5 w-5" aria-hidden /> {t.lowTitle}
        </p>
        <p className="body-6 mt-1 text-ink-soft">{t.lowBody(need)}</p>
      </div>
      <Link href={rechargeHref(need)} className={btnPrimary}>
        {t.recharge}
      </Link>
    </div>
  );
}
