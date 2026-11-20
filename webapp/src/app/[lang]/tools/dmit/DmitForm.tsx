"use client";

import { useId, useState } from "react";
import { PiCheck } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import {
  CONSENT_TEXT_VERSION,
  FINGER_KEYS,
  PATTERNS,
  createDmitReport,
  type DmitCreateBody,
  type FingerInput,
  type FingerKey,
  type Pattern,
} from "@/lib/services/toolsDmit";
import { toolFailure, type ToolFailure } from "@/lib/services/tools";
import { ApiError } from "@/lib/api";
import { Card, ErrorBox, Notice, btnPrimary, inputCls, labelCls } from "../../kundli/_components/ui";
import { Choice, Field, ageOn, todayISO } from "../_components/forms";
import { LABELS } from "../_reportkit/labels";
import { useFailureText } from "../_reportkit/kit";

const text = defineMessages({
  hi: {
    subject: "विषय",
    name: "नाम",
    namePh: "पूरा नाम",
    dob: "जन्म तिथि",
    gender: "लिंग (वैकल्पिक)",
    male: "पुरुष",
    female: "स्त्री",
    other: "अन्य",
    language: "रिपोर्ट की भाषा",
    en: "अंग्रेज़ी",
    hi: "हिंदी",
    fingers: "उँगलियों के पैटर्न",
    fingersHint: "हर उँगली के लिए फिंगरप्रिंट का पैटर्न और रिज गणना (0 से 40) भरें। आर्च में रिज गणना हमेशा 0 होती है।",
    right: "दायाँ हाथ",
    left: "बायाँ हाथ",
    finger: (k: string) => `उँगली ${k}`,
    pattern: "पैटर्न",
    ridge: "रिज गणना",
    trc: "कुल रिज गणना (TRC)",
    atd: "ATD कोण",
    atdHint: "तर्जनी और कनिष्ठा के नीचे त्रिरेडियस और हथेली के केंद्र के बीच का कोण (डिग्री)। प्रत्येक हाथ के लिए 25 से 70।",
    atdLeft: "बायाँ हाथ ATD (°)",
    atdRight: "दायाँ हाथ ATD (°)",
    consent: "मैं पुष्टि करता/करती हूँ कि विषय (या उनके अभिभावक) ने केवल आत्म-चिंतन और मार्गदर्शन हेतु इस फिंगरप्रिंट पैटर्न विश्लेषण के लिए सहमति दी है।",
    guardian: "अभिभावक का नाम",
    guardianPh: "18 वर्ष से कम आयु होने पर आवश्यक",
    submit: "रिपोर्ट बनाएँ",
    submitting: "रिपोर्ट बन रही है…",
    archNote: "आर्च: 0",
    invalid: {
      name: "विषय का नाम दर्ज करें।",
      dateOfBirth: "मान्य जन्म तिथि दर्ज करें (भविष्य की नहीं)।",
      fingers: "सभी दस उँगलियों के लिए पैटर्न और रिज गणना (0 से 40) दर्ज करें।",
      atdLeft: "बायाँ ATD 25 से 70 डिग्री के बीच होना चाहिए।",
      atdRight: "दायाँ ATD 25 से 70 डिग्री के बीच होना चाहिए।",
      consent: "आगे बढ़ने के लिए सहमति आवश्यक है।",
      guardianName: "18 वर्ष से कम आयु होने पर अभिभावक का नाम आवश्यक है।",
    },
    choose: "चुनें",
    free: "रिपोर्ट बनाने में वॉलेट से कोई पॉइंट नहीं कटते।",
  },
  en: {
    subject: "Subject",
    name: "Name",
    namePh: "Full name",
    dob: "Date of birth",
    gender: "Gender (optional)",
    male: "Male",
    female: "Female",
    other: "Other",
    language: "Report language",
    en: "English",
    hi: "Hindi",
    fingers: "Fingerprint patterns",
    fingersHint: "For each finger, enter the fingerprint pattern and the ridge count (0 to 40). An arch always has a ridge count of 0.",
    right: "Right hand",
    left: "Left hand",
    finger: (k) => `Finger ${k}`,
    pattern: "Pattern",
    ridge: "Ridge count",
    trc: "Total ridge count (TRC)",
    atd: "ATD angle",
    atdHint: "The angle, in degrees, between the triradii below the index and little fingers and the palm's centre. 25 to 70 for each hand.",
    atdLeft: "Left hand ATD (°)",
    atdRight: "Right hand ATD (°)",
    consent: "I confirm the subject (or their guardian) has agreed to this fingerprint pattern analysis, for self-reflection and guidance only.",
    guardian: "Guardian's name",
    guardianPh: "Required for a subject under 18",
    submit: "Create the report",
    submitting: "Creating the report…",
    archNote: "Arch: 0",
    invalid: {
      name: "Enter the subject's name.",
      dateOfBirth: "Enter a valid date of birth (not in the future).",
      fingers: "Enter a pattern and a ridge count (0 to 40) for all ten fingers.",
      atdLeft: "Left ATD must be 25 to 70 degrees.",
      atdRight: "Right ATD must be 25 to 70 degrees.",
      consent: "Consent is required to continue.",
      guardianName: "Guardian's name is required for a subject under 18.",
    },
    choose: "Choose",
    free: "Creating a report takes no points from the wallet.",
  },
});

