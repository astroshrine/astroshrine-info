"use client";

import { useCallback, useEffect, useState } from "react";
import { PiClockCounterClockwise, PiTrash } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { deleteToolResult, getToolResult, listToolResults, type SavedResult, type SavedSummary, type SavedTool } from "@/lib/services/tools";
import { ErrorBox, Skeleton, btnSmall } from "../../kundli/_components/ui";

const text = defineMessages({
  hi: {
    title: "सहेजे हुए नतीजे",
    show: "सहेजे नतीजे देखें",
    hide: "बंद करें",
    empty: "अभी कोई सहेजा हुआ नतीजा नहीं। बनाई गई हर रिपोर्ट यहाँ अपने आप सहेजी जाती है।",
    loadError: "सहेजे नतीजे नहीं खुल सके।",
    openError: "यह नतीजा नहीं खुल सका।",
    deleteError: "नतीजा हटाया नहीं जा सका।",
    open: "खोलें",
    del: "हटाएँ",
    confirm: "यह सहेजा हुआ नतीजा हटाएँ?",
    yes: "हाँ, हटाएँ",
    no: "रहने दें",
    more: "और दिखाएँ",
  },
  en: {
    title: "Saved results",
    show: "Show saved results",
    hide: "Close",
    empty: "No saved results yet. Every report you make is saved here automatically.",
    loadError: "Could not load the saved results.",
    openError: "Could not open this result.",
    deleteError: "Could not delete this result.",
    open: "Open",
    del: "Delete",
    confirm: "Delete this saved result?",
    yes: "Yes, delete",
    no: "Keep it",
    more: "Show more",
  },
});

/** A tool's saved results (backend /v1/tool-results): newest first, open one in place or delete it. */
export default function SavedResults<R = unknown, I = unknown>({
  tool,
  onOpen,
  refreshKey = 0,
}: {
  tool: SavedTool;
  onOpen: (s: SavedResult<R, I>) => void;
  /** Change it after a new result is saved to reload the list while it is open. */
  refreshKey?: number;
}) {
  const t = useT(text);
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<SavedSummary[]>([]);
  const [more, setMore] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  const load = useCallback(
    async (offset: number) => {
      try {
        const page = await listToolResults(tool, offset);
        setRows((prev) => (offset ? [...prev, ...(page.results ?? [])] : (page.results ?? [])));
        setMore(Boolean(page.hasMore));
        setState("ready");
      } catch {
        setState("error");
      }
    },
    [tool],
  );

  useEffect(() => {
    if (!open) return;
    let live = true;
    listToolResults(tool, 0).then(
      (page) => {
        if (!live) return;
        setRows(page.results ?? []);
        setMore(Boolean(page.hasMore));
        setState("ready");
      },
      () => live && setState("error"),
    );
    return () => {
      live = false;
    };
  }, [open, tool, refreshKey]);

  async function openOne(id: string) {
    setBusy(id);
    setProblem(null);
    try {
      onOpen(await getToolResult<R, I>(id));
    } catch {
      setProblem(t.openError);
    } finally {
      setBusy("");
    }
  }

  async function remove(id: string) {
    setBusy(id);
    setProblem(null);
    try {
      await deleteToolResult(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setConfirm("");
    } catch {
      setProblem(t.deleteError);
    } finally {
      setBusy("");
    }
  }

  return (
    <section aria-label={t.title} className="rounded-2xl border border-line bg-surface-card p-4">
      <button type="button" onClick={() => { if (!open) setState("loading"); setOpen((o) => !o); }} aria-expanded={open} className="title-3 flex w-full items-center justify-between gap-2 text-ink">
        <span className="flex items-center gap-2">
          <PiClockCounterClockwise className="h-5 w-5 text-brand-strong" aria-hidden /> {open ? t.title : t.show}
        </span>
        {open && <span className="caption-3 text-ink-soft">{t.hide}</span>}
      </button>
      {open && (
        <div className="mt-3">
          {problem && <ErrorBox message={problem} />}
          {state === "loading" && (
            <div aria-hidden className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {state === "error" && <ErrorBox message={t.loadError} onRetry={() => { setState("loading"); void load(0); }} />}
          {state === "ready" && rows.length === 0 && <p className="body-6 text-ink-soft">{t.empty}</p>}
          {state === "ready" && rows.length > 0 && (
            <ul className="divide-y divide-line">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="body-5 truncate text-ink">{r.title}</p>
                    <p className="caption-3 text-ink-soft">{new Date(r.createdAt).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN")}</p>
                  </div>
                  {confirm === r.id ? (
                    <div className="flex items-center gap-2">
                      <span className="caption-2 text-ink-soft">{t.confirm}</span>
                      <button type="button" disabled={busy === r.id} onClick={() => void remove(r.id)} className={btnSmall}>
                        {t.yes}
                      </button>
                      <button type="button" onClick={() => setConfirm("")} className="caption-3 text-ink-soft underline">
                        {t.no}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button type="button" disabled={busy === r.id} onClick={() => void openOne(r.id)} className={btnSmall}>
                        {t.open}
                      </button>
                      <button type="button" aria-label={t.del} onClick={() => setConfirm(r.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft transition hover:bg-surface-sunken hover:text-danger">
                        <PiTrash className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {state === "ready" && more && (
            <button type="button" onClick={() => void load(rows.length)} className={`${btnSmall} mt-3`}>
              {t.more}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
