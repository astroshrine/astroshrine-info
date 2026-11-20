"use client";

import { useEffect, useRef, useState } from "react";
import { PiMagnifyingGlass, PiPrinter, PiSpinnerGap } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { addMonths, makeBi, utcDay } from "@/lib/services/toolsBBi";
import { todayYmd } from "@/lib/services/toolsBCommon";
import { saveResult } from "@/lib/services/toolsBSaved";
import { loadYagyopavitEngine, toSaved, type Last } from "@/lib/services/toolsBYagyopavit";
import type { PlaceForm } from "@/lib/services/toolsBMuhurat";
import { Card, ErrorBox, Notice, btnPrimary, btnSecondary } from "../../kundli/_components/ui";
import { Gate, PanelSkeleton, ToolPage } from "../_b/shell";
import SavedList from "../_b/SavedList";
import { CheckRow, ChipRow, DateField, Fold, PlaceField, PrintStyles, TextField, placeOf, placeVal } from "../_b/muhuratUi";
import YagyopavitResults from "./YagyopavitResults";

/* eslint-disable @typescript-eslint/no-explicit-any */

const text = defineMessages({
  hi: {
    eyebrow: "ज्योतिषी टूल · मुहूर्त",
    title: "यज्ञोपवीत मुहूर्त निर्णायक",
    intro: "गुरु · सूर्य · चन्द्र बल एवं तारा शुद्धि · स्वतः पंचांग गणना · ग्रेड 1-2-3 मुहूर्त सूची",
    what: "यज्ञोपवीत मुहूर्त",
    engineFailed: "यह टूल इस ब्राउज़र में शुरू नहीं हो सका। पेज फिर से खोलें।",
    engineNote: "गणना आपके ब्राउज़र में ही होती है, ऐप वाले इंजन से। कोई पॉइंट नहीं कटते।",
    disclaimer:
      "ये टूल्स सिर्फ़ आपकी रीडिंग में मदद के लिए हैं। इनका रिज़ल्ट न पूरी तरह सच का दावा है, न ही झूठ: ये पारंपरिक सिद्धांतों पर आधारित एक व्याख्या है। क्लाइंट को कुछ भी बताने से पहले अपने ज्ञान और विवेक का उपयोग करें।",
  },
  en: {
    eyebrow: "Astrologer tool · Muhurat",
    title: "Yagyopavit Muhurat Finder",
    intro: "Guru · Surya · Chandra bala and Tara shuddhi · automatic panchang · Grade 1-2-3 muhurat list",
    what: "the Yagyopavit muhurat finder",
    engineFailed: "This tool could not start in this browser. Reload the page.",
    engineNote: "The calculation runs in your browser, with the same engine as the app. No points are taken.",
    disclaimer:
      "These tools are AI-assisted aids to support your own reading. Their output is neither a guaranteed truth nor a false claim: it is an interpretation based on traditional principles. Please apply your own knowledge and judgement before sharing anything with a client.",
  },
});

type OptKey = "step" | "strict" | "minDur" | "span" | "masaSys";
const OPTS: Array<{ k: OptKey; en: string; hi: string; items: Array<[number | string, string, string]> }> = [
  { k: "step", en: "Calculation precision", hi: "गणना सूक्ष्मता", items: [[5, "Normal (5 minutes)", "सामान्य (5 मिनट)"], [3, "Fine (3 minutes)", "सूक्ष्म (3 मिनट)"], [2, "Very fine (2 minutes)", "अति सूक्ष्म (2 मिनट)"]] },
  { k: "strict", en: "Guru bala strictness", hi: "गुरु बल कठोरता", items: [[0, "Favourable + pujya (with shanti): standard", "शुभ + पूज्य (शान्ति सहित): मानक"], [1, "Favourable Guru only (very strict)", "केवल शुभ गुरु (अति कठोर)"]] },
  { k: "minDur", en: "Shortest muhurat", hi: "न्यूनतम मुहूर्त अवधि", items: [[12, "12 minutes", "12 मिनट"], [18, "18 minutes", "18 मिनट"], [24, "24 minutes (1 ghati)", "24 मिनट (1 घटी)"], [48, "48 minutes (2 ghati)", "48 मिनट (2 घटी)"]] },
  { k: "span", en: "Time window", hi: "समय-सीमा", items: [["purvahna", "Sunrise to midday (forenoon)", "सूर्योदय से मध्याह्न (पूर्वाह्न)"], ["full", "Sunrise to sunset", "सूर्योदय से सूर्यास्त"]] },
  { k: "masaSys", en: "Month system (display)", hi: "मास पद्धति (प्रदर्शन)", items: [["purnimanta", "Purnimanta (North India)", "पूर्णिमान्त (उत्तर भारत)"], ["amanta", "Amanta (South/West)", "अमान्त (दक्षिण/पश्चिम)"]] },
];

