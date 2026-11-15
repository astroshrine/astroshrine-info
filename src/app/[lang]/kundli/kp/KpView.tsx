"use client";

import { use, useState } from "react";
import { browser } from "react-dom";
import { useSearchParams } from "next/navigation";
import { PiCompass } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { grahaName, isValidTimeZone, nakshatraName, rashiName, type BirthPlace, type Graha, type Horary } from "@/lib/jyotish";
import { fetchHorary } from "@/lib/services/jyotish";
import PlaceSearch from "../_components/PlaceSearch";
import { useSavedProfile } from "../_components/profile";
import { Card, CardSkeleton, Disclaimer, ErrorBox, KV, Notice, PageHeader, SignInPrompt, btnPrimary, inputCls, labelCls } from "../_components/ui";
import { jyotishErrorText, useJyotish } from "../_components/useJyotish";

const text = defineMessages({
  hi: {
    errNumber: "1 से 249 तक का पूर्ण अंक लिखें।",
    errPlace: "आप अभी जहाँ हैं, वह जगह खोजकर चुनें।",
    eyebrow: "KP प्रश्न (होरारी)",
    title: "एक अंक, इसी पल की प्रश्न कुंडली",
    intro:
      "अपना प्रश्न मन में रखें, फिर 1 से 249 के बीच जो पहला अंक मन में आए, वह लिखें। अंक से लग्न तय होता है और ग्रह इसी पल के लिए जाते हैं।",
    number: "अंक (1 से 249)",
    numberPlaceholder: "जैसे 108",
    where: "आप अभी कहाँ हैं?",
    cast: "अभी प्रश्न कुंडली बनाएं",
    howTo: "अंक और जगह भरकर प्रश्न कुंडली बनाएं। हर प्रश्न का अपना लिंक बनता है, जिसे बाद में फिर खोला जा सकता है।",
    signInWhat: "प्रश्न कुंडली",
    none: "कोई नहीं",
    numberTitle: (n: number) => `अंक ${n}`,
    castAt: (when: string, place: string) => `${when} पर, ${place}`,
    lagna: "लग्न",
    starSub: "नक्षत्र स्वामी / उप स्वामी",
    ruling: "शासक ग्रह",
    dayLord: "वार स्वामी",
    moonLords: "चंद्र: राशि / नक्षत्र / उप",
    lagnaLords: "लग्न: राशि / नक्षत्र / उप",
    cusps: "भाव संधि (प्लेसिडस)",
    house: "भाव",
    signDegree: "राशि · अंश",
    cuspLords: "नक्षत्र / उप स्वामी",
    significators: "कारक ग्रह (4 स्तर)",
    significatorsHint: "हर भाव के कारक, स्तर 1 सबसे प्रबल।",
    houseN: (n: number) => `भाव ${n}`,
  },
  en: {
    errNumber: "Enter a whole number from 1 to 249.",
    errPlace: "Search for the place where you are now and choose it.",
    eyebrow: "KP Prashna (horary)",
    title: "One number, a horary chart for this moment",
    intro:
      "Think of your question, then enter the first number from 1 to 249 that comes to mind. The number sets the Ascendant, and the planets are taken for this moment.",
    number: "Number (1 to 249)",
    numberPlaceholder: "For example, 108",
    where: "Where are you now?",
    cast: "Cast the horary chart now",
    howTo: "Enter the number and the place to cast the horary chart. Each question gets its own link, which you can open again later.",
    signInWhat: "the horary chart",
    none: "None",
    numberTitle: (n) => `Number ${n}`,
    castAt: (when, place) => `At ${when}, ${place}`,
    lagna: "Ascendant",
    starSub: "Nakshatra lord / sub lord",
    ruling: "Ruling planets",
    dayLord: "Day lord",
    moonLords: "Moon: sign / nakshatra / sub",
    lagnaLords: "Ascendant: sign / nakshatra / sub",
    cusps: "House cusps (Placidus)",
    house: "House",
    signDegree: "Sign · degree",
    cuspLords: "Nakshatra / sub lord",
    significators: "Significators (4 levels)",
    significatorsHint: "The significators of each house; level 1 is the strongest.",
    houseN: (n) => `House ${n}`,
  },
});
type Text = (typeof text)["hi"];

/** The app's parseHoraryNumber: a whole number 1..249. */
const parseNumber = (s: string) => (/^\d{1,3}$/.test(s.trim()) && +s >= 1 && +s <= 249 ? +s : null);

function placeFromParams(q: URLSearchParams): BirthPlace | null {
  const lat = Number(q.get("lat")), lon = Number(q.get("lon")), tz = q.get("tz") ?? "", name = q.get("p") ?? "";
  if (!name || !q.get("lat") || !q.get("lon") || !(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180) || !isValidTimeZone(tz)) return null;
  return { name: name.slice(0, 200), lat, lon, tz };
}

