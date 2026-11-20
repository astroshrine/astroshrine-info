"use client";

import { use, type ReactNode } from "react";
import { browser } from "react-dom";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { generateChart } from "@/lib/endpoints";
import {
  GRAHAS,
  VARGAS,
  cancelName,
  day,
  dignityName,
  grahaName,
  levelName,
  lordName,
  nakshatraName,
  rashiName,
  toBirth,
  vargaHouses,
  vargaMeaning,
  vargaName,
  type Chart,
  type DashaPeriod,
  type Varga,
  type YogaHit,
} from "@/lib/jyotish";
import NorthIndianChart from "../_components/NorthIndianChart";
import ProfileHeader from "../_components/ProfileHeader";
import { profileToHash, usePageProfile } from "../_components/profile";
import { Card, CardSkeleton, Disclaimer, ErrorBox, KV, NeedProfile, Notice, SignInPrompt } from "../_components/ui";
import { jyotishErrorText, useJyotish } from "../_components/useJyotish";

const text = defineMessages({
  hi: {
    needWhat: "कुंडली",
    signInWhat: "कुंडली",
    eyebrow: "जन्म कुंडली",
    timeUnknown: "जन्म समय ज्ञात नहीं, इसलिए कुंडली दोपहर 12:00 की है। लग्न, भाव और वर्ग चार्ट भरोसेमंद नहीं।",
    moonChanges: " इस दिन चंद्र का नक्षत्र बदलता है।",
    keyFacts: "मुख्य बातें",
    lagna: "लग्न",
    unknown: "अज्ञात",
    moonSign: "चंद्र राशि",
    nakshatra: "नक्षत्र",
    mahadasha: "महादशा",
    ayanamsha: (deg: string) => `लाहिड़ी अयनांश ${deg}°`,
    vargaTitle: (v: Varga) => `${v.hi} कुंडली (${v.key})`,
    vargaDescription: (v: Varga) => `${v.en}: ${v.meaning}`,
    vargaTooltip: (v: Varga) => `${v.hi} (${v.en}): ${v.meaning}`,
    pickVarga: "वर्ग चार्ट चुनें",
    legend: "हर भाव में राशि का अंक (1 मेष से 12 मीन तक) · ᴿ वक्री · ऊपर का भाव लग्न",
    planets: "ग्रह स्थिति",
    planetsHint: "राशि, अंश, नक्षत्र और भाव लग्न कुंडली (D1) से।",
    planet: "ग्रह",
    signDegree: "राशि · अंश",
    starLord: "नक्षत्र स्वामी",
    house: "भाव",
    retro: "वक्री",
    combust: "अस्त",
    period: (from: string, to: string) => `${from} से ${to} तक`,
    dasha: "दशा",
    dashaHint: "इस समय चल रही दशाएँ।",
    vimshottari: "विंशोत्तरी",
    yogini: "योगिनी",
    balance: (lord: string, years: string) => `जन्म के समय शेष: ${lord} ${years} वर्ष`,
    nextAntar: (lord: string, from: string) => `अगली अंतर्दशा: ${lord}, ${from} से`,
    /** `link` renders the link to the detailed kundli around its label. */
    fullTable: (link: (label: string) => ReactNode): ReactNode => (
      <>पूरी दशा तालिका (महादशा से प्रत्यंतर तक) {link("विस्तृत कुंडली")} में है।</>
    ),
    yogasDoshas: "योग और दोष",
    yogasHint: "योग और दोष के नियम हमारे ज्योतिषियों की समीक्षा में हैं।",
    yogas: "योग",
    noYogas: "सूचीबद्ध योगों में से कोई नहीं बनता।",
    doshas: "दोष",
    noDoshas: "सूचीबद्ध दोषों में से कोई नहीं।",
    kaalSarp: (full: boolean) => `काल सर्प: ${full ? "पूर्ण" : "आंशिक"}`,
    cancelled: "भंग",
    present: "उपस्थित",
    formed: "बनता है",
    cancelReason: (reasons: string) => `भंग का कारण: ${reasons}`,
  },
  en: {
    needWhat: "the chart",
    signInWhat: "the kundli",
    eyebrow: "Birth chart",
    timeUnknown: "The birth time is not known, so the kundli is made for 12:00 noon. The Ascendant, houses and divisional charts are not reliable.",
    moonChanges: " The Moon changes nakshatra on this day.",
    keyFacts: "Key facts",
    lagna: "Ascendant",
    unknown: "Unknown",
    moonSign: "Moon sign",
    nakshatra: "Nakshatra",
    mahadasha: "Mahadasha",
    ayanamsha: (deg) => `Lahiri ayanamsha ${deg}°`,
    vargaTitle: (v) => `${v.en} chart (${v.key})`,
    vargaDescription: (v) => vargaMeaning(v, "en"),
    vargaTooltip: (v) => `${v.en}: ${vargaMeaning(v, "en")}`,
    pickVarga: "Choose a divisional chart",
    legend: "Each house shows its sign number (1 Aries to 12 Pisces) · ᴿ retrograde · the top house is the Ascendant",
    planets: "Planet positions",
    planetsHint: "Sign, degree, nakshatra and house, from the Rashi chart (D1).",
    planet: "Planet",
    signDegree: "Sign · degree",
    starLord: "Nakshatra lord",
    house: "House",
    retro: "Retrograde",
    combust: "Combust",
    period: (from, to) => `${from} to ${to}`,
    dasha: "Dasha",
    dashaHint: "The dashas running now.",
    vimshottari: "Vimshottari",
    yogini: "Yogini",
    balance: (lord, years) => `Balance at birth: ${lord} ${years} years`,
    nextAntar: (lord, from) => `Next antardasha: ${lord}, from ${from}`,
    fullTable: (link) => <>The full dasha table, from Mahadasha to Pratyantar, is in the {link("detailed kundli")}.</>,
    yogasDoshas: "Yogas and doshas",
    yogasHint: "The yoga and dosha rules are being reviewed by our astrologers.",
    yogas: "Yogas",
    noYogas: "None of the listed yogas is formed.",
    doshas: "Doshas",
    noDoshas: "None of the listed doshas is present.",
    kaalSarp: (full) => `Kaal Sarp: ${full ? "full" : "partial"}`,
    cancelled: "Cancelled",
    present: "Present",
    formed: "Formed",
    cancelReason: (reasons) => `Reason for cancellation: ${reasons}`,
  },
});
type Text = (typeof text)["hi"];

