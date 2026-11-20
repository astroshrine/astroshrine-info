"use client";

import { useEffect, useRef, useState } from "react";
import { PiMagnifyingGlass, PiPrinter, PiSpinnerGap } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { makeBi, addMonths, dmy } from "@/lib/services/toolsBBi";
import { loadMuhuratEngine, runMuhuratFind, type PersonForm, type PlaceForm } from "@/lib/services/toolsBMuhurat";
import { todayYmd } from "@/lib/services/toolsBCommon";
import { saveResult } from "@/lib/services/toolsBSaved";
import { Card, ErrorBox, Notice, btnPrimary, btnSecondary } from "../../kundli/_components/ui";
import { Gate, PanelSkeleton, ToolPage } from "../_b/shell";
import SavedList from "../_b/SavedList";
import { ChipRow, CheckRow, DateField, Fold, PlaceField, PrintStyles, TextField, Tx, placeOf, placeVal, useBi, toggleCls } from "../_b/muhuratUi";
import MuhuratResults from "./MuhuratResults";

/* eslint-disable @typescript-eslint/no-explicit-any */

const text = defineMessages({
  hi: {
    eyebrow: "ज्योतिषी टूल · मुहूर्त",
    title: "सर्व-मुहूर्त निर्णायक",
    what: "मुहूर्त टूल",
    engineFailed: "यह टूल इस ब्राउज़र में शुरू नहीं हो सका। पेज फिर से खोलें।",
    disclaimer:
      "ये टूल्स सिर्फ़ आपकी रीडिंग में मदद के लिए हैं। इनका रिज़ल्ट न पूरी तरह सच का दावा है, न ही झूठ: ये पारंपरिक सिद्धांतों पर आधारित एक व्याख्या है। क्लाइंट को कुछ भी बताने से पहले अपने ज्ञान और विवेक का उपयोग करें।",
    engineNote: "गणना आपके ब्राउज़र में ही होती है, ऐप वाले इंजन से। कोई पॉइंट नहीं कटते।",
  },
  en: {
    eyebrow: "Astrologer tool · Muhurat",
    title: "Sarva-Muhurat Nirnayak",
    what: "the Muhurat tool",
    engineFailed: "This tool could not start in this browser. Reload the page.",
    disclaimer:
      "These tools are AI-assisted aids to support your own reading. Their output is neither a guaranteed truth nor a false claim: it is an interpretation based on traditional principles. Please apply your own knowledge and judgement before sharing anything with a client.",
    engineNote: "The calculation runs in your browser, with the same engine as the app. No points are taken.",
  },
});

const STEPS: [string, [string, string]][] = [
  ["5", ["Normal (5 minutes)", "सामान्य (5 मिनट)"]],
  ["3", ["Fine (3 minutes)", "सूक्ष्म (3 मिनट)"]],
  ["2", ["Very fine (2 minutes)", "अति सूक्ष्म (2 मिनट)"]],
];
const MIN_DUR: [string, [string, string]][] = [
  ["12", ["12 minutes", "12 मिनट"]],
  ["15", ["15 minutes", "15 मिनट"]],
  ["24", ["24 minutes (1 ghati)", "24 मिनट (1 घटी)"]],
  ["48", ["48 minutes (2 ghatis)", "48 मिनट (2 घटी)"]],
];
const STRICT: [boolean, [string, string]][] = [
  [false, ["Standard (the shastra's house rules are binding)", "मानक (शास्त्रोक्त भाव-नियम अनिवार्य)"]],
  [true, ["Relaxed (house rules other than the 8th only lower the score)", "शिथिल (अष्टम को छोड़ भाव-नियम केवल अंक-कटौती)"]],
];
const MAX_MONTHS = 24;
const DEFAULT_MONTHS = 12;

const extraDefaults = (ty: any): Record<string, string> =>
  Object.fromEntries((ty.extra || []).map((e: any) => [e.key, String(e.default ?? (e.type === "select" ? e.options[0][0] : ""))]));

