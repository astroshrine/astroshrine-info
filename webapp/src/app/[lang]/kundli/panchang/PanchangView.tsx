"use client";

import { use } from "react";
import { browser } from "react-dom";
import { useSearchParams } from "next/navigation";
import { PiCaretLeft, PiCaretRight } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import {
  day,
  grahaName,
  hm,
  isValidTimeZone,
  localToday,
  nakshatraName,
  termName,
  when,
  type Anga,
  type BirthPlace,
  type Chogh,
  type Panchang,
  type Span,
} from "@/lib/jyotish";
import { fetchPanchang } from "@/lib/services/jyotish";
import PlaceSearch from "../_components/PlaceSearch";
import { useSavedProfile } from "../_components/profile";
import { Card, CardSkeleton, Disclaimer, ErrorBox, KV, Notice, PageHeader, SignInPrompt, btnSmall, inputCls, labelCls } from "../_components/ui";
import { jyotishErrorText, useJyotish } from "../_components/useJyotish";

const text = defineMessages({
  hi: {
    panchang: "पंचांग",
    titleFor: (date: string) => `${date} का पंचांग`,
    intro: "किसी भी दिन और जगह की तिथि, नक्षत्र, योग, करण, राहुकाल और चौघड़िया।",
    date: "तिथि",
    previousDay: "पिछला दिन",
    nextDay: "अगला दिन",
    place: "स्थान",
    needPlace: "पंचांग देखने के लिए स्थान खोजें। जन्म विवरण सहेजा हो तो जन्म स्थान अपने आप भर जाता है।",
    signInWhat: "पंचांग",
    span: (from: string, to: string) => `${from} से ${to} तक`,
    range: (from: string, to: string) => `${from} से ${to}`,
    until: (time: string) => `${time} तक`,
    none: "नहीं",
    now: "अभी",
    nature: { shubh: "शुभ", madhyam: "सामान्य", ashubh: "अशुभ" },
    paksha: { shukla: "शुक्ल पक्ष", krishna: "कृष्ण पक्ष" },
    tithi: "तिथि",
    nakshatra: "नक्षत्र",
    yoga: "योग",
    karana: "करण",
    month: "मास",
    monthValue: (amanta: string, adhika: boolean, purnimanta: string) =>
      `${amanta}${adhika ? " (अधिक)" : ""} अमांत · ${purnimanta} पूर्णिमांत`,
    dayLord: "वार स्वामी",
    sunMoon: "सूर्य और चंद्र",
    sunrise: "सूर्योदय",
    sunset: "सूर्यास्त",
    moonrise: "चंद्रोदय",
    moonset: "चंद्रास्त",
    sunriseNote: "सूर्योदय हिंदू पद्धति से (बिंब का केंद्र, अपवर्तन रहित), इसलिए सामान्य पंचांगों से कुछ मिनट बाद।",
    muhurat: "मुहूर्त काल",
    rahuKaal: "राहुकाल",
    yamaganda: "यमगंड",
    gulika: "गुलिक",
    abhijit: "अभिजित",
    noAbhijit: "बुधवार को नहीं लिया जाता",
    choghadiya: "चौघड़िया",
    day: "दिन",
    night: "रात",
  },
  en: {
    panchang: "Panchang",
    titleFor: (date) => `Panchang for ${date}`,
    intro: "Tithi, nakshatra, yoga, karana, Rahu Kaal and Choghadiya for any day and place.",
    date: "Date",
    previousDay: "Previous day",
    nextDay: "Next day",
    place: "Place",
    needPlace: "Search for a place to see its panchang. If you have saved birth details, the place of birth is filled in for you.",
    signInWhat: "the panchang",
    span: (from, to) => `${from} to ${to}`,
    range: (from, to) => `${from} to ${to}`,
    until: (time) => `until ${time}`,
    none: "None",
    now: "Now",
    nature: { shubh: "Auspicious", madhyam: "Neutral", ashubh: "Inauspicious" },
    paksha: { shukla: "Shukla paksha", krishna: "Krishna paksha" },
    tithi: "Tithi",
    nakshatra: "Nakshatra",
    yoga: "Yoga",
    karana: "Karana",
    month: "Month",
    monthValue: (amanta, adhika, purnimanta) => `${adhika ? "Adhika " : ""}${amanta} (amanta) · ${purnimanta} (purnimanta)`,
    dayLord: "Day lord",
    sunMoon: "Sun and Moon",
    sunrise: "Sunrise",
    sunset: "Sunset",
    moonrise: "Moonrise",
    moonset: "Moonset",
    sunriseNote:
      "Sunrise follows the Hindu convention (centre of the disc, no refraction), so it is a few minutes later than in common almanacs.",
    muhurat: "Muhurat timings",
    rahuKaal: "Rahu Kaal",
    yamaganda: "Yamaganda",
    gulika: "Gulika",
    abhijit: "Abhijit",
    noAbhijit: "Not taken on Wednesdays",
    choghadiya: "Choghadiya",
    day: "Day",
    night: "Night",
  },
});
type Text = (typeof text)["hi"];

