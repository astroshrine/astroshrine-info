"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PiPrinter } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { api } from "@/lib/api";
import { getIntegratedReading, type Confidence, type IntegratedReading } from "@/lib/services/toolsBIntegrated";
import { toolErrorText } from "@/lib/services/toolsBCommon";
import { Card, ErrorBox, Notice, Skeleton, btnSecondary, btnSmall } from "../../../kundli/_components/ui";
import { Gate, ToolPage } from "../../_b/shell";
import { YEAR_AHEAD, irText } from "../text";

export default function ReportView() {
  const t = useT(irText);
  return (
    <ToolPage eyebrow={t.reportEyebrow} title={t.title}>
      <Gate what={t.what} astrologerOnly>
        <Report />
      </Gate>
    </ToolPage>
  );
}

const CONF_CLS: Record<Confidence, string> = { strong: "bg-success-soft text-success", medium: "bg-warning-soft text-warning", subtle: "bg-surface-sunken text-ink-soft" };

function Report() {
  const t = useT(irText);
  const locale = useLocale();
  const id = useSearchParams().get("id") ?? "";
  const [r, setR] = useState<IntegratedReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const c = new AbortController();
    getIntegratedReading(id, c.signal).then(setR, (e) => !c.signal.aborted && setError(toolErrorText(e, locale)));
    return () => c.abort();
  }, [id, attempt, locale]);

  /** The printable page the backend makes (the app prints the same HTML to PDF). Opened in a new tab to print or save. */
  async function print() {
    setPrinting(true);
    setError(null);
    try {
      const html = await api<string>(`/v1/integrated-reading/reports/${encodeURIComponent(id)}/pdf`);
      const url = URL.createObjectURL(new Blob([String(html)], { type: "text/html" }));
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError(t.printFailed);
    } finally {
      setPrinting(false);
    }
  }

  if (!id) return <Notice>{t.noReport}</Notice>;
  if (error && !r) return <ErrorBox message={error} onRetry={() => { setError(null); setAttempt((a) => a + 1); }} />;
  if (!r) {
    return (
      <div aria-hidden className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { output: o, titles } = r;
  const lang = r.subject.language;
  const ya = YEAR_AHEAD[lang];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="title-2 break-words text-ink">{r.subject.name}</p>
          <p className="caption-2 text-ink-soft">
            {t.reportLang}: {t.languages[lang]} · {new Date(r.createdAt).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <button type="button" className={btnSmall} disabled={printing} onClick={() => void print()}>
          <PiPrinter className="h-4 w-4" aria-hidden /> {printing ? t.printing : t.print}
        </button>
      </div>
      {error && <ErrorBox message={error} />}

      {/* The reading is written by the backend in the language chosen for the report, which may not be the page's. */}
      <div lang={lang} className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card title={titles.sections.intro}>
            <p className="body-5 whitespace-pre-line text-ink">{o.intro}</p>
          </Card>
          <h2 className="caption-4 text-brand-strong">{titles.sections.answers}</h2>
          {o.answers.map((a, i) =>
            a.flag === "distress" ? (
              <section key={i} className="rounded-2xl border border-warning bg-surface-card p-5">
                <h3 className="heading-6 text-ink">{`${i + 1}. ${a.question}`}</h3>
                <p className="body-5 mt-3 whitespace-pre-line text-ink">{a.conclusion}</p>
              </section>
            ) : (
              <Card key={i} title={`${i + 1}. ${a.question}`}>
                <span className={`caption-3 inline-block rounded-full px-3 py-1 ${CONF_CLS[a.confidence]}`}>{titles.confidence[a.confidence]}</span>
                <Field k={titles.fields.conclusion} v={a.conclusion} strong />
                <Field k={titles.fields.basis} v={a.basis} />
                {!!a.timing && <Field k={titles.fields.timing} v={a.timing} />}
                <Field k={titles.fields.suggestion} v={a.suggestion} />
                {!!a.remedy && <Field k={titles.fields.remedy} v={a.remedy} />}
              </Card>
            ),
          )}
          <Card title={titles.sections.summary}>
            <p className="body-5 whitespace-pre-line text-ink">{o.summary}</p>
          </Card>
        </div>
        <aside className="space-y-6 lg:col-span-2">
          {o.year_ahead && (
            <Card title={ya.title}>
              {!!o.year_ahead.impact && <p className="body-6 text-ink">{o.year_ahead.impact}</p>}
              <div className="mt-3 space-y-4">
                {o.year_ahead.quarters.map((q, i) => (
                  <div key={i}>
                    <p className="title-4 text-ink">{q.period}</p>
                    <Bullets label={ya.good} items={q.good} tone="text-success" />
                    <Bullets label={ya.challenges} items={q.challenges} tone="text-warning" />
                    {!q.good.length && !q.challenges.length && <p className="caption-2 text-ink-soft">{ya.steady}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card title={titles.sections.remedies}>
            <ul className="body-6 list-disc space-y-1 pl-5 text-ink">
              {o.remedies.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </Card>
          <Card title={titles.sections.closing}>
            <p className="body-6 whitespace-pre-line text-ink">{o.closing}</p>
          </Card>
        </aside>
      </div>

      <div className="space-y-1 border-t border-line pt-4">
        <p className="caption-2 text-ink-soft">
          {t.sourcesUsed}: <span lang={lang}>{[...r.sourcesUsed.map((d) => titles.disciplines[d])].join(", ") || "—"}</span>
        </p>
        {r.sourcesMissing.length > 0 && (
          <p className="caption-2 text-ink-soft">
            {t.sourcesMissing}: <span lang={lang}>{r.sourcesMissing.map((d) => titles.disciplines[d]).join(", ")}</span>
          </p>
        )}
        <p lang={lang} className="caption-2 text-ink-muted">{r.disclaimer}</p>
      </div>
      <Link href="/tools/integrated-reading" className={btnSecondary}>{t.back}</Link>
    </div>
  );
}

function Field({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <p className={`body-6 mt-3 whitespace-pre-line text-ink ${strong ? "font-semibold" : ""}`}>
      <span className="title-4">{k}: </span>
      {v}
    </p>
  );
}

function Bullets({ label, items, tone }: { label: string; items: string[]; tone: string }) {
  if (!items.length) return null;
  return (
    <>
      <p className={`caption-3 mt-2 ${tone}`}>{label}</p>
      <ul className="body-6 list-disc space-y-1 pl-5 text-ink">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </>
  );
}