export default function MuhuratView() {
  const t = useT(text);
  const locale = useLocale();
  const [loaded, setLoaded] = useState<{ lang: string; UM?: any; failed?: boolean } | null>(null);
  useEffect(() => {
    let live = true;
    loadMuhuratEngine(locale).then(
      (UM) => live && setLoaded({ lang: locale, UM }),
      () => live && setLoaded({ lang: locale, failed: true }),
    );
    return () => {
      live = false;
    };
  }, [locale]);
  const ready = loaded?.lang === locale ? loaded : null;

  return (
    <ToolPage eyebrow={t.eyebrow} title={t.title} intro={ready?.UM ? <EngineLine UM={ready.UM} /> : undefined}>
      <Gate what={t.what} astrologerOnly>
        {!ready ? <PanelSkeleton /> : ready.failed ? <ErrorBox message={t.engineFailed} /> : <MuhuratFlow key={locale} UM={ready.UM} />}
      </Gate>
    </ToolPage>
  );
}

function EngineLine({ UM }: { UM: any }) {
  const bi = useBi();
  return (
    <>
      {bi(
        `${UM.TYPES.length} kinds of muhurat · classical rule tables · Chandra & Tara bala · lagna shuddhi · grades 1-2-3`,
        `${UM.TYPES.length} प्रकार के मुहूर्त · शास्त्रीय नियम-सारणी · चन्द्र-तारा बल · लग्न शुद्धि · ग्रेड 1-2-3`,
      )}
    </>
  );
}

