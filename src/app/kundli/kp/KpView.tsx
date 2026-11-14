"use client";

import { use, useState } from "react";
import { browser } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PiCompass } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";
import { grahaHi, isValidTimeZone, nakshatraHi, rashiHi, type BirthPlace, type Graha, type Horary } from "@/lib/jyotish";
import { fetchHorary } from "@/lib/services/jyotish";
import PlaceSearch from "../_components/PlaceSearch";
import { useSavedProfile } from "../_components/profile";
import { Card, CardSkeleton, Disclaimer, ErrorBox, KV, Notice, PageHeader, SignInPrompt, btnPrimary, inputCls, labelCls } from "../_components/ui";
import { jyotishErrorText, useJyotish } from "../_components/useJyotish";

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

  // A cast question lives in the URL: ?n=108&at=<ISO>&p=&lat=&lon=&tz=
  const n = parseNumber(params.get("n") ?? "");
  const atRaw = params.get("at") ?? "";
  const at = atRaw && !Number.isNaN(Date.parse(atRaw)) ? new Date(atRaw) : null;
  const castPlace = placeFromParams(params);
  const cast = n && at && castPlace ? { n, at, place: castPlace } : null;

  const [text, setText] = useState(n ? String(n) : "");
  const [place, setPlace] = useState<BirthPlace | null>(castPlace ?? saved?.place ?? null);
  const [error, setError] = useState<string | null>(null);

  const req = useJyotish(
    status === "signedIn" && cast ? `kp|${cast.n}|${cast.at.toISOString()}|${cast.place.lat}|${cast.place.lon}` : null,
    (signal) => fetchHorary(cast!.n, cast!.place, cast!.at, signal),
  );

  function submit() {
    const num = parseNumber(text);
    if (!num) {
      setError("1 से 249 तक का पूर्ण अंक लिखें।");
      return;
    }
    if (!place) {
      setError("आप अभी जहाँ हैं, वह जगह खोजकर चुनें।");
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
      <PageHeader eyebrow="KP प्रश्न (होरारी)" title="एक अंक, इसी पल की प्रश्न कुंडली">
        अपना प्रश्न मन में रखें, फिर 1 से 249 के बीच जो पहला अंक मन में आए, वह लिखें। अंक से लग्न तय होता है और ग्रह इसी पल के
        लिए जाते हैं।
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
                अंक (1 से 249)
              </label>
              <input
                id="kp-n"
                inputMode="numeric"
                maxLength={3}
                value={text}
                onChange={(e) => setText(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="जैसे 108"
                className={inputCls}
              />
            </div>
            <PlaceSearch id="kp-place" label="आप अभी कहाँ हैं?" value={place} onPick={setPlace} />
            {error && (
              <p role="alert" className="body-5 text-danger">
                {error}
              </p>
            )}
            <button type="submit" className={`${btnPrimary} w-full`}>
              <PiCompass className="h-5 w-5" aria-hidden /> अभी प्रश्न कुंडली बनाएं
            </button>
          </form>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {!cast ? (
            <Notice>अंक और जगह भरकर प्रश्न कुंडली बनाएं। हर प्रश्न का अपना लिंक बनता है, जिसे बाद में फिर खोला जा सकता है।</Notice>
          ) : status === "loading" || req.loading ? (
            <CardSkeleton rows={6} />
          ) : status === "signedOut" || (req.error instanceof ApiError && req.error.status === 401) ? (
            <SignInPrompt what="प्रश्न कुंडली" />
          ) : req.error ? (
            <ErrorBox message={jyotishErrorText(req.error)} onRetry={req.retry} />
          ) : req.data ? (
            <HoraryBody h={req.data} at={cast.at} place={cast.place} />
          ) : null}
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}

const names = (gs: Graha[]) => (gs.length ? gs.map(grahaHi).join(", ") : "कोई नहीं");

function HoraryBody({ h, at, place }: { h: Horary; at: Date; place: BirthPlace }) {
  const a = h.ascendant;
  const rp = h.ruling_planets;
  return (
    <>
      <Card title={`अंक ${h.number}`} description={`${localStamp(at)} पर, ${place.name}`}>
        <KV
          rows={[
            ["लग्न", `${rashiHi(a.rashi)} ${a.dms} · ${nakshatraHi(a.nakshatra, a.nakshatra_name)}`],
            ["नक्षत्र स्वामी / उप स्वामी", `${grahaHi(a.star_lord)} / ${grahaHi(a.sub_lord)}`],
          ]}
        />
      </Card>

      <Card title="शासक ग्रह">
        <KV
          rows={[
            ["वार स्वामी", grahaHi(rp.day_lord)],
            ["चंद्र: राशि / नक्षत्र / उप", `${grahaHi(rp.moon_sign_lord)} / ${grahaHi(rp.moon_star_lord)} / ${grahaHi(rp.moon_sub_lord)}`],
            ["लग्न: राशि / नक्षत्र / उप", `${grahaHi(rp.lagna_sign_lord)} / ${grahaHi(rp.lagna_star_lord)} / ${grahaHi(rp.lagna_sub_lord)}`],
          ]}
        />
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <Card title="भाव संधि (प्लेसिडस)">
          <table className="w-full text-left">
            <thead>
              <tr className="text-ink-soft">
                <th scope="col" className="caption-4 pb-2 pr-3">भाव</th>
                <th scope="col" className="caption-4 pb-2 pr-3">राशि · अंश</th>
                <th scope="col" className="caption-4 pb-2">नक्षत्र / उप स्वामी</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {h.cusps.map((c) => (
                <tr key={c.house} className="body-6 text-ink">
                  <th scope="row" className="body-4 py-2 pr-3">
                    {c.house}
                  </th>
                  <td className="py-2 pr-3">
                    {rashiHi(c.rashi)} <span className="caption-5 text-ink-muted">{c.dms}</span>
                  </td>
                  <td className="py-2">
                    {grahaHi(c.star_lord)} / {grahaHi(c.sub_lord)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="कारक ग्रह (4 स्तर)" description="हर भाव के कारक, स्तर 1 सबसे प्रबल।">
          <ul className="divide-y divide-line">
            {h.significators.houses.map((s) => (
              <li key={s.house} className="py-2">
                <p className="body-4 text-ink">भाव {s.house}</p>
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
