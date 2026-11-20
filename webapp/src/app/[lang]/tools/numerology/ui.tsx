"use client";

import { useCallback, useEffect, useState } from "react";
import { PiArrowClockwise, PiTrash } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { deleteToolResult, getToolResult, listToolResults, type SavedResult, type SavedSummary, type SavedTool } from "@/lib/services/tools";
import { Card, ErrorBox, KV, Skeleton, btnSmall } from "../../kundli/_components/ui";
import { makeBi, ymText, type Bi } from "./bi";
import { PHAL, PRAVRITTI, PHAL_CLS, BAL, PRAMAAN } from "./phalEngine";
import type { Block, Sec, Val } from "./report";

// Pieces shared by the numerology and tarot pages: the phaladesh card, the report blocks, the saved-results list
// and the print rules.

export type Cls = "ok" | "mid" | "bad";
const VERDICT: Record<Cls, string> = { ok: "border-success bg-success-soft text-success", mid: "border-warning bg-warning-soft text-warning", bad: "border-danger bg-danger-soft text-danger" };
const INK: Record<Cls, string> = { ok: "text-success", mid: "text-ink-soft", bad: "text-danger" };

export function Verdict({ cls, children }: { cls: Cls; children: React.ReactNode }) {
  return <div className={`body-5 rounded-xl border p-3 font-semibold ${VERDICT[cls]}`}>{children}</div>;
}

/** The report is laid out for paper too: this hides the site's header, footer and the page's controls when printing. */
export function PrintRules() {
  return (
    <style>{`@media print{body>*:not(main) , header, footer, nav, .no-print{display:none!important} body{background:#fff!important} main{padding:0!important}}`}</style>
  );
}

// ─── The phaladesh card ─────────────────────────────────────────────────────

const VIDHI: Record<string, Bi> = {
  vimshottari_kp: ["KP Vimshottari joint periods + ruling planets + Sun transit", "KP विंशोत्तरी संयुक्त दशा + शासक ग्रह + सूर्य गोचर"],
  varshank_masank: ["Personal year (9-year cycle) and personal month", "वर्षांक (9-वर्षीय चक्र) एवं मासांक"],
  golden_dawn_book_t: ["Golden Dawn decan / sign of the cards", "कार्डों के गोल्डन डॉन दशांश / राशि-संबंध"],
  benham_rekha_aayu: ["Age scale on the line (Benham), ±2–3 years", "रेखा-आयु-माप (बेनहम), ±2–3 वर्ष"],
};

type Reason = { text: Bi; effect: number; shastra?: { granth: Bi; sandarbh: string | Bi | null; pramaan_star: string } | null };
// The phal object the engines build (see phalEngine.ts); every text in it is an [en, hi] pair.
export type Phal = {
  topic?: Bi;
  blocked?: Bi | null;
  phal: string;
  anirnit_reason?: Bi | null;
  pravritti?: boolean;
  bal: string;
  alt?: Bi | null;
  kaal_khand?: { from: string; to?: string; sabse_sambhavit: string; vidhi: string; aadhar: Bi; now?: boolean } | null;
  kaal_khand_null?: Bi | null;
  kaal_khand_ab?: { now: boolean; from: string } | null;
  note?: Bi | null;
  reasons?: Reason[];
  kya_karen?: Bi[];
};

