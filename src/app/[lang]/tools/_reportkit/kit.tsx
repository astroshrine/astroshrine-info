"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PiPrinter, PiTrash } from "react-icons/pi";
import Dialog from "@/components/consult/Dialog";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import type { ToolFailure } from "@/lib/services/tools";
import { openPrintable, toolFailure } from "@/lib/services/tools";
import { hasFingerprintSections, type PalmContent, type PalmScores, type YearAhead } from "@/lib/services/toolsPalmTalent";
import type { TextBlock } from "@/lib/services/toolsDmit";
import { Card, ErrorBox, Skeleton, btnPrimary, btnSecondary, btnSmall } from "../../kundli/_components/ui";
import { LABELS, labelOf } from "./labels";

const text = defineMessages({
  hi: {
    notAllowed: "यह टूल आपके खाते के लिए उपलब्ध नहीं है।",
    insufficientBalance: "वॉलेट में पर्याप्त पॉइंट नहीं हैं।",
    rateLimited: "बहुत अधिक अनुरोध। कृपया थोड़ी देर बाद फिर कोशिश करें।",
    disabled: "यह टूल अभी आपके खाते के लिए चालू नहीं है।",
    tooLarge: "फ़ाइल बहुत बड़ी है।",
    failed: "लोड नहीं हो सका। कृपया फिर से कोशिश करें।",
    print: "प्रिंट / PDF",
    printing: "खुल रहा है…",
    printFailed: "रिपोर्ट प्रिंट के लिए तैयार नहीं हो सकी।",
    delete: "हटाएँ",
    deleteTitle: "रिपोर्ट हटाएँ?",
    deleteBody: (name: string) => `${name} की रिपोर्ट हटाएँ? इसे वापस नहीं लाया जा सकता।`,
    cancel: "रद्द करें",
    deleteFailed: "रिपोर्ट हटाई नहीं जा सकी।",
    disclaimer: "अस्वीकरण",
    strengths: "विशेषताएँ",
    watchOuts: "संतुलन व विकास",
    waysToDevelop: "विकसित करने के तरीके",
    careerInterests: "करियर रुचियाँ",
    studyTips: "अध्ययन सुझाव",
    tips: "सुझाव",
    yearTitle: "आने वाला वर्ष (अगले 12 महीने)",
    yearGood: "अनुकूल",
    yearCare: "सावधानी रखें",
    yearSteady: "स्थिर समय।",
    personality: "व्यक्तित्व",
    patternsFrom: "अंगुली पैटर्न स्रोत",
    fingertipPhoto: "अंगुली क्लोज़-अप फोटो",
    needsFingertipScans:
      "शामिल नहीं: व्यक्तित्व प्रकार, IQ/EQ कोशंट, सीखने की शैली, ग्रहण विधियाँ और बायाँ/दायाँ मस्तिष्क के लिए असली अंगुली-छाप स्कैन चाहिए, जो हथेली की फोटो से नहीं मिल सकते। इनके लिए DMIT टूल का उपयोग करें।",
    acquiringMethods: "ग्रहण करने की विधियाँ",
    fingerStrength: "दस-अंगुली क्षमता",
    multipleIntelligence: "बहु-बुद्धि",
    quotients: "कोशंट",
    learningStyle: "सीखने की शैली",
    careerDomains: "करियर क्षेत्र",
    activities: "गतिविधियाँ",
    summary: "समग्र सारांश",
    lookingAhead: "आगे का संकेत",
    fingerCol: "उंगली",
    pattern: "पैटर्न",
    bandCol: "स्तर",
    back: "वापस",
    newer: "और रिपोर्टें दिखाएँ",
    loading: "लोड हो रहा है",
  },
  en: {
    notAllowed: "This tool is not available for your account.",
    insufficientBalance: "Your wallet does not have enough points.",
    rateLimited: "Too many requests. Please try again in a little while.",
    disabled: "This tool is not turned on for your account yet.",
    tooLarge: "The file is too large.",
    failed: "Could not load this. Please try again.",
    print: "Print / PDF",
    printing: "Opening…",
    printFailed: "Could not prepare the report for printing.",
    delete: "Delete",
    deleteTitle: "Delete this report?",
    deleteBody: (name: string) => `Delete ${name}'s report? This cannot be undone.`,
    cancel: "Cancel",
    deleteFailed: "Could not delete the report.",
    disclaimer: "Disclaimer",
    strengths: "Strengths",
    watchOuts: "Balance and growth",
    waysToDevelop: "Ways to develop",
    careerInterests: "Career interests",
    studyTips: "Study tips",
    tips: "Tips",
    yearTitle: "The year ahead (next 12 months)",
    yearGood: "Favourable",
    yearCare: "Handle with care",
    yearSteady: "A steady period.",
    personality: "Personality",
    patternsFrom: "Finger patterns from",
    fingertipPhoto: "fingertip close-up photos",
    needsFingertipScans:
      "Not included: personality type, IQ/EQ quotients, learning style, acquiring methods and left/right brain need real fingertip (fingerprint) scans, which a palm photo cannot provide. Use the DMIT tool for those.",
    acquiringMethods: "Acquiring methods",
    fingerStrength: "Ten-finger strength",
    multipleIntelligence: "Multiple intelligence",
    quotients: "Quotients",
    learningStyle: "Learning style",
    careerDomains: "Career domains",
    activities: "Activities",
    summary: "Overall summary",
    lookingAhead: "Looking ahead",
    fingerCol: "Finger",
    pattern: "Pattern",
    bandCol: "Band",
    back: "Back",
    newer: "Show more reports",
    loading: "Loading",
  },
});

