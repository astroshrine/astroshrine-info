"use client";

import { useRef, useState } from "react";
import { PiSpinnerGap } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import type { SavedResult } from "@/lib/services/tools";
import { SIGNATURE_FEATURES, analyzeSignature, type SignatureAnalysis, type SignatureFeatureKey, type SignatureResult } from "@/lib/services/toolsSignature";
import { Card, ErrorBox, Notice, btnPrimary } from "../../kundli/_components/ui";
import Bars from "../_components/Bars";
import PhotoPicker from "../_components/PhotoPicker";
import SavedResults from "../_components/SavedResults";
import YearAheadCard from "../_components/YearAheadCard";
import { useFailureText } from "../_components/failure";

const text = defineMessages({
  hi: {
    hint: "केवल मनोरंजन और आत्म-चिंतन के लिए। एक हस्तलिखित हस्ताक्षर की साफ़ फ़ोटो चुनें: सफ़ेद कागज़, अच्छी रोशनी, केवल हस्ताक्षर।",
    photo: "हस्ताक्षर की फ़ोटो",
    analyze: "हस्ताक्षर पढ़ें",
    analyzing: "पढ़ा जा रहा है…",
    traits: "गुण",
    features: "विशेषताएं",
    summary: "सारांश",
    strengths: "विशेषताएं (सकारात्मक)",
    tip: "सुझाव",
    retake: "दोबारा फ़ोटो लें",
    trait: { confidence: "आत्मविश्वास", creativity: "रचनात्मकता", energy: "ऊर्जा" },
    feature: { size: "आकार", slant: "झुकाव", pressure: "दबाव", speed: "गति", complexity: "जटिलता", baseline: "आधार रेखा", underline: "अंडरलाइन", legibility: "सुवाच्यता" },
    chooseFirst: "पहले फ़ोटो चुनें।",
  },
  en: {
    hint: "For entertainment and self-reflection only. Choose a clear photo of one handwritten signature: white paper, good light, nothing else in the frame.",
    photo: "Photo of the signature",
    analyze: "Read signature",
    analyzing: "Reading…",
    traits: "Traits",
    features: "Features",
    summary: "Summary",
    strengths: "Strengths",
    tip: "Tip",
    retake: "Take the photo again",
    trait: { confidence: "Confidence", creativity: "Creativity", energy: "Energy" },
    feature: { size: "Size", slant: "Slant", pressure: "Pressure", speed: "Speed", complexity: "Complexity", baseline: "Baseline", underline: "Underline", legibility: "Legibility" },
    chooseFirst: "Choose a photo first.",
  },
});

export default function SignatureView() {
  const t = useT(text);
  const locale = useLocale();
  const failureText = useFailureText();
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SignatureResult | null>(null);
  const [savedTick, setSavedTick] = useState(0);
  const top = useRef<HTMLDivElement>(null);

  async function analyze() {
    if (!photo || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await analyzeSignature(photo, locale);
      setResult(r);
      if (r.valid) setSavedTick((n) => n + 1);
    } catch (e) {
      setError(failureText(e));
    } finally {
      setBusy(false);
    }
  }

  function openSaved(s: SavedResult<SignatureResult>) {
    setPhoto(null);
    setError(null);
    setResult(s.result);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const valid: SignatureAnalysis | null = result?.valid ? result : null;
  const invalid = result && !result.valid ? result : null;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-2">
        <Notice>{t.hint}</Notice>
        <Card>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void analyze();
            }}
          >
            <PhotoPicker label={t.photo} file={photo} onChange={(f) => { setPhoto(f); setResult(null); setError(null); }} required />
            {error && <ErrorBox message={error} />}
            <button type="submit" disabled={!photo || busy} className={btnPrimary}>
              {busy && <PiSpinnerGap className="h-5 w-5 animate-spin" aria-hidden />} {busy ? t.analyzing : t.analyze}
            </button>
            {!photo && <p className="caption-2 text-ink-soft">{t.chooseFirst}</p>}
          </form>
        </Card>
        <SavedResults<SignatureResult> tool="signature_analysis" onOpen={openSaved} refreshKey={savedTick} />
      </div>

      <div ref={top} className="scroll-mt-24 space-y-6 lg:col-span-3">
        {invalid && (
          <Card title={t.retake}>
            <p role="alert" className="body-4 text-danger">{invalid.reason}</p>
            <p className="body-5 mt-2 text-ink">{invalid.retake_tip}</p>
          </Card>
        )}
        {valid && (
          <>
            <Card title={t.traits}>
              <Bars rows={(Object.keys(valid.traits) as (keyof typeof valid.traits)[]).map((k) => ({ key: k, label: t.trait[k], value: valid.traits[k] }))} />
              <h3 className="title-3 mt-5 text-ink">{t.features}</h3>
              <div className="mt-3">
                <Bars rows={SIGNATURE_FEATURES.map((k: SignatureFeatureKey) => ({ key: k, label: t.feature[k], value: valid.features[k]?.score }))} />
              </div>
            </Card>
            <Card title={t.summary}>
              <p className="body-5 text-ink">{valid.summary}</p>
              <dl className="mt-4 space-y-3">
                {SIGNATURE_FEATURES.map((k) => {
                  const f = valid.features[k];
                  return (
                    <div key={k}>
                      <dt className="title-4 text-ink">{t.feature[k]} · {f.score} ({f.band})</dt>
                      <dd className="body-6 text-ink-soft">{f.observation}</dd>
                      <dd className="body-6 text-ink-soft">{f.meaning}</dd>
                    </div>
                  );
                })}
              </dl>
              {valid.strengths?.length > 0 && (
                <>
                  <h3 className="title-3 mt-5 text-ink">{t.strengths}</h3>
                  <ul className="body-5 mt-2 list-disc space-y-1 pl-5 text-ink">{valid.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </>
              )}
              <h3 className="title-3 mt-5 text-ink">{t.tip}</h3>
              <p className="body-5 mt-1 text-ink">{valid.tip}</p>
              <p className="caption-5 mt-4 text-ink-muted">{valid.disclaimer}</p>
            </Card>
            <YearAheadCard yearAhead={valid.year_ahead} />
          </>
        )}
      </div>
    </div>
  );
}
