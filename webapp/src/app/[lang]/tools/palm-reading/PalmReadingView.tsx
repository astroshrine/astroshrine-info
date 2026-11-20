"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import {
  SECTION_KEYS,
  deletePalmReading,
  generatePalmReading,
  getPalmReading,
  listPalmReadings,
  palmReadingPrintPath,
  type PalmReadingReport,
  type Polarity,
} from "@/lib/services/toolsPalmReading";
import { Card, ErrorBox, Notice, btnPrimary } from "../../kundli/_components/ui";
import {
  DeleteButton,
  Disclaimer,
  PrintButton,
  ReportError,
  ReportSkeleton,
  Section,
  TalentBody,
  YearAheadCard,
  useFailureText,
  useReport,
} from "../_reportkit/kit";
import ReportList, { type ListItem } from "../_reportkit/ReportList";
import { toolFailure } from "@/lib/services/tools";

const text = defineMessages({
  hi: {
    empty: "अभी तक कोई हस्त रेखा रीडिंग नहीं है।",
    appOnly:
      "नई हस्त रेखा रीडिंग AstroShrine ऐप में बनती है, क्योंकि दोनों हाथों का माप फ़ोन के कैमरे पर चलने वाले हाथ-पहचान मॉडल से होता है, जो वेबसाइट पर उपलब्ध नहीं है। ऐप में बनी रीडिंग यहाँ खोली, पूरी की, प्रिंट की और हटाई जा सकती हैं।",
    analysed: "दोनों हाथों का विश्लेषण हो चुका है, पर लिखित रीडिंग अभी तैयार नहीं है।",
    generate: "रीडिंग लिखें",
    generating: "लिखी जा रही है… (एक मिनट तक लग सकता है)",
    aiFailed: "लिखित रीडिंग अभी तैयार नहीं हो सकी। आप फिर कोशिश कर सकते हैं।",
    notReady: "अभी लिखित रीडिंग नहीं",
    sections: {
      mainLines: "मुख्य रेखाएँ",
      marriage: "विवाह व संतान रेखाएँ",
      travel: "यात्रा रेखाएँ",
      marks: "विशेष चिह्न",
      overall: "परिचय",
      handShape: "हाथ का आकार",
      heart: "हृदय रेखा",
      head: "मस्तिष्क रेखा",
      life: "जीवन रेखा",
      fate: "भाग्य रेखा",
      sun: "सूर्य रेखा",
      mercury: "बुध रेखा व पर्वत",
      fingers: "उँगलियों का विश्लेषण",
      thumb: "अँगूठे का विश्लेषण",
      mounts: "पर्वतों का विश्लेषण",
      comparison: "बायाँ बनाम दायाँ हाथ",
      strengths: "शुभ संकेत",
      attention: "सावधानियाँ व उपाय",
      ahead: "आगे का संकेत",
      closing: "अंतिम सार",
    },
    polarity: { good: "शुभ", bad: "ध्यान दें", mixed: "मिश्रित" },
    left: "बायाँ",
    right: "दायाँ",
    marksGood: "शुभ संकेत",
    marksAttention: "ध्यान देने योग्य",
    marksNone: "इन हाथों पर कोई विशेष चिह्न नहीं दिखा।",
    similar: "समानताएँ",
    different: "अंतर",
    talent: "प्रतिभा और व्यक्तित्व",
    generated: "रीडिंग",
  },
  en: {
    empty: "No palm readings yet.",
    appOnly:
      "New palm readings are made in the AstroShrine app: both hands are measured by a hand-detection model that runs on the phone camera, which the website cannot do. Readings made in the app can be opened, completed, printed and deleted here.",
    analysed: "The hands were analysed but the written reading is not ready yet.",
    generate: "Write the reading",
    generating: "Writing… (can take up to a minute)",
    aiFailed: "The written reading could not be prepared right now. You can try again.",
    notReady: "No written reading yet",
    sections: {
      mainLines: "Main lines",
      marriage: "Marriage and children lines",
      travel: "Travel lines",
      marks: "Special marks",
      overall: "Overview",
      handShape: "Hand shape",
      heart: "Heart line",
      head: "Head line",
      life: "Life line",
      fate: "Fate line",
      sun: "Sun / Apollo line",
      mercury: "Mercury line and mount",
      fingers: "Finger analysis",
      thumb: "Thumb analysis",
      mounts: "Mount analysis",
      comparison: "Left vs right comparison",
      strengths: "Positive signs",
      attention: "Cautions and remedies",
      ahead: "Looking ahead",
      closing: "Final summary",
    },
    polarity: { good: "Good", bad: "Attention", mixed: "Mixed" },
    left: "Left",
    right: "Right",
    marksGood: "Good signs",
    marksAttention: "Worth attention",
    marksNone: "No special marks were seen on these hands.",
    similar: "Similarities",
    different: "Differences",
    talent: "Talent and personality",
    generated: "Reading",
  },
});

const POLARITY_STYLE: Record<Polarity, string> = {
  good: "bg-success-soft text-success",
  bad: "bg-danger-soft text-danger",
  mixed: "bg-warning-soft text-warning",
};