export function useKitText() {
  return useT(text);
}

export function useFailureText() {
  const t = useT(text);
  return (e: unknown | ToolFailure) => t[(typeof e === "string" ? e : toolFailure(e)) as ToolFailure];
}

/** The language a report's own text is written in: marks it on the page so Hindi on /en keeps the Hindi font. */
export type ContentLang = "hi" | "en";

// ─── Loading state for one report ───────────────────────────────────────────

export type Load<T> = { state: "loading" } | { state: "error"; failure: ToolFailure } | { state: "ready"; data: T };

/** Loads one report by id; `reload` fetches again. */
export function useReport<T>(id: string, fetcher: (id: string, signal: AbortSignal) => Promise<T>) {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<{ id: string; tick: number; load: Load<T> } | null>(null);
  useEffect(() => {
    const c = new AbortController();
    fetcher(id, c.signal).then(
      (data) => setResult({ id, tick, load: { state: "ready", data } }),
      (e) => !c.signal.aborted && setResult({ id, tick, load: { state: "error", failure: toolFailure(e) } }),
    );
    return () => c.abort();
    // The fetcher is a module-level function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tick]);
  const load: Load<T> = result && result.id === id && result.tick === tick ? result.load : { state: "loading" };
  return { load, setData: (data: T) => setResult({ id, tick, load: { state: "ready", data } }), reload: () => setTick((n) => n + 1) };
}

export function ReportSkeleton() {
  return (
    <div aria-hidden className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-line bg-surface-card p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

/** Failure box with a way back to the list. */
export function ReportError({ failure, backHref, onRetry }: { failure: ToolFailure; backHref: string; onRetry: () => void }) {
  const t = useKitText();
  const fail = useFailureText();
  return (
    <div className="space-y-4">
      <ErrorBox message={fail(failure)} onRetry={failure === "failed" || failure === "rateLimited" ? onRetry : undefined} />
      <Link href={backHref} className={btnSecondary}>
        {t.back}
      </Link>
    </div>
  );
}

/** Print / save as PDF: the backend's printable HTML opens in a new tab. */
export function PrintButton({ path }: { path: string }) {
  const t = useKitText();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={busy}
        className={btnSmall}
        onClick={async () => {
          setBusy(true);
          setFailed(false);
          try {
            await openPrintable(path);
          } catch {
            setFailed(true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <PiPrinter className="h-4 w-4" aria-hidden /> {busy ? t.printing : t.print}
      </button>
      {failed && (
        <span role="alert" className="caption-3 text-danger">
          {t.printFailed}
        </span>
      )}
    </span>
  );
}

/** A delete button with a confirmation dialog. `onDelete` rejects on failure. */
export function DeleteButton({ name, onDelete, onDone }: { name: string; onDelete: () => Promise<unknown>; onDone: () => void }) {
  const t = useKitText();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFailed(false);
          setOpen(true);
        }}
        className={btnSmall}
        aria-label={`${t.delete}: ${name}`}
      >
        <PiTrash className="h-4 w-4" aria-hidden /> {t.delete}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t.deleteTitle}>
        <p className="body-5 text-ink" lang={/[ऀ-ॿ]/.test(name) ? "hi" : undefined}>
          {t.deleteBody(name)}
        </p>
        {failed && (
          <p role="alert" className="body-6 mt-2 text-danger">
            {t.deleteFailed}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={btnSecondary} onClick={() => setOpen(false)}>
            {t.cancel}
          </button>
          <button
            type="button"
            disabled={busy}
            className={btnPrimary}
            onClick={async () => {
              setBusy(true);
              setFailed(false);
              try {
                await onDelete();
                setOpen(false);
                onDone();
              } catch {
                setFailed(true);
              } finally {
                setBusy(false);
              }
            }}
          >
            {t.delete}
          </button>
        </div>
      </Dialog>
    </>
  );
}

// ─── Report building blocks ─────────────────────────────────────────────────

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card title={title}>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

/** Sorted label + bar + value rows. A missing or non-numeric value reads as 0. */
export function RankedBars({ data }: { data: Record<string, number>; lang?: ContentLang }) {
  const l = useT(LABELS);
  const rows = Object.entries(data)
    .map(([k, v]): [string, number] => [k, typeof v === "number" && Number.isFinite(v) ? v : 0])
    .sort((a, b) => b[1] - a[1]);
  const top = Math.max(100, ...rows.map(([, v]) => v));
  return (
    <ul className="space-y-2">
      {rows.map(([k, v]) => (
        <li key={k} className="grid grid-cols-[minmax(0,8rem)_1fr_3rem] items-center gap-3 sm:grid-cols-[12rem_1fr_3rem]">
          <span className="caption-1 truncate text-ink">{labelOf(l, k)}</span>
          <div
            role="meter"
            aria-label={labelOf(l, k)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(v)}
            className="h-2.5 overflow-hidden rounded-full bg-surface-sunken"
          >
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(100, (v / top) * 100))}%` }} />
          </div>
          <span className="caption-2 text-right text-ink-soft">{Number.isInteger(v) ? v : v.toFixed(1)}</span>
        </li>
      ))}
    </ul>
  );
}

function Bullets({ label, items, lang }: { label: string; items?: string[]; lang: ContentLang }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="title-4 text-ink">{label}</p>
      <ul lang={lang} className="body-6 mt-1 list-disc space-y-0.5 pl-5 text-ink-soft">
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

export function TextBlockView({ title, block, lang }: { title: string; block?: TextBlock; lang: ContentLang }) {
  const t = useKitText();
  if (!block) return null;
  return (
    <div className="rounded-xl bg-surface-sunken p-3">
      <h3 className="title-3 text-ink">{title}</h3>
      {block.description && (
        <p lang={lang} className="body-6 mt-1 text-ink">
          {block.description}
        </p>
      )}
      <div className="mt-2 space-y-2">
        <Bullets label="" items={block.traits} lang={lang} />
        <Bullets label={t.strengths} items={block.strengths} lang={lang} />
        <Bullets label={t.watchOuts} items={block.watchOuts} lang={lang} />
        <Bullets label={t.careerInterests} items={block.careerInterests} lang={lang} />
        <Bullets label={t.waysToDevelop} items={block.waysToDevelop} lang={lang} />
        <Bullets label={t.studyTips} items={block.studyTips} lang={lang} />
        {Array.isArray(block.tips) ? (
          <Bullets label={t.tips} items={block.tips} lang={lang} />
        ) : (
          block.tips && (
            <p lang={lang} className="body-6 text-ink-soft">
              <b>{t.tips}:</b> {block.tips}
            </p>
          )
        )}
      </div>
    </div>
  );
}

export function Disclaimer({ text: body, lang }: { text: string; lang?: ContentLang }) {
  const t = useKitText();
  return (
    <div className="border-t border-line pt-4">
      <p className="title-4 text-ink">{t.disclaimer}</p>
      <p lang={lang} className="caption-2 mt-1 text-ink-soft">
        {body}
      </p>
    </div>
  );
}

export function YearAheadCard({ yearAhead, lang }: { yearAhead?: YearAhead | null; lang: ContentLang }) {
  const t = useKitText();
  if (!yearAhead) return null;
  return (
    <Section title={t.yearTitle}>
      {yearAhead.impact && (
        <p lang={lang} className="body-6 text-ink">
          {yearAhead.impact}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {yearAhead.quarters.map((q, i) => (
          <div key={i} className="rounded-xl bg-surface-sunken p-3">
            <h3 lang={lang} className="title-3 text-ink">
              {q.period}
            </h3>
            {q.good.length > 0 && (
              <>
                <p className="title-4 mt-2 text-success">{t.yearGood}</p>
                <ul lang={lang} className="body-6 list-disc pl-5 text-ink-soft">
                  {q.good.map((x, j) => (
                    <li key={j}>{x}</li>
                  ))}
                </ul>
              </>
            )}
            {q.challenges.length > 0 && (
              <>
                <p className="title-4 mt-2 text-warning">{t.yearCare}</p>
                <ul lang={lang} className="body-6 list-disc pl-5 text-ink-soft">
                  {q.challenges.map((x, j) => (
                    <li key={j}>{x}</li>
                  ))}
                </ul>
              </>
            )}
            {!q.good.length && !q.challenges.length && <p className="body-6 mt-1 text-ink-soft">{t.yearSteady}</p>}
          </div>
        ))}
      </div>
    </Section>
  );
}

function Labelled({ title, body, lang }: { title: string; body?: string; lang: ContentLang }) {
  return (
    <p lang={lang} className="body-6 text-ink">
      <b>{title}: </b>
      {body}
    </p>
  );
}

/** The talent sections of a palm report: personality, finger strength, intelligences, careers, summary, year ahead. */
export function TalentBody({ scores, content, lang }: { scores: PalmScores; content: Pick<PalmContent, "patternSource"> & Omit<PalmContent, "patternSource" | "personality"> & { personality: string }; lang: ContentLang }) {
  const t = useKitText();
  const l = useT(LABELS);
  const locale = useLocale();
  void locale;
  const fp = hasFingerprintSections(scores, content);
  const topMi = Object.entries(scores.multipleIntelligence).sort((a, b) => b[1] - a[1]);
  const keys = (r?: Record<string, string>) => Object.entries(r ?? {});
  return (
    <>
      <Section title={t.personality}>
        {fp && (
          <p className="caption-2 text-ink-soft">
            {t.patternsFrom}: {t.fingertipPhoto}
          </p>
        )}
        <p lang={lang} className="body-6 text-ink">
          {content.personality}
        </p>
        {fp && scores.personality ? <RankedBars data={scores.personality.birds} /> : null}
        {!fp && <p className="caption-2 text-ink-soft">{t.needsFingertipScans}</p>}
      </Section>

      <Section title={t.fingerStrength}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-80 text-left">
            <thead>
              <tr className="caption-3 border-b border-line text-ink-soft">
                <th className="py-1 pr-2 font-medium">{t.fingerCol}</th>
                <th className="py-1 pr-2 font-medium">{t.pattern}</th>
                <th className="py-1 pr-2 font-medium">%</th>
                <th className="py-1 font-medium">{t.bandCol}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(scores.fingers).map(([k, f]) => (
                <tr key={k} className="body-6 border-b border-line/60 text-ink">
                  <td className="py-1 pr-2">{k}</td>
                  <td className="py-1 pr-2">{f.pattern ? (l.patternName[f.pattern] ?? f.pattern) : "-"}</td>
                  <td className="py-1 pr-2">{f.percent}</td>
                  <td className="py-1">{labelOf(l, f.band)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={t.multipleIntelligence}>
        <RankedBars data={scores.multipleIntelligence} />
        {topMi.map(([k]) => (
          <Labelled key={k} title={labelOf(l, k)} body={content.intelligence[k]} lang={lang} />
        ))}
      </Section>

      {fp && scores.quotients && (
        <Section title={t.quotients}>
          <RankedBars data={scores.quotients} />
          {keys(content.quotients).map(([k, v]) => (
            <Labelled key={k} title={labelOf(l, k)} body={v} lang={lang} />
          ))}
        </Section>
      )}
      {fp && scores.learningStyle && (
        <Section title={t.learningStyle}>
          <RankedBars data={scores.learningStyle} />
          {keys(content.learningStyle).map(([k, v]) => (
            <Labelled key={k} title={labelOf(l, k)} body={v} lang={lang} />
          ))}
        </Section>
      )}
      {fp && scores.learnerType && (
        <Section title={t.acquiringMethods}>
          <RankedBars data={scores.learnerType} />
          {keys(content.acquiringMethods).map(([k, v]) => (
            <Labelled key={k} title={labelOf(l, k)} body={v} lang={lang} />
          ))}
        </Section>
      )}

      <Section title={t.careerDomains}>
        <p lang={lang} className="body-6 text-ink">
          {content.careers}
        </p>
        <RankedBars data={scores.careerDomains} />
      </Section>
      <Section title={t.activities}>
        <p lang={lang} className="body-6 text-ink">
          {content.activities}
        </p>
        <RankedBars data={scores.activities} />
      </Section>
      <Section title={t.summary}>
        <p lang={lang} className="body-6 text-ink">
          {content.summary}
        </p>
      </Section>
      <YearAheadCard yearAhead={content.year_ahead} lang={lang} />
      {!content.year_ahead && content.lookingAhead && (
        <Section title={t.lookingAhead}>
          <p lang={lang} className="body-6 text-ink">
            {content.lookingAhead}
          </p>
        </Section>
      )}
    </>
  );
}
