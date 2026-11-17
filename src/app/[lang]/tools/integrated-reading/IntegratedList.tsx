"use client";

import { useEffect, useState } from "react";
import { PiPlus, PiTrash } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { INTL_LOCALE } from "@/i18n/config";
import { deleteIntegratedReading, listIntegratedReadings, type IntegratedReadingSummary } from "@/lib/services/toolsBIntegrated";
import { toolErrorText } from "@/lib/services/toolsBCommon";
import { ErrorBox, Skeleton, btnPrimary, btnSecondary, btnSmall } from "../../kundli/_components/ui";
import { Gate, ToolPage } from "../_b/shell";
import { irText } from "./text";

export default function IntegratedList() {
  const t = useT(irText);
  return (
    <ToolPage eyebrow={t.eyebrow} title={t.title} intro={t.intro}>
      <Gate what={t.what} astrologerOnly>
        <List />
      </Gate>
    </ToolPage>
  );
}

function List() {
  const t = useT(irText);
  const locale = useLocale();
  const [rows, setRows] = useState<IntegratedReadingSummary[] | null>(null);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState<IntegratedReadingSummary | null>(null);

  useEffect(() => {
    const c = new AbortController();
    listIntegratedReadings(0, 20, c.signal).then(
      (p) => {
        setRows(p.reports);
        setMore(p.hasMore);
        setError(null);
      },
      (e) => !c.signal.aborted && setError(toolErrorText(e, locale)),
    );
    return () => c.abort();
  }, [attempt, locale]);

  async function loadMore() {
    setBusy(true);
    try {
      const p = await listIntegratedReadings(rows?.length ?? 0);
      setRows((r) => [...(r ?? []), ...p.reports]);
      setMore(p.hasMore);
    } catch (e) {
      setError(toolErrorText(e, locale));
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: IntegratedReadingSummary) {
    setBusy(true);
    try {
      await deleteIntegratedReading(r.id);
      setRows((x) => (x ?? []).filter((y) => y.id !== r.id));
      setAsking(null);
    } catch {
      setError(t.deleteFailed);
    } finally {
      setBusy(false);
    }
  }

  const date = (iso: string) => new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-4">
      <div>
        <Link href="/tools/integrated-reading/new" className={btnPrimary}>
          <PiPlus className="h-5 w-5" aria-hidden /> {t.newReading}
        </Link>
      </div>
      {error && <ErrorBox message={error} onRetry={() => setAttempt((a) => a + 1)} />}
      {asking && (
        <div role="alertdialog" aria-labelledby="ir-del" className="rounded-2xl border border-line bg-warning-soft p-4">
          <p id="ir-del" className="title-3 text-warning">{t.deleteTitle}</p>
          <p className="body-6 mt-1 text-ink-soft">{t.deleteBody(asking.name)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} disabled={busy} onClick={() => void remove(asking)}>{t.confirmDelete}</button>
            <button type="button" className={btnSecondary} onClick={() => setAsking(null)}>{t.cancel}</button>
          </div>
        </div>
      )}
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
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface-card p-4">
              <Link href={`/tools/integrated-reading/report?id=${encodeURIComponent(r.id)}`} className="min-w-0 flex-1">
                <p className="title-3 break-words text-ink">{r.name}</p>
                <p className="caption-2 mt-1 text-ink-soft">{date(r.createdAt)}</p>
              </Link>
              <button type="button" className={btnSmall} aria-label={t.removeLabel(r.name)} onClick={() => setAsking(r)}>
                <PiTrash className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {more && (
        <button type="button" className={btnSecondary} disabled={busy} onClick={() => void loadMore()}>
          {t.more}
        </button>
      )}
    </div>
  );
}
