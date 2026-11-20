import type { Locale } from "@/i18n/config";
import type { Bi } from "./toolsBBi";
import { dmy } from "./toolsBBi";

// The Muhurat tool (Sarva-Muhurat Nirnayak): the app's own offline engine (UniversalMuhurta, Muhurta Chintamani /
// B.V. Raman rule tables), run in the browser. No backend call computes it; only saving the result (tool-results).
// The engine source is a lazily loaded module (~320 KB), fetched when the visitor opens the tool.

/* eslint-disable @typescript-eslint/no-explicit-any */

const engines: Partial<Record<Locale, any>> = {};
const loading: Partial<Record<Locale, Promise<any>>> = {};

async function source(): Promise<string> {
  return (await import("./toolsBEngines/muhuratSrc")).default;
}

/** The engine in the page's language (its texts and name tables follow window.__AS_LANG, read once at load). */
export function loadMuhuratEngine(lang: Locale): Promise<any> {
  if (engines[lang]) return Promise.resolve(engines[lang]);
  return (loading[lang] ??= source().then((src) => {
    const mod: { exports: any } = { exports: {} };
    new Function("module", "window", src)(mod, { __AS_LANG: lang });
    return (engines[lang] = mod.exports);
  }));
}

let worker: Worker | null = null;

/**
 * UM.find(input): synchronous and several seconds long for a long period, so it runs in a Web Worker holding its
 * own copy of the engine. If a worker cannot start here (or its answer cannot be sent back), it runs on the page.
 */
export async function runMuhuratFind(input: unknown, lang: Locale): Promise<any> {
  const src = await source();
  try {
    return await new Promise((resolve, reject) => {
      const code = `const mod={exports:{}};new Function("module","window",${JSON.stringify(src)})(mod,{__AS_LANG:${JSON.stringify(lang)}});
onmessage=function(e){try{postMessage({ok:true,out:mod.exports.find(e.data)})}catch(err){postMessage({ok:false,message:String(err&&err.message||err)})}};`;
      const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
      worker?.terminate();
      const w = (worker = new Worker(url));
      const done = () => {
        URL.revokeObjectURL(url);
        w.terminate();
        if (worker === w) worker = null;
      };
      w.onmessage = (e) => {
        done();
        if (e.data.ok) resolve(e.data.out);
        else reject(Object.assign(new Error(e.data.message), { engine: true }));
      };
      w.onerror = (e) => {
        done();
        reject(new Error(e.message || "worker"));
      };
      w.postMessage(input);
    });
  } catch (e) {
    if ((e as { engine?: boolean }).engine) throw e;
    return (await loadMuhuratEngine(lang)).find(input);
  }
}

// ─── Text of the result, ported from the app (muhuratToolText.ts) ───────────────────────────────

type Rows = Array<[string, string]>;