/** POST /v1/jyotish/chart for the page's birth profile, with every varga. Browser only (profile in storage / hash). */
export default function ChartView() {
  use(browser("The birth profile comes from this browser's storage or the URL hash."));
  const { status } = useAuth();
  const { profile, fromLink, ready } = usePageProfile();
  const params = useSearchParams();
  const t = useT(text);
  const locale = useLocale();
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
  if (!profile) return <NeedProfile what={t.needWhat} />;

  return (
    <div className="space-y-6">
      <ProfileHeader eyebrow={t.eyebrow} profile={profile} fromLink={fromLink} />

      {status === "loading" || req.loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CardSkeleton chart rows={2} />
          <CardSkeleton rows={8} />
        </div>
      ) : status === "signedOut" || (req.error instanceof ApiError && req.error.status === 401) ? (
        <SignInPrompt what={t.signInWhat} />
      ) : req.error ? (
        <ErrorBox message={jyotishErrorText(req.error, locale)} onRetry={req.retry} />
      ) : req.data ? (
        <ChartBody chart={req.data} vargaKey={varga.key} hash={profileToHash(profile)} t={t} />
      ) : null}

      <Disclaimer />
    </div>
  );
}

function ChartBody({ chart, vargaKey, hash, t }: { chart: Chart; vargaKey: string; hash: string; t: Text }) {
  const locale = useLocale();
  const tu = chart.meta.time_unknown;
  const moon = chart.planets.Moon;
  const warnings = chart.meta.warnings.filter((w) => !w.startsWith("TIME_UNKNOWN"));

  return (
    <>
      {tu && (
        <Notice tone="warning">
          {t.timeUnknown}
          {tu.moon_nakshatra_stable ? "" : t.moonChanges}
        </Notice>
      )}
      {warnings.map((w) => (
        <Notice key={w}>{w}</Notice>
      ))}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <VargaCard chart={chart} vargaKey={vargaKey} hash={hash} t={t} />

        <div className="space-y-6">
          <Card title={t.keyFacts}>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {[
                [t.lagna, tu ? t.unknown : rashiName(chart.lagna.rashi, locale)],
                [t.moonSign, rashiName(moon.rashi, locale)],
                [t.nakshatra, `${nakshatraName(moon.nakshatra, locale, moon.nakshatra_name)} ${moon.pada}`],
                [t.mahadasha, lordName(chart.dasha.vimshottari.running[0]?.lord ?? "", locale)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-surface-sunken p-3">
                  <dt className="caption-4 text-ink-soft">{k}</dt>
                  <dd className="title-3 mt-1 text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="caption-5 mt-3 text-ink-muted">{t.ayanamsha(chart.meta.ayanamsha_deg.toFixed(4))}</p>
          </Card>

          <PlanetsCard chart={chart} vargaKey={vargaKey} t={t} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <DashaCard chart={chart} t={t} />
        <YogaCard chart={chart} t={t} />
      </div>
    </>
  );
}

function VargaCard({ chart, vargaKey, hash, t }: { chart: Chart; vargaKey: string; hash: string; t: Text }) {
  const locale = useLocale();
  const v = VARGAS.find((x) => x.key === vargaKey)!;
  return (
    <Card title={t.vargaTitle(v)} description={t.vargaDescription(v)}>
      <nav aria-label={t.pickVarga}>
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
                  title={t.vargaTooltip(x)}
                  className={`caption-3 inline-flex items-center gap-1 rounded-full border px-3 py-1 transition active:scale-98 ${
                    active
                      ? "border-surface-inverse bg-surface-inverse text-ink-inverse on-inverse"
                      : "border-line-strong bg-surface-card text-ink-soft hover:border-brand hover:text-ink"
                  }`}
                >
                  {x.key}
                  <span className="caption-5">{vargaName(x, locale)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mx-auto mt-4 max-w-md">
        <NorthIndianChart houses={vargaHouses(chart, vargaKey)} label={t.vargaTitle(v)} />
      </div>
      <p className="caption-5 mt-3 text-center text-ink-muted">{t.legend}</p>
    </Card>
  );
}

function PlanetsCard({ chart, vargaKey, t }: { chart: Chart; vargaKey: string; t: Text }) {
  const locale = useLocale();
  const showVarga = vargaKey !== "D1";
  const v = chart.vargas[vargaKey];
  return (
    <Card title={t.planets} description={t.planetsHint}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-80 text-left">
          <thead>
            <tr className="text-ink-soft">
              <th scope="col" className="caption-4 pb-2 pr-3">{t.planet}</th>
              <th scope="col" className="caption-4 pb-2 pr-3">{t.signDegree}</th>
              <th scope="col" className="caption-4 pb-2 pr-3">{t.nakshatra}</th>
              <th scope="col" className="caption-4 hidden pb-2 pr-3 md:table-cell">{t.starLord}</th>
              {showVarga && (
                <th scope="col" className="caption-4 pb-2 pr-3">
                  {vargaKey}
                </th>
              )}
              <th scope="col" className="caption-4 pb-2 text-right">{t.house}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr className="body-6 text-ink">
              <th scope="row" className="body-4 py-2 pr-3 align-top">{t.lagna}</th>
              <td className="py-2 pr-3 align-top">
                {rashiName(chart.lagna.rashi, locale)}
                <span className="caption-5 block text-ink-muted">{chart.lagna.dms}</span>
              </td>
              <td className="py-2 pr-3 align-top">
                {nakshatraName(chart.lagna.nakshatra, locale, chart.lagna.nakshatra_name)} {chart.lagna.pada}
              </td>
              <td className="hidden py-2 pr-3 align-top md:table-cell">{grahaName(chart.lagna.nak_lord, locale)}</td>
              {showVarga && <td className="py-2 pr-3 align-top">{rashiName(v.lagna, locale)}</td>}
              <td className="py-2 text-right align-top">1</td>
            </tr>
            {GRAHAS.map((g) => {
              const p = chart.planets[g];
              const tags = [
                dignityName(p.dignity, locale),
                p.retro && g !== "Rahu" && g !== "Ketu" ? t.retro : null,
                p.combust ? t.combust : null,
              ].filter(Boolean);
              return (
                <tr key={g} className="body-6 text-ink">
                  <th scope="row" className="body-4 py-2 pr-3 align-top">
                    {grahaName(g, locale)}
                    {tags.length > 0 && <span className="caption-4 block text-brand-strong">{tags.join(" · ")}</span>}
                  </th>
                  <td className="py-2 pr-3 align-top">
                    {rashiName(p.rashi, locale)}
                    <span className="caption-5 block text-ink-muted">{p.dms}</span>
                  </td>
                  <td className="py-2 pr-3 align-top">
                    {nakshatraName(p.nakshatra, locale, p.nakshatra_name)} {p.pada}
                  </td>
                  <td className="hidden py-2 pr-3 align-top md:table-cell">{grahaName(p.nak_lord, locale)}</td>
                  {showVarga && <td className="py-2 pr-3 align-top">{rashiName(v.planets[g], locale)}</td>}
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

function DashaCard({ chart, t }: { chart: Chart; t: Text }) {
  const locale = useLocale();
  const v = chart.dasha.vimshottari;
  const y = chart.dasha.yogini;
  const nextAntar = v.next.find((p) => p.level === "antar");
  const periodRow = (p: DashaPeriod): [ReactNode, ReactNode] => [
    levelName(p.level, locale),
    <span key={p.level}>
      <span className="body-4">{lordName(p.lord, locale)}</span>
      <span className="caption-5 block text-ink-muted">{t.period(day(p.start), day(p.end))}</span>
    </span>,
  ];
  return (
    <Card title={t.dasha} description={t.dashaHint}>
      <h3 className="title-3 text-ink">{t.vimshottari}</h3>
      <p className="caption-2 mt-1 text-ink-soft">{t.balance(lordName(v.balance.lord, locale), v.balance.years.toFixed(1))}</p>
      <KV rows={v.running.map(periodRow)} />
      {nextAntar && (
        <p className="caption-2 mt-2 text-ink-soft">{t.nextAntar(lordName(nextAntar.lord, locale), day(nextAntar.start))}</p>
      )}
      <h3 className="title-3 mt-6 text-ink">{t.yogini}</h3>
      <KV rows={y.running.map(periodRow)} />
      <p className="caption-2 mt-3 text-ink-soft">
        {t.fullTable((label) => (
          <Link href="/kundli/sheet" className="text-brand-strong underline underline-offset-2">
            {label}
          </Link>
        ))}
      </p>
    </Card>
  );
}

function YogaCard({ chart, t }: { chart: Chart; t: Text }) {
  return (
    <Card title={t.yogasDoshas} description={t.yogasHint}>
      <HitList title={t.yogas} hits={chart.yogas} empty={t.noYogas} dosha={false} t={t} />
      <div className="mt-6">
        <HitList title={t.doshas} hits={chart.doshas.list} empty={t.noDoshas} dosha t={t} />
      </div>
      {chart.doshas.kaal_sarp !== "none" && <p className="body-5 mt-4 text-ink">{t.kaalSarp(chart.doshas.kaal_sarp === "full")}</p>}
    </Card>
  );
}

function HitList({ title, hits, empty, dosha, t }: { title: string; hits: YogaHit[]; empty: string; dosha: boolean; t: Text }) {
  const locale = useLocale();
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
            <li key={hit.id} className="rounded-xl border border-line p-3">
              <p className="flex flex-wrap items-center gap-2">
                {/* Hindi pages lead with the Hindi name and show the engine's English name under it. */}
                <span className="body-4 text-ink">{locale === "hi" ? hit.name_hi : hit.name_en}</span>
                <span
                  className={`caption-3 rounded-full px-2 py-0.5 ${
                    !active ? "bg-neutral-soft text-neutral" : dosha ? "bg-warning-soft text-warning" : "bg-success-soft text-success"
                  }`}
                >
                  {!active ? t.cancelled : dosha ? t.present : t.formed}
                </span>
              </p>
              {locale === "hi" && <p className="caption-5 mt-1 text-ink-muted">{hit.name_en}</p>}
              {!active && reasons.size > 0 && (
                <p className="caption-2 mt-1 text-ink-soft">{t.cancelReason([...reasons].map((r) => cancelName(r, locale)).join("; "))}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
