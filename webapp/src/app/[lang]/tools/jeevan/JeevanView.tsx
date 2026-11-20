"use client";

import { useMemo, useRef, useState } from "react";
import { PiArrowLeft, PiPrinter, PiSpinnerGap } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { createJeevanReport, type JeevanReport } from "@/lib/services/toolsMansik";
import type { SavedResult } from "@/lib/services/tools";
import { Card, ErrorBox, Notice, btnPrimary, btnSecondary } from "../../kundli/_components/ui";
import BirthSection, { emptyBirth, toToolPlace, type Birth } from "../_components/BirthSection";
import SafetySupport from "../_components/SafetySupport";
import SavedResults from "../_components/SavedResults";
import YearAheadCard from "../_components/YearAheadCard";
import { useFailureText } from "../_components/failure";
import { COMMON, SENSITIVE_WARNING, TOPICS, hasDistress, pick, toQA, topicById, type Question, type Topic } from "./data";

const text = defineMessages({
  hi: {
    intro: "पारंपरिक ज्योतिष और आपके उत्तरों पर आधारित आत्म-चिंतन। हर परिणाम एक रुझान है, भविष्यवाणी नहीं, और असली कदम हमेशा पहले आता है।",
    pick: "विषय चुनें",
    sensitive: "संवेदनशील",
    back: "विषय बदलें",
    birth: "जन्म विवरण",
    questions: "प्रश्न (वैकल्पिक)",
    questionsHint: "कोई उत्तर न दें तो रिपोर्ट केवल कुंडली से बनेगी।",
    build: "रिपोर्ट बनाएँ",
    building: "रिपोर्ट बन रही है, इसमें एक मिनट तक लग सकता है…",
    missing: "नाम, जन्म तिथि और जन्म स्थान भरें।",
    disclaimer: "यह AI से बनी, पारंपरिक ज्योतिष पर आधारित रिपोर्ट है: मार्गदर्शन के लिए, चिकित्सा, कानूनी या वित्तीय सलाह का विकल्प नहीं।",
    steps: "पहले असली कदम",
    tendency: "आपके चार्ट का रुझान",
    period: "अभी का समय",
    answers: "आपके उत्तरों से",
    chart: "कुंडली से",
    upay: "सुकून के लिए पारंपरिक उपाय",
    print: "प्रिंट / PDF",
    newReport: "नई रिपोर्ट",
    typeHere: "यहाँ लिखें",
  },
  en: {
    intro: "A self-reflection based on traditional Jyotish and your answers. Every result is a tendency, never a prediction, and the real-world step always comes first.",
    pick: "Pick a topic",
    sensitive: "sensitive",
    back: "Change topic",
    birth: "Birth details",
    questions: "Questions (optional)",
    questionsHint: "With no answers the report is made from the chart alone.",
    build: "Build report",
    building: "Building the report, this can take up to a minute…",
    missing: "Enter the name, date of birth and place of birth.",
    disclaimer: "An AI-written report based on traditional Jyotish: for guidance, not a substitute for medical, legal or financial advice.",
    steps: "Real-world steps first",
    tendency: "Tendency in your chart",
    period: "The present period",
    answers: "From your answers",
    chart: "From the chart",
    upay: "Traditional practices for calm",
    print: "Print / PDF",
    newReport: "New report",
    typeHere: "Type here",
  },
});

type SavedInput = { subject?: { language?: "hinglish" | "english" } };

