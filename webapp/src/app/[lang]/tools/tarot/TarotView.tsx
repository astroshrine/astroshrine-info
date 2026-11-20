"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PiArrowCounterClockwise, PiCards, PiClockCounterClockwise, PiMagicWand, PiPrinter, PiShuffle } from "react-icons/pi";
import { useLocale } from "@/i18n/LocaleProvider";
import { api } from "@/lib/api";
import { saveToolResult, type SavedResult } from "@/lib/services/tools";
import { Card, Disclaimer, ErrorBox, KV, Notice, btnPrimary, btnSecondary, btnSmall, inputCls, labelCls } from "../../kundli/_components/ui";
import { Choice, Field, todayISO } from "../_components/forms";
import { hasDevanagari, makeBi, type BiFn } from "../numerology/bi";
import { PhalCard, PrintRules, SavedList, Verdict, type Phal } from "../numerology/ui";
import * as E from "./engine";
import { cardName, orient, tarotModel, type Birth, type Card as TCard, type Reading } from "./model";

const TOPICS = ["general", "love", "career", "money", "health", "spiritual"];
/** A bank question also sets the area of life by its category (as the page does). */
const TOPIC_BY_CAT: Record<string, string> = { C02: "career", C03: "money", C04: "love", C05: "love", C07: "health", C08: "career", C09: "spiritual", C12: "career", C14: "health", C16: "career", C18: "money" };

type BirthForm = { dob: string; time: string; tz: string; place: string };
type Row = { id: number | null; rev: boolean };
type BankQuestion = { id: string; q: string };

// Uniform integer in [0, n) from the browser's crypto, so the shuffle is not a pseudo-random one.
function rnd(n: number): number {
  const buf = new Uint32Array(1);
  const lim = Math.floor(4294967296 / n) * n;
  do crypto.getRandomValues(buf);
  while (buf[0] >= lim);
  return buf[0] % n;
}

/** Every card gets an orientation; "Use reversed cards" is applied at reveal, so changing it after the shuffle still counts. */
function shuffled(): TCard[] {
  const a = Array.from({ length: 78 }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.map((id) => ({ id, rev: rnd(2) === 1 }));
}
const drawId = () => Array.from({ length: 12 }, () => rnd(16).toString(16)).join("").toUpperCase();

/** The page's readBirth({dob: false}): the birth details, or the error message. */
function readBirth(bi: BiFn, f: BirthForm): Birth | string {
  const tz = parseFloat(f.tz);
  const b: Birth = { dob: "", time: "", tz: isFinite(tz) ? tz : 5.5, place: f.place.trim() };
  if (f.dob) {
    const y = +f.dob.slice(0, 4);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.dob) || y < 1900 || y > 2100) return bi("Year of birth must be between 1900 and 2100.", "जन्म वर्ष 1900 से 2100 के बीच हो।");
    if (f.dob > todayISO()) return bi("Date of birth cannot be after today.", "जन्म तिथि आज के बाद की नहीं हो सकती।");
    b.dob = f.dob;
  }
  if (f.time) {
    if (!b.dob) return bi("Enter the date of birth along with the birth time.", "जन्म समय के साथ जन्म तिथि भी भरें।");
    if (!(b.tz >= -12 && b.tz <= 14)) return bi("Enter a time zone between −12 and +14.", "समय-क्षेत्र −12 से +14 के बीच भरें।");
    b.time = f.time.slice(0, 5);
  }
  return b;
}

const SUIT_INK: Record<string, string> = { m: "text-brand-strong", w: "text-warning", c: "text-focus", s: "text-ink-soft", p: "text-brand-strong" };
const lang = (s: string) => (hasDevanagari(s) ? "hi" : undefined);

