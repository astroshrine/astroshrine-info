"use client";

import { use } from "react";
import { browser } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PiCaretLeft, PiCaretRight } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";
import {
  day,
  grahaHi,
  hm,
  isValidTimeZone,
  localToday,
  nakshatraHi,
  termHi,
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
      <PageHeader eyebrow="पंचांग" title={place ? `${day(date)} का पंचांग` : "पंचांग"}>
        {place ? place.name : "किसी भी दिन और जगह की तिथि, नक्षत्र, योग, करण, राहुकाल और चौघड़िया।"}
      </PageHeader>

      <Card>
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="pc-date" className={labelCls}>
              तिथि
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => go({ date: shiftDate(date, -1) })} className={btnSmall} aria-label="पिछला दिन">
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
              <button type="button" onClick={() => go({ date: shiftDate(date, 1) })} className={btnSmall} aria-label="अगला दिन">
                <PiCaretRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
            <PlaceSearch key={place ? `${place.lat},${place.lon}` : "none"} id="pc-place" label="स्थान" value={place} onPick={(p) => p && go({ place: p })} />
          </div>
        </div>
      </Card>

      {!place ? (
        <Notice>पंचांग देखने के लिए स्थान खोजें। जन्म विवरण सहेजा हो तो जन्म स्थान अपने आप भर जाता है।</Notice>
      ) : status === "loading" || req.loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CardSkeleton rows={6} />
          <CardSkeleton rows={6} />
        </div>
      ) : status === "signedOut" || (req.error instanceof ApiError && req.error.status === 401) ? (
        <SignInPrompt what="पंचांग" />
      ) : req.error ? (
        <ErrorBox message={jyotishErrorText(req.error)} onRetry={req.retry} />
      ) : req.data ? (
        <PanchangBody p={req.data} now={req.at} />
      ) : null}

      <Disclaimer />
    </div>
  );
}

const span = (s: Span | null) => (s ? `${hm(s.start)} से ${hm(s.end)} तक` : "नहीं");

/** Every anga before the next sunrise, each with its end; the date is added when it is not this day. */
function AngaList({ list, name, date }: { list: Anga[]; name: (a: Anga) => string; date: string }) {
  return (
    <span className="flex flex-col items-end gap-1">
      {list.map((a) => (
        <span key={a.index + a.end}>
          {name(a)} <span className="caption-5 text-ink-muted">{a.end.slice(0, 10) === date ? hm(a.end) : when(a.end)} तक</span>
        </span>
      ))}
    </span>
  );
}

const NATURE: Record<Chogh["nature"], { label: string; cls: string }> = {
  shubh: { label: "शुभ", cls: "bg-success-soft text-success" },
  madhyam: { label: "सामान्य", cls: "bg-neutral-soft text-neutral" },
  ashubh: { label: "अशुभ", cls: "bg-warning-soft text-warning" },
};

function ChoghTable({ title, list, now }: { title: string; list: Chogh[]; now: number }) {
  return (
    <div>
      <h3 className="title-3 text-ink">{title}</h3>
      <ul className="mt-2 divide-y divide-line">
        {list.map((c) => {
          const current = Date.parse(c.start) <= now && now < Date.parse(c.end);
          return (
            <li key={c.start} className={`flex items-center justify-between gap-3 py-2 ${current ? "rounded-lg bg-surface-sunken px-2" : ""}`}>
              <span className="body-6 text-ink">
                {hm(c.start)} से {hm(c.end)}
                {current && <span className="caption-3 ml-2 text-brand-strong">अभी</span>}
              </span>
              <span className="flex items-center gap-2">
                <span className="body-5 text-ink">{termHi(c.name)}</span>
                <span className={`caption-3 rounded-full px-2 py-0.5 ${NATURE[c.nature].cls}`}>{NATURE[c.nature].label}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PanchangBody({ p, now }: { p: Panchang; now: number }) {
  const paksha = p.paksha === "shukla" ? "शुक्ल पक्ष" : "कृष्ण पक्ष";
  return (
    <>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card title={`${termHi(p.vaar.name)}, ${paksha}`}>
          <KV
            rows={[
              ["तिथि", <AngaList key="t" list={p.tithi} name={(a) => termHi(a.name)} date={p.date} />],
              ["नक्षत्र", <AngaList key="n" list={p.nakshatra} name={(a) => nakshatraHi(a.index, a.name)} date={p.date} />],
              ["योग", <AngaList key="y" list={p.yoga} name={(a) => termHi(a.name)} date={p.date} />],
              ["करण", <AngaList key="k" list={p.karana} name={(a) => termHi(a.name)} date={p.date} />],
              [
                "मास",
                `${termHi(p.month.amanta)}${p.month.adhika ? " (अधिक)" : ""} अमांत · ${termHi(p.month.purnimanta)} पूर्णिमांत`,
              ],
              ["वार स्वामी", grahaHi(p.vaar.lord)],
            ]}
          />
        </Card>

        <div className="space-y-6">
          <Card title="सूर्य और चंद्र">
            <KV
              rows={[
                ["सूर्योदय", hm(p.sunrise)],
                ["सूर्यास्त", hm(p.sunset)],
                ["चंद्रोदय", p.moonrise ? hm(p.moonrise) : "नहीं"],
                ["चंद्रास्त", p.moonset ? hm(p.moonset) : "नहीं"],
              ]}
            />
            <p className="caption-5 mt-2 text-ink-muted">
              सूर्योदय हिंदू पद्धति से (बिंब का केंद्र, अपवर्तन रहित), इसलिए सामान्य पंचांगों से कुछ मिनट बाद।
            </p>
          </Card>
          <Card title="मुहूर्त काल">
            <KV
              rows={[
                ["राहुकाल", span(p.rahu_kaal)],
                ["यमगंड", span(p.yamaganda)],
                ["गुलिक", span(p.gulika)],
                ["अभिजित", p.abhijit ? span(p.abhijit) : "बुधवार को नहीं लिया जाता"],
              ]}
            />
          </Card>
        </div>
      </div>

      <Card title="चौघड़िया">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ChoghTable title="दिन" list={p.choghadiya.day} now={now} />
          <ChoghTable title="रात" list={p.choghadiya.night} now={now} />
        </div>
      </Card>

      {p.warnings.map((w) => (
        <Notice key={w}>{w}</Notice>
      ))}
    </>
  );
}