async function fetchPage(offset: number, signal: AbortSignal) {
  const p = await listPalmReadings(offset, signal);
  return { hasMore: p.hasMore, reports: p.reports.map((r): ListItem => ({ id: r.id, name: r.name, createdAt: r.createdAt, note: r.status === "ready" ? undefined : "x" })) };
}

export default function PalmReadingView() {
  const id = useSearchParams().get("id");
  const t = useT(text);
  if (id) return <Reading key={id} id={id} />;
  return (
    <ReportList
      fetchPage={async (o, s) => {
        const p = await fetchPage(o, s);
        return { ...p, reports: p.reports.map((r) => ({ ...r, note: r.note ? t.notReady : undefined })) };
      }}
      href={(rid) => `/tools/palm-reading?id=${encodeURIComponent(rid)}`}
      remove={deletePalmReading}
      emptyText={t.empty}
      header={<Notice>{t.appOnly}</Notice>}
    />
  );
}

function Reading({ id }: { id: string }) {
  const { load, setData, reload } = useReport(id, getPalmReading);
  if (load.state === "loading") return <ReportSkeleton />;
  if (load.state === "error") return <ReportError failure={load.failure} backHref="/tools/palm-reading" onRetry={reload} />;
  return <Body report={load.data} onChange={setData} />;
}

function Body({ report, onChange }: { report: PalmReadingReport; onChange: (r: PalmReadingReport) => void }) {
  const t = useT(text);
  const fail = useFailureText();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lang = report.subject.language === "hi" ? "hi" : "en";
  const sections = report.sections;
  const marks = report.matches.filter((m) => m.section === "marks");
  const good = marks.filter((m) => m.polarity === "good");
  const attention = marks.filter((m) => m.polarity !== "good");

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      onChange(await generatePalmReading(report.id));
    } catch (e) {
      const k = toolFailure(e);
      setError(k === "failed" ? t.aiFailed : fail(k));
    } finally {
      setBusy(false);
    }
  }

  const markRow = (m: (typeof marks)[number], i: number) => (
    <li key={i} className="flex items-start gap-2">
      <span className={`caption-4 mt-0.5 shrink-0 rounded-full px-2 py-0.5 ${POLARITY_STYLE[m.polarity ?? "mixed"]}`}>{t.polarity[m.polarity ?? "mixed"]}</span>
      <span lang={lang} className="body-6 text-ink">
        {m.text}
      </span>
    </li>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p lang={/[ऀ-ॿ]/.test(report.subject.name) ? "hi" : undefined} className="title-2 text-ink">
          {report.subject.name}
        </p>
        <div className="flex flex-wrap items-start gap-2">
          {sections && <PrintButton path={palmReadingPrintPath(report.id)} />}
          <DeleteButton name={report.subject.name} onDelete={() => deletePalmReading(report.id)} onDone={() => router.push("/tools/palm-reading")} />
        </div>
      </div>

      {report.status !== "ready" && (
        <Card>
          <p className="body-5 text-ink">{t.analysed}</p>
          <button type="button" onClick={generate} disabled={busy} className={`${btnPrimary} mt-3`}>
            {busy ? t.generating : t.generate}
          </button>
          {error && (
            <div className="mt-3">
              <ErrorBox message={error} />
            </div>
          )}
        </Card>
      )}

      {sections &&
        SECTION_KEYS.filter((k) => sections[k]).map((k) => (
          <div key={k} className="space-y-4">
            <Section title={t.sections[k]}>
              <p lang={lang} className="body-6 whitespace-pre-line text-ink">
                {sections[k]}
              </p>
              {k === "marks" && (
                <>
                  {good.length > 0 && (
                    <div>
                      <p className="title-4 text-ink">{t.marksGood}</p>
                      <ul className="mt-1 space-y-1">{good.map(markRow)}</ul>
                    </div>
                  )}
                  {attention.length > 0 && (
                    <div>
                      <p className="title-4 text-ink">{t.marksAttention}</p>
                      <ul className="mt-1 space-y-1">{attention.map(markRow)}</ul>
                    </div>
                  )}
                  {!marks.length && <p className="caption-1 text-ink-soft">{t.marksNone}</p>}
                </>
              )}
              {k === "comparison" && report.comparison && (
                <>
                  {report.comparison.similarities.length > 0 && (
                    <div>
                      <p className="title-4 text-ink">{t.similar}</p>
                      <ul lang={lang} className="body-6 mt-1 list-disc pl-5 text-ink-soft">
                        {report.comparison.similarities.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.comparison.differences.length > 0 && (
                    <div>
                      <p className="title-4 text-ink">{t.different}</p>
                      <ul lang={lang} className="body-6 mt-1 list-disc pl-5 text-ink-soft">
                        {report.comparison.differences.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </Section>
            {k === "ahead" && <YearAheadCard yearAhead={sections.year_ahead} lang={lang} />}
          </div>
        ))}
      {sections && !sections.ahead && <YearAheadCard yearAhead={sections.year_ahead} lang={lang} />}
      {sections?.talent && (
        <>
          <h2 className="heading-6 pt-2 text-ink">{t.talent}</h2>
          <TalentBody scores={sections.talent.scores} content={{ ...sections.talent.narrative, patternSource: sections.talent.patternSource }} lang={lang} />
        </>
      )}
      <Disclaimer text={report.disclaimer} lang={lang} />
    </div>
  );
}