export function muhuratText(bi: Bi) {
  const GRADE_LABEL: [string, string][] = [
    ["Grade 1 — best", "ग्रेड 1 — श्रेष्ठ"],
    ["Grade 2 — good", "ग्रेड 2 — शुभ"],
    ["Grade 3 — middling", "ग्रेड 3 — मध्यम"],
  ];
  const BLOCK: Record<string, [string, string]> = {
    asta: ["Jupiter/Venus combust", "गुरु/शुक्र अस्त"],
    balyaVriddha: ["Jupiter/Venus infancy/old age", "गुरु/शुक्र बाल्य-वार्धक्य"],
    guruAditya: ["Gurvaditya", "गुर्वादित्य"],
    simhastha: ["Simhastha Jupiter", "सिंहस्थ गुरु"],
    adhik: ["Adhik/samsarpa/kshaya maas", "अधिक/संसर्प/क्षय मास"],
    chaturmas: ["Chaturmas", "चातुर्मास"],
    bhishmaPanchak: ["Bhishma panchak", "भीष्म पंचक"],
    kharmas: ["Kharmas", "खरमास"],
    holashtak: ["Holashtak", "होलाष्टक"],
    pitrupaksha: ["Pitru paksha", "पितृपक्ष"],
    bhadra: ["Bhadra", "भद्रा"],
    sankranti: ["Sankranti", "संक्रान्ति"],
    sankrantiAdj: ["Masant/masadi", "मासान्त/मासादि"],
    panchak: ["Panchak", "पंचक"],
    bhumiShayan: ["Bhoomi-shayan", "भूमि-शयन"],
  };
  const MODE: Record<string, [string, string]> = {
    reject: ["barred", "वर्जित"],
    warn: ["warning", "चेतावनी"],
    penalty: ["score deduction", "अंक-कटौती"],
    none: ["not applied", "लागू नहीं"],
    exempt: ["exempt", "मुक्त"],
    south: ["southward travel barred", "दक्षिण-यात्रा वर्जित"],
  };
  const dayStr = (d: any) => `${d.D}/${d.M}/${d.Y}`;

  return {
    GRADE_LABEL,
    /** The window in UTC ms, for the lagna table's "this muhurat" rows. */
    winSpan: (r: any) => {
      const s = (r.startJD - 2440587.5) * 864e5;
      return { s, e: s + (r.endH - r.startH) * 36e5 };
    },
    dateStr: (r: any) => `${r.calD}/${r.calM}/${r.calY}`,
    bestMoment: () => bi("Best moment", "श्रेष्ठ क्षण"),
    roleLabel: (UM: any, karya: string, role: string): string =>
      (UM.RULES[karya]?.roles.find((r: any) => r.key === role) || {}).label || role,
    rangeText: (input: any) => bi(`Search range: From ${dmy(input.from)} To ${dmy(input.to)}`, `खोज-अवधि: ${dmy(input.from)} से ${dmy(input.to)} तक`),
    /** The five best by grade, then score, then time. */
    topFive: (results: any[]): any[] =>
      results
        .slice()
        .sort((a, b) => a.grade - b.grade || b.score - a.score || a.startJD - b.startJD)
        .slice(0, 5),
    bestRow(UM: any, r: any): [string, string] {
      const hm = (x: string) => UM.hm12All(x) as string;
      const d = r.detail;
      return [
        `${r.calD}/${r.calM}/${r.calY} · ${r.vaar} · ${hm(r.start)}–${hm(r.end)}${r.nextDay ? bi(" (next date)", " (अगली तिथि)") : ""} · ${bi("Best moment", "श्रेष्ठ क्षण")} ${hm(r.best)}`,
        `${r.godhuli ? bi("Godhuli", "गोधूलि") : r.lagna + bi(" lagna", " लग्न")} · ${d.tithi} · ${d.nak} · ${r.maas}${bi(" month", " मास")}${d.yogas.length ? " · " + d.yogas.join(", ") : ""}`,
      ];
    },
    bestEmpty: (out: any) =>
      (out.fixedReject || []).length
        ? bi("This karya is barred for now for the reason above — no muhurat was worked out.", "ऊपर दिए कारण से यह कार्य अभी वर्जित है — कोई मुहूर्त नहीं निकाला गया।")
        : bi(
            "No acceptable muhurat in this period — widen the period or choose “Relaxed” strictness. See “Barred days” and the rules below.",
            "इस अवधि में कोई ग्राह्य मुहूर्त नहीं — अवधि बढ़ाएँ या \"शिथिल\" कठोरता चुनें। नीचे \"वर्जित दिन\" व नियम देखें।",
          ),
    bestNote: (out: any) =>
      out.counts.g1 === 0 && out.results.length
        ? bi(
            "No grade 1 found — a best nakshatra + tithi + weekday together with the person’s Chandra/Tara bala did not occur in this period; try a longer period.",
            "ग्रेड 1 नहीं मिला — उत्तम नक्षत्र+तिथि+वार का संयोग व्यक्ति के चन्द्र/तारा बल के साथ इस अवधि में नहीं बना; अवधि बढ़ाकर देखें।",
          )
        : "",
    personRows(UM: any, p: any): Rows {
      const rows: Rows = [
        [p.known === "birth" ? bi("Janma rashi", "जन्म राशि") : bi("Rashi", "राशि"), p.rashiName || "—"],
        [bi("Birth nakshatra", "जन्म नक्षत्र"), (p.nakName || bi("not known", "अज्ञात")) + (p.pada ? " – " + p.pada : "")],
      ];
      if (p.lagnaSign != null) rows.push([bi("Janma lagna", "जन्म लग्न"), UM.RASHI[p.lagnaSign]]);
      rows.push([
        bi("Based on", "आधार"),
        p.known === "birth"
          ? p.birth?.timeUnknown
            ? bi("date of birth (time taken as 12:00 PM)", "जन्म तिथि (समय 12:00 PM माना)")
            : bi("birth chart", "जन्म कुण्डली")
          : bi("name rashi", "नाम-राशि"),
      ]);
      return rows;
    },
    /** Consecutive barred days with the same reasons, merged into one row: [dates, reasons]. */
    barredSegments(UM: any, days: any[]): Rows {
      const seg: any[] = [];
      for (const d of days) {
        const k = d.reasons.join("; ");
        const last = seg[seg.length - 1];
        const jd = UM.julianDay(d.Y, d.M, d.D, 0);
        if (last && last.k === k && jd - last.jdEnd <= 1) Object.assign(last, { jdEnd: jd, end: d });
        else seg.push({ k, start: d, end: d, jdEnd: jd });
      }
      return seg.map((x) => [dayStr(x.start) + (x.start !== x.end ? " – " + dayStr(x.end) : ""), x.k]);
    },
    /** The karya's classical rules as [heading, text]. */
    ruleRows(UM: any, R: any): Rows {
      const T = R.tithi;
      const SH = bi("Shukla", "शुक्ल");
      const KR = bi("Krishna", "कृष्ण");
      const UT = bi("Best", "उत्तम");
      const MA = bi("Middling", "मध्यम");
      const VA = bi("Barred", "वर्जित");
      const tithi = T.shukla
        ? `${SH}: ${T.shukla.uttam.join(", ")} (${MA.toLowerCase()} ${T.shukla.madhyam.join(", ") || "—"}) · ${KR}: ${T.krishna.uttam.join(", ")} (${MA.toLowerCase()} ${T.krishna.madhyam.join(", ") || "—"})`
        : `${UT}: ${T.uttam.join(", ")} · ${MA}: ${(T.madhyam || []).join(", ") || "—"} · ${VA}: ${(T.varjit || []).join(", ")}${
            T.shuklaExtra ? bi(" · also in Shukla ", " · शुक्ल में अतिरिक्त ") + T.shuklaExtra.join(", ") : ""
          }${T.krishnaExtra ? bi(" · also in Krishna ", " · कृष्ण में अतिरिक्त ") + T.krishnaExtra.join(", ") : ""}`;
      const tithiMV = T.monthVarjit
        ? bi(" · barred in particular months: ", " · मास-विशेष वर्जित: ") +
          T.monthVarjit.map(([m, pk, tn]: [number, string, number]) => `${UM.MAAS[m]} ${pk === "S" ? SH : KR} ${tn}`).join(", ")
        : "";
      const L = R.lagna || {};
      const rs = (a?: number[]) => (a || []).map((i) => UM.RASHI[i]).join(", ");
      const lagna = L.none
        ? bi("No lagna rule (daytime only)", "लग्न-नियम नहीं (केवल दिन-काल)")
        : `${UT}: ${rs(L.uttam) || bi("none in particular", "कोई विशेष नहीं")} · ${MA}: ${rs(L.madhyam) || "—"} · ${VA}: ${rs(L.varjit) || "—"} · ${bi(
            "a lagna 8th/12th from the janma rashi is barred",
            "जन्मराशि से 8वाँ/12वाँ लग्न वर्जित",
          )}${L.from8thOfLagna ? bi(" · 8th from the janma lagna barred", " · जन्म-लग्न से अष्टम वर्जित") : ""}`;
      // without the newer keys the engine's defaults apply: balya-vriddha and gurvaditya as asta
      const B = R.blocks;
      const onlySh = B.shukraAsta && (!B.asta || B.asta === "none");
      const BE: Record<string, any> = { balyaVriddha: B.shukraAsta || B.asta, guruAditya: onlySh ? "none" : B.asta, ...B };
      const blocks =
        Object.keys(BLOCK)
          .filter((k) => BE[k] != null)
          .map(
            (k) =>
              `${bi(BLOCK[k])}: ${MODE[BE[k]] ? bi(MODE[BE[k]]) : BE[k]}${
                k === "chaturmas" && (B.chaturmasAllow || []).length
                  ? " (" + B.chaturmasAllow.map((i: number) => UM.MAAS[i]).join(", ") + bi(" exempt)", " मुक्त)")
                  : ""
              }`,
          )
          .join(" · ") + (R.avoidNoonSandhya ? bi(" · exact midday, both sandhyas and midnight: barred", " · ठीक मध्याह्न, दोनों सन्ध्या व मध्यरात्रि: वर्जित") : "");
      const rows: Array<[string, string] | false> = [
        [bi("Nakshatra", "नक्षत्र"), `${UT}: ${R.nak.uttam.join(", ")}${R.nak.madhyam.length ? `\n${MA}: ${R.nak.madhyam.join(", ")}` : ""}`],
        [bi("Tithi (1–15; 15 = Purnima/Amavasya)", "तिथि (1–15; 15 = पूर्णिमा/अमावस्या)"), tithi + tithiMV],
        [
          bi("Weekday", "वार"),
          `${bi("Good", "शुभ")}: ${R.vaar.shubh.join(", ")} · ${MA}: ${R.vaar.madhyam.join(", ") || "—"} · ${bi("Avoid", "त्याज्य")}: ${R.vaar.varjit.join(", ") || "—"}`,
        ],
        [bi("Lagna", "लग्न"), lagna],
        [bi("Barred periods", "काल-वर्जन"), blocks],
        !!R.age && [bi("Age rule (warning)", "आयु-नियम (चेतावनी)"), R.age.note],
        [
          bi("For every karya", "सार्वत्रिक"),
          bi(
            "Rahu kaal, Yamaganda and Gulik kaal barred · Vyatipata/Vaidhriti barred · lagna sandhi barred · gandanta, dagdha/visha/hutashan and yamaghanta/mrityu yogas lower the score · Chandra bala 4/8/12 barred · Vipat/Pratyari/Vadha tara barred · Sarvartha-siddhi/Amrit-siddhi/Ravi/Pushya/Pushkar yogas add a bonus",
            "राहुकाल, यमगण्ड व गुलिक काल वर्जित · व्यतीपात/वैधृति वर्जित · लग्न-सन्धि वर्जित · गण्डान्त, दग्ध/विष/हुताशन, यमघण्ट/मृत्यु योग अंक-कटौती · चन्द्र बल 4/8/12 वर्जित · विपत्/प्रत्यरि/वध तारा वर्जित · सर्वार्थसिद्धि/अमृतसिद्धि/रवि/पुष्य/पुष्कर योग बोनस",
          ),
        ],
        [bi("Shastra notes", "शास्त्र-टिप्पणी"), R.notes.map((n: string) => "• " + n).join("\n")],
        R.disputed.length > 0 && [bi("Differing views (the engine’s choice)", "मत-भेद (इंजन का चयन)"), R.disputed.map((n: string) => "• " + n).join("\n")],
        R.sources.length > 0 && [bi("Sources", "स्रोत"), R.sources.join(" · ")],
      ];
      return rows.filter((x): x is [string, string] => !!x);
    },
  };
}

/** The persons and venue the form keeps, so a saved result reopens with the form as it was. */
export type PlaceForm = { city: number | null; custom: boolean; name: string; lat: string; lon: string; tz: string };
export type PersonForm = { name: string; date: string; time: string; place: PlaceForm };