/** "14/11/2026, 18:06" on this device's clock: the moment the question was asked. */
function localStamp(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function KpView() {
  use(browser("The default place is the one saved in this browser."));
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const saved = useSavedProfile();
  const t = useT(text);
  const locale = useLocale();

  // A cast question lives in the URL: ?n=108&at=<ISO>&p=&lat=&lon=&tz=
  const n = parseNumber(params.get("n") ?? "");
  const atRaw = params.get("at") ?? "";
  const at = atRaw && !Number.isNaN(Date.parse(atRaw)) ? new Date(atRaw) : null;
  const castPlace = placeFromParams(params);
  const cast = n && at && castPlace ? { n, at, place: castPlace } : null;

  const [number, setNumber] = useState(n ? String(n) : "");
  const [place, setPlace] = useState<BirthPlace | null>(castPlace ?? saved?.place ?? null);
  const [error, setError] = useState<string | null>(null);

  const req = useJyotish(
    status === "signedIn" && cast ? `kp|${cast.n}|${cast.at.toISOString()}|${cast.place.lat}|${cast.place.lon}` : null,
    (signal) => fetchHorary(cast!.n, cast!.place, cast!.at, signal),
  );

  function submit() {
    const num = parseNumber(number);
    if (!num) {
      setError(t.errNumber);
      return;
    }
    if (!place) {
      setError(t.errPlace);
      return;
    }
    setError(null);
    const q = new URLSearchParams({
      n: String(num),
      at: new Date().toISOString(),
      p: place.name,
      lat: String(place.lat),
      lon: String(place.lon),
      tz: place.tz,
    });
    router.push(`${pathname}?${q.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t.eyebrow} title={t.title}>
        {t.intro}
      </PageHeader>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="kp-n" className={labelCls}>
                {t.number}
              </label>
              <input
                id="kp-n"
                inputMode="numeric"
                maxLength={3}
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder={t.numberPlaceholder}
                className={inputCls}
              />
            </div>
            <PlaceSearch id="kp-place" label={t.where} value={place} onPick={setPlace} />
            {error && (
              <p role="alert" className="body-5 text-danger">
                {error}
              </p>
            )}
            <button type="submit" className={`${btnPrimary} w-full`}>
              <PiCompass className="h-5 w-5" aria-hidden /> {t.cast}
            </button>
          </form>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {!cast ? (
            <Notice>{t.howTo}</Notice>
          ) : status === "loading" || req.loading ? (
            <CardSkeleton rows={6} />
          ) : status === "signedOut" || (req.error instanceof ApiError && req.error.status === 401) ? (
            <SignInPrompt what={t.signInWhat} />
          ) : req.error ? (
            <ErrorBox message={jyotishErrorText(req.error, locale)} onRetry={req.retry} />
          ) : req.data ? (
            <HoraryBody h={req.data} at={cast.at} place={cast.place} t={t} />
          ) : null}
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}

function HoraryBody({ h, at, place, t }: { h: Horary; at: Date; place: BirthPlace; t: Text }) {
  const locale = useLocale();
  const g = (x: Graha) => grahaName(x, locale);
  const names = (gs: Graha[]) => (gs.length ? gs.map(g).join(", ") : t.none);
  const a = h.ascendant;
  const rp = h.ruling_planets;
  return (
    <>
      <Card title={t.numberTitle(h.number)} description={t.castAt(localStamp(at), place.name)}>
        <KV
          rows={[
            [t.lagna, `${rashiName(a.rashi, locale)} ${a.dms} · ${nakshatraName(a.nakshatra, locale, a.nakshatra_name)}`],
            [t.starSub, `${g(a.star_lord)} / ${g(a.sub_lord)}`],
          ]}
        />
      </Card>

      <Card title={t.ruling}>
        <KV
          rows={[
            [t.dayLord, g(rp.day_lord)],
            [t.moonLords, `${g(rp.moon_sign_lord)} / ${g(rp.moon_star_lord)} / ${g(rp.moon_sub_lord)}`],
            [t.lagnaLords, `${g(rp.lagna_sign_lord)} / ${g(rp.lagna_star_lord)} / ${g(rp.lagna_sub_lord)}`],
          ]}
        />
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <Card title={t.cusps}>
          <table className="w-full text-left">
            <thead>
              <tr className="text-ink-soft">
                <th scope="col" className="caption-4 pb-2 pr-3">{t.house}</th>
                <th scope="col" className="caption-4 pb-2 pr-3">{t.signDegree}</th>
                <th scope="col" className="caption-4 pb-2">{t.cuspLords}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {h.cusps.map((c) => (
                <tr key={c.house} className="body-6 text-ink">
                  <th scope="row" className="body-4 py-2 pr-3">
                    {c.house}
                  </th>
                  <td className="py-2 pr-3">
                    {rashiName(c.rashi, locale)} <span className="caption-5 text-ink-muted">{c.dms}</span>
                  </td>
                  <td className="py-2">
                    {g(c.star_lord)} / {g(c.sub_lord)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title={t.significators} description={t.significatorsHint}>
          <ul className="divide-y divide-line">
            {h.significators.houses.map((s) => (
              <li key={s.house} className="py-2">
                <p className="body-4 text-ink">{t.houseN(s.house)}</p>
                <p className="caption-2 mt-1 text-ink-soft">
                  1: {names(s.level1)} · 2: {names(s.level2)} · 3: {names(s.level3)} · 4: {names(s.level4)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {h.warnings.map((w) => (
        <Notice key={w}>{w}</Notice>
      ))}
    </>
  );
}
