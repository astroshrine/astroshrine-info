import type { Locale } from "@/i18n/config";
import { pad2, type Bi } from "./toolsBBi";

// The Yagyopavit (Upanayana) Muhurat finder: the app's own offline engine (the @engine block of its tool page),
// run in the browser; it reports its progress and yields between slices, so the page stays responsive. No
// backend call computes it. The source is a lazily loaded module, fetched when the visitor opens the tool.

/* eslint-disable @typescript-eslint/no-explicit-any */

const engines: Partial<Record<Locale, any>> = {};
const loading: Partial<Record<Locale, Promise<any>>> = {};

const EXPORTS = "{search, upanayanLagnaDay, RASHI, NAK, YOGA, VAR, RLORD, NAKLORD, ayanamsa, Tof, jdOf, hm12, masaLabel, GR, GRNAME, RULES, ord}";

export function loadYagyopavitEngine(lang: Locale): Promise<any> {
  if (engines[lang]) return Promise.resolve(engines[lang]);
  return (loading[lang] ??= import("./toolsBEngines/yagyopavitSrc").then(({ default: src }) => {
    // the engine reads its language from window.__AS_LANG once
    return (engines[lang] = new Function(`var window = {__AS_LANG: ${JSON.stringify(lang)}};\n${src}\nreturn ${EXPORTS};`)());
  }));
}

export type Place = { name: string; lat: number; lon: number; tz: number };
export type Last = {
  id: number;
  E: any;
  r: any;
  opt: any;
  batuk: any;
  meta: { name: string; bp: Place; wp: Place; bd: string; bt: string };
  /** The day's lagna table by date, built when its card is first opened. */
  lagna: Record<string, any>;
};
type Row = [string, string];
type Cls = "shubh" | "mid" | "bad";

/**
 * A finished search as saved (JSON): no engine or lagna cache, and r.days cut to the one field the note reads, each
 * day's Guru bala (the whole list is hundreds of KB). The page adds the engine and an empty cache when reopening.
 */
export const toSaved = ({ r, opt, batuk, meta }: Last) => ({
  r: { ...r, days: r.days.map((d: any) => ({ df: { juC: d.df.juC } })) },
  opt,
  batuk,
  meta,
});

const MONTHS: [string, string][] = [
  ["January", "जनवरी"], ["February", "फ़रवरी"], ["March", "मार्च"], ["April", "अप्रैल"], ["May", "मई"], ["June", "जून"],
  ["July", "जुलाई"], ["August", "अगस्त"], ["September", "सितंबर"], ["October", "अक्टूबर"], ["November", "नवंबर"], ["December", "दिसंबर"],
];
const loc = (ms: number, tz: number) => new Date(ms + tz * 3600000);
/** 24-hour wall clock of the venue; displayed through hm12. */
export const hhmm = (ms: number, tz: number) => {
  const d = loc(ms, tz);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
};