export default function JeevanView() {
  const t = useT(text);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [report, setReport] = useState<JeevanReport | null>(null);
  const [savedTick, setSavedTick] = useState(0);
  const top = useRef<HTMLDivElement>(null);

  function show(r: JeevanReport) {
    setReport(r);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="space-y-6">
      <Notice>{t.intro}</Notice>
      <SavedResults<JeevanReport, SavedInput> tool="jeevan_margdarshan" onOpen={(s: SavedResult<JeevanReport, SavedInput>) => show({ ...s.result, name: s.title })} refreshKey={savedTick} />
      <div ref={top} className="scroll-mt-24">
        {report && <ReportView report={report} onNew={() => { setReport(null); setTopic(null); }} />}
      </div>
      {!report && !topic && <Topics onPick={setTopic} />}
      {!report && topic && (
        <Intake
          topic={topic}
          onBack={() => setTopic(null)}
          onDone={(r) => {
            show(r);
            if (!r.safety) setSavedTick((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}

function Topics({ onPick }: { onPick: (t: Topic) => void }) {
  const t = useT(text);
  const hi = useLocale() === "hi";
  return (
    <section aria-labelledby="jv-topics">
      <h2 id="jv-topics" className="heading-6 text-ink">{t.pick}</h2>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((tp) => (
          <li key={tp.id}>
            <button
              type="button"
              onClick={() => onPick(tp.id)}
              className="flex h-full w-full items-center justify-between gap-2 rounded-2xl border border-line bg-surface-card p-4 text-left transition hover:border-line-strong hover:bg-surface-sunken active:scale-98"
            >
              <span className="title-4 text-ink">{pick(tp.name, hi)}</span>
              {tp.sensitive && <span className="caption-4 shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-brand-strong">{t.sensitive}</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Intake({ topic: topicId, onBack, onDone }: { topic: Topic; onBack: () => void; onDone: (r: JeevanReport) => void }) {
  const t = useT(text);
  const hi = useLocale() === "hi";
  const failureText = useFailureText();
  const topic = useMemo(() => topicById(topicId), [topicId]);
  const [birth, setBirth] = useState<Birth>(() => emptyBirth(hi));
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = Boolean(birth.name.trim() && birth.dob && birth.place);

  async function build() {
    if (!birth.place || busy) return;
    setError(null);
    if (Object.values(answers).some((v) => hasDistress(v))) {
      // Distress in a free-text answer: the support card, nothing is sent.
      onDone({ safety: true, topic: topic.id, output: null, createdAt: new Date().toISOString(), name: birth.name });
      return;
    }
    setBusy(true);
    try {
      const qa = toQA(topic, answers, birth.language);
      const report = await createJeevanReport({
        subject: { name: birth.name.trim(), dob: birth.dob, ...(birth.tob ? { tob: birth.tob } : {}), place: toToolPlace(birth.place), language: birth.language, tobCertain: Boolean(birth.tob) && answers.G2 === "Yes" },
        topic: topic.id,
        answers: qa,
      });
      onDone({ ...report, name: birth.name.trim(), ...(!qa.length && { kundliOnly: true }) });
    } catch (e) {
      setError(failureText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void build(); }} className="space-y-6">
      <div>
        <button type="button" onClick={onBack} className="caption-3 inline-flex items-center gap-1 text-ink-soft hover:text-ink">
          <PiArrowLeft className="h-4 w-4" aria-hidden /> {t.back}
        </button>
        <h2 className="heading-5 mt-2 text-ink">{pick(topic.name, hi)}</h2>
      </div>
      {topic.sensitive && <Notice tone="warning">{pick(topic.warning ?? SENSITIVE_WARNING, hi)}</Notice>}
      <Card title={t.birth}>
        <BirthSection value={birth} onChange={setBirth} idPrefix="jeevan" />
      </Card>
      <Card title={t.questions} description={t.questionsHint}>
        <div className="space-y-5">
          {[...COMMON, ...topic.questions].map((q) => (
            <QuestionRow key={q.id} q={q} hi={hi} value={answers[q.id]} onChange={(v) => setAnswers((p) => ({ ...p, [q.id]: v }))} placeholder={t.typeHere} />
          ))}
        </div>
      </Card>
      {error && <ErrorBox message={error} />}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!ready || busy} className={btnPrimary}>
          {busy && <PiSpinnerGap className="h-5 w-5 animate-spin" aria-hidden />} {t.build}
        </button>
        {!ready && !busy && <span className="caption-2 text-ink-soft">{t.missing}</span>}
        {busy && <span role="status" className="caption-2 text-ink-soft">{t.building}</span>}
      </div>
      <p className="caption-5 text-ink-muted">{t.disclaimer}</p>
    </form>
  );
}

function QuestionRow({ q, hi, value, onChange, placeholder }: { q: Question; hi: boolean; value?: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <p className="body-5 text-ink">{pick(q.text, hi)}</p>
      {q.options ? (
        <div role="radiogroup" aria-label={pick(q.text, hi)} className="mt-2 flex flex-wrap gap-2">
          {q.options.map((o) => {
            const on = value === o[0];
            return (
              <button
                key={o[0]}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange(o[0])}
                className={`caption-2 rounded-full border px-3 py-1 transition active:scale-98 ${on ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"}`}
              >
                {pick(o, hi)}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          aria-label={pick(q.text, hi)}
          value={value ?? ""}
          maxLength={300}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="body-3 mt-2 w-full rounded-xl border border-line-strong bg-surface-card px-3 py-2 text-ink placeholder:text-ink-muted hover:border-brand"
        />
      )}
    </div>
  );
}

function ReportView({ report, onNew }: { report: JeevanReport; onNew: () => void }) {
  const t = useT(text);
  const hi = useLocale() === "hi";
  if (report.safety || !report.output) {
    return (
      <div className="space-y-4">
        <SafetySupport />
        <button type="button" onClick={onNew} className={btnSecondary}>{t.newReport}</button>
      </div>
    );
  }
  const o = report.output;
  const title = pick(topicById(report.topic).name, hi);
  return (
    <article className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <h2 className="heading-5 text-ink">{report.name ? `${title}: ${report.name}` : title}</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.print()} className={btnSecondary}><PiPrinter className="h-5 w-5" aria-hidden /> {t.print}</button>
          <button type="button" onClick={onNew} className={btnSecondary}>{t.newReport}</button>
        </div>
      </div>
      {o.warning && <Notice tone="warning">{o.warning}</Notice>}
      <p className="body-4 text-ink">{o.namaskar}</p>
      <Card title={t.steps}>
        <ul className="body-5 list-disc space-y-1 pl-5 text-ink">{o.asli_kadam.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </Card>
      <Card title={t.tendency}><p className="body-5 whitespace-pre-line text-ink">{o.rujhaan}</p></Card>
      <Card title={t.period}><p className="body-5 whitespace-pre-line text-ink">{o.samay}</p></Card>
      <Card title={report.kundliOnly ? t.chart : t.answers}><p className="body-5 whitespace-pre-line text-ink">{o.jawabon_se}</p></Card>
      <YearAheadCard yearAhead={o.year_ahead} />
      <Card title={t.upay}>
        <ul className="body-5 list-disc space-y-1 pl-5 text-ink">{o.upay.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </Card>
      <p className="caption-5 text-ink-muted">{o.disclaimer}</p>
    </article>
  );
}
