"use client";

import { useEffect, useState } from "react";
import { PiLockKey, PiPlus } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { INTL_LOCALE } from "@/i18n/config";
import { listBlindKundli, type Summary } from "@/lib/services/toolsBBlindKundli";
import { toolErrorText } from "@/lib/services/toolsBCommon";
import { ErrorBox, Skeleton, btnPrimary } from "../../kundli/_components/ui";
import { ToolPage } from "../_b/shell";
import BkGate from "./BkGate";
import { bkText } from "./text";

export default function BlindList() {
  const t = useT(bkText);
  return (
    <ToolPage eyebrow={t.eyebrow} title={t.title} intro={t.listIntro}>
      <BkGate>
        <List />
      </BkGate>
    </ToolPage>
  );
}

function List() {
  const t = useT(bkText);
  const locale = useLocale();
  const [rows, setRows] = useState<Summary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const c = new AbortController();
    listBlindKundli(c.signal).then(
      (r) => {
        setRows(r);
        setError(null);
      },
      (e) => !c.signal.aborted && setError(toolErrorText(e, locale)),
    );
    return () => c.abort();
  }, [attempt, locale]);

  const date = (iso: string) => new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-4">
      <div>
        <Link href="/tools/blind-kundli/new" className={btnPrimary}>
          <PiPlus className="h-5 w-5" aria-hidden /> {t.newPrediction}
        </Link>
      </div>
      {error && <ErrorBox message={error} onRetry={() => setAttempt((a) => a + 1)} />}
      {!rows && !error && (
        <div aria-hidden className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}
      {rows && rows.length === 0 && <p className="body-5 text-ink-soft">{t.empty}</p>}
      {rows && rows.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/tools/blind-kundli/report?id=${encodeURIComponent(r.id)}`} className="block rounded-2xl border border-line bg-surface-card p-4 transition hover:border-line-strong hover:bg-surface-sunken active:scale-98">
                <p className="title-3 flex items-center gap-2 break-words text-ink">
                  <PiLockKey className="h-5 w-5 shrink-0 text-brand-strong" aria-hidden /> {r.label || t.untitled}
                </p>
                <p className="caption-2 mt-1 text-ink-soft">
                  {t.locked} {date(r.locked_at)} · {r.revealed_at && r.score ? t.revealedScore(r.score.points, r.score.max) : t.notRevealed}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