/** The place in the URL (?p=&lat=&lon=&tz=), so a panchang can be bookmarked and shared. */
function placeFromParams(q: URLSearchParams): BirthPlace | null {
  const lat = Number(q.get("lat")), lon = Number(q.get("lon")), tz = q.get("tz") ?? "", name = q.get("p") ?? "";
  if (!name || !q.get("lat") || !q.get("lon") || !(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180) || !isValidTimeZone(tz)) return null;
  return { name: name.slice(0, 200), lat, lon, tz };
}

function shiftDate(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

export default function PanchangView() {
  use(browser("The default place is the birth place saved in this browser."));
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const saved = useSavedProfile();
  const t = useT(text);
  const locale = useLocale();

  const rawDate = params.get("date") ?? "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && rawDate >= "1900-01-01" && rawDate <= "2100-12-31" ? rawDate : localToday();
  const place = placeFromParams(params) ?? saved?.place ?? null;

  const go = (next: { date?: string; place?: BirthPlace | null }) => {
    const p = next.place === undefined ? place : next.place;
    const q = new URLSearchParams({ date: next.date ?? date });
    if (p) {
      q.set("p", p.name);
      q.set("lat", String(p.lat));
      q.set("lon", String(p.lon));
      q.set("tz", p.tz);
    }
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  const req = useJyotish(status === "signedIn" && place ? `panchang|${date}|${place.lat}|${place.lon}|${place.tz}` : null, (signal) =>
    fetchPanchang(date, place!, signal),
  );

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t.panchang} title={place ? t.titleFor(day(date)) : t.panchang}>
        {place ? place.name : t.intro}
      </PageHeader>

      <Card>
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="pc-date" className={labelCls}>
              {t.date}
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => go({ date: shiftDate(date, -1) })} className={btnSmall} aria-label={t.previousDay}>
                <PiCaretLeft className="h-4 w-4" aria-hidden />
              </button>
              <input
                id="pc-date"
                type="date"
                min="1900-01-01"
                max="2100-12-31"
                value={date}
                onChange={(e) => e.target.value && go({ date: e.target.value })}
                className={`${inputCls} min-w-0 flex-1`}
              />
              <button type="button" onClick={() => go({ date: shiftDate(date, 1) })} className={btnSmall} aria-label={t.nextDay}>
                <PiCaretRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
            <PlaceSearch key={place ? `${place.lat},${place.lon}` : "none"} id="pc-place" label={t.place} value={place} onPick={(p) => p && go({ place: p })} />
          </div>
        </div>
      </Card>

      {!place ? (
        <Notice>{t.needPlace}</Notice>
      ) : status === "loading" || req.loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CardSkeleton rows={6} />
          <CardSkeleton rows={6} />
        </div>
      ) : status === "signedOut" || (req.error instanceof ApiError && req.error.status === 401) ? (
        <SignInPrompt what={t.signInWhat} />
      ) : req.error ? (
        <ErrorBox message={jyotishErrorText(req.error, locale)} onRetry={req.retry} />
      ) : req.data ? (
        <PanchangBody p={req.data} now={req.at} t={t} />
      ) : null}

      <Disclaimer />
    </div>
  );
}

