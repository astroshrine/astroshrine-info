"use client";

import { use } from "react";
import { browser } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";
import { generateChart } from "@/lib/endpoints";
import {
  DIGNITY_HI,
  GRAHAS,
  LEVEL_HI,
  VARGAS,
  cancelHi,
  day,
  grahaHi,
  lordHi,
  nakshatraHi,
  rashiHi,
  toBirth,
  vargaHouses,
  type Chart,
  type DashaPeriod,
  type YogaHit,
} from "@/lib/jyotish";
import NorthIndianChart from "../_components/NorthIndianChart";
import ProfileHeader from "../_components/ProfileHeader";
import { profileToHash, usePageProfile } from "../_components/profile";
import { Card, CardSkeleton, Disclaimer, ErrorBox, KV, NeedProfile, Notice, SignInPrompt } from "../_components/ui";
import { jyotishErrorText, useJyotish } from "../_components/useJyotish";

/** POST /v1/jyotish/chart for the page's birth profile, with every varga. Browser only (profile in storage / hash). */
export default function ChartView() {
  use(browser("The birth profile comes from this browser's storage or the URL hash."));
  const { status } = useAuth();
  const { profile, fromLink, ready } = usePageProfile();
  const params = useSearchParams();
  const varga = VARGAS.find((v) => v.key === params.get("varga")) ?? VARGAS[0];

  const req = useJyotish(status === "signedIn" && profile ? `chart|${profileToHash(profile)}` : null, (signal) =>
    generateChart(toBirth(profile!), signal),
  );

  if (!profile && !ready) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardSkeleton chart rows={2} />
        <CardSkeleton rows={8} />
      </div>
    );
  }
  if (!profile) return <NeedProfile what="कुंडली" />;

  return (
    <div className="space-y-6">
      <ProfileHeader eyebrow="जन्म कुंडली" profile={profile} fromLink={fromLink} />

      {status === "loading" || req.loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CardSkeleton chart rows={2} />
          <CardSkeleton rows={8} />
        </div>
      ) : status === "signedOut" || (req.error instanceof ApiError && req.error.status === 401) ? (
        <SignInPrompt what="कुंडली" />
      ) : req.error ? (
        <ErrorBox message={jyotishErrorText(req.error)} onRetry={req.retry} />
      ) : req.data ? (
        <ChartBody chart={req.data} vargaKey={varga.key} hash={profileToHash(profile)} />
      ) : null}

      <Disclaimer />
    </div>
  );
}

