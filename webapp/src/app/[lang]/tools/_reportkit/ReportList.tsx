"use client";

import { useCallback, useEffect, useState } from "react";
import { PiArrowRight } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useLocale } from "@/i18n/LocaleProvider";
import { toolFailure, type ToolFailure } from "@/lib/services/tools";
import { Card, CardSkeleton, ErrorBox, btnSecondary } from "../../kundli/_components/ui";
import { DeleteButton, useFailureText, useKitText } from "./kit";

export type ListItem = { id: string; name: string; createdAt: string; note?: string };

const hasDeva = (s: string) => /[ऀ-ॿ]/.test(s);

/**
 * A page of saved reports (newest first) with load more, open and delete. `href` builds the link of one report.
 * `emptyText` is shown for an account with none; `header` sits above the list.
 */
export default function ReportList({
  fetchPage,
  href,
  remove,
  emptyText,
  header,
}: {
  fetchPage: (offset: number, signal: AbortSignal) => Promise<{ reports: ListItem[]; hasMore: boolean }>;
  href: (id: string) => string;
  remove: (id: string) => Promise<unknown>;
  emptyText: string;
  header?: React.ReactNode;
}) {
  const locale = useLocale();
  const t = useKitText();
  const fail = useFailureText();
  const [items, setItems] = useState<ListItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [phase, setPhase] = useState<"loading" | "ready" | "error" | "more">("loading");
  const [failure, setFailure] = useState<ToolFailure>("failed");

  const load = useCallback(
    (offset: number, signal: AbortSignal) => {
      fetchPage(offset, signal).then(
        (p) => {
          setItems((prev) => (offset ? [...prev, ...p.reports] : p.reports));
          setHasMore(p.hasMore);
          setPhase("ready");
        },
        (e) => {
          if (signal.aborted) return;
          setFailure(toolFailure(e));
          setPhase("error");
        },
      );
    },
    [fetchPage],
  );

  useEffect(() => {
    const c = new AbortController();
    load(0, c.signal);
    return () => c.abort();
  }, [load]);

  const date = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      {header}
      {phase === "loading" && (
        <div aria-busy="true" aria-label={t.loading} className="space-y-3">
          <CardSkeleton rows={1} />
          <CardSkeleton rows={1} />
        </div>
      )}
      {phase === "error" && items.length === 0 && (
        <ErrorBox
          message={fail(failure)}
          onRetry={
            failure === "failed" || failure === "rateLimited"
              ? () => {
                  setPhase("loading");
                  load(0, new AbortController().signal);
                }
              : undefined
          }
        />
      )}
      {phase !== "loading" && phase !== "error" && items.length === 0 && (
        <Card>
          <p className="body-5 text-ink-soft">{emptyText}</p>
        </Card>
      )}
      {items.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface-card p-4">
              <Link href={href(r.id)} className="group min-w-0 flex-1">
                <span lang={hasDeva(r.name) ? "hi" : undefined} className="title-3 flex items-center justify-between gap-2 truncate text-ink">
                  <span className="truncate">{r.name}</span>
                  <PiArrowRight className="h-4 w-4 shrink-0 text-ink-muted transition group-hover:translate-x-1" aria-hidden />
                </span>
                <span className="caption-2 mt-0.5 block text-ink-soft">{date(r.createdAt)}</span>
                {r.note && <span className="caption-2 mt-0.5 block text-ink">{r.note}</span>}
              </Link>
              <DeleteButton name={r.name} onDelete={() => remove(r.id)} onDone={() => setItems((p) => p.filter((x) => x.id !== r.id))} />
            </li>
          ))}
        </ul>
      )}
      {phase === "error" && items.length > 0 && <ErrorBox message={fail(failure)} />}
      {hasMore && (
        <button
          type="button"
          className={btnSecondary}
          disabled={phase === "more"}
          onClick={() => {
            setPhase("more");
            load(items.length, new AbortController().signal);
          }}
        >
          {t.newer}
        </button>
      )}
    </div>
  );
}
