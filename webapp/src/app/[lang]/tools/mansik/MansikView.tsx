"use client";

import { useMemo, useRef, useState } from "react";
import { PiPrinter, PiSpinnerGap } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { createMansikReport, type MansikReport } from "@/lib/services/toolsMansik";
import type { SavedResult } from "@/lib/services/tools";
import { Card, ErrorBox, Notice, btnPrimary, btnSecondary } from "../../kundli/_components/ui";
import BirthSection, { emptyBirth, toToolPlace, type Birth } from "../_components/BirthSection";
import SafetySupport from "../_components/SafetySupport";
import SavedResults from "../_components/SavedResults";
import YearAheadCard from "../_components/YearAheadCard";
import { useFailureText } from "../_components/failure";
import { CAT_NAME, CATS, EXTRA_TITLE, SCALE, isChildOn, pick, questionsFor, score, type QKind } from "./data";

const text = defineMessages({
  hi: {
    intro: "जन्म कुंडली से पारंपरिक ज्योतिष पर आधारित आत्म-चिंतन। यह कोई क्लिनिकल टेस्ट या निदान नहीं है।",
    birth: "जन्म विवरण",
    child: "18 से कम: बच्चे के व्यवहार वाले प्रश्न जोड़े गए हैं; अभिभावक उत्तर दें।",
    quest: "प्रश्नावली (वैकल्पिक)",
    questHint: "हर पंक्ति के लिए: पिछले दो सप्ताह में यह कितनी बार सच रहा? कोई उत्तर न दें तो रिपोर्ट केवल कुंडली से बनेगी।",
    clear: "उत्तर साफ़ करें",
    completeHint: "आगे बढ़ने के लिए सभी प्रश्नों के उत्तर दें, या उत्तर साफ़ करें।",
    build: "रिपोर्ट बनाएँ",
    building: "रिपोर्ट बन रही है, इसमें एक मिनट तक लग सकता है…",
    disclaimer: "यह AI से बनी, पारंपरिक ज्योतिष पर आधारित रिपोर्ट है: मार्गदर्शन के लिए, चिकित्सा या कानूनी सलाह का विकल्प नहीं।",
    reportFor: "रिपोर्ट",
    swabhaav: "आपका स्वभाव",
    samay: "अभी का समय",
    jawabon: "आपके जवाबों से",
    kundli: "कुंडली की प्रवृत्ति",
    upay: "सुकून के लिए पारंपरिक उपाय",
    print: "प्रिंट / PDF",
    newReport: "नई रिपोर्ट",
    missing: "नाम, जन्म तिथि और जन्म स्थान भरें।",
  },
  en: {
    intro: "A self-reflection from the birth chart, based on traditional Jyotish. Not a clinical test or a diagnosis.",
    birth: "Birth details",
    child: "Under 18: the child-behaviour questions are included; a parent should answer.",
    quest: "Questionnaire (optional)",
    questHint: "For each line, how often has it been true in the last two weeks? With no answers the report is made from the chart alone.",
    clear: "Clear answers",
    completeHint: "Answer every question, or clear the answers, to continue.",
    build: "Build report",
    building: "Building the report, this can take up to a minute…",
    disclaimer: "An AI-written report based on traditional Jyotish: for guidance, not a substitute for medical or legal advice.",
    reportFor: "Report",
    swabhaav: "Your nature",
    samay: "The present period",
    jawabon: "From your answers",
    kundli: "Tendencies in the chart",
    upay: "Traditional practices for calm",
    print: "Print / PDF",
    newReport: "New report",
    missing: "Enter the name, date of birth and place of birth.",
  },
});

/** The report headings follow the report's own language (Hinglish or English), as in the app. */
const HEADINGS = {
  hinglish: { swabhaav: "Aapka swabhaav", samay: "Abhi ka samay", jawabon: "Aapke jawabon se", kundli: "Kundli ki pravritti", upay: "Sukoon ke liye paramparik upay" },
  english: { swabhaav: "Your nature", samay: "The present period", jawabon: "From your answers", kundli: "Tendencies in the chart", upay: "Traditional practices for calm" },
};

type Shown = { report: MansikReport; language: "hinglish" | "english" };

