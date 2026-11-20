"use client";

import { useEffect, useRef, useState } from "react";
import { PiCheck, PiPlus, PiSparkle } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import type { BirthPlace } from "@/lib/jyotish";
import {
  CONSENT_TEXT_VERSION, DEFAULT_QUESTIONS, GENDERS, MARITAL, MAX_QUESTIONS, createIntegratedReading, fetchQuestionBank,
  type BankQuestion, type Gender, type Lang, type MaritalStatus, type QuestionBank,
} from "@/lib/services/toolsBIntegrated";
import { toolErrorKind, toolErrorText } from "@/lib/services/toolsBCommon";
import PlaceSearch from "../../../kundli/_components/PlaceSearch";
import { Card, ErrorBox, Notice, Skeleton, btnPrimary, btnSecondary, btnSmall, inputCls, labelCls } from "../../../kundli/_components/ui";
import { Gate, ToolPage } from "../../_b/shell";
import { Chips } from "../../blind-kundli/Checks";
import { irText } from "../text";

/** Pseudo category of the bank's most-asked list, shown first. */
const MOST_ASKED = "*";

export default function NewView() {
  const t = useT(irText);
  return (
    <ToolPage eyebrow={t.newEyebrow} title={t.title} intro={t.intro}>
      <Gate what={t.what} astrologerOnly>
        <Flow />
      </Gate>
    </ToolPage>
  );
}

