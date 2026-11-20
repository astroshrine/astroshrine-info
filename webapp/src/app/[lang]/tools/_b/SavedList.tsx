"use client";

import { useState } from "react";
import { PiClockCounterClockwise, PiTrash } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { INTL_LOCALE } from "@/i18n/config";
import { deleteSaved, getSaved, listSaved, type SavedResult, type SavedSummary, type SavedTool } from "@/lib/services/toolsBSaved";
import { toolErrorText } from "@/lib/services/toolsBCommon";
import { Card, ErrorBox, Skeleton, btnSmall } from "../../kundli/_components/ui";

const text = defineMessages({
  hi: {
    title: "सहेजे हुए नतीजे",
    show: "सहेजे नतीजे देखें",
    hide: "छुपाएं",
    empty: "अभी कोई नतीजा सहेजा नहीं गया है।",
    open: "खोलें",
    remove: "हटाएं",
    more: "और दिखाएं",
    untitled: "बिना नाम",
    removeLabel: (title: string) => `${title} हटाएं`,
  },
  en: {
    title: "Saved results",
    show: "Show saved results",
    hide: "Hide",
    empty: "No result has been saved yet.",
    open: "Open",
    remove: "Delete",
    more: "Show more",
    untitled: "Untitled",
    removeLabel: (title) => `Delete ${title}`,
  },
});

/**
 * The tool's saved results (the app's "Saved" button), loaded when the visitor opens the list. `onOpen` receives
 * the stored input and result, to show again exactly as they were.
 */
export default function SavedList<R = unknown, I = unknown>({ tool, onOpen }: { tool: SavedTool; onOpen: (saved: SavedResult<R, I>) => void }) {
  const t = useT(text);
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<SavedSummary[] | null>(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(offset: number) {
    setBusy(true);
    setError(null);
    try {
      const page = await listSaved(tool, offset);
      setRows((r) => (offset ? [...(r ?? []), ...page.results] : page.results));
      setMore(!!page.hasMore);
    } catch (e) {
      setError(toolErrorText(e, locale));
    } finally {
      setBusy(false);
    }
  }

  async function openOne(id: string) {
    setError(null);
    try {
      onOpen(await getSaved<R, I>(id));
    } catch (e) {
      setError(toolErrorText(e, locale));
    }
  }

  async function removeOne(id: string) {
    setError(null);
    try {
      await deleteSaved(id);
      setRows((r) => (r ?? []).filter((x) => x.id !== id));
    } catch (e) {
      setError(toolErrorText(e, locale));
    }
  }

  const date = (iso: string) => new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "short", year: "numeric" });

  return (
    <Card
      title={t.title}
      action={
        <button
          type="button"
          className={btnSmall}
          aria-expanded={open}
          onClick={() => {
            setOpen((o) => !o);
            if (!rows && !busy) void load(0);
          }}
        >
          <PiClockCounterClockwise className="h-4 w-4" aria-hidden /> {open ? t.hide : t.show}
        </button>
      }
    >
      {open && (
        <div className="space-y-3" aria-live="polite">
          {error && <ErrorBox message={error} onRetry={() => void load(0)} />}
          {!rows && busy && <Skeleton className="h-10 w-full" />}
          {rows && rows.length === 0 && <p className="body-6 text-ink-soft">{t.empty}</p>}
          {rows && rows.length > 0 && (
            <ul className="divide-y divide-line">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="body-5 break-words text-ink">{r.title || t.untitled}</p>
                    <p className="caption-2 text-ink-soft">{date(r.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className={btnSmall} onClick={() => void openOne(r.id)}>
                      {t.open}
                    </button>
                    <button type="button" className={btnSmall} aria-label={t.removeLabel(r.title || t.untitled)} onClick={() => void removeOne(r.id)}>
                      <PiTrash className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {more && (
            <button type="button" className={btnSmall} disabled={busy} onClick={() => void load(rows?.length ?? 0)}>
              {t.more}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
