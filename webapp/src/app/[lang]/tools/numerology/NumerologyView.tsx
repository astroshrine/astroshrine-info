"use client";

import { useMemo, useState } from "react";
import { PiCalculator, PiClockCounterClockwise, PiPrinter } from "react-icons/pi";
import { useLocale } from "@/i18n/LocaleProvider";
import { saveToolResult, type SavedResult } from "@/lib/services/tools";
import { Card, Disclaimer, ErrorBox, Notice, btnPrimary, btnSecondary} from "../../kundli/_components/ui";
import { Choice, Field, todayISO } from "../_components/forms";
import { makeBi, type BiFn } from "./bi";
import * as E from "./engine";
import { buildReport, tagLine, type Input } from "./report";
import { PhalCard, PrintRules, SavedList, Sections, type Phal } from "./ui";

type Form = { name: string; area: string; gender: string; year: string; mobile: string; firm: string; dob: string; time: string; tz: string; place: string };
type Res = { r: ReturnType<typeof E.compute>; inp: Input; phal: ReturnType<typeof E.phaladesh> };

const AREAS: [string, string, string][] = [
  ["career", "Career / job", "करियर / नौकरी"],
  ["business", "Business", "व्यापार"],
  ["money", "Money / wealth", "धन"],
  ["marriage", "Marriage (unmarried)", "विवाह (अविवाहित)"],
  ["education", "Education / exams", "शिक्षा / परीक्षा"],
  ["property", "Property / vehicle", "संपत्ति / वाहन"],
  ["foreign", "Foreign travel / settling", "विदेश यात्रा / बसना"],
  ["children", "Children", "संतान"],
  ["health", "Health (tendency only)", "स्वास्थ्य (केवल प्रवृत्ति)"],
];

const blank = (): Form => ({ name: "", area: "career", gender: "", year: String(new Date().getFullYear()), mobile: "", firm: "", dob: "", time: "", tz: "5.5", place: "" });

class FormError extends Error {}
const fail = (bi: BiFn, en: string, hi: string): never => {
  throw new FormError(bi(en, hi));
};

/** The page's readInput() and readBirth({dob: true}): the same checks and messages. */
function readInput(bi: BiFn, f: Form): Input {
  const name = f.name.trim();
  if (/[ऀ-ॿ]/.test(name)) fail(bi, 'Write the name in English (Roman) letters, e.g. "Rahul Sharma".', 'नाम अंग्रेज़ी (Roman) अक्षरों में लिखें — जैसे "Rahul Sharma"।');
  if ((E.latin(name).match(/[A-Za-z]/g) || []).length < 2) fail(bi, "Enter the full name.", "पूरा नाम भरें।");
  const now = new Date();
  const today = todayISO();
  if (!f.dob) fail(bi, "Enter the date of birth.", "जन्म तिथि भरें।");
  const by = +f.dob.slice(0, 4);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.dob) || by < 1900 || by > 2100) fail(bi, "Year of birth must be between 1900 and 2100.", "जन्म वर्ष 1900 से 2100 के बीच हो।");
  if (f.dob > today) fail(bi, "Date of birth cannot be after today.", "जन्म तिथि आज के बाद की नहीं हो सकती।");
  const tzN = parseFloat(f.tz);
  const tz = isFinite(tzN) ? tzN : 5.5;
  if (f.time && !(tz >= -12 && tz <= 14)) fail(bi, "Enter a time zone between −12 and +14.", "समय-क्षेत्र −12 से +14 के बीच भरें।");
  const year = parseInt(f.year, 10);
  if (!(year >= 1900 && year <= 2100)) fail(bi, "Enter a forecast year between 1900 and 2100.", "फलादेश का वर्ष 1900 से 2100 के बीच भरें।");
  const mobileRaw = f.mobile.trim();
  const mobile: string = mobileRaw ? E.mobileDigits(mobileRaw) : "";
  if (mobileRaw && !mobile) fail(bi, "Enter the 10-digit mobile number (with or without +91).", "मोबाइल नंबर 10 अंकों का भरें (+91 के साथ या बिना)।");
  const firm = f.firm.trim();
  if (firm && !E.hasLatin(firm)) fail(bi, 'Write the firm name in English (Roman) letters, e.g. "Shri Balaji Traders".', 'फ़र्म का नाम अंग्रेज़ी (Roman) अक्षरों में लिखें — जैसे "Shri Balaji Traders"।');
  const district = f.place.trim();
  return {
    name,
    dob: f.dob,
    gender: f.gender,
    year,
    mobile,
    firm,
    area: f.area,
    // Phaladesh as of today; for a later forecast year, as of 1 January of that year (never a past date).
    asOf: year > now.getFullYear() ? `${year}-01-01` : today,
    today,
    birth: { dob: f.dob, time: f.time, tz, district, place: district },
  };
}