function Flow() {
  const t = useT(irText);
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [tob, setTob] = useState("");
  const [place, setPlace] = useState<BirthPlace | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [marital, setMarital] = useState<MaritalStatus | null>(null);
  // The report is written in Devanagari unless told otherwise, so Hindi is the default whatever the page language, as in the app.
  const [reportLang, setReportLang] = useState<Lang>("hi");
  const [own, setOwn] = useState<string[]>([""]);
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [bankFailed, setBankFailed] = useState(false);
  const [cat, setCat] = useState(MOST_ASKED);
  const [picked, setPicked] = useState<BankQuestion[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const c = new AbortController();
    fetchQuestionBank(c.signal).then(setBank, () => !c.signal.aborted && setBankFailed(true));
    return () => c.abort();
  }, []);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const qs = own.map((q) => q.trim()).filter(Boolean);
  const total = picked.length + qs.length;
  const sent = total ? picked : (bank?.mostAsked.slice(0, DEFAULT_QUESTIONS) ?? []);
  const sentTotal = sent.length + qs.length;
  const ready = !!(name.trim() && dob && place && gender && marital && consent && sentTotal > 0 && sentTotal <= MAX_QUESTIONS);
  const togglePick = (q: BankQuestion) => setPicked((p) => (p.some((x) => x.id === q.id) ? p.filter((x) => x.id !== q.id) : total < MAX_QUESTIONS ? [...p, q] : p));

  async function submit() {
    if (busy) return;
    if (!ready || !place || !gender || !marital) {
      setError(t.needFields);
      return;
    }
    setBusy(true);
    setSeconds(0);
    setError(null);
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    try {
      const report = await createIntegratedReading({
        subject: {
          name: name.trim(),
          dob,
          ...(tob ? { tob } : {}),
          place: { name: place.name, lat: place.lat, lng: place.lon, tz: place.tz },
          language: reportLang,
          gender,
          maritalStatus: marital,
        },
        consent: { accepted: true, textVersion: CONSENT_TEXT_VERSION },
        questions: [...sent.map((p) => ({ id: p.id })), ...qs.map((q) => ({ q }))],
      });
      router.replace(`/tools/integrated-reading/report?id=${encodeURIComponent(report.id)}`);
    } catch (e) {
      // The server may still have finished after the proxy gave up: say so instead of promising nothing happened.
      const kind = toolErrorKind(e);
      setError(kind === "failed" || kind === "offline" ? `${toolErrorText(e, locale)} ${t.failedLong}` : toolErrorText(e, locale));
      if (e instanceof ApiError && e.status === 400 && e.message && !/^Request failed/.test(e.message)) setError(e.message);
    } finally {
      if (timer.current) clearInterval(timer.current);
      setBusy(false);
    }
  }

  const bankList = cat === MOST_ASKED ? bank?.mostAsked : bank?.categories.find((c) => c.id === cat)?.questions;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <div className="space-y-4">
            <div>
              <label htmlFor="ir-name" className={labelCls}>{t.name}</label>
              <input id="ir-name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} autoComplete="off" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ir-dob" className={labelCls}>{t.dob}</label>
                <input id="ir-dob" type="date" min="1920-01-01" max={new Date().toISOString().slice(0, 10)} value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="ir-tob" className={labelCls}>{t.tob}</label>
                <input id="ir-tob" type="time" value={tob} onChange={(e) => setTob(e.target.value)} className={inputCls} />
              </div>
            </div>
            <PlaceSearch id="ir-pob" label={t.pob} value={place} onPick={setPlace} />
            <div>
              <p className={labelCls}>{t.gender}</p>
              <Chips<Gender> items={GENDERS.map((v) => ({ v, label: t.genders[v] }))} value={gender} onPick={setGender} label={t.gender} />
            </div>
            <div>
              <p className={labelCls}>{t.marital}</p>
              <Chips<MaritalStatus> items={MARITAL.map((v) => ({ v, label: t.maritalStatus[v] }))} value={marital} onPick={setMarital} label={t.marital} />
            </div>
            <div>
              <p className={labelCls}>{t.reportLanguage}</p>
              <Chips<Lang> items={(["hi", "en"] as const).map((v) => ({ v, label: t.languages[v] }))} value={reportLang} onPick={setReportLang} label={t.reportLanguage} />
            </div>
          </div>
        </Card>

        <Card title={t.questions} description={t.questionsHint}>
          {!total && <p className="caption-2 mb-3 text-ink-soft">{t.nothingPicked(DEFAULT_QUESTIONS)}</p>}
          {picked.length > 0 && (
            <div className="mb-4">
              <p className="title-4 mb-2 text-ink">{t.picked}</p>
              <ul lang="hi" className="flex flex-wrap gap-2">
                {picked.map((p) => (
                  <li key={p.id}>
                    <button type="button" className={`${btnSmall} !bg-surface-sunken`} aria-label={t.unpick(p.q)} onClick={() => togglePick(p)}>
                      <PiCheck className="h-4 w-4" aria-hidden /> {p.q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="title-4 text-ink">{t.bank}</p>
          <p className="caption-2 mb-2 text-ink-muted">{t.bankNote}</p>
          {bankFailed && <Notice tone="warning">{t.bankFailed}</Notice>}
          {!bank && !bankFailed && <Skeleton className="h-24 w-full" />}
          {bank && (
            <>
              <div lang="hi" role="group" aria-label={t.bank} className="flex flex-wrap gap-2">
                {[{ id: MOST_ASKED, name: t.mostAsked }, ...bank.categories].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={cat === c.id}
                    onClick={() => setCat(c.id)}
                    className={`button-sm rounded-lg border px-3 py-1.5 transition active:scale-98 ${cat === c.id ? "on-inverse border-transparent bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"}`}
                  >
                    {c.id === MOST_ASKED ? <span lang={locale}>{c.name}</span> : c.name}
                  </button>
                ))}
              </div>
              <ul lang="hi" className="mt-3 max-h-80 divide-y divide-line overflow-y-auto rounded-xl border border-line">
                {bankList?.map((q) => {
                  const on = picked.some((p) => p.id === q.id);
                  return (
                    <li key={q.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        disabled={!on && total >= MAX_QUESTIONS}
                        onClick={() => togglePick(q)}
                        className="body-6 flex w-full items-start gap-3 px-3 py-2 text-left text-ink transition hover:bg-surface-sunken disabled:opacity-50"
                      >
                        <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${on ? "border-transparent bg-surface-inverse text-ink-inverse" : "border-line-strong"}`} aria-hidden>
                          {on ? <PiCheck className="h-3 w-3" /> : <PiPlus className="h-3 w-3 text-ink-muted" />}
                        </span>
                        <span className="min-w-0 flex-1">{q.q}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <p className="title-4 mt-5 text-ink">{t.ownQuestions}</p>
          <div className="mt-2 space-y-2">
            {own.map((q, i) => (
              <div key={i}>
                <label htmlFor={`ir-q${i}`} className="sr-only">{`${t.ownQuestions} ${i + 1}`}</label>
                <input id={`ir-q${i}`} maxLength={200} value={q} onChange={(e) => setOwn((p) => p.map((x, j) => (j === i ? e.target.value : x)))} placeholder={t.questionPlaceholder} className={inputCls} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {total < MAX_QUESTIONS && own.length < MAX_QUESTIONS && (
              <button type="button" className={btnSmall} onClick={() => setOwn((p) => [...p, ""])}>{t.addQuestion}</button>
            )}
            {own.length > 1 && (
              <button type="button" className={btnSmall} onClick={() => setOwn((p) => p.slice(0, -1))}>{t.removeQuestion}</button>
            )}
          </div>
          {sentTotal > MAX_QUESTIONS && <p role="alert" className="caption-2 mt-2 text-danger">{t.tooMany(MAX_QUESTIONS)}</p>}
        </Card>
      </div>

      <aside className="lg:col-span-2">
        <div className="space-y-4 lg:sticky lg:top-24">
          <Notice>{t.sourcesNoteWeb}</Notice>
          <label className="body-6 flex cursor-pointer items-start gap-3 text-ink">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-brand)]" />
            <span>{t.consent}</span>
          </label>
          {error && <ErrorBox message={error} />}
          <button type="button" className={`${btnPrimary} w-full`} disabled={!ready || busy} onClick={() => void submit()}>
            <PiSparkle className="h-5 w-5" aria-hidden /> {busy ? `${t.generating} · ${t.elapsed(seconds)}` : t.generate}
          </button>
          {busy && (
            <div role="status" aria-live="polite" className="space-y-2">
              <div aria-hidden className="h-1 overflow-hidden rounded-full bg-surface-sunken">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-brand" />
              </div>
              <p className="caption-2 text-ink-soft">{t.takesAMinute}</p>
            </div>
          )}
          <Link href="/tools/integrated-reading" className={`${btnSecondary} w-full`}>{t.back}</Link>
        </div>
      </aside>
    </div>
  );
}
