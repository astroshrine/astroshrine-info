"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PiArrowLeft, PiPrinter, PiSpinnerGap, PiTrash } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { openPrintable, toolFailure } from "@/lib/services/tools";
import {
  FACE_CONSENT_VERSION,
  FACE_FEATURES,
  createFaceReading,
  deleteFaceReading,
  faceReadingPrintPath,
  getFaceReading,
  listFaceReadings,
  type FaceReading,
  type FaceReadingSummary,
} from "@/lib/services/toolsFace";
import { Card, ErrorBox, Notice, Skeleton, btnPrimary, btnSecondary, btnSmall } from "../../kundli/_components/ui";
import { Choice, Field, ageOn, todayISO } from "../_components/forms";
import PhotoPicker from "../_components/PhotoPicker";
import YearAheadCard from "../_components/YearAheadCard";
import { useFailureText } from "../_components/failure";

const text = defineMessages({
  hi: {
    intro: "एक स्पष्ट, सामने से ली गई फ़ोटो चुनें। प्रोफ़ाइल और मुस्कुराती फ़ोटो वैकल्पिक हैं और रीडिंग को बेहतर बनाती हैं।",
    newReading: "नई रीडिंग",
    name: "नाम",
    dob: "जन्म तिथि",
    gender: "लिंग",
    male: "पुरुष",
    female: "स्त्री",
    other: "अन्य",
    front: "सामने से फ़ोटो",
    frontTip: "कैमरे की ओर सीधे देखें, आंखें खुली हों, रोशनी समान हो, माथे से ठोड़ी तक चेहरा दिखे।",
    profile: "साइड प्रोफ़ाइल फ़ोटो (वैकल्पिक)",
    profileTip: "बगल की ओर मुड़ें ताकि एक कान पूरी तरह दिखे।",
    smiling: "मुस्कुराती हुई फ़ोटो (वैकल्पिक)",
    smilingTip: "कैमरे की ओर देखते हुए एक स्वाभाविक मुस्कान।",
    consent: "मैं पुष्टि करता/करती हूं कि विषय (या उनके अभिभावक) ने इस चेहरे-फ़ोटो रीडिंग के लिए सहमति दी है। ये फ़ोटो केवल इस रीडिंग के लिए उपयोग होंगी, पहचान के लिए कभी नहीं।",
    guardian: "अभिभावक का नाम",
    guardianTip: "18 वर्ष से कम आयु होने पर आवश्यक",
    submit: "फ़ोटो का विश्लेषण करें",
    submitting: "विश्लेषण हो रहा है, इसमें आधा मिनट तक लग सकता है…",
    liveNote: "लाइव कैमरा स्कैन केवल ऐप में है; वेबसाइट पर फ़ोटो चुनें।",
    history: "पिछली रीडिंग",
    historyEmpty: "अभी तक कोई रीडिंग नहीं है।",
    historyError: "पिछली रीडिंग नहीं खुल सकीं।",
    retakeNeeded: "दोबारा फ़ोटो चाहिए",
    open: "खोलें",
    del: "हटाएँ",
    confirm: "यह रीडिंग हटाएँ?",
    yes: "हाँ, हटाएँ",
    no: "रहने दें",
    more: "और दिखाएँ",
    back: "वापस",
    loadError: "यह रीडिंग नहीं खुल सकी।",
    retakeTitle: "फ़ोटो दोबारा लेनी होगी",
    retakeHint: "फ़ोटो स्पष्ट रूप से नहीं पढ़ी जा सकी। कृपया समान रोशनी में और पूरा चेहरा दिखाते हुए फिर से कोशिश करें।",
    retakePhoto: "फ़ोटो दोबारा लें",
    print: "PDF / प्रिंट",
    recharge: "वॉलेट रिचार्ज करें",
    shape: "चेहरे का आकार",
    upper: "ऊपरी तिहाई — ललाट",
    middle: "मध्य तिहाई",
    lower: "निचली तिहाई",
    balance: "तीनों क्षेत्रों का संतुलन",
    features: "विशेषताएं",
    strengths: "विशेषताएं (शक्तियां)",
    growth: "विकास क्षेत्र",
    summary: "व्यक्तित्व सारांश",
    careers: "करियर रुझान",
    relationship: "संबंध शैली",
    parent: "अभिभावकों के लिए एक नोट",
    remedies: "सरल उपाय",
    disclaimer: "अस्वीकरण",
    feature: { forehead: "ललाट", eyebrows: "भौहें", eyes: "आंखें", nose: "नाक", cheeks: "गाल", lips: "होंठ", chin: "ठोड़ी", jaw: "जबड़ा", ears: "कान" },
  },
  en: {
    intro: "Choose a clear, front-facing photo. Profile and smiling photos are optional and improve the reading.",
    newReading: "New reading",
    name: "Name",
    dob: "Date of birth",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    front: "Front-facing photo",
    frontTip: "Face the camera directly, eyes open, even light, hairline to chin visible.",
    profile: "Side profile photo (optional)",
    profileTip: "Turn to the side so one ear is fully visible.",
    smiling: "Smiling photo (optional)",
    smilingTip: "A natural smile, facing the camera.",
    consent: "I confirm the subject (or their guardian) has agreed to this face-photo reading. The photos are used only for this reading, never for identification.",
    guardian: "Guardian's name",
    guardianTip: "Required for a subject under 18",
    submit: "Analyse photo",
    submitting: "Analysing, this can take up to half a minute…",
    liveNote: "The live camera scan is in the app only; on the website, choose a photo.",
    history: "Earlier readings",
    historyEmpty: "No readings yet.",
    historyError: "Could not load the earlier readings.",
    retakeNeeded: "Needs a retake",
    open: "Open",
    del: "Delete",
    confirm: "Delete this reading?",
    yes: "Yes, delete",
    no: "Keep it",
    more: "Show more",
    back: "Back",
    loadError: "Could not open this reading.",
    retakeTitle: "The photo needs a retake",
    retakeHint: "The photo couldn't be read clearly. Please try again with even lighting and your full face visible.",
    retakePhoto: "Retake photo",
    print: "PDF / print",
    recharge: "Recharge wallet",
    shape: "Face shape",
    upper: "Upper third: forehead",
    middle: "Middle third",
    lower: "Lower third",
    balance: "Balance of the three zones",
    features: "Features",
    strengths: "Strengths",
    growth: "Growth areas",
    summary: "Personality summary",
    careers: "Career inclinations",
    relationship: "Relationship style",
    parent: "A note for parents",
    remedies: "Simple practices",
    disclaimer: "Disclaimer",
    feature: { forehead: "Forehead", eyebrows: "Eyebrows", eyes: "Eyes", nose: "Nose", cheeks: "Cheeks", lips: "Lips", chin: "Chin", jaw: "Jaw", ears: "Ears" },
  },
});