export default function MansikView() {
  const t = useT(text);
  const hi = useLocale() === "hi";
  const failureText = useFailureText();
  const [birth, setBirth] = useState<Birth>(() => emptyBirth(hi));
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const [savedTick, setSavedTick] = useState(0);
  const top = useRef<HTMLDivElement>(null);

  const isChild = isChildOn(birth.dob);
  const qs = useMemo(() => questionsFor(isChild), [isChild]);
  const scored = useMemo(() => score(answers, isChild), [answers, isChild]);
  const groups = useMemo(() => {
    const by = (k: QKind[]) => qs.filter((q) => k.includes(q.cat));
    return [
      ...CATS.map((c) => ({ key: c, title: pick(CAT_NAME[c], hi), items: by([c]) })).filter((g) => g.items.length),
      { key: "extra", title: pick(EXTRA_TITLE, hi), items: by(["R", "E", "S"]) },
    ];
  }, [qs, hi]);
  const answered = Object.keys(answers).length > 0;
  const ready = Boolean(birth.name.trim() && birth.dob && birth.place) && (!answered || scored.complete);

  function show(s: Shown) {
    setShown(s);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function build() {
    if (!birth.place || busy) return;
    setError(null);
    if (scored.safety_triggered) {
      // Never a chart, never a server call: the support card only (the app's S1 rule).
      show({ report: { safety: true, output: null, applicable: [], createdAt: new Date().toISOString(), name: birth.name }, language: birth.language });
      return;
    }
    setBusy(true);
    try {
      const report = await createMansikReport({
        subject: { name: birth.name.trim(), dob: birth.dob, ...(birth.tob ? { tob: birth.tob } : {}), place: toToolPlace(birth.place), language: birth.language, isChild },
        scores: answered ? scored.scores : {},
        flag_only_triggered: scored.flag_only_triggered,
        safety_triggered: false,
      });
      show({ report: { ...report, name: birth.name.trim(), ...(!answered && { kundliOnly: true }) }, language: birth.language });
      setSavedTick((n) => n + 1);
    } catch (e) {
      setError(failureText(e));
    } finally {
      setBusy(false);
    }
  }

  function openSaved(s: SavedResult<MansikReport, { subject?: { language?: "hinglish" | "english" } }>) {
    show({ report: { ...s.result, name: s.title }, language: s.input?.subject?.language ?? "english" });
  }

  return (
    <div className="space-y-6">
      <Notice>{t.intro}</Notice>
      <SavedResults<MansikReport, { subject?: { language?: "hinglish" | "english" } }> tool="mansik_pravritti" onOpen={openSaved} refreshKey={savedTick} />

      <div ref={top} className="scroll-mt-24">
        {shown && <Report shown={shown} onNew={() => setShown(null)} />}
      </div>

      {!shown && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void build();
          }}
          className="space-y-6"
        >
          <Card title={t.birth}>
            <BirthSection value={birth} onChange={setBirth} idPrefix="mansik" />
            {isChild && <p className="body-6 mt-3 text-ink-soft">{t.child}</p>}
          </Card>

          <Card title={t.quest} description={t.questHint}>
            <details>
              <summary className="button-sm cursor-pointer text-brand-strong">{answered ? `${Object.keys(answers).length}/${qs.length}` : "…"}</summary>
              <div className="mt-4 space-y-6">
                {groups.map((g) => (
                  <fieldset key={g.key}>
                    <legend className="title-3 text-ink">{g.title}</legend>
                    <div className="mt-2 space-y-4">
                      {g.items.map((q) => (
                        <div key={q.id}>
                          <p className="body-5 text-ink">{pick(q.text, hi)}</p>
                          <div role="radiogroup" aria-label={pick(q.text, hi)} className="mt-2 flex flex-wrap gap-2">
                            {SCALE.map((label, v) => {
                              const on = answers[q.id] === v;
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  role="radio"
                                  aria-checked={on}
                                  onClick={() => setAnswers((p) => ({ ...p, [q.id]: v }))}
                                  className={`caption-2 rounded-full border px-3 py-1 transition active:scale-98 ${
                                    on ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"
                                  }`}
                                >
                                  {pick(label, hi)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </fieldset>
                ))}
                {answered && (
                  <button type="button" onClick={() => setAnswers({})} className={btnSecondary}>
                    {t.clear}
                  </button>
                )}
              </div>
            </details>
          </Card>

          {answered && !scored.complete && <Notice tone="warning">{t.completeHint}</Notice>}
          {error && <ErrorBox message={error} />}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={!ready || busy} className={btnPrimary}>
              {busy && <PiSpinnerGap className="h-5 w-5 animate-spin" aria-hidden />} {t.build}
            </button>
            {!ready && !busy && !answered && <span className="caption-2 text-ink-soft">{t.missing}</span>}
            {busy && <span role="status" className="caption-2 text-ink-soft">{t.building}</span>}
          </div>
          <p className="caption-5 text-ink-muted">{t.disclaimer}</p>
        </form>
      )}
    </div>
  );
}

function Report({ shown, onNew }: { shown: Shown; onNew: () => void }) {
  const t = useT(text);
  const { report, language } = shown;
  if (report.safety || !report.output) return <div className="space-y-4"><SafetySupport /><button type="button" onClick={onNew} className={btnSecondary}>{t.newReport}</button></div>;
  const o = report.output;
  const L = HEADINGS[language];
  return (
    <article className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <h2 className="heading-5 text-ink">{report.name ? `${t.reportFor}: ${report.name}` : t.reportFor}</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.print()} className={btnSecondary}><PiPrinter className="h-5 w-5" aria-hidden /> {t.print}</button>
          <button type="button" onClick={onNew} className={btnSecondary}>{t.newReport}</button>
        </div>
      </div>
      <p className="body-4 text-ink">{o.namaskar}</p>
      <Card title={L.swabhaav}><p className="body-5 whitespace-pre-line text-ink">{o.swabhaav}</p></Card>
      <Card title={L.samay}><p className="body-5 whitespace-pre-line text-ink">{o.samay}</p></Card>
      <Card title={report.kundliOnly ? L.kundli : L.jawabon}><p className="body-5 whitespace-pre-line text-ink">{o.jawabon_se}</p></Card>
      <YearAheadCard yearAhead={o.year_ahead} />
      <Card title={L.upay}>
        <ul className="body-5 list-disc space-y-1 pl-5 text-ink">{o.upay.map((u, i) => <li key={i}>{u}</li>)}</ul>
      </Card>
      {o.support && <Notice tone="warning">{o.support}</Notice>}
      <p className="caption-5 text-ink-muted">{o.disclaimer}</p>
    </article>
  );
}