type Draft = {
  name: string;
  dob: string;
  gender: string;
  language: "en" | "hi";
  fingers: Partial<Record<FingerKey, { pattern: Pattern | ""; ridge: string }>>;
  atdLeft: string;
  atdRight: string;
  consent: boolean;
  guardian: string;
};

const HANDS: { hand: "right" | "left"; keys: FingerKey[] }[] = [
  { hand: "right", keys: FINGER_KEYS.slice(0, 5) },
  { hand: "left", keys: FINGER_KEYS.slice(5) },
];

function fingerValue(f?: { pattern: Pattern | ""; ridge: string }): FingerInput | null {
  if (!f || !f.pattern) return null;
  const n = f.pattern === "arch" ? 0 : Number(f.ridge);
  if (f.ridge === "" && f.pattern !== "arch") return null;
  if (!Number.isInteger(n) || n < 0 || n > 40) return null;
  return { pattern: f.pattern, ridgeCount: n };
}

type InvalidKey = "name" | "dateOfBirth" | "fingers" | "atdLeft" | "atdRight" | "consent" | "guardianName";

function validate(d: Draft): InvalidKey | null {
  if (!d.name.trim()) return "name";
  const age = ageOn(d.dob);
  if (age === null || d.dob > todayISO()) return "dateOfBirth";
  if (FINGER_KEYS.some((k) => !fingerValue(d.fingers[k]))) return "fingers";
  const l = Number(d.atdLeft);
  const r = Number(d.atdRight);
  if (!(d.atdLeft !== "" && l >= 25 && l <= 70)) return "atdLeft";
  if (!(d.atdRight !== "" && r >= 25 && r <= 70)) return "atdRight";
  if (!d.consent) return "consent";
  if (age < 18 && !d.guardian.trim()) return "guardianName";
  return null;
}

