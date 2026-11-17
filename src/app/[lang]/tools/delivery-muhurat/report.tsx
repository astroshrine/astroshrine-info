"use client";

import { useEffect, useState } from "react";
import { PiPrinter } from "react-icons/pi";
import { api } from "@/lib/api";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { grahaName } from "@/lib/jyotish";
import { fill } from "@/lib/services/toolsBCommon";
import { REPORT_SECTIONS, generateDmReport, getDmReport, type DmReport, type Lang, type ReportJson } from "@/lib/services/toolsBDelivery";
import { Card, Skeleton, btnPrimary, btnSecondary, btnSmall } from "../../kundli/_components/ui";
import { KindBanner } from "./chart";
import { Pills } from "./fields";
import { pickBi } from "./logic";
import { dmText } from "./messages";

const POLL_MS = 3000;

/** Step 06: write the newborn kundli report (Hindi or English), read it, print it. */
export default function ReportStep({ requestId, reportId, lang, onError }: { requestId: string; reportId: string; lang: Lang; onError: (e: unknown) => void }) {
  const t = useT(dmText);
  const [rlang, setRlang] = useState<Lang>(lang);
  const [rep, setRep] = useState<DmReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [kick, setKick] = useState(0);
  const [busy, setBusy] = useState<"" | "generate" | "print">("");

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = async () => {
      try {
        const r = await getDmReport(reportId, rlang);
        if (!alive) return;
        setRep(r);
        setLoading(false);
        if (r.status === "generating") timer = setTimeout(run, POLL_MS);
      } catch (e) {
        if (!alive) return;
        setLoading(false);
        onError(e);
      }
    };
    void run();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [reportId, rlang, kick, onError]);

  async function generate() {
    if (busy) return;
    setBusy("generate");
    try {
      const res = await generateDmReport(requestId, rlang);
      if (res?.status === "generating") setRep((r) => (r ? { ...r, status: "generating", report: null } : r));
      setKick((n) => n + 1);
    } catch (e) {
      onError(e);
    } finally {
      setBusy("");
    }
  }

  // The 28 page report as HTML, fetched with the account's token and opened in a tab to print or save as PDF.
  async function print() {
    if (busy) return;
    setBusy("print");
    try {
      const html = await api<string>(`/v1/delivery-muhurat/reports/${encodeURIComponent(reportId)}/html?lang=${rlang}`);
      const url = URL.createObjectURL(new Blob([typeof html === "string" ? html : String(html)], { type: "text/html" }));
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      onError(e);
    } finally {
      setBusy("");
    }
  }

  const ready = rep?.status === "ready" && rep.languagesReady?.includes(rlang) && !!rep.report;
  const canGenerate = !!rep && (rep.status === "chart_ready" || rep.status === "failed" || (rep.status === "ready" && !rep.languagesReady?.includes(rlang)));

  return (
    <div className="space-y-4">
      <h2 className="heading-6 text-ink">{t.reportTitle}</h2>
      {rep && <KindBanner kind={rep.kind} />}
      <div>
        <p className="title-4 mb-2 text-ink">{t.reportLanguage}</p>
        <Pills
          label={t.reportLanguage}
          value={rlang}
          options={[
            { value: "hi", label: "हिन्दी", lang: "hi" },
            { value: "en", label: "English" },
          ]}
          onChange={setRlang}
        />
      </div>

      {loading && <Skeleton className="h-24 w-full" />}
      {rep?.status === "generating" && (
        <div role="status" className="rounded-2xl border border-line bg-surface-sunken p-6 text-center">
          <p className="title-2 text-ink">{t.generating}</p>
          <p className="body-6 mt-1 text-ink-soft">{t.generatingHintWeb}</p>
        </div>
      )}
      {rep?.status === "in_review" && (
        <Card>
          <h3 className="title-3 text-ink">{t.inReview}</h3>
          <p className="body-6 mt-1 text-ink-soft">{t.inReviewHint}</p>
          <button type="button" className={`${btnSmall} mt-3`} onClick={() => setKick((n) => n + 1)}>
            {t.refresh}
          </button>
        </Card>
      )}
      {rep?.status === "failed" && <p role="alert" className="body-6 text-danger">{t.reportFailed}</p>}
      {canGenerate && (
        <button type="button" className={btnPrimary} onClick={() => void generate()} disabled={!!busy}>
          {t.generate}
        </button>
      )}

      {ready && rep?.report && (
        <>
          <button type="button" className={btnSecondary} onClick={() => void print()} disabled={!!busy}>
            <PiPrinter className="h-4 w-4" aria-hidden /> {t.printReport}
          </button>
          <Reader r={rep.report} lang={rlang} />
        </>
      )}
      <p className="caption-3 text-ink-muted">{pickBi(rep?.disclaimer, lang)}</p>
    </div>
  );
}