function MuhuratFlow({ UM }: { UM: any }) {
  const t = useT(text);
  const locale = useLocale();
  const bi = makeBi(locale);
  const today = todayYmd();
  const typeOf = (id: string) => UM.TYPES.find((x: any) => x.id === id) ?? UM.TYPES[0];

  const [karya, setKarya] = useState<string>(() => typeOf("GRIHA_PRAVESH").id);
  const [extra, setExtra] = useState(() => extraDefaults(typeOf(karya)));
  const [persons, setPersons] = useState<Record<string, PersonForm>>({});
  const [venue, setVenue] = useState<PlaceForm>(() => placeOf(0));
  const [from, setFromDate] = useState(today);
  const [to, setTo] = useState(() => addMonths(today, DEFAULT_MONTHS));
  const [step, setStep] = useState("5");
  const [minDur, setMinDur] = useState("15");
  const [relaxed, setRelaxed] = useState(false);
  const [bhadraVaas, setBhadraVaas] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState<{ out: any; input: any; n: number } | null>(null);
  const runs = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const scrollNext = useRef(false);

  useEffect(() => {
    if (res && scrollNext.current) {
      scrollNext.current = false;
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [res]);

  const ty = typeOf(karya);
  const rule = UM.RULES[ty.id];
  const blank = (): PersonForm => ({ name: "", date: "", time: "", place: placeOf(null) });
  const person = (key: string) => persons[key] ?? blank();
  const setPerson = (key: string, p: Partial<PersonForm>) => setPersons((ps) => ({ ...ps, [key]: { ...(ps[key] ?? blank()), ...p } }));
  const chooseKarya = (id: string) => {
    setKarya(id);
    setExtra(extraDefaults(typeOf(id)));
  };
  /** To never before From, at most From + 24 months, else From + 12 months. */
  const setFrom = (f: string) => {
    setFromDate(f);
    setTo((x) => (!x || x < f || x > addMonths(f, MAX_MONTHS) ? addMonths(f, DEFAULT_MONTHS) : x));
  };
  const place = (p: PlaceForm) => placeVal(p, bi("Other", "अन्य"), locale === "hi");

  /** UM.find's input, or an Error with the message to show. */
  const buildInput = () => {
    const ps = ty.roles.map((r: any) => {
      const p = person(r.key);
      const who = r.label;
      if (!p.date || !p.time) throw new Error(bi(`Enter the date and time of birth of "${who}".`, `"${who}" की जन्म तिथि व जन्म समय भरें।`));
      if (p.place.city == null && !p.place.custom) throw new Error(bi(`Choose the place of birth of "${who}".`, `"${who}" का जन्म स्थान चुनें।`));
      const c = place(p.place);
      if (!c) throw new Error(bi(`Enter the latitude/longitude/TZ of the birthplace of "${who}".`, `"${who}" के जन्म-स्थान के अक्षांश/रेखांश/TZ भरें।`));
      return { role: r.key, name: p.name.trim(), birth: { date: p.date, time: p.time, tz: c.tz, lat: c.lat, lon: c.lon } };
    });
    if (venue.city == null && !venue.custom) throw new Error(bi("Choose the venue.", "कार्य-स्थान चुनें।"));
    const vp = place(venue);
    if (!vp) throw new Error(bi("Enter the latitude/longitude/TZ of the venue.", "कार्य-स्थान के अक्षांश/रेखांश/TZ भरें।"));
    if (!from || !to) throw new Error(bi("Enter the From and To dates of the search.", "खोज की प्रारम्भ (From) व अन्त (To) तिथि भरें।"));
    if (to < from) throw new Error(bi("The To date cannot be before the From date.", "अन्त तिथि (To) प्रारम्भ तिथि (From) से पहले नहीं हो सकती।"));
    const cap = addMonths(from, MAX_MONTHS);
    if (to > cap) {
      throw new Error(
        bi(`The search can span at most 24 months: set the To date on or before ${dmy(cap)}.`, `खोज-अवधि अधिकतम 24 मास: अन्त तिथि (To) ${dmy(cap)} या उससे पहले रखें।`),
      );
    }
    return {
      karya: ty.id,
      persons: ps,
      place: vp,
      from,
      to,
      days: (Date.parse(to) - Date.parse(from)) / 864e5 + 1,
      extra: { ...extra },
      options: { stepMin: +step, minDurMin: +minDur, relaxed, bhadraVaas },
    };
  };

  async function run() {
    if (busy) return;
    setErr("");
    setRes(null);
    let input: any;
    try {
      input = buildInput();
    } catch (e) {
      setErr((e as Error).message);
      return;
    }
    setBusy(true);
    try {
      const out = await runMuhuratFind(input, locale);
      scrollNext.current = true;
      setRes({ out, input, n: ++runs.current });
      const names = input.persons.map((p: any) => p.name).filter(Boolean).join(" & ");
      void saveResult("muhurat", out, { ...input, form: { persons, venue } }, [ty.name, names].filter(Boolean).join(" — "));
    } catch (e) {
      setErr(bi("Error: ", "त्रुटि: ") + ((e as Error)?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  }

  const groups: Record<string, any[]> = {};
  UM.TYPES.forEach((k: any) => (groups[k.group] = groups[k.group] || []).push(k));
  const timeNote =
    rule.time === "forenoon" ? bi(" · forenoon only", " · केवल पूर्वाह्न") : rule.time === "any" ? bi(" · day or night", " · दिन-रात्रि दोनों") : bi(" · daytime", " · दिन-काल");

  const personForm = (r: any) => {
    const p = person(r.key);
    const c = place(p.place);
    let janma: any = null;
    if (p.date && p.time && c) {
      try {
        const [y, m, d] = p.date.split("-").map(Number);
        const [H, M] = p.time.split(":").map(Number);
        janma = UM.computePerson({ role: r.key, birth: { y, m, d, hour: H + M / 60, tz: c.tz, lat: c.lat, lon: c.lon } });
      } catch {
        janma = null;
      }
    }
    return (
      <div key={r.key} className="space-y-3 rounded-xl border border-dashed border-line-strong p-3">
        <p className="caption-4 text-brand-strong">
          <Tx>{r.label}</Tx>
          {r.required ? " *" : bi(" (optional)", " (वैकल्पिक)")}
        </p>
        <TextField id={`p-${r.key}-name`} label={bi("Name", "नाम")} value={p.name} onChange={(name) => setPerson(r.key, { name })} placeholder={bi(`${r.label}'s name`, `${r.label} का नाम`)} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DateField id={`p-${r.key}-d`} type="date" label={bi("Date of birth", "जन्म तिथि")} value={p.date} onChange={(date) => setPerson(r.key, { date })} max={today} />
          <DateField id={`p-${r.key}-t`} type="time" label={bi("Time of birth", "जन्म समय")} value={p.time} onChange={(time) => setPerson(r.key, { time })} />
        </div>
        <PlaceField id={`p-${r.key}-place`} label={bi("Place of birth", "जन्म स्थान")} value={p.place} onChange={(pl) => setPerson(r.key, { place: pl })} />
        {janma && (
          <p className="body-6 text-ink-soft">
            {bi("Janma rashi", "जन्म राशि")}: <b className="text-ink"><Tx>{janma.rashiName}</Tx></b> · {bi("Janma nakshatra", "जन्म नक्षत्र")}:{" "}
            <b className="text-ink"><Tx>{`${janma.nakName} – ${janma.pada}`}</Tx></b>
          </p>
        )}
      </div>
    );
  };

  const choose = (saved: { input: any; result: any }) => {
    const { form, ...input } = saved.input;
    setKarya(input.karya);
    setExtra(input.extra);
    if (form?.persons) setPersons(form.persons);
    if (form?.venue) setVenue(form.venue);
    setFromDate(input.from);
    setTo(input.to);
    setStep(String(input.options.stepMin));
    setMinDur(String(input.options.minDurMin));
    setRelaxed(!!input.options.relaxed);
    setBhadraVaas(!!input.options.bhadraVaas);
    setErr("");
    scrollNext.current = true;
    setRes({ out: saved.result, input, n: ++runs.current });
  };

  const venueName = place(venue)?.name ?? "—";

  return (
    <div className="space-y-8">
      <PrintStyles />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5" data-noprint>
        <div className="space-y-6 lg:col-span-3">
          <Card title={bi("Muhurat for which karya?", "किस कार्य का मुहूर्त?")}>
            <Fold title={`${bi("Karya", "कार्य")}: ${ty.name}`} defaultOpen>
              <div className="space-y-4">
                {Object.keys(groups).map((g) => (
                  <div key={g}>
                    <p className="caption-4 mb-2 text-brand-strong">
                      <Tx>{UM.tw(g)}</Tx>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {groups[g].map((k: any) => (
                        <button key={k.id} type="button" aria-pressed={k.id === ty.id} onClick={() => chooseKarya(k.id)} className={toggleCls(k.id === ty.id)}>
                          <Tx>{k.name}</Tx>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="body-6 text-ink-soft">
                  <Tx>{ty.desc + timeNote}</Tx>
                </p>
              </div>
            </Fold>
          </Card>

          <Card title={bi("Muhurat for whom? Birth details", "किसका मुहूर्त? जन्म विवरण")}>
            <div className="space-y-4">
              {ty.roles.filter((r: any) => r.required).map(personForm)}
              {ty.roles.some((r: any) => !r.required) && (
                <Fold title={bi("Other people (optional)", "अन्य व्यक्ति (वैकल्पिक)")}>{ty.roles.filter((r: any) => !r.required).map(personForm)}</Fold>
              )}
            </div>
          </Card>

          {ty.extra.length > 0 && (
            <Card>
              <Fold title={bi("Details of the karya (optional)", "कार्य का विवरण (वैकल्पिक)")}>
                {ty.extra.map((e: any) =>
                  e.type === "select" ? (
                    <ChipRow key={e.key} label={e.label} options={e.options.map(([v, l]: [unknown, string]) => [String(v), l])} value={extra[e.key]} onChange={(v) => setExtra((x) => ({ ...x, [e.key]: v }))} />
                  ) : (
                    <TextField key={e.key} id={`x-${e.key}`} label={e.label} value={extra[e.key] ?? ""} onChange={(v) => setExtra((x) => ({ ...x, [e.key]: v }))} />
                  ),
                )}
              </Fold>
            </Card>
          )}

          <Card>
            <Fold title={`${bi("Venue and search period", "कार्य-स्थान एवं अवधि")}: ${venueName} · ${dmy(from)} – ${dmy(to)}`}>
              <PlaceField
                id="venue"
                label={bi("Where the karya takes place (sunrise, lagna and Rahu kaal are for this place)", "कार्य कहाँ होना है (सूर्योदय, लग्न व राहुकाल इसी स्थान से)")}
                value={venue}
                onChange={setVenue}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DateField id="from" type="date" label={bi("Search from", "खोज प्रारम्भ तिथि (From)")} value={from} onChange={setFrom} min={today} />
                <DateField
                  id="to"
                  type="date"
                  label={bi("Search to · at most 24 months", "खोज अन्त तिथि (To) · अधिकतम 24 मास")}
                  value={to}
                  onChange={setTo}
                  min={from}
                  max={addMonths(from, MAX_MONTHS)}
                />
              </div>
              <ChipRow label={bi("Precision", "गणना सूक्ष्मता")} options={STEPS.map(([v, l]) => [v, bi(l)])} value={step} onChange={setStep} />
              <ChipRow label={bi("Shortest muhurat", "न्यूनतम मुहूर्त अवधि")} options={MIN_DUR.map(([v, l]) => [v, bi(l)])} value={minDur} onChange={setMinDur} />
              <ChipRow label={bi("Strictness", "कठोरता")} options={STRICT.map(([v, l]) => [v, bi(l)])} value={relaxed} onChange={setRelaxed} />
              <div>
                <p className="title-4 mb-2 text-ink">{bi("Bhadra", "भद्रा")}</p>
                <CheckRow
                  label={bi("Bhadra dwelling in Svarga/Patala allowed (standard: all of Vishti barred)", "स्वर्ग/पाताल-वास भद्रा ग्राह्य (मानक: सम्पूर्ण विष्टि वर्जित)")}
                  checked={bhadraVaas}
                  onChange={setBhadraVaas}
                />
              </div>
            </Fold>
          </Card>
        </div>

        <aside className="space-y-6 lg:col-span-2">
          <div className="space-y-3 lg:sticky lg:top-24">
            <Card>
              <button type="button" onClick={() => void run()} disabled={busy} className={`${btnPrimary} w-full`}>
                {busy ? <PiSpinnerGap className="h-5 w-5 animate-spin" aria-hidden /> : <PiMagnifyingGlass className="h-5 w-5" aria-hidden />}
                {bi("Find muhurat", "मुहूर्त निकालें")}
              </button>
              <div aria-live="polite" className="mt-3 space-y-3">
                {busy && <p className="body-6 text-ink-soft">{bi("Working out the panchang, planets and lagnas…", "पंचांग, ग्रह एवं लग्न गणना चल रही है…")}</p>}
                {err && <ErrorBox message={err} />}
              </div>
              <p className="caption-2 mt-3 text-ink-soft">{t.engineNote}</p>
            </Card>
            <SavedList tool="muhurat" onOpen={choose} />
          </div>
        </aside>
      </div>

      {res && (
        <div ref={resultsRef} className="scroll-mt-24 space-y-6">
          <MuhuratResults key={res.n} UM={UM} out={res.out} input={res.input} />
          <div data-noprint>
            <button type="button" onClick={() => window.print()} className={btnSecondary}>
              <PiPrinter className="h-5 w-5" aria-hidden /> {bi("Print / save as PDF", "प्रिंट / PDF सेव करें")}
            </button>
          </div>
        </div>
      )}

      <Notice>{t.disclaimer}</Notice>
    </div>
  );
}