export default function NumerologyView() {
  const locale = useLocale();
  const bi = useMemo(() => makeBi(locale), [locale]);
  const [f, setF] = useState<Form>(blank);
  const set = (k: keyof Form) => (v: string) => setF((o) => ({ ...o, [k]: v }));
  const [err, setErr] = useState("");
  const [res, setRes] = useState<Res | null>(null);
  const [saveState, setSaveState] = useState<"" | "saving" | "saved" | "failed">("");
  const [showSaved, setShowSaved] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const sections = useMemo(() => (res ? buildReport(E, bi, res.r, res.inp) : null), [res, bi]);

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    let next: Res;
    try {
      const inp = readInput(bi, f);
      const r = E.compute(inp);
      next = { r, inp, phal: E.phaladesh(r, inp.area, inp.asOf, inp.today) };
    } catch (x) {
      setRes(null); // never leave the previous client's report up behind an error
      setSaveState("");
      setErr(x instanceof FormError ? x.message : bi("Could not calculate.", "गणना नहीं हो सकी।"));
      return;
    }
    setRes(next);
    setSaveState("saving");
    const id = await saveToolResult("numerology", next, f);
    setSaveState(id ? "saved" : "failed");
    if (id) setReloadKey((k) => k + 1);
  }

  function openSaved(s: SavedResult) {
    const saved = s as SavedResult<Res, Form>;
    if (!saved.result?.r || !saved.result?.inp) {
      setErr(bi("This saved result could not be opened.", "यह सहेजा हुआ परिणाम खुल नहीं सका।"));
      return;
    }
    setErr("");
    setF({ ...blank(), ...(saved.input ?? {}) });
    setRes(saved.result);
    setSaveState("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <PrintRules />
      <div className="no-print space-y-6">
        <p className="caption-2 text-ink-soft">{tagLine(bi)}</p>
        <Card title={bi("Client details", "जातक का विवरण")}>
          <form onSubmit={calculate} className="space-y-4" noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label={bi("Full name (in English letters)", "पूरा नाम (अंग्रेज़ी अक्षरों में)")}
                placeholder={bi("e.g. Rahul Kumar Sharma", "जैसे Rahul Kumar Sharma")}
                value={f.name}
                onChange={(e) => set("name")(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
              />
              <Field label={bi("Date of birth", "जन्म तिथि")} type="date" min="1900-01-01" max={todayISO()} value={f.dob} onChange={(e) => set("dob")(e.target.value)} />
              <Field
                label={bi("Birth time (optional)", "जन्म समय (वैकल्पिक)")}
                type="time"
                value={f.time}
                onChange={(e) => set("time")(e.target.value)}
              />
              <Field
                label={bi("Birthplace", "जन्म स्थान")}
                placeholder={bi("e.g. Raipur", "जैसे रायपुर")}
                value={f.place}
                onChange={(e) => set("place")(e.target.value)}
                autoComplete="off"
              />
            </div>

            <details className="rounded-xl border border-line p-3">
              <summary className="title-4 cursor-pointer text-ink">{bi("More options (optional)", "और विकल्प (वैकल्पिक)")}</summary>
              <div className="mt-4 space-y-4">
                <Choice
                  label={bi("Life area for the phaladesh", "फलादेश का जीवन-क्षेत्र")}
                  value={f.area}
                  options={AREAS.map(([value, en, hi]) => ({ value, label: bi(en, hi) }))}
                  onChange={set("area")}
                />
                <Choice
                  label={bi("Gender (for Kua number)", "लिंग (कुआ अंक के लिए)")}
                  value={f.gender}
                  options={[
                    { value: "", label: bi("Not given", "नहीं बताया") },
                    { value: "M", label: bi("Male", "पुरुष") },
                    { value: "F", label: bi("Female", "स्त्री") },
                  ]}
                  onChange={set("gender")}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={bi("Forecast year", "फलादेश का वर्ष")} inputMode="numeric" maxLength={4} value={f.year} onChange={(e) => set("year")(e.target.value)} />
                  <Field
                    label={bi("Mobile number (optional)", "मोबाइल नंबर (वैकल्पिक)")}
                    placeholder={bi("10-digit number", "10 अंकों का नंबर")}
                    inputMode="tel"
                    value={f.mobile}
                    onChange={(e) => set("mobile")(e.target.value)}
                  />
                  <Field
                    label={bi("Business / firm name (optional)", "व्यापार / फ़र्म का नाम (वैकल्पिक)")}
                    placeholder={bi("e.g. Shree Balaji Traders", "जैसे Shree Balaji Traders")}
                    value={f.firm}
                    onChange={(e) => set("firm")(e.target.value)}
                  />
                  <Field
                    label={bi("Time zone at birth (UTC ±h)", "जन्म का समय-क्षेत्र (UTC ±घंटे)")}
                    hint={bi("India is UTC +5.5; change the time zone only for a birth abroad.", "भारत का समय-क्षेत्र UTC +5.5 है; विदेश में जन्म हो तभी बदलें।")}
                    inputMode="decimal"
                    value={f.tz}
                    onChange={(e) => set("tz")(e.target.value)}
                  />
                </div>
              </div>
            </details>

            {err && <ErrorBox message={err} />}
            <div className="flex flex-wrap gap-3">
              <button type="submit" className={btnPrimary}>
                <PiCalculator className="h-5 w-5" aria-hidden /> {bi("Calculate", "गणना करें")}
              </button>
              <button type="button" className={btnSecondary} aria-expanded={showSaved} onClick={() => setShowSaved((v) => !v)}>
                <PiClockCounterClockwise className="h-5 w-5" aria-hidden /> {bi("Saved results", "सहेजे गए परिणाम")}
              </button>
            </div>
          </form>
        </Card>

        {showSaved && <SavedList tool="numerology" reloadKey={reloadKey} onOpen={openSaved} />}
      </div>

      {res && sections && (
        <div className="space-y-4">
          <div className="no-print flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="caption-2 text-ink-soft">
              {saveState === "saving" && bi("Saving to your history…", "इतिहास में सहेज रहे हैं…")}
              {saveState === "saved" && bi("Saved to your history.", "इतिहास में सहेज लिया गया।")}
              {saveState === "failed" && bi("The result could not be saved to your history; it is still shown here.", "परिणाम इतिहास में सहेजा नहीं जा सका; यहाँ दिख रहा है।")}
            </p>
            <button type="button" className={btnSecondary} onClick={() => window.print()}>
              <PiPrinter className="h-5 w-5" aria-hidden /> {bi("Print / save as PDF", "प्रिंट / PDF सेव करें")}
            </button>
          </div>
          <PhalCard p={res.phal as unknown as Phal} />
          <Sections sections={sections} />
        </div>
      )}

      <div className="no-print">
        <Notice>{bi("Traditional numerology, for guidance and reflection. Not a substitute for medical, legal or financial advice.", "पारंपरिक अंक ज्योतिष, मार्गदर्शन और चिंतन के लिए। चिकित्सा, कानूनी या वित्तीय सलाह का विकल्प नहीं।")}</Notice>
        <div className="mt-3">
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