export default function DmitForm() {
  const t = useT(text);
  const l = useT(LABELS);
  const locale = useLocale();
  const router = useRouter();
  const fail = useFailureText();
  const [d, setD] = useState<Draft>({ name: "", dob: "", gender: "", language: locale, fingers: {}, atdLeft: "", atdRight: "", consent: false, guardian: "" });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const problem = validate(d);
  const age = ageOn(d.dob);
  const trc = FINGER_KEYS.reduce((s, k) => s + (fingerValue(d.fingers[k])?.ridgeCount ?? 0), 0);

  const set = (p: Partial<Draft>) => setD((o) => ({ ...o, ...p }));
  const setFinger = (k: FingerKey, p: Partial<{ pattern: Pattern | ""; ridge: string }>) =>
    setD((o) => {
      const cur = o.fingers[k] ?? { pattern: "", ridge: "" };
      const next = { ...cur, ...p };
      if (next.pattern === "arch") next.ridge = "0";
      return { ...o, fingers: { ...o.fingers, [k]: next } };
    });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (problem || busy) return;
    setBusy(true);
    setError(null);
    const body: DmitCreateBody = {
      subject: { name: d.name.trim(), dateOfBirth: d.dob, language: d.language, ...(d.gender ? { gender: d.gender } : {}) },
      fingers: Object.fromEntries(FINGER_KEYS.map((k) => [k, fingerValue(d.fingers[k])!])) as DmitCreateBody["fingers"],
      atd: { left: Number(d.atdLeft), right: Number(d.atdRight) },
      consent: { accepted: true, textVersion: CONSENT_TEXT_VERSION, ...(d.guardian.trim() ? { guardianName: d.guardian.trim() } : {}) },
    };
    try {
      const r = await createDmitReport(body);
      router.push(`/tools/dmit?id=${encodeURIComponent(r.id)}`);
    } catch (e2) {
      // A 400 carries the backend's own (English) message; anything else maps to a localized one.
      const kind: ToolFailure = toolFailure(e2);
      setError(e2 instanceof ApiError && e2.status === 400 ? e2.message : fail(kind));
      setBusy(false);
    }
  }

  const showProblem = tried && problem;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card title={t.subject}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t.name} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder={t.namePh} maxLength={100} autoComplete="off" />
          <Field label={t.dob} type="date" value={d.dob} max={todayISO()} onChange={(e) => set({ dob: e.target.value })} />
          <Choice
            label={t.gender}
            value={d.gender}
            onChange={(v) => set({ gender: d.gender === v ? "" : v })}
            options={[
              { value: "male", label: t.male },
              { value: "female", label: t.female },
              { value: "other", label: t.other },
            ]}
          />
          <Choice
            label={t.language}
            value={d.language}
            onChange={(v) => set({ language: v })}
            options={[
              { value: "en", label: t.en },
              { value: "hi", label: t.hi },
            ]}
          />
        </div>
      </Card>

      <Card title={t.fingers} description={t.fingersHint}>
        <div className="grid gap-6 lg:grid-cols-2">
          {HANDS.map(({ hand, keys }) => (
            <fieldset key={hand}>
              <legend className="title-3 mb-3 text-ink">{t[hand]}</legend>
              <ul className="space-y-3">
                {keys.map((k) => {
                  const f = d.fingers[k] ?? { pattern: "" as const, ridge: "" };
                  const arch = f.pattern === "arch";
                  return (
                    <li key={k} className="grid grid-cols-[3rem_1fr_5.5rem] items-end gap-2 sm:gap-3">
                      <span className="title-4 pb-2 text-ink">{k}</span>
                      <PatternSelect label={t.pattern} choose={t.choose} value={f.pattern} onChange={(p) => setFinger(k, { pattern: p })} names={l.patternName} />
                      <Field label={t.ridge} type="number" inputMode="numeric" min={0} max={40} value={f.ridge} disabled={arch} onChange={(e) => setFinger(k, { ridge: e.target.value })} />
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ))}
        </div>
        <p className="body-6 mt-4 text-ink-soft">
          {t.trc}: <b className="text-ink">{trc}</b>
        </p>
      </Card>

      <Card title={t.atd} description={t.atdHint}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.atdLeft} type="number" inputMode="numeric" min={25} max={70} value={d.atdLeft} onChange={(e) => set({ atdLeft: e.target.value })} />
          <Field label={t.atdRight} type="number" inputMode="numeric" min={25} max={70} value={d.atdRight} onChange={(e) => set({ atdRight: e.target.value })} />
        </div>
      </Card>

      <Card>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={d.consent} onChange={(e) => set({ consent: e.target.checked })} className="peer sr-only" />
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-ink text-ink-inverse peer-checked:bg-surface-inverse peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
            {d.consent && <PiCheck className="h-3.5 w-3.5" aria-hidden />}
          </span>
          <span className="body-6 text-ink">{t.consent}</span>
        </label>
        {age !== null && age < 18 && (
          <div className="mt-4 max-w-md">
            <Field label={t.guardian} value={d.guardian} onChange={(e) => set({ guardian: e.target.value })} placeholder={t.guardianPh} maxLength={100} />
          </div>
        )}
      </Card>

      {showProblem && (
        <p role="alert" className="body-6 text-danger">
          {t.invalid[problem]}
        </p>
      )}
      {error && <ErrorBox message={error} />}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? t.submitting : t.submit}
        </button>
        <Notice>{t.free}</Notice>
      </div>
    </form>
  );
}

function PatternSelect({
  label,
  choose,
  value,
  onChange,
  names,
}: {
  label: string;
  choose: string;
  value: Pattern | "";
  onChange: (p: Pattern) => void;
  names: Record<string, string>;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <select id={id} className={inputCls} value={value} onChange={(e) => onChange(e.target.value as Pattern)}>
        <option value="">{choose}</option>
        {PATTERNS.map((p) => (
          <option key={p} value={p}>
            {names[p]}
          </option>
        ))}
      </select>
    </div>
  );
}