/** The view model of a finished search: everything the page prints, as text rows. */
export function yagyopavitView(bi: Bi, L: Last) {
  const { E, r, opt, meta: m, batuk: b } = L;
  const tz = opt.venue.tz;
  const n = r.nat;
  const fD = (iso: string) => {
    const p = iso.split("-");
    return `${+p[2]} ${bi(MONTHS[+p[1] - 1] as [string, string])} ${p[0]}`;
  };
  const fT = (ms: number): string => E.hm12(hhmm(ms, tz));
  const fDs = (ms: number) => {
    const d = loc(ms, tz);
    return `${d.getUTCDate()} ${bi(MONTHS[d.getUTCMonth()] as [string, string]).slice(0, 3)} ${d.getUTCFullYear()}`;
  };
  const dms = (x: number) => {
    const s = Math.floor(x / 30);
    const d = x % 30;
    return `${E.RASHI[s]} ${Math.floor(d)}°${pad2(Math.floor((d % 1) * 60))}′`;
  };
  const ageTxt = (ms: number) => {
    const d = loc(ms, tz);
    let y = d.getUTCFullYear() - b.y;
    let mo = d.getUTCMonth() + 1 - b.m;
    if (d.getUTCDate() - b.d < 0) mo--;
    if (mo < 0) {
      y--;
      mo += 12;
    }
    return bi(`${y} years ${mo} months`, `${y} वर्ष ${mo} मास`);
  };
  const paksha = (ti: any) => (ti.paksha === "S" ? bi("Shukla", "शुक्ल") : bi("Krishna", "कृष्ण"));
  const balWord = (c: Cls, ch?: boolean) =>
    c === "shubh" ? bi("favourable", "शुभ") : c === "mid" ? (ch ? bi("moderate", "मध्यम") : bi("pujya", "पूज्य")) : bi("adverse", "नेष्ट");
  const house = (h: number) => bi(E.ord(h), `${h}वाँ`);
  const masa = (e: any) => E.masaLabel(r.cal, e.li, e.t.n, opt.masaSys) as string;
  const gname = ["", bi("Best", "श्रेष्ठ"), bi("Very good", "उत्तम"), bi("Fair", "सामान्य")];

  const c = [0, 0, 0];
  r.wins.forEach((w: any) => c[w.grade - 1]++);
  const top = r.wins.slice().sort((x: any, y: any) => y.ev.score - x.ev.score || y.dur - x.dur)[0];
  const ju: Cls[] = r.days.map((d: any) => d.df.juC);
  const note = [
    ju.filter((x) => x === "bad").length > ju.length / 2
      ? bi(
          "For most of this period Jupiter is in an adverse house (4, 8 or 12) from the batuk’s janma rashi, so there are very few muhurats.",
          "इस अवधि के अधिकांश भाग में गुरु बटुक की जन्म राशि से नेष्ट (4, 8 या 12) भाव में है, इसलिए मुहूर्त बहुत कम हैं।",
        )
      : ju.filter((x) => x === "mid").length > ju.length / 2
        ? bi(
            "For most of this period Jupiter is in a pujya house. By tradition a Guru shanti/puja is done before the Upanayana, so the scores look lower.",
            "इस अवधि के अधिकांश भाग में गुरु पूज्य भाव में है। परंपरा अनुसार उपनयन से पूर्व गुरु शान्ति/पूजन कराया जाता है, इसलिए अंक कम दिखते हैं।",
          )
        : "",
    bi("“Best” only means the best of the available options; it does not guarantee any outcome.", "\"सर्वोत्तम\" का अर्थ केवल उपलब्ध विकल्पों में श्रेष्ठ है; यह किसी परिणाम की गारंटी नहीं है।"),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    fD,
    batuk: [
      [bi("Birth", "जन्म"), `${fD(m.bd)}, ${E.hm12(m.bt)}`],
      [bi("Place", "स्थान"), m.bp.name],
      [bi("Lagna", "लग्न"), dms(n.asc)],
      [bi("Janma rashi", "जन्म राशि"), `${E.RASHI[n.rashi]} (${bi("lord", "स्वामी")} ${E.RLORD[n.rashi]})`],
      [bi("Nakshatra", "नक्षत्र"), `${E.NAK[n.nak]} ${bi("pada", "चरण")} ${n.pada} (${E.NAKLORD[n.nak % 9]})`],
      [bi("Tithi", "तिथि"), `${paksha(n.tithi)} ${n.tithi.name}`],
      [bi("Yoga / Karana", "योग / करण"), `${E.YOGA[n.yoga]} / ${n.karana}`],
      [bi("Birth weekday", "जन्म वार"), E.VAR[n.vara]],
    ] as Row[],
    age: ageTxt(r.from),
    basis: [
      [bi("Upanayana place", "उपनयन स्थान"), m.wp.name],
      [bi("Period", "अवधि"), `${fDs(r.from)}${bi(" to ", " से ")}${fDs(r.to - 86400000)}${bi("", " तक")}`],
      [bi("Time window", "समय-सीमा"), opt.span === "full" ? bi("Sunrise–sunset", "सूर्योदय–सूर्यास्त") : bi("Forenoon (purvahna)", "पूर्वाह्न")],
      [bi("Ayanamsha", "अयनांश"), `${bi("Lahiri", "लाहिरी")} ${E.ayanamsa(E.Tof(E.jdOf(r.from))).toFixed(3)}°`],
      [bi("Guru bala mode", "गुरु बल मोड"), opt.strict ? bi("Favourable only", "केवल शुभ") : bi("Favourable + pujya", "शुभ + पूज्य")],
    ] as Row[],
    counts: [bi("Grade 1 · Best", "ग्रेड 1 · श्रेष्ठ"), bi("Grade 2 · Very good", "ग्रेड 2 · उत्तम"), bi("Grade 3 · Fair", "ग्रेड 3 · सामान्य")].map((label, i) => ({ n: c[i], label })),
    top: top
      ? `${bi("Best muhurat: ", "सर्वोत्तम मुहूर्त: ")}${fD(top.iso)}, ${E.VAR[top.wd]} · ${fT(top.s)}–${fT(top.e)}${bi(" · best moment ", " · श्रेष्ठ क्षण ")}${fT(top.best)}`
      : null,
    note,
    head: (w: any) => {
      const e = w.ev;
      return {
        date: `${fD(w.iso)} · ${E.VAR[w.wd]}`,
        time: `${fT(w.s)} – ${fT(w.e)}`,
        dur: `(${Math.round(w.dur)}${bi(" min)", " मिनट)")}`,
        meta: `${masa(e)} ${paksha(e.t)} ${e.t.name} · ${E.NAK[e.nk.i]} · ${E.RASHI[e.L]}${bi(" lagna", " लग्न")}`,
        best: `${bi("Best moment ", "श्रेष्ठ क्षण ")}${fT(w.best)}`,
        grade: `${bi("Grade ", "ग्रेड ")}${w.grade} · ${gname[w.grade]}`,
      };
    },
    det: (w: any) => {
      const e = w.ev;
      const upay = [
        w.df.juC === "mid" && bi("Jupiter is pujya — by tradition a Guru (Brihaspati) puja/shanti is done before the samskara", "गुरु पूज्य है — संस्कार से पूर्व गुरु (बृहस्पति) पूजन/शान्ति की परंपरा"),
        w.df.suC === "mid" && bi("Sun is pujya — by tradition arghya/puja is offered to the Sun", "सूर्य पूज्य है — सूर्य को अर्घ्य/पूजन की परंपरा"),
        e.tara === 1 && bi("Janma tara — some traditions prescribe daan/shanti", "जन्म तारा — कुछ परंपराओं में दान/शान्ति का विधान"),
      ].filter(Boolean) as string[];
      return {
        panchang: [
          [bi("Tithi", "तिथि"), `${paksha(e.t)} ${e.t.name}`],
          [bi("Nakshatra", "नक्षत्र"), `${E.NAK[e.nk.i]} ${bi("pada", "चरण")} ${e.nk.pada}`],
          [bi("Yoga", "योग"), E.YOGA[e.yg]],
          [bi("Karana", "करण"), e.kar],
          [bi("Weekday", "वार"), E.VAR[w.wd]],
          [bi("Month", "मास"), masa(e)],
          [bi("Sunrise / sunset", "सूर्योदय / सूर्यास्त"), `${fT(w.rise)} / ${fT(w.set)}`],
          [bi("Age", "आयु"), ageTxt(w.s)],
        ] as Row[],
        bala: [
          [bi("Guru bala", "गुरु बल"), `${house(w.df.juH)} · ${balWord(w.df.juC)}`, w.df.juC],
          [bi("Surya bala", "सूर्य बल"), `${house(w.df.suH)} · ${balWord(w.df.suC)}`, w.df.suC],
          [bi("Chandra bala", "चन्द्र बल"), `${house(e.chH)} · ${balWord(e.chC, true)}`, e.chC],
          [bi("Tara", "तारा"), E.RULES.taraName[e.tara - 1], e.tara === 1 ? "mid" : "shubh"],
        ] as Array<[string, string, Cls]>,
        planetsTitle: `${bi("Muhurat lagna ", "मुहूर्त लग्न ")}${E.RASHI[e.L]}${bi(" — planets by house", " — ग्रह भाव")}`,
        planets: E.GR.map((k: string) => `${e.hs[k]} · ${E.GRNAME[k]}`) as string[],
        good: e.good as string[],
        mid: e.mid as string[],
        upay,
      };
    },
  };
}

/** The day's lagna table of the Upanayana (built on first open, kept per date). */
export const yagyopavitLagnaRows = (L: Last, iso: string) =>
  L.lagna[iso] || (L.lagna[iso] = L.E.upanayanLagnaDay(iso, L.r.nat, L.opt, L.r.wins, (ms: number) => hhmm(ms, L.opt.venue.tz)));