function Reader({ r, lang }: { r: ReportJson; lang: Lang }) {
  const t = useT(dmText);
  const locale = useLocale();
  // The report is written in its own language, whatever the page's.
  return (
    <div className="space-y-4" lang={lang}>
      <Card>
        <p className="caption-4 text-brand-strong">{r.title}</p>
        <dl className="mt-2 divide-y divide-line" lang={locale}>
          {(
            [
              [t.mother, r.parents?.mother || "-"],
              [t.birthTime, r.birth?.local?.replace("T", " ") ?? "-"],
              [t.hospital, r.birth?.place?.name ?? "-"],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="flex flex-wrap justify-between gap-2 py-2">
              <dt className="caption-1 text-ink-soft">{k}</dt>
              <dd className="body-5 min-w-0 text-right text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
      {r.houses?.map((h) => (
        <Card key={h.house}>
          <p className="caption-4 text-brand-strong">{fill(t.houseN, { n: h.house })}</p>
          <h3 className="heading-6 text-ink">{h.title}</h3>
          {h.paragraphs.map((p, i) => (
            <p key={i} className="body-5 mt-2 text-ink-soft">
              {p}
            </p>
          ))}
        </Card>
      ))}
      {REPORT_SECTIONS.map((k) =>
        r.sections?.[k]?.length ? (
          <Card key={k}>
            <h3 className="heading-6 text-ink">{t.section[k]}</h3>
            {r.sections[k].map((p, i) => (
              <p key={i} className="body-5 mt-2 text-ink-soft">
                {p}
              </p>
            ))}
            {k === "career" && r.careerDomains?.length > 0 && (
              <p className="caption-2 mt-2 text-ink-soft">
                {t.careerDomains}: {r.careerDomains.join(", ")}
              </p>
            )}
          </Card>
        ) : null,
      )}
      {r.dashaTimeline?.length > 0 && (
        <Card>
          <h3 className="heading-6 text-ink">{t.dashaTimeline}</h3>
          <ul className="mt-2 space-y-2">
            {r.dashaTimeline.map((d) => (
              <li key={`${d.lord}-${d.startMs}`}>
                <p className="title-4 text-ink">
                  {grahaName(d.lord, lang)} · {fill(t.ageRange, { from: Math.round(d.ageFrom * 10) / 10, to: Math.round(d.ageTo * 10) / 10 })}
                </p>
                {!!d.themes && <p className="body-6 text-ink-soft">{d.themes}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}
      {r.names && (
        <Card>
          <h3 className="heading-6 text-ink">{t.names}</h3>
          <p className="caption-2 mt-1 text-ink-soft">
            {t.syllables}: {r.names.syllables.map((x) => pickBi(x, lang)).join(", ")}
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {(["boy", "girl"] as const).map((g) => (
              <div key={g}>
                <p className="title-4 text-ink">{g === "boy" ? t.boyNames : t.girlNames}</p>
                <ul className="mt-1 space-y-1">
                  {r.names[g].map((n) => (
                    <li key={n.name} className="body-6 text-ink-soft">
                      {lang === "hi" ? n.nameHi : n.name} ({lang === "hi" ? n.name : <span lang="hi">{n.nameHi}</span>}): {lang === "hi" ? n.meaningHi : n.meaningEn}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}
      {!!r.disclaimer && <p className="caption-3 text-ink-muted">{r.disclaimer}</p>}
    </div>
  );
}