export default function TarotView() {
  const locale = useLocale();
  const bi = useMemo(() => makeBi(locale), [locale]);
  const [client, setClient] = useState("");
  const [topic, setTopic] = useState("general");
  const [question, setQuestion] = useState("");
  const [birth, setBirth] = useState<BirthForm>({ dob: "", time: "", tz: "5.5", place: "" });
  const [spreadKey, setSpreadKey] = useState("ppf");
  const [mode, setMode] = useState<"app" | "deck">("app");
  const [useRev, setUseRev] = useState(true);
  const [err, setErr] = useState("");
  const [step, setStep] = useState<"" | "pick" | "deck">("");
  const [pick, setPick] = useState<{ deck: TCard[]; picks: number[]; drawId: string }>({ deck: [], picks: [], drawId: "" });
  const [rows, setRows] = useState<Row[]>([]);
  const [err2, setErr2] = useState("");
  const [result, setResult] = useState<Reading | null>(null);
  const [saveState, setSaveState] = useState<"" | "saving" | "saved" | "failed">("");
  const [showSaved, setShowSaved] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [bank, setBank] = useState<BankQuestion[]>([]);
  const stepRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [scrollTo, setScrollTo] = useState<"" | "step" | "result">("");

  // The question bank is Hindi and served by the backend; without it the chips are simply not shown.
  useEffect(() => {
    const c = new AbortController();
    api<{ mostAsked?: BankQuestion[] }>("/v1/integrated-reading/questions", { signal: c.signal }).then(
      (b) => setBank(Array.isArray(b?.mostAsked) ? b.mostAsked : []),
      () => {},
    );
    return () => c.abort();
  }, []);

  useEffect(() => {
    if (!scrollTo) return;
    (scrollTo === "step" ? stepRef : resultRef).current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // The scroll is the effect of a step or result having rendered.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScrollTo("");
  }, [scrollTo, step, result]);

  const sp = E.SPREADS[spreadKey as keyof typeof E.SPREADS];
  const n: number = sp.pos.length;
  const M = useMemo(() => (result ? tarotModel(E, bi, result) : null), [result, bi]);

  const fit = (r: Row[], len: number) => Array.from({ length: len }, (_, i) => r[i] ?? { id: null, rev: false });
  const takeBirth = (setE: (m: string) => void) => {
    const b = readBirth(bi, birth);
    if (typeof b === "string") {
      setE(b);
      return null;
    }
    return b;
  };
  const startPick = () => setPick({ deck: shuffled(), picks: [], drawId: drawId() });

  function start() {
    setErr("");
    setResult(null);
    setSaveState("");
    if (!takeBirth(setErr)) return setStep("");
    if (mode === "deck") setRows((r) => fit(r, n));
    else startPick();
    setStep(mode === "deck" ? "deck" : "pick");
    setScrollTo("step");
  }
  function onSpread(k: string) {
    setSpreadKey(k);
    if (step === "pick") setStep("");
    if (step === "deck") setRows((r) => fit(r, E.SPREADS[k as keyof typeof E.SPREADS].pos.length));
  }
  function onMode(v: "app" | "deck") {
    setMode(v);
    setStep("");
  }
  const takeBankQuestion = (q: BankQuestion) => {
    setQuestion(q.q);
    setTopic(TOPIC_BY_CAT[q.id.slice(0, 3)] ?? "general");
  };

  const tapTile = (i: number) =>
    setPick((P) => (P.picks.includes(i) ? { ...P, picks: P.picks.filter((x) => x !== i) } : P.picks.length < n ? { ...P, picks: [...P.picks, i] } : P));
  const autoPick = () =>
    setPick((P) => {
      const picks = [...P.picks];
      while (picks.length < n) {
        const i = rnd(78);
        if (!picks.includes(i)) picks.push(i);
      }
      return { ...P, picks };
    });

  async function finish(cards: TCard[], id: string | null, b: Birth) {
    const reading: Reading = { cards, drawId: id, at: new Date(), meta: { client: client.trim(), topic, question: question.trim(), spreadKey, useRev, birth: b } };
    setResult(reading);
    setStep("");
    setRows([]); // entered cards belong to this reading; the next client starts blank
    setScrollTo("result");
    setSaveState("saving");
    const sid = await saveToolResult("tarot", reading, reading.meta, reading.meta.question || reading.meta.client || undefined);
    setSaveState(sid ? "saved" : "failed");
    if (sid) setReloadKey((k) => k + 1);
  }
  function reveal() {
    setErr("");
    const b = takeBirth(setErr);
    if (!b) return window.scrollTo({ top: 0, behavior: "smooth" });
    void finish(pick.picks.map((i) => ({ id: pick.deck[i].id, rev: useRev && pick.deck[i].rev })), pick.drawId, b);
  }
  function readDeck() {
    setErr2("");
    const seen = new Set<number>();
    const cards: TCard[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.id == null) return setErr2(bi(`Choose a card for position ${i + 1}.`, `स्थान ${i + 1} के लिए कार्ड चुनें।`));
      if (seen.has(r.id)) return setErr2(bi("The same card is chosen twice.", "एक ही कार्ड दो बार चुना गया है।"));
      seen.add(r.id);
      cards.push({ id: r.id, rev: r.rev });
    }
    const b = takeBirth(setErr2);
    if (b) void finish(cards, null, b);
  }
  const setRow = (i: number, p: Partial<Row>) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, ...p } : x)));

  function openSaved(s: SavedResult) {
    const r = (s as SavedResult<Reading & { at: string }>).result;
    if (!r?.meta || !Array.isArray(r.cards) || !(r.meta.spreadKey in E.SPREADS)) {
      setErr(bi("This saved result could not be opened.", "यह सहेजा हुआ परिणाम खुल नहीं सका।"));
      return;
    }
    const m = r.meta;
    setErr("");
    setClient(m.client);
    setTopic(m.topic);
    setQuestion(m.question);
    setSpreadKey(m.spreadKey);
    setUseRev(m.useRev);
    setMode(r.drawId ? "app" : "deck");
    setBirth(m.birth ? { ...m.birth, tz: String(m.birth.tz) } : { dob: "", time: "", tz: "5.5", place: "" });
    setStep("");
    setSaveState("");
    setResult({ ...r, at: new Date(r.at) });
    setScrollTo("result");
  }

  const label = (id: number) => {
    const d = E.DECK[id]!;
    return (d.major ? `${E.ROMAN[id]} · ` : "") + cardName(bi, d);
  };
  const groups: [string, number[]][] = [
    [bi("Major Arcana", "मेजर आर्काना"), E.MAJ.map((_: unknown, i: number) => i)],
    ...E.SUITS.map((s: { en: string; hi: string; cards: unknown[] }, si: number): [string, number[]] => [bi(s.en, s.hi), s.cards.map((_, r) => 22 + si * 14 + r)]),
  ];

  return (
    <div className="space-y-6">
      <PrintRules />
      <div className="no-print space-y-6">
        <p className="caption-2 text-ink-soft">{bi("78 cards · 7 spreads · shuffle here or your own deck", "78 कार्ड · 7 स्प्रेड · यहीं शफ़ल या अपना डेक")}</p>

        <Card title={bi("The question", "प्रश्न")}>
          <div className="space-y-4">
            <Field label={bi("Client name (optional)", "जातक का नाम (वैकल्पिक)")} value={client} onChange={(e) => setClient(e.target.value)} autoComplete="off" lang={lang(client)} />
            <Choice label={bi("Area of life", "जीवन का क्षेत्र")} value={topic} options={TOPICS.map((k) => ({ value: k, label: bi(E.TOPIC[k as keyof typeof E.TOPIC]) }))} onChange={setTopic} />
            {bank.length > 0 && (
              <div>
                <p className={labelCls}>{bi("Most asked questions (tap to use)", "सबसे अधिक पूछे जाने वाले प्रश्न (चुनने के लिए दबाएँ)")}</p>
                <div className="flex flex-wrap gap-2">
                  {bank.slice(0, 12).map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      lang="hi"
                      onClick={() => takeBankQuestion(q)}
                      className={`body-6 rounded-full border px-3 py-1.5 text-left transition active:scale-98 ${
                        question === q.q ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"
                      }`}
                    >
                      {q.q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Field label={bi("Question (as the client asked it)", "प्रश्न (जैसा जातक ने पूछा)")}>
              {(id) => (
                <textarea
                  id={id}
                  rows={2}
                  maxLength={500}
                  className={inputCls}
                  value={question}
                  lang={lang(question)}
                  placeholder={bi("e.g. Will the new job offer work out for me?", "जैसे: क्या नई नौकरी का प्रस्ताव मेरे लिए अच्छा रहेगा?")}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              )}
            </Field>

            <details className="rounded-xl border border-line p-3">
              <summary className="title-4 cursor-pointer text-ink">{bi("Birth details (optional)", "जन्म विवरण (वैकल्पिक)")}</summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label={bi("Date of birth (optional)", "जन्म तिथि (वैकल्पिक)")} type="date" min="1900-01-01" max={todayISO()} value={birth.dob} onChange={(e) => setBirth((b) => ({ ...b, dob: e.target.value }))} />
                <Field label={bi("Birth time (optional)", "जन्म समय (वैकल्पिक)")} type="time" value={birth.time} onChange={(e) => setBirth((b) => ({ ...b, time: e.target.value }))} />
                <Field
                  label={bi("Time zone at birth (UTC ±h)", "जन्म का समय-क्षेत्र (UTC ±घंटे)")}
                  hint={bi("India is UTC +5.5; change the time zone only for a birth abroad.", "भारत का समय-क्षेत्र UTC +5.5 है; विदेश में जन्म हो तभी बदलें।")}
                  inputMode="decimal"
                  value={birth.tz}
                  onChange={(e) => setBirth((b) => ({ ...b, tz: e.target.value }))}
                />
                <Field
                  label={bi("Birthplace", "जन्म स्थान")}
                  placeholder={bi("e.g. Raipur, Chhattisgarh, India", "जैसे रायपुर, छत्तीसगढ़, भारत")}
                  value={birth.place}
                  onChange={(e) => setBirth((b) => ({ ...b, place: e.target.value }))}
                  autoComplete="off"
                />
              </div>
            </details>

            <Choice
              label={bi("Spread", "स्प्रेड")}
              value={spreadKey}
              options={Object.keys(E.SPREADS).map((k) => ({ value: k, label: bi(E.SPREADS[k as keyof typeof E.SPREADS].en, E.SPREADS[k as keyof typeof E.SPREADS].hi) }))}
              onChange={onSpread}
            />
            <Choice
              label={bi("How are the cards drawn?", "कार्ड कैसे निकलेंगे?")}
              value={mode}
              options={[
                { value: "app", label: bi("Shuffle here — client picks", "यहीं शफ़ल — जातक कार्ड चुने") },
                { value: "deck", label: bi("I drew from my own deck", "मैंने अपने डेक से निकाले") },
              ]}
              onChange={onMode}
            />
            <label className="body-6 flex items-center gap-2 text-ink">
              <input type="checkbox" className="h-4 w-4 accent-brand-strong" checked={useRev} onChange={(e) => setUseRev(e.target.checked)} />
              {bi("Use reversed cards", "उल्टे (रिवर्स्ड) कार्ड भी मानें")}
            </label>
            {err && <ErrorBox message={err} />}
            <div className="flex flex-wrap gap-3">
              <button type="button" className={btnPrimary} onClick={start}>
                {mode === "deck" ? <PiCards className="h-5 w-5" aria-hidden /> : <PiShuffle className="h-5 w-5" aria-hidden />}
                {mode === "deck" ? bi("Enter the cards", "कार्ड दर्ज करें") : bi("Shuffle the deck", "डेक शफ़ल करें")}
              </button>
              <button type="button" className={btnSecondary} aria-expanded={showSaved} onClick={() => setShowSaved((v) => !v)}>
                <PiClockCounterClockwise className="h-5 w-5" aria-hidden /> {bi("Saved results", "सहेजे गए परिणाम")}
              </button>
            </div>
          </div>
        </Card>

        {showSaved && <SavedList tool="tarot" reloadKey={reloadKey} onOpen={openSaved} />}

        <div ref={stepRef} className="scroll-mt-24">
          {step === "pick" && (
            <Card title={bi(`Pick ${n} ${n > 1 ? "cards" : "card"}`, `${n} कार्ड चुनें`)}>
              <div className="space-y-4">
                <p className="caption-2 text-ink-soft">
                  {bi(
                    "Ask the client to name numbers between 1 and 78, or tap the cards they choose. Picked: ",
                    "जातक से 1 से 78 के बीच संख्याएँ पूछें या उनके बताए कार्ड पर टैप करें। चुने गए: ",
                  )}
                  {`${pick.picks.length} / ${n}`}
                </p>
                <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9 lg:grid-cols-13">
                  {pick.deck.map((_, i) => {
                    const at = pick.picks.indexOf(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-label={String(i + 1)}
                        aria-pressed={at >= 0}
                        onClick={() => tapTile(i)}
                        className={`grid aspect-2/3 place-items-center rounded-md border-2 text-sm font-bold transition active:scale-95 ${
                          at >= 0 ? "border-ink bg-brand-hover text-brand-ink" : "border-brand-strong bg-brand text-brand-ink hover:bg-brand-hover"
                        }`}
                      >
                        {at >= 0 ? at + 1 : ""}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btnSmall} onClick={autoPick}>
                    <PiMagicWand className="h-4 w-4" aria-hidden /> {bi("Pick for me", "मेरे लिए चुनें")}
                  </button>
                  <button type="button" className={btnSmall} onClick={startPick}>
                    <PiShuffle className="h-4 w-4" aria-hidden /> {bi("Shuffle again", "फिर से शफ़ल करें")}
                  </button>
                </div>
                <button type="button" className={btnPrimary} onClick={reveal} disabled={pick.picks.length !== n}>
                  {bi("Reveal the cards", "कार्ड खोलें")}
                </button>
              </div>
            </Card>
          )}

          {step === "deck" && (
            <Card title={bi("Cards from your deck", "आपके डेक के कार्ड")}>
              <div className="space-y-4">
                <p className="caption-2 text-ink-soft">
                  {bi(
                    "Choose the card that came up in each position, and tick it if it came up reversed. Keep “Use reversed cards” above ticked only if your deck reading uses reversals: it sets the deck average for the phaladesh.",
                    "हर स्थान पर जो कार्ड निकला वह चुनें; उल्टा निकला हो तो टिक करें। ऊपर “उल्टे (रिवर्स्ड) कार्ड भी मानें” तभी टिक रखें जब आपकी रीडिंग में उल्टे कार्ड माने जाते हों: इससे फलादेश का डेक-औसत तय होता है।",
                  )}
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {rows.map((r, i) => (
                    <Field key={i} label={`${i + 1}. ${bi(sp.pos[i])}`}>
                      {(id) => (
                        <div className="space-y-2">
                          <select id={id} className={inputCls} value={r.id ?? ""} onChange={(e) => setRow(i, { id: e.target.value === "" ? null : +e.target.value })}>
                            <option value="">—</option>
                            {groups.map(([title, ids]) => (
                              <optgroup key={title} label={title}>
                                {ids.map((cid) => (
                                  <option key={cid} value={cid}>
                                    {label(cid)}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          <label className="body-6 flex items-center gap-2 text-ink">
                            <input type="checkbox" className="h-4 w-4 accent-brand-strong" checked={r.rev} onChange={(e) => setRow(i, { rev: e.target.checked })} />
                            {bi("Reversed", "उल्टा")}
                          </label>
                        </div>
                      )}
                    </Field>
                  ))}
                </div>
                {err2 && <ErrorBox message={err2} />}
                <button type="button" className={btnPrimary} onClick={readDeck}>
                  {bi("Read the cards", "कार्ड पढ़ें")}
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <div ref={resultRef} className="scroll-mt-24">
        {M && (
          <div className="space-y-4">
            <div className="no-print flex flex-wrap items-center justify-between gap-3">
              <p role="status" className="caption-2 text-ink-soft">
                {saveState === "saving" && bi("Saving to your history…", "इतिहास में सहेज रहे हैं…")}
                {saveState === "saved" && bi("Saved to your history.", "इतिहास में सहेज लिया गया।")}
                {saveState === "failed" && bi("The reading could not be saved to your history; it is still shown here.", "रीडिंग इतिहास में सहेजी नहीं जा सकी; यहाँ दिख रही है।")}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnSecondary} onClick={() => window.print()}>
                  <PiPrinter className="h-5 w-5" aria-hidden /> {bi("Print / save as PDF", "प्रिंट / PDF सेव करें")}
                </button>
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => {
                    setResult(null);
                    setSaveState("");
                    setPick({ deck: [], picks: [], drawId: "" });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <PiArrowCounterClockwise className="h-5 w-5" aria-hidden /> {bi("New reading", "नई रीडिंग")}
                </button>
              </div>
            </div>

            <PhalCard p={M.p as unknown as Phal} />

            <Card title={M.title}>
              <div className="space-y-4">
                <KV rows={M.kv.map(([k, v]) => [k, <span key={k} lang={lang(v)}>{v}</span>])} />
                {M.question && (
                  <p className="body-6 text-ink" lang={lang(M.question)}>
                    <b>{bi("Question", "प्रश्न")}:</b> {M.question}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                  {M.faces.map((f, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="caption-3 flex min-h-8 items-end text-center font-semibold text-ink-soft">{f.pos}</span>
                      <div className={`aspect-2/3 w-full max-w-28 overflow-hidden rounded-lg border-2 p-1.5 ${f.cls === "m" ? "border-brand-strong bg-surface-sunken" : "border-line bg-surface-card"}`}>
                        <div className={`flex h-full flex-col items-center justify-between ${f.rev ? "rotate-180" : ""}`}>
                          <span className={`caption-3 font-bold ${f.cls === "m" ? "text-ink" : SUIT_INK[f.cls]}`}>{f.rk}</span>
                          <span className={`text-3xl leading-none ${SUIT_INK[f.cls]}`} aria-hidden>
                            {f.sym}
                          </span>
                          <span className="caption-3 text-center font-semibold leading-tight text-ink">{f.name}</span>
                        </div>
                      </div>
                      <span className={`caption-4 rounded-full px-2 py-0.5 font-semibold ${f.rev ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>{orient(bi, f.rev)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {M.birth && (
              <Card title={bi("Birth card", "जन्म-कार्ड")}>
                <div className="space-y-2">
                  <KV rows={M.birth.rows} />
                  <p className="body-6 text-ink">{M.birth.up}</p>
                  <p className="caption-2 text-ink-soft">{M.birth.hint}</p>
                </div>
              </Card>
            )}

            {M.yesno && (
              <Card title={bi("Yes / No indication", "हाँ / ना संकेत")}>
                <Verdict cls={M.yesno.cls}>
                  {M.yesno.lean}
                  <span className="body-6 block font-normal">{M.yesno.text}</span>
                </Verdict>
              </Card>
            )}

            <Card title={bi("Card by card", "कार्ड-दर-कार्ड")}>
              <ul className="divide-y divide-line">
                {M.byCard.map((c, i) => (
                  <li key={i} className="space-y-1 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="title-4 text-ink">{c.head}</h3>
                      <span className={`caption-4 shrink-0 rounded-full px-2 py-0.5 font-semibold ${c.rev ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>{orient(bi, c.rev)}</span>
                    </div>
                    <p className="body-6 text-ink">{c.mean}</p>
                    <p className="caption-2 text-ink-soft">{c.kind}</p>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title={bi("Overall reading", "समग्र संकेत")}>
              <div className="space-y-3">
                <ul className="list-disc space-y-1 pl-5">
                  {M.overall.map((x, i) => (
                    <li key={i} className="body-6 text-ink">
                      {x}
                    </li>
                  ))}
                </ul>
                {M.health && <Verdict cls="mid">{M.health}</Verdict>}
                <p className="caption-2 rounded-xl bg-surface-sunken p-3 text-ink-soft">{M.closing}</p>
              </div>
            </Card>
          </div>
        )}
      </div>

      <div className="no-print space-y-3">
        <Notice>{bi("Tarot is for guidance and reflection. It is not a substitute for medical, legal or financial advice.", "टैरो मार्गदर्शन और चिंतन के लिए है। यह चिकित्सा, कानूनी या वित्तीय सलाह का विकल्प नहीं।")}</Notice>
        <Disclaimer />
      </div>
    </div>
  );
}