/** Every anga before the next sunrise, each with its end; the date is added when it is not this day. */
function AngaList({ list, name, date, t }: { list: Anga[]; name: (a: Anga) => string; date: string; t: Text }) {
  return (
    <span className="flex flex-col items-end gap-1">
      {list.map((a) => (
        <span key={a.index + a.end}>
          {name(a)} <span className="caption-5 text-ink-muted">{t.until(a.end.slice(0, 10) === date ? hm(a.end) : when(a.end))}</span>
        </span>
      ))}
    </span>
  );
}

const NATURE_CLASS: Record<Chogh["nature"], string> = {
  shubh: "bg-success-soft text-success",
  madhyam: "bg-neutral-soft text-neutral",
  ashubh: "bg-warning-soft text-warning",
};

function ChoghTable({ title, list, now, t }: { title: string; list: Chogh[]; now: number; t: Text }) {
  const locale = useLocale();
  return (
    <div>
      <h3 className="title-3 text-ink">{title}</h3>
      <ul className="mt-2 divide-y divide-line">
        {list.map((c) => {
          const current = Date.parse(c.start) <= now && now < Date.parse(c.end);
          return (
            <li key={c.start} className={`flex items-center justify-between gap-3 py-2 ${current ? "rounded-lg bg-surface-sunken px-2" : ""}`}>
              <span className="body-6 text-ink">
                {t.range(hm(c.start), hm(c.end))}
                {current && <span className="caption-3 ml-2 text-brand-strong">{t.now}</span>}
              </span>
              <span className="flex items-center gap-2">
                <span className="body-5 text-ink">{termName(c.name, locale)}</span>
                <span className={`caption-3 rounded-full px-2 py-0.5 ${NATURE_CLASS[c.nature]}`}>{t.nature[c.nature]}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PanchangBody({ p, now, t }: { p: Panchang; now: number; t: Text }) {
  const locale = useLocale();
  const term = (name: string) => termName(name, locale);
  const span = (s: Span | null) => (s ? t.span(hm(s.start), hm(s.end)) : t.none);
  return (
    <>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card title={`${term(p.vaar.name)}, ${t.paksha[p.paksha]}`}>
          <KV
            rows={[
              [t.tithi, <AngaList key="t" list={p.tithi} name={(a) => term(a.name)} date={p.date} t={t} />],
              [t.nakshatra, <AngaList key="n" list={p.nakshatra} name={(a) => nakshatraName(a.index, locale, a.name)} date={p.date} t={t} />],
              [t.yoga, <AngaList key="y" list={p.yoga} name={(a) => term(a.name)} date={p.date} t={t} />],
              [t.karana, <AngaList key="k" list={p.karana} name={(a) => term(a.name)} date={p.date} t={t} />],
              [t.month, t.monthValue(term(p.month.amanta), p.month.adhika, term(p.month.purnimanta))],
              [t.dayLord, grahaName(p.vaar.lord, locale)],
            ]}
          />
        </Card>

        <div className="space-y-6">
          <Card title={t.sunMoon}>
            <KV
              rows={[
                [t.sunrise, hm(p.sunrise)],
                [t.sunset, hm(p.sunset)],
                [t.moonrise, p.moonrise ? hm(p.moonrise) : t.none],
                [t.moonset, p.moonset ? hm(p.moonset) : t.none],
              ]}
            />
            <p className="caption-5 mt-2 text-ink-muted">{t.sunriseNote}</p>
          </Card>
          <Card title={t.muhurat}>
            <KV
              rows={[
                [t.rahuKaal, span(p.rahu_kaal)],
                [t.yamaganda, span(p.yamaganda)],
                [t.gulika, span(p.gulika)],
                [t.abhijit, p.abhijit ? span(p.abhijit) : t.noAbhijit],
              ]}
            />
          </Card>
        </div>
      </div>

      <Card title={t.choghadiya}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ChoghTable title={t.day} list={p.choghadiya.day} now={now} t={t} />
          <ChoghTable title={t.night} list={p.choghadiya.night} now={now} t={t} />
        </div>
      </Card>

      {p.warnings.map((w) => (
        <Notice key={w}>{w}</Notice>
      ))}
    </>
  );
}