type Form = {
  name: string;
  bd: string;
  bt: string;
  bp: PlaceForm;
  wp: PlaceForm;
  sd: string;
  td: string;
  eldest: boolean;
  step: number | string;
  strict: number | string;
  minDur: number | string;
  span: number | string;
  masaSys: number | string;
};

export default function YagyopavitView() {
  const t = useT(text);
  const locale = useLocale();
  const [loaded, setLoaded] = useState<{ lang: string; E?: any; failed?: boolean } | null>(null);
  useEffect(() => {
    let live = true;
    loadYagyopavitEngine(locale).then(
      (E) => live && setLoaded({ lang: locale, E }),
      () => live && setLoaded({ lang: locale, failed: true }),
    );
    return () => {
      live = false;
    };
  }, [locale]);
  const ready = loaded?.lang === locale ? loaded : null;

  return (
    <ToolPage eyebrow={t.eyebrow} title={t.title} intro={t.intro}>
      <Gate what={t.what} astrologerOnly>
        {!ready ? <PanelSkeleton /> : ready.failed ? <ErrorBox message={t.engineFailed} /> : <YagyopavitForm key={locale} E={ready.E} />}
      </Gate>
    </ToolPage>
  );
}

function YagyopavitForm({ E }: { E: any }) {
  const t = useT(text);
  const locale = useLocale();
  const bi = makeBi(locale);
  const today = todayYmd();
  const [f, setF] = useState<Form>(() => ({
    name: "", bd: "", bt: "", bp: placeOf(0), wp: placeOf(0), sd: today, td: addMonths(today, 10), eldest: false,
    step: 3, strict: 0, minDur: 18, span: "purvahna", masaSys: "purnimanta",
  }));
  const [err, setErr] = useState("");
  const [pct, setPct] = useState<number | null>(null);
  const [L, setL] = useState<Last | null>(null);
  const runId = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const jump = useRef(false);

  useEffect(() => {
    if (L && jump.current) {
      jump.current = false;
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [L]);

  const patch = (p: Partial<Form>) => setF((o) => ({ ...o, ...p }));
  /** To follows From: From + 10 months unless it is already within From … From + 24 months. */
  const setFrom = (sd: string) => setF((o) => ({ ...o, sd, td: !o.td || o.td < sd || o.td > addMonths(sd, 24) ? addMonths(sd, 10) : o.td }));
  const place = (p: PlaceForm) => {
    const v = placeVal(p, bi("Other place", "अन्य स्थान"), locale === "hi");
    return v && p.custom && Math.abs(v.lat) > 66 ? null : v;
  };
  const fD = (iso: string) => iso.split("-").reverse().join("/");

  function run() {
    if (pct !== null) return;
    const fail = (en: string, hi: string) => setErr(bi(en, hi));
    setErr("");
    const bp = place(f.bp);
    const wp = place(f.wp);
    if (!f.bd || !f.bt) return fail("Enter both the batuk’s date and time of birth.", "बटुक की जन्म तिथि और जन्म समय दोनों भरें।");
    if (!bp) return fail("Enter a valid latitude, longitude and time zone for the place of birth.", "जन्म स्थान का अक्षांश, रेखांश और समय क्षेत्र सही भरें।");
    if (!wp) return fail("Enter a valid latitude, longitude and time zone for the Upanayana place.", "उपनयन स्थान का अक्षांश, रेखांश और समय क्षेत्र सही भरें।");
    if (!f.sd || !f.td) return fail("Choose the search start (From) and end (To) dates.", "खोज की प्रारम्भ (From) व अन्त (To) तिथि चुनें।");
    if (f.td < f.sd) return fail("The end date (To) cannot be before the start date (From).", "अन्त तिथि (To) प्रारम्भ तिथि (From) से पहले नहीं हो सकती।");
    const max = fD(addMonths(f.sd, 24));
    if (f.td > addMonths(f.sd, 24)) return fail(`The search covers at most 24 months: set the end date (To) on or before ${max}.`, `खोज-अवधि अधिकतम 24 मास: अन्त तिथि (To) ${max} या उससे पहले रखें।`);
    if (utcDay(f.sd) < utcDay(f.bd)) return fail("The search must start after the date of birth.", "खोज प्रारम्भ तिथि जन्म तिथि के बाद की होनी चाहिए।");
    const b = f.bd.split("-").map(Number);
    const tm = f.bt.split(":").map(Number);
    const s = f.sd.split("-").map(Number);
    const batuk = { y: b[0], m: b[1], d: b[2], lat: bp.lat, lon: bp.lon, tz: bp.tz, utc: Date.UTC(b[0], b[1] - 1, b[2], tm[0], tm[1]) - bp.tz * 3600000 };
    const opt = {
      venue: wp,
      start: { y: s[0], m: s[1], d: s[2] },
      days: (utcDay(f.td) - utcDay(f.sd)) / 86400000 + 1,
      step: +f.step, strict: +f.strict, minDur: +f.minDur, span: f.span, eldest: f.eldest, masaSys: f.masaSys,
    };
    const meta = { name: f.name.trim() || bi("Batuk", "बटुक"), bp, wp, bd: f.bd, bt: f.bt };
    const id = ++runId.current;
    setL(null);
    setPct(0);
    // a beat for the progress to paint; search() then yields between its slices
    setTimeout(() => {
      try {
        E.search(
          { batuk, opt },
          (p: number) => id === runId.current && setPct(Math.round(p * 100)),
          (r: any) => {
            if (id !== runId.current) return;
            jump.current = true;
            const last: Last = { id, E, r, opt, batuk, meta, lagna: {} };
            setL(last);
            setPct(null);
            void saveResult("yagyopavit", toSaved(last), f, meta.name);
          },
        );
      } catch (e) {
        if (id !== runId.current) return;
        setErr((e as Error)?.message ?? String(e));
        setPct(null);
      }
    }, 30);
  }

  function reopen(saved: { input: any; result: any }) {
    const input = saved.input as Partial<Form>;
    setF((o) => ({ ...o, ...input }));
    setErr("");
    jump.current = true;
    setL({ id: ++runId.current, E, ...saved.result, lagna: {} });
  }

  const busy = pct !== null;
  const wpName = place(f.wp)?.name ?? "—";

  return (
    <div className="space-y-8">
      <PrintStyles />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5" data-noprint>
        <div className="space-y-6 lg:col-span-3">
          <Card title={bi("Batuk’s birth details", "बटुक का जन्म विवरण")}>
            <div className="space-y-4">
              <TextField id="y-name" label={bi("Name", "नाम")} value={f.name} onChange={(name) => patch({ name })} placeholder={bi("Batuk’s name", "बटुक का नाम")} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DateField id="y-bd" type="date" label={bi("Date of birth", "जन्म तिथि")} value={f.bd} onChange={(bd) => patch({ bd })} min="1900-01-01" max={today} />
                <DateField id="y-bt" type="time" label={bi("Time of birth", "जन्म समय")} value={f.bt} onChange={(bt) => patch({ bt })} />
              </div>
              <PlaceField id="y-bp" label={bi("Place of birth", "जन्म स्थान")} value={f.bp} onChange={(bp) => patch({ bp })} />
              <CheckRow label={bi("The batuk is the eldest (first) child", "बटुक ज्येष्ठ (पहली) संतान है")} checked={f.eldest} onChange={(eldest) => patch({ eldest })} />
            </div>
          </Card>

          <Card>
            <Fold title={`${bi("Upanayana place and period", "उपनयन स्थान एवं अवधि")}: ${wpName} · ${fD(f.sd)} – ${fD(f.td)}`}>
              <PlaceField
                id="y-wp"
                label={bi("Where the Yagyopavit will be held (lagna and sunrise are taken for this place)", "यज्ञोपवीत कहाँ होना है (लग्न व सूर्योदय इसी स्थान से)")}
                value={f.wp}
                onChange={(wp) => patch({ wp })}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DateField id="y-sd" type="date" label={bi("Search from", "खोज प्रारम्भ तिथि (From)")} value={f.sd} onChange={setFrom} min={today} />
                <DateField id="y-td" type="date" label={bi("Search to · at most 24 months", "खोज अन्त तिथि (To) · अधिकतम 24 मास")} value={f.td} onChange={(td) => patch({ td })} min={f.sd} max={addMonths(f.sd, 24)} />
              </div>
              {OPTS.map((o) => (
                <ChipRow key={o.k} label={bi(o.en, o.hi)} options={o.items.map(([v, en, hi]) => [v, bi(en, hi)] as [number | string, string])} value={f[o.k]} onChange={(v) => patch({ [o.k]: v })} />
              ))}
            </Fold>
          </Card>
        </div>

        <aside className="space-y-6 lg:col-span-2">
          <div className="space-y-3 lg:sticky lg:top-24">
            <Card>
              <button type="button" onClick={run} disabled={busy} className={`${btnPrimary} w-full`}>
                {busy ? <PiSpinnerGap className="h-5 w-5 animate-spin" aria-hidden /> : <PiMagnifyingGlass className="h-5 w-5" aria-hidden />}
                {busy ? `${bi("Calculating panchang and lagnas…", "पंचांग एवं लग्न गणना चल रही है…")} ${pct}%` : bi("Find muhurat", "मुहूर्त निकालें")}
              </button>
              {busy && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken" role="progressbar" aria-valuenow={pct ?? 0} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-brand transition-[width]" style={{ width: `${pct}%` }} />
                </div>
              )}
              <div aria-live="polite" className="mt-3">
                {err && <ErrorBox message={err} />}
              </div>
              <p className="caption-2 mt-3 text-ink-soft">{t.engineNote}</p>
            </Card>
            <SavedList tool="yagyopavit" onOpen={reopen} />
          </div>
        </aside>
      </div>

      {L && (
        <div ref={resultsRef} key={L.id} className="scroll-mt-24 space-y-6">
          <YagyopavitResults L={L} />
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