type Gender = "male" | "female" | "other";

export default function FaceView() {
  const [reading, setReading] = useState<FaceReading | null>(null);
  const [tick, setTick] = useState(0);
  const top = useRef<HTMLDivElement>(null);

  function show(r: FaceReading) {
    setReading(r);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div ref={top} className="scroll-mt-24">
      {reading ? (
        <ReadingView
          reading={reading}
          onBack={() => {
            setReading(null);
            setTick((n) => n + 1);
          }}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <NewReading
              onDone={(r) => {
                show(r);
              }}
            />
          </div>
          <aside className="lg:col-span-2">
            <History refreshKey={tick} onOpen={show} />
          </aside>
        </div>
      )}
    </div>
  );
}

function NewReading({ onDone }: { onDone: (r: FaceReading) => void }) {
  const t = useT(text);
  const locale = useLocale();
  const failureText = useFailureText();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [front, setFront] = useState<File | null>(null);
  const [profile, setProfile] = useState<File | null>(null);
  const [smiling, setSmiling] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [guardian, setGuardian] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; recharge: boolean } | null>(null);

  const age = ageOn(dob);
  const minor = age !== null && age < 18;
  const valid = Boolean(name.trim() && dob && age !== null && gender && front && consent && (!minor || guardian.trim()));

  async function submit() {
    if (!valid || busy || !front || !gender) return;
    setBusy(true);
    setError(null);
    try {
      const reading = await createFaceReading(
        { name: name.trim(), dateOfBirth: dob, gender, language: locale },
        { accepted: true, textVersion: FACE_CONSENT_VERSION, ...(guardian.trim() ? { guardianName: guardian.trim() } : {}) },
        { front, profile, smiling },
      );
      onDone(reading);
    } catch (e) {
      setError({ message: failureText(e), recharge: toolFailure(e) === "insufficientBalance" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-5"
    >
      <Notice>{t.intro}</Notice>
      <Card title={t.newReading}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.name} value={name} maxLength={100} autoComplete="off" onChange={(e) => setName(e.target.value)} />
          <Field label={t.dob} type="date" value={dob} min="1900-01-01" max={todayISO()} onChange={(e) => setDob(e.target.value)} />
          <div className="sm:col-span-2">
            <Choice
              label={t.gender}
              value={gender}
              onChange={setGender}
              options={[
                { value: "male", label: t.male },
                { value: "female", label: t.female },
                { value: "other", label: t.other },
              ]}
            />
          </div>
        </div>
      </Card>
      <Card>
        <div className="space-y-5">
          <div>
            <PhotoPicker label={t.front} file={front} onChange={setFront} required />
            <p className="caption-3 mt-1 text-ink-muted">{t.frontTip}</p>
          </div>
          <div>
            <PhotoPicker label={t.profile} file={profile} onChange={setProfile} />
            <p className="caption-3 mt-1 text-ink-muted">{t.profileTip}</p>
          </div>
          <div>
            <PhotoPicker label={t.smiling} file={smiling} onChange={setSmiling} />
            <p className="caption-3 mt-1 text-ink-muted">{t.smilingTip}</p>
          </div>
        </div>
        <p className="caption-3 mt-4 text-ink-muted">{t.liveNote}</p>
      </Card>

      <label className="flex items-start gap-3">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-brand)]" />
        <span className="body-6 text-ink">{t.consent}</span>
      </label>
      {minor && <Field label={t.guardian} hint={t.guardianTip} value={guardian} maxLength={100} onChange={(e) => setGuardian(e.target.value)} />}

      {error && (
        <div className="space-y-2">
          <ErrorBox message={error.message} />
          {error.recharge && (
            <Link href="/wallet" className={btnSecondary}>
              {t.recharge}
            </Link>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!valid || busy} className={btnPrimary}>
          {busy && <PiSpinnerGap className="h-5 w-5 animate-spin" aria-hidden />} {t.submit}
        </button>
        {busy && <span role="status" className="caption-2 text-ink-soft">{t.submitting}</span>}
      </div>
    </form>
  );
}

function History({ refreshKey, onOpen }: { refreshKey: number; onOpen: (r: FaceReading) => void }) {
  const t = useT(text);
  const locale = useLocale();
  const failureText = useFailureText();
  const [rows, setRows] = useState<FaceReadingSummary[]>([]);
  const [more, setMore] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  const load = useCallback(async (offset: number) => {
    try {
      const p = await listFaceReadings(offset);
      setRows((prev) => (offset ? [...prev, ...p.readings] : p.readings));
      setMore(p.hasMore);
      setState("ready");
    } catch (e) {
      // A customer on an account without access gets a 403 here: say so, not "could not load".
      setProblem(toolFailure(e) === "disabled" || toolFailure(e) === "notAllowed" ? failureText(e) : null);
      setState("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- failureText is rebuilt every render
  }, []);

  useEffect(() => {
    let live = true;
    listFaceReadings(0).then(
      (p) => {
        if (!live) return;
        setRows(p.readings);
        setMore(p.hasMore);
        setProblem(null);
        setState("ready");
      },
      (e) => {
        if (!live) return;
        setProblem(toolFailure(e) === "disabled" || toolFailure(e) === "notAllowed" ? failureText(e) : null);
        setState("error");
      },
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- failureText is rebuilt every render
  }, [refreshKey]);

  async function openOne(id: string) {
    setBusy(id);
    try {
      onOpen(await getFaceReading(id));
    } catch (e) {
      setProblem(failureText(e));
    } finally {
      setBusy("");
    }
  }

  async function remove(id: string) {
    setBusy(id);
    try {
      await deleteFaceReading(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setConfirm("");
    } catch (e) {
      setProblem(failureText(e));
    } finally {
      setBusy("");
    }
  }

  return (
    <Card title={t.history}>
      {problem && <ErrorBox message={problem} />}
      {state === "loading" && (
        <div aria-hidden className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      {state === "error" && !problem && <ErrorBox message={t.historyError} onRetry={() => { setState("loading"); void load(0); }} />}
      {state === "ready" && rows.length === 0 && <p className="body-6 text-ink-soft">{t.historyEmpty}</p>}
      {state === "ready" && rows.length > 0 && (
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="body-5 truncate text-ink" lang={/[ऀ-ॿ]/.test(r.name) ? "hi" : undefined}>{r.name}</p>
                <p className="caption-3 text-ink-soft">
                  {new Date(r.createdAt).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN")}
                  {r.status === "retake_needed" && ` · ${t.retakeNeeded}`}
                </p>
              </div>
              {confirm === r.id ? (
                <div className="flex items-center gap-2">
                  <button type="button" disabled={busy === r.id} onClick={() => void remove(r.id)} className={btnSmall}>{t.yes}</button>
                  <button type="button" onClick={() => setConfirm("")} className="caption-3 text-ink-soft underline">{t.no}</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button type="button" disabled={busy === r.id} onClick={() => void openOne(r.id)} className={btnSmall}>{t.open}</button>
                  <button type="button" aria-label={`${t.del}: ${r.name}`} onClick={() => setConfirm(r.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft transition hover:bg-surface-sunken hover:text-danger">
                    <PiTrash className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {state === "ready" && more && (
        <button type="button" onClick={() => void load(rows.length)} className={`${btnSmall} mt-3`}>{t.more}</button>
      )}
    </Card>
  );
}

function ReadingView({ reading, onBack }: { reading: FaceReading; onBack: () => void }) {
  const t = useT(text);
  const failureText = useFailureText();
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function print() {
    setPrinting(true);
    setError(null);
    try {
      await openPrintable(faceReadingPrintPath(reading.id));
    } catch (e) {
      setError(failureText(e));
    } finally {
      setPrinting(false);
    }
  }

  // A reading that needs a retake is of no use: drop it (as the app does) so the list does not fill with such rows.
  async function retake() {
    await deleteFaceReading(reading.id).catch(() => {});
    onBack();
  }

  if (reading.status === "retake_needed") {
    return (
      <Card title={t.retakeTitle}>
        <p className="body-5 text-ink">{t.retakeHint}</p>
        <button type="button" onClick={() => void retake()} className={`${btnPrimary} mt-4`}>{t.retakePhoto}</button>
      </Card>
    );
  }

  const o = reading.output;
  return (
    <article className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button type="button" onClick={onBack} className="caption-3 inline-flex items-center gap-1 text-ink-soft hover:text-ink">
          <PiArrowLeft className="h-4 w-4" aria-hidden /> {t.back}
        </button>
        <button type="button" onClick={() => void print()} disabled={printing} className={btnSecondary}>
          <PiPrinter className="h-5 w-5" aria-hidden /> {t.print}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      <h2 className="heading-5 text-ink" lang={/[ऀ-ॿ]/.test(reading.subject.name) ? "hi" : undefined}>{reading.subject.name}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title={t.shape}>
          <p className="body-5 text-ink"><b>{o.face_shape.value}:</b> {o.face_shape.meaning}</p>
        </Card>
        <Card title={t.balance}>
          <p className="body-5 text-ink"><b>{o.face_thirds_balance.value}:</b> {o.face_thirds_balance.meaning}</p>
        </Card>
        <Zone title={t.upper} z={o.zones.forehead} />
        <Zone title={t.middle} z={o.zones.middle_third} />
        <Zone title={t.lower} z={o.zones.lower_third} />
      </div>
      <Card title={t.features}>
        <dl className="space-y-3">
          {[...FACE_FEATURES, "ears" as const].map((k) => {
            const f = o.features[k];
            if (!f?.visible) return null;
            return (
              <div key={k}>
                <dt className="title-4 text-ink">{t.feature[k]}</dt>
                <dd className="body-6 text-ink-soft">{f.observation} — {f.meaning}</dd>
              </div>
            );
          })}
        </dl>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <List title={t.strengths} items={o.strengths} />
        <List title={t.growth} items={o.growth_areas} />
      </div>
      <Card title={t.summary}><p className="body-5 text-ink">{o.personality_summary}</p></Card>
      <List title={t.careers} items={o.career_inclinations} />
      {o.relationship_style && <Card title={t.relationship}><p className="body-5 text-ink">{o.relationship_style}</p></Card>}
      {o.parent_note && <Card title={t.parent}><p className="body-5 text-ink">{o.parent_note}</p></Card>}
      <YearAheadCard yearAhead={o.year_ahead} />
      <List title={t.remedies} items={o.remedies_or_practices} />
      <p className="caption-5 text-ink-muted"><b>{t.disclaimer}.</b> {reading.disclaimer}</p>
    </article>
  );
}

function Zone({ title, z }: { title: string; z: { observations: string[]; meaning: string } }) {
  return (
    <Card title={title}>
      <ul className="body-6 list-disc space-y-1 pl-5 text-ink-soft">{z.observations.map((x, i) => <li key={i}>{x}</li>)}</ul>
      <p className="body-5 mt-2 text-ink">{z.meaning}</p>
    </Card>
  );
}

function List({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <Card title={title}>
      <ul className="body-5 list-disc space-y-1 pl-5 text-ink">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </Card>
  );
}