function ChartBody({ chart, vargaKey, hash }: { chart: Chart; vargaKey: string; hash: string }) {
  const tu = chart.meta.time_unknown;
  const moon = chart.planets.Moon;
  const warnings = chart.meta.warnings.filter((w) => !w.startsWith("TIME_UNKNOWN"));

  return (
    <>
      {tu && (
        <Notice tone="warning">
          जन्म समय ज्ञात नहीं, इसलिए कुंडली दोपहर 12:00 की है। लग्न, भाव और वर्ग चार्ट भरोसेमंद नहीं।
          {tu.moon_nakshatra_stable ? "" : " इस दिन चंद्र का नक्षत्र बदलता है।"}
        </Notice>
      )}
      {warnings.map((w) => (
        <Notice key={w}>{w}</Notice>
      ))}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <VargaCard chart={chart} vargaKey={vargaKey} hash={hash} />

        <div className="space-y-6">
          <Card title="मुख्य बातें">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {[
                ["लग्न", tu ? "अज्ञात" : rashiHi(chart.lagna.rashi)],
                ["चंद्र राशि", rashiHi(moon.rashi)],
                ["नक्षत्र", `${nakshatraHi(moon.nakshatra, moon.nakshatra_name)} ${moon.pada}`],
                ["महादशा", lordHi(chart.dasha.vimshottari.running[0]?.lord ?? "")],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-surface-sunken p-3">
                  <dt className="caption-4 text-ink-soft">{k}</dt>
                  <dd className="title-3 mt-1 text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="caption-5 mt-3 text-ink-muted">लाहिड़ी अयनांश {chart.meta.ayanamsha_deg.toFixed(4)}°</p>
          </Card>

          <PlanetsCard chart={chart} vargaKey={vargaKey} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <DashaCard chart={chart} />
        <YogaCard chart={chart} />
      </div>
    </>
  );
}

function VargaCard({ chart, vargaKey, hash }: { chart: Chart; vargaKey: string; hash: string }) {
  const v = VARGAS.find((x) => x.key === vargaKey)!;
  return (
    <Card title={`${v.hi} कुंडली (${v.key})`} description={`${v.en}: ${v.meaning}`}>
      <nav aria-label="वर्ग चार्ट चुनें">
        <ul className="flex flex-wrap gap-2">
          {VARGAS.map((x) => {
            const active = x.key === vargaKey;
            return (
              <li key={x.key}>
                <Link
                  href={`?varga=${x.key}${hash}`}
                  replace
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  title={`${x.hi} (${x.en}): ${x.meaning}`}
                  className={`caption-3 inline-flex items-center gap-1 rounded-full border px-3 py-1 transition active:scale-98 ${
                    active
                      ? "border-surface-inverse bg-surface-inverse text-ink-inverse on-inverse"
                      : "border-line-strong bg-surface-card text-ink-soft hover:border-brand hover:text-ink"
                  }`}
                >
                  {x.key}
                  <span className="caption-5">{x.hi}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mx-auto mt-4 max-w-md">
        <NorthIndianChart houses={vargaHouses(chart, vargaKey)} label={`${v.hi} कुंडली (${v.key})`} />
      </div>
      <p className="caption-5 mt-3 text-center text-ink-muted">
        हर भाव में राशि का अंक (1 मेष से 12 मीन तक) · ᴿ वक्री · ऊपर का भाव लग्न
      </p>
    </Card>
  );
}

function PlanetsCard({ chart, vargaKey }: { chart: Chart; vargaKey: string }) {
  const showVarga = vargaKey !== "D1";
  const v = chart.vargas[vargaKey];
  return (
    <Card title="ग्रह स्थिति" description="राशि, अंश, नक्षत्र और भाव लग्न कुंडली (D1) से।">
      <div className="overflow-x-auto">
        <table className="w-full min-w-80 text-left">
          <thead>
            <tr className="text-ink-soft">
              <th scope="col" className="caption-4 pb-2 pr-3">ग्रह</th>
              <th scope="col" className="caption-4 pb-2 pr-3">राशि · अंश</th>
              <th scope="col" className="caption-4 pb-2 pr-3">नक्षत्र</th>
              <th scope="col" className="caption-4 hidden pb-2 pr-3 md:table-cell">नक्षत्र स्वामी</th>
              {showVarga && (
                <th scope="col" className="caption-4 pb-2 pr-3">
                  {vargaKey}
                </th>
              )}
              <th scope="col" className="caption-4 pb-2 text-right">भाव</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr className="body-6 text-ink">
              <th scope="row" className="body-4 py-2 pr-3 align-top">लग्न</th>
              <td className="py-2 pr-3 align-top">
                {rashiHi(chart.lagna.rashi)}
                <span className="caption-5 block text-ink-muted">{chart.lagna.dms}</span>
              </td>
              <td className="py-2 pr-3 align-top">
                {nakshatraHi(chart.lagna.nakshatra, chart.lagna.nakshatra_name)} {chart.lagna.pada}
              </td>
              <td className="hidden py-2 pr-3 align-top md:table-cell">{grahaHi(chart.lagna.nak_lord)}</td>
              {showVarga && <td className="py-2 pr-3 align-top">{rashiHi(v.lagna)}</td>}
              <td className="py-2 text-right align-top">1</td>
            </tr>
            {GRAHAS.map((g) => {
              const p = chart.planets[g];
              const tags = [DIGNITY_HI[p.dignity], p.retro && g !== "Rahu" && g !== "Ketu" ? "वक्री" : null, p.combust ? "अस्त" : null].filter(
                Boolean,
              );
              return (
                <tr key={g} className="body-6 text-ink">
                  <th scope="row" className="body-4 py-2 pr-3 align-top">
                    {grahaHi(g)}
                    {tags.length > 0 && <span className="caption-4 block text-brand-strong">{tags.join(" · ")}</span>}
                  </th>
                  <td className="py-2 pr-3 align-top">
                    {rashiHi(p.rashi)}
                    <span className="caption-5 block text-ink-muted">{p.dms}</span>
                  </td>
                  <td className="py-2 pr-3 align-top">
                    {nakshatraHi(p.nakshatra, p.nakshatra_name)} {p.pada}
                  </td>
                  <td className="hidden py-2 pr-3 align-top md:table-cell">{grahaHi(p.nak_lord)}</td>
                  {showVarga && <td className="py-2 pr-3 align-top">{rashiHi(v.planets[g])}</td>}
                  <td className="py-2 text-right align-top">{p.house}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const periodRow = (p: DashaPeriod): [React.ReactNode, React.ReactNode] => [
  LEVEL_HI[p.level],
  <span key={p.level}>
    <span className="body-4">{lordHi(p.lord)}</span>
    <span className="caption-5 block text-ink-muted">
      {day(p.start)} से {day(p.end)} तक
    </span>
  </span>,
];

function DashaCard({ chart }: { chart: Chart }) {
  const v = chart.dasha.vimshottari;
  const y = chart.dasha.yogini;
  const nextAntar = v.next.find((p) => p.level === "antar");
  return (
    <Card title="दशा" description="इस समय चल रही दशाएँ।">
      <h3 className="title-3 text-ink">विंशोत्तरी</h3>
      <p className="caption-2 mt-1 text-ink-soft">
        जन्म के समय शेष: {lordHi(v.balance.lord)} {v.balance.years.toFixed(1)} वर्ष
      </p>
      <KV rows={v.running.map(periodRow)} />
      {nextAntar && (
        <p className="caption-2 mt-2 text-ink-soft">
          अगली अंतर्दशा: {lordHi(nextAntar.lord)}, {day(nextAntar.start)} से
        </p>
      )}
      <h3 className="title-3 mt-6 text-ink">योगिनी</h3>
      <KV rows={y.running.map(periodRow)} />
      <p className="caption-2 mt-3 text-ink-soft">
        पूरी दशा तालिका (महादशा से प्रत्यंतर तक) <Link href="/kundli/sheet" className="text-brand-strong underline underline-offset-2">विस्तृत कुंडली</Link> में है।
      </p>
    </Card>
  );
}

function YogaCard({ chart }: { chart: Chart }) {
  return (
    <Card title="योग और दोष" description="योग और दोष के नियम हमारे ज्योतिषियों की समीक्षा में हैं।">
      <HitList title="योग" hits={chart.yogas} empty="सूचीबद्ध योगों में से कोई नहीं बनता।" dosha={false} />
      <div className="mt-6">
        <HitList title="दोष" hits={chart.doshas.list} empty="सूचीबद्ध दोषों में से कोई नहीं।" dosha />
      </div>
      {chart.doshas.kaal_sarp !== "none" && (
        <p className="body-5 mt-4 text-ink">काल सर्प: {chart.doshas.kaal_sarp === "full" ? "पूर्ण" : "आंशिक"}</p>
      )}
    </Card>
  );
}

function HitList({ title, hits, empty, dosha }: { title: string; hits: YogaHit[]; empty: string; dosha: boolean }) {
  // One line per yoga or dosha; it counts as formed if any of its instances is not cancelled.
  const byId = new Map<string, { hit: YogaHit; active: boolean; reasons: Set<string> }>();
  for (const h of hits) {
    const e = byId.get(h.id) ?? { hit: h, active: false, reasons: new Set<string>() };
    e.active ||= !h.cancelled;
    if (h.cancelled) h.cancelled_by.forEach((r) => e.reasons.add(r));
    byId.set(h.id, e);
  }
  const list = [...byId.values()].sort((a, b) => Number(b.active) - Number(a.active));

  return (
    <div>
      <h3 className="title-3 text-ink">{title}</h3>
      {list.length === 0 ? (
        <p className="body-6 mt-2 text-ink-soft">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {list.map(({ hit, active, reasons }) => (
            <li key={hit.id} className="rounded-lg border border-line p-3">
              <p className="flex flex-wrap items-center gap-2">
                <span className="body-4 text-ink">{hit.name_hi}</span>
                <span
                  className={`caption-3 rounded-full px-2 py-0.5 ${
                    !active ? "bg-neutral-soft text-neutral" : dosha ? "bg-warning-soft text-warning" : "bg-success-soft text-success"
                  }`}
                >
                  {!active ? "भंग" : dosha ? "उपस्थित" : "बनता है"}
                </span>
              </p>
              <p className="caption-5 mt-1 text-ink-muted">{hit.name_en}</p>
              {!active && reasons.size > 0 && (
                <p className="caption-2 mt-1 text-ink-soft">भंग का कारण: {[...reasons].map(cancelHi).join("; ")}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