export function PhalCard({ p }: { p: Phal }) {
  const bi = makeBi(useLocale());
  const title = bi("Phaladesh", "फलादेश") + (p.topic ? ` — ${bi(p.topic)}` : "");
  if (p.blocked) {
    return (
      <Card title={title}>
        <Verdict cls="mid">{bi(p.blocked)}</Verdict>
      </Card>
    );
  }
  const k = p.kaal_khand;
  const words = (p.pravritti ? PRAVRITTI : PHAL)[p.phal as keyof typeof PHAL];
  const rows: [string, React.ReactNode][] = [[bi("Strength", "बल"), bi(BAL[p.bal as keyof typeof BAL])]];
  if (k) {
    rows.push([bi("Time window", "कालखंड"), ymText(bi, k.from) + (k.to && k.to !== k.from ? ` – ${ymText(bi, k.to)}` : "")]);
    if (typeof k.now === "boolean") {
      rows.push([bi("Right now", "अभी"), k.now ? bi("Favourable, running now", "अनुकूल, अभी चल रहा है") : bi("Not yet started", "अभी प्रारम्भ नहीं हुआ")]);
    }
    rows.push([bi("Most likely", "सबसे संभावित"), ymText(bi, k.sabse_sambhavit)], [bi("Method", "विधि"), bi(VIDHI[k.vidhi] ?? [k.vidhi, k.vidhi])]);
  }
  return (
    <Card title={title}>
      <div className="space-y-3">
        <Verdict cls={(PHAL_CLS[p.phal as keyof typeof PHAL_CLS] as Cls) ?? "mid"}>
          {bi(words)}
          {p.phal === "anirnit" && p.anirnit_reason ? `, ${bi("because", "क्योंकि")} ${bi(p.anirnit_reason)}` : ""}
        </Verdict>
        {p.alt && <p className="caption-2 text-ink-soft">{bi(p.alt)}</p>}
        <KV rows={rows} />
        <p className="caption-2 text-ink-soft">
          {k ? `${bi("Basis", "आधार")}: ${bi(k.aadhar)}` : `${bi("Time window", "कालखंड")}: ${p.kaal_khand_null ? bi(p.kaal_khand_null) : "—"}`}
        </p>
        {p.kaal_khand_ab && (
          <KV
            rows={[
              [
                bi("As of today", "आज की स्थिति"),
                p.kaal_khand_ab.now
                  ? bi("Favourable", "अनुकूल")
                  : bi("Not yet — next favourable window ", "अभी नहीं — अगला अनुकूल समय ") + ymText(bi, p.kaal_khand_ab.from),
              ],
            ]}
          />
        )}
        {p.note && <p className="body-6 rounded-xl bg-surface-sunken p-3 text-ink">{bi(p.note)}</p>}
        {!!p.reasons?.length && (
          <div>
            <h3 className="title-4 text-ink">{bi("Reasons (rule and source)", "कारण (तर्क एवं ग्रंथ)")}</h3>
            <ul className="mt-2 space-y-2">
              {p.reasons.map((r, i) => {
                const sh = r.shastra;
                const ref = sh ? (sh.sandarbh ? (typeof sh.sandarbh === "string" ? sh.sandarbh : bi(sh.sandarbh)) : bi("reference: verification pending", "संदर्भ: सत्यापन शेष")) : "";
                return (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      aria-label={r.effect > 0 ? bi("supports", "समर्थन") : r.effect < 0 ? bi("opposes", "विरोध") : bi("informs", "सूचना")}
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold text-ink-inverse ${
                        r.effect > 0 ? "bg-success" : r.effect < 0 ? "bg-danger" : "bg-neutral"
                      }`}
                    >
                      {r.effect > 0 ? "+" : r.effect < 0 ? "−" : "·"}
                    </span>
                    <span className="body-6 min-w-0 text-ink">
                      {bi(r.text)}
                      {sh && (
                        <span className="caption-3 block text-ink-muted">
                          {`${bi(sh.granth)}, ${ref} · ${bi(PRAMAAN[sh.pramaan_star as keyof typeof PRAMAAN] ?? [sh.pramaan_star, sh.pramaan_star])}`}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {!!p.kya_karen?.length && (
          <div>
            <h3 className="title-4 text-ink">{bi("What to do", "क्या करें")}</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {p.kya_karen.map((x, i) => (
                <li key={i} className="body-6 text-ink">
                  {bi(x)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Report blocks ──────────────────────────────────────────────────────────

const ValView = ({ v }: { v: Val }) => (typeof v === "string" ? <>{v}</> : <span className={`font-semibold ${INK[v.cls]}`}>{v.pill}</span>);
const Tile = ({ top, val, total }: { top: string; val: string | number; total?: boolean }) => (
  <span className={`inline-flex min-w-8 flex-col items-center rounded-lg border bg-surface-card px-1.5 py-0.5 ${total ? "border-brand" : "border-line"}`}>
    <span className="body-5 font-semibold text-ink">{top}</span>
    <span className="caption-3 font-semibold text-brand-strong">{val}</span>
  </span>
);

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "nums":
      return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {b.items.map((x) => (
            <div key={x.label} className={`rounded-xl border p-3 text-center ${x.key ? "border-brand bg-surface-sunken" : "border-line bg-surface-card"}`}>
              <p className="caption-2 font-semibold text-ink">{x.label}</p>
              <p className="heading-4 text-ink">{x.n}</p>
              <p className="caption-3 text-ink-muted">{x.sub}</p>
            </div>
          ))}
        </div>
      );
    case "kv":
      return <KV rows={b.rows.map(([k, v]) => [k, <ValView key={k} v={v} />])} />;
    case "h3":
      return <h3 className="title-4 mt-2 text-ink">{b.text}</h3>;
    case "p":
      return <p className="body-6 text-ink">{b.text}</p>;
    case "hint":
      return <p className="caption-2 text-ink-soft">{b.text}</p>;
    case "note":
      return <p className="body-6 rounded-xl bg-surface-sunken p-3 text-ink-soft">{b.text}</p>;
    case "letters":
      return (
        <div className="space-y-2">
          {b.words.map((w, i) => (
            <div key={i} className="flex flex-wrap gap-1">
              {w.letters.map(([ch, v], j) => (
                <Tile key={j} top={ch} val={v} />
              ))}
              {!!w.total && <Tile top="=" val={w.total} total />}
            </div>
          ))}
        </div>
      );
    case "verdict":
      return (
        <Verdict cls={b.cls}>
          {b.title}
          {b.body && <span className="body-6 block font-normal">{b.body}</span>}
          {b.list?.map((x, i) => (
            <span key={i} className="body-6 block font-normal">
              • {x}
            </span>
          ))}
        </Verdict>
      );
    case "loshu":
      return (
        <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-1.5">
          {b.cells.map((x, i) => (
            <div
              key={i}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg border-2 p-1 text-center ${x.empty ? "border-danger bg-danger-soft" : "border-line bg-surface-card"}`}
            >
              <span className="title-2 min-h-6 tracking-widest text-ink">{x.text}</span>
              <span className={`caption-3 ${x.empty ? "text-danger" : "text-ink-muted"}`}>{x.sub}</span>
            </div>
          ))}
        </div>
      );
    case "rows":
      return (
        <ul className="divide-y divide-line">
          {b.rows.map((x, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0">
                <span className="body-5 block font-semibold text-ink">{x.main}</span>
                {x.sub && <span className="caption-2 block text-ink-soft">{x.sub}</span>}
              </span>
              {x.right && (
                <span className="body-5 shrink-0 text-ink">
                  <ValView v={x.right} />
                </span>
              )}
            </li>
          ))}
        </ul>
      );
    case "list":
      return (
        <ul className="list-disc space-y-1 pl-5">
          {b.items.map((x, i) => (
            <li key={i} className="body-6 text-ink">
              {x}
            </li>
          ))}
        </ul>
      );
  }
}

export function Sections({ sections }: { sections: Sec[] }) {
  return (
    <>
      {sections.map((sec, i) => (
        <Card key={i} title={sec.title}>
          <div className="space-y-3">
            {sec.blocks.map((b, j) => (
              <BlockView key={j} b={b} />
            ))}
          </div>
        </Card>
      ))}
    </>
  );
}

// ─── Saved results ──────────────────────────────────────────────────────────

const savedText = defineMessages({
  hi: {
    title: "सहेजे गए परिणाम",
    empty: "अभी कोई सहेजा हुआ परिणाम नहीं है। हर गणना अपने आप यहाँ जुड़ जाती है।",
    loadError: "सहेजे गए परिणाम नहीं खुल सके।",
    openError: "यह परिणाम नहीं खुल सका।",
    deleteError: "हटाया नहीं जा सका।",
    open: "खोलें",
    delete: "हटाएँ",
    confirm: "पक्का हटाएँ?",
    cancel: "रहने दें",
    more: "और दिखाएँ",
    untitled: "बिना शीर्षक",
  },
  en: {
    title: "Saved results",
    empty: "Nothing saved yet. Every calculation is added here automatically.",
    loadError: "Could not load the saved results.",
    openError: "Could not open this result.",
    deleteError: "Could not delete it.",
    open: "Open",
    delete: "Delete",
    confirm: "Delete for good?",
    cancel: "Keep it",
    more: "Show more",
    untitled: "Untitled",
  },
});

/** A tool's saved results (newest first): open one, or delete it. `reloadKey` changes after a new result is saved. */
export function SavedList({ tool, reloadKey, onOpen }: { tool: SavedTool; reloadKey: number; onOpen: (saved: SavedResult) => void }) {
  const t = useT(savedText);
  const locale = useLocale();
  const [rows, setRows] = useState<SavedSummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState("");
  const [confirming, setConfirming] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(
    async (offset: number) => {
      try {
        const page = await listToolResults(tool, offset);
        setRows((prev) => (offset ? [...prev, ...page.results] : page.results));
        setHasMore(!!page.hasMore);
        setState("ready");
      } catch {
        setState("error");
      }
    },
    [tool],
  );
  useEffect(() => {
    // Loading starts from an effect: the state it sets is the answer of a request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(0);
  }, [load, reloadKey]);

  async function open(id: string) {
    setBusy(id);
    setMessage("");
    try {
      onOpen(await getToolResult(id));
    } catch {
      setMessage(t.openError);
    } finally {
      setBusy("");
    }
  }
  async function remove(id: string) {
    setBusy(id);
    setMessage("");
    try {
      await deleteToolResult(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setConfirming("");
    } catch {
      setMessage(t.deleteError);
    } finally {
      setBusy("");
    }
  }

  return (
    <Card title={t.title}>
      {state === "loading" && (
        <div aria-hidden className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}
      {state === "error" && <ErrorBox message={t.loadError} onRetry={() => { setState("loading"); void load(0); }} />}
      {state === "ready" && rows.length === 0 && <p className="body-6 text-ink-soft">{t.empty}</p>}
      {message && (
        <p role="alert" className="body-6 mb-2 text-danger">
          {message}
        </p>
      )}
      {state === "ready" && rows.length > 0 && (
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="min-w-0">
                <span className="body-5 block truncate font-semibold text-ink" lang={/[ऀ-ॿ]/.test(r.title) ? "hi" : undefined}>
                  {r.title || t.untitled}
                </span>
                <span className="caption-3 block text-ink-muted">{new Date(r.createdAt).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN")}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {confirming === r.id ? (
                  <>
                    <span className="caption-2 text-ink-soft">{t.confirm}</span>
                    <button type="button" className={btnSmall} disabled={busy === r.id} onClick={() => remove(r.id)}>
                      {t.delete}
                    </button>
                    <button type="button" className={btnSmall} onClick={() => setConfirming("")}>
                      {t.cancel}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className={btnSmall} disabled={!!busy} onClick={() => open(r.id)}>
                      {busy === r.id ? <PiArrowClockwise className="h-4 w-4 animate-spin" aria-hidden /> : t.open}
                    </button>
                    <button type="button" className={btnSmall} aria-label={t.delete} onClick={() => setConfirming(r.id)}>
                      <PiTrash className="h-4 w-4" aria-hidden />
                    </button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {hasMore && (
        <button type="button" className={`${btnSmall} mt-3`} onClick={() => load(rows.length)}>
          {t.more}
        </button>
      )}
    </Card>
  );
}
