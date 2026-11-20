"use client";

import type { ReactNode } from "react";
import { PiPrinter } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import {
  charaName,
  coords,
  day,
  dignityName,
  grahaName,
  levelName,
  lordName,
  nakshatraName,
  rashiName,
  runningIndex,
  sheetChartHouses,
  sheetLagnaHouses,
  sthiraName,
  taraName,
  vaarName,
  type ChartHouse,
  type DashaLevel,
  type DashaNode,
  type Sheet,
} from "@/lib/jyotish";
import { fetchOwnSheet } from "@/lib/services/jyotish";
import NorthIndianChart from "../_components/NorthIndianChart";
import { Card, CardSkeleton, Disclaimer, ErrorBox, KV, Notice, PageHeader, SignInPrompt, btnPrimary, btnSmall } from "../_components/ui";
import { jyotishErrorText, useJyotish } from "../_components/useJyotish";

const text = defineMessages({
  hi: {
    eyebrow: "मेरी विस्तृत कुंडली",
    title: "आपकी कुंडली शीट",
    signInIntro: "यह शीट आपके खाते में सहेजे जन्म विवरण से बनती है, वही जो AstroShrine ऐप में है।",
    signInWhat: "अपनी विस्तृत कुंडली",
    missingTitle: "खाते में जन्म विवरण नहीं है",
    missingBody:
      "विस्तृत कुंडली आपके खाते के जन्म विवरण से बनती है। नई कुंडली जोड़ते समय “यह मेरी अपनी कुंडली है, खाते में भी सहेजें” चुनें, या ऐप में प्रोफ़ाइल में जन्म तिथि, समय और स्थान भरें।",
    addOwn: "अपनी कुंडली जोड़ें",
    myKundli: "मेरी कुंडली",
    print: "प्रिंट या PDF",
    birth: "जन्म का विवरण",
    latLon: "अक्षांश, देशांतर",
    timeZone: "समय क्षेत्र",
    ayanamsha: "लाहिड़ी अयनांश",
    lagnaMoon: "लग्न · राशि",
    charts: "चार्ट",
    lagnaChart: "लग्न कुंडली",
    chalit: "भाव चलित",
    moonChart: "चंद्र कुंडली",
    moon: "चंद्र",
    navamsha: "नवांश (D9)",
    planetTable: "ग्रह तालिका",
    planetTableHint: "नवांश स्वामी = ग्रह की नवांश राशि का स्वामी। शड्बल 1 या अधिक = पर्याप्त बल।",
    columns: ["ग्रह", "राशि · अंश", "नक्षत्र · पद", "नक्षत्र स्वामी", "उप स्वामी", "नवांश स्वामी", "स्थिति", "शड्बल", "कारक", "तारा"],
    lagna: "लग्न",
    retro: "वक्री",
    combust: "अस्त",
    neutral: "सम",
    none: "नहीं",
    running: "चल रही",
    period: (from: string, to: string) => `${from} से ${to} तक`,
    vimshottari: "विंशोत्तरी दशा",
    yogini: "योगिनी दशा",
    balance: (lord: string, years: string, current: string | null) =>
      `जन्म के समय शेष: ${lord} ${years} वर्ष${current ? ` · अभी ${current} महादशा` : ""}`,
    sav: "सर्वाष्टकवर्ग",
    savHint: (total: number) => `हर भाव के बिंदु, लग्न से गिने गए। कुल ${total}।`,
    house: (n: number): ReactNode => `भाव ${n}`,
    gochar: "आज का गोचर",
    gocharHint: (date: string, fromLagna: boolean) => `${date} को ग्रह, जन्म कुंडली के भावों पर (${fromLagna ? "लग्न से" : "चंद्र से"})।`,
    gocharRow: (sign: string, dms: string, retro: boolean, house: number) => `${sign} ${dms}${retro ? " वक्री" : ""} · भाव ${house}`,
  },
  en: {
    eyebrow: "My detailed kundli",
    title: "Your kundli sheet",
    signInIntro: "This sheet is made from the birth details saved in your account, the same ones the AstroShrine app uses.",
    signInWhat: "your detailed kundli",
    missingTitle: "No birth details in your account",
    missingBody:
      "The detailed kundli is made from your account's birth details. When you add a new kundli, tick “This is my own kundli, also save it to my account”, or fill in your date, time and place of birth in your profile in the app.",
    addOwn: "Add your kundli",
    myKundli: "My kundli",
    print: "Print or PDF",
    birth: "Birth details",
    latLon: "Latitude, longitude",
    timeZone: "Time zone",
    ayanamsha: "Lahiri ayanamsha",
    lagnaMoon: "Ascendant · Moon sign",
    charts: "Charts",
    lagnaChart: "Lagna chart",
    chalit: "Bhava chalit",
    moonChart: "Moon chart",
    moon: "Moon",
    navamsha: "Navamsha (D9)",
    planetTable: "Planet table",
    planetTableHint: "Navamsha lord = the lord of the planet's Navamsha sign. Shadbala of 1 or more = enough strength.",
    columns: ["Planet", "Sign · degree", "Nakshatra · pada", "Nakshatra lord", "Sub lord", "Navamsha lord", "Status", "Shadbala", "Karaka", "Tara"],
    lagna: "Ascendant",
    retro: "Retrograde",
    combust: "Combust",
    neutral: "Neutral",
    none: "None",
    running: "Current",
    period: (from, to) => `${from} to ${to}`,
    vimshottari: "Vimshottari dasha",
    yogini: "Yogini dasha",
    balance: (lord, years, current) => `Balance at birth: ${lord} ${years} years${current ? ` · ${current} Mahadasha now` : ""}`,
    sav: "Sarvashtakavarga",
    savHint: (total) => `Points in each house, counted from the Ascendant. Total ${total}.`,
    // "House 12" is wider than a bar on phones and in the 12 column layout, so English stacks it on two lines.
    house: (n) => (
      <>
        House
        <br />
        {n}
      </>
    ),
    gochar: "Today's transits",
    gocharHint: (date, fromLagna) => `Planets on ${date}, in the houses of the birth chart (from the ${fromLagna ? "Ascendant" : "Moon"}).`,
    gocharRow: (sign, dms, retro, house) => `${sign} ${dms}${retro ? " retrograde" : ""} · House ${house}`,
  },
});
type Text = (typeof text)["hi"];

/** The app's "My Kundli" sheet: GET /v1/jyotish/sheet/:userId from the account's own birth details (shared DB). */
export default function SheetView() {
  const { status, session } = useAuth();
  const t = useT(text);
  const locale = useLocale();
  const userId = session?.user.id ?? null;
  const req = useJyotish(status === "signedIn" && userId ? `sheet|${userId}` : null, (signal) => fetchOwnSheet(userId!, signal));

  const missing = req.error instanceof ApiError && req.error.status === 404;

  return (
    <div className="space-y-6">
      {status === "loading" || req.loading ? (
        <>
          <PageHeader eyebrow={t.eyebrow} title={t.title} />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <CardSkeleton chart rows={1} />
            <CardSkeleton chart rows={1} />
          </div>
        </>
      ) : status === "signedOut" || (req.error instanceof ApiError && req.error.status === 401) ? (
        <>
          <PageHeader eyebrow={t.eyebrow} title={t.title}>
            {t.signInIntro}
          </PageHeader>
          <SignInPrompt what={t.signInWhat} />
        </>
      ) : missing ? (
        <>
          <PageHeader eyebrow={t.eyebrow} title={t.missingTitle} />
          <div className="rounded-2xl border border-line bg-surface-card p-6">
            <p className="body-3 max-w-2xl text-ink-soft">{t.missingBody}</p>
            <Link href="/kundli?new=1" className={`${btnPrimary} mt-4`}>
              {t.addOwn}
            </Link>
          </div>
        </>
      ) : req.error ? (
        <>
          <PageHeader eyebrow={t.eyebrow} title={t.title} />
          <ErrorBox message={jyotishErrorText(req.error, locale)} onRetry={req.retry} />
        </>
      ) : req.data ? (
        <SheetBody s={req.data} now={req.at} t={t} />
      ) : null}

      <Disclaimer />
    </div>
  );
}

function SheetBody({ s, now, t }: { s: Sheet; now: number; t: Text }) {
  const locale = useLocale();
  const lagnaRow = s.rows.find((r) => r.graha === "Lagna")!;
  const moonRow = s.rows.find((r) => r.graha === "Moon")!;
  const levels = (list: DashaLevel[]) => list.map((l) => levelName(l, locale));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader eyebrow={t.eyebrow} title={s.profile.name || t.myKundli}>
          {day(s.birth.date)} · {s.birth.time} · {vaarName(s.vaar, locale)} · {s.profile.place}
        </PageHeader>
        <button type="button" onClick={() => window.print()} className={btnSmall}>
          <PiPrinter className="h-4 w-4" aria-hidden /> {t.print}
        </button>
      </div>

      <Card title={t.birth}>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            [t.latLon, coords(s.birth.lat, s.birth.lon)],
            [t.timeZone, s.birth.tz],
            [t.ayanamsha, `${s.ayanamsha.deg.toFixed(4)}°`],
            [t.lagnaMoon, `${rashiName(lagnaRow.rashi, locale)} · ${rashiName(moonRow.rashi, locale)}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-surface-sunken p-3">
              <dt className="caption-4 text-ink-soft">{k}</dt>
              <dd className="body-5 mt-1 break-words text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        {s.warnings.map((w) => (
          <div key={w} className="mt-3">
            <Notice>{w}</Notice>
          </div>
        ))}
      </Card>

      <section aria-labelledby="sheet-charts" className="space-y-4">
        <h2 id="sheet-charts" className="heading-6 text-ink">
          {t.charts}
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <MiniChart title={t.lagnaChart} houses={sheetLagnaHouses(s)} />
          <MiniChart title={t.chalit} houses={sheetChartHouses(s.charts.lagna_chalit)} />
          <MiniChart title={t.moonChart} houses={sheetChartHouses(s.charts.chandra)} lagnaLabel={t.moon} />
          <MiniChart title={t.navamsha} houses={sheetChartHouses(s.charts.navamsha)} />
        </div>
      </section>

      <PlanetTable s={s} t={t} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <DashaTreeCard title={t.vimshottari} tree={s.dasha.vimshottari} levels={levels(["maha", "antar", "pratyantar"])} now={now} t={t} />
        <div className="space-y-6">
          <DashaTreeCard title={t.yogini} tree={s.dasha.yogini} levels={levels(["maha", "antar"])} now={now} t={t} />
          <SavCard s={s} t={t} />
        </div>
      </div>

      {s.gochar && <GocharCard s={s} t={t} />}
    </>
  );
}

function MiniChart({ title, houses, lagnaLabel }: { title: string; houses: ChartHouse[]; lagnaLabel?: string }) {
  return (
    <Card title={title}>
      <NorthIndianChart houses={houses} label={title} lagnaLabel={lagnaLabel} />
    </Card>
  );
}

function PlanetTable({ s, t }: { s: Sheet; t: Text }) {
  const locale = useLocale();
  return (
    <Card title={t.planetTable} description={t.planetTableHint}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left">
          <thead>
            <tr className="text-ink-soft">
              {t.columns.map((h) => (
                <th key={h} scope="col" className="caption-4 pb-2 pr-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {s.rows.map((r) => {
              const tags = [
                r.dignity ? dignityName(r.dignity, locale) : null,
                r.retro && r.graha !== "Rahu" && r.graha !== "Ketu" ? t.retro : null,
                r.combust ? t.combust : null,
              ].filter(Boolean);
              const karaka = [
                r.chara_karaka ? charaName(r.chara_karaka, locale) : null,
                r.sthira_karaka ? sthiraName(r.sthira_karaka, locale) : null,
              ].filter(Boolean);
              return (
                <tr key={r.graha} className="body-6 text-ink">
                  <th scope="row" className="body-4 py-2 pr-4">
                    {r.graha === "Lagna" ? t.lagna : grahaName(r.graha, locale)}
                  </th>
                  <td className="py-2 pr-4">
                    {rashiName(r.rashi, locale)} <span className="caption-5 text-ink-muted">{r.dms}</span>
                  </td>
                  <td className="py-2 pr-4">
                    {nakshatraName(r.nakshatra, locale)} {r.pada}
                  </td>
                  <td className="py-2 pr-4">{grahaName(r.nak_lord, locale)}</td>
                  <td className="py-2 pr-4">{grahaName(r.sub_lord, locale)}</td>
                  <td className="py-2 pr-4">{grahaName(r.ansh_lord, locale)}</td>
                  <td className="py-2 pr-4">{tags.length ? tags.join(", ") : t.neutral}</td>
                  <td className="py-2 pr-4">
                    {r.shadbala ? (
                      <span className={r.shadbala.ratio >= 1 ? "text-success" : "text-warning"}>{r.shadbala.ratio.toFixed(2)}</span>
                    ) : (
                      <span className="text-ink-muted">{t.none}</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">{karaka.length ? karaka.join(", ") : <span className="text-ink-muted">{t.none}</span>}</td>
                  <td className="py-2 pr-4">{taraName(r.tara, locale)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** One dasha period; it opens to the periods inside it, and starts open while it is running. */
function DashaNodeRow({ p, depth, levels, now, t }: { p: DashaNode; depth: number; levels: string[]; now: number; t: Text }) {
  const locale = useLocale();
  const running = Date.parse(p.start) <= now && now < Date.parse(p.end);
  const label = (
    <span className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
      <span className={depth === 0 ? "body-4 text-ink" : "body-5 text-ink"}>
        {lordName(p.lord, locale)}
        {p.graha ? <span className="caption-5 ml-1 text-ink-muted">({grahaName(p.graha, locale)})</span> : null}
        {running && <span className="caption-3 ml-2 text-brand-strong">{t.running}</span>}
      </span>
      <span className="caption-5 text-ink-muted">{t.period(day(p.start), day(p.end))}</span>
    </span>
  );
  if (!p.sub?.length) return <div className={`flex rounded-xl px-3 py-2 ${running ? "bg-surface-sunken" : ""}`}>{label}</div>;
  return (
    <details open={running} className={`rounded-xl ${running ? "bg-surface-sunken" : ""}`}>
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-surface-sunken">
        {label}
      </summary>
      <div className="space-y-1 pb-2 pl-4">
        <p className="caption-4 px-3 text-ink-soft">{levels[depth + 1]}</p>
        {p.sub.map((c) => (
          <DashaNodeRow key={c.start} p={c} depth={depth + 1} levels={levels} now={now} t={t} />
        ))}
      </div>
    </details>
  );
}

/** The whole dasha timeline, maha to pratyantar (Vimshottari) or maha to antar (Yogini). */
function DashaTreeCard({
  title,
  tree,
  levels,
  now,
  t,
}: {
  title: string;
  tree: { balance: { lord: string; years: number }; periods: DashaNode[] };
  levels: string[];
  now: number;
  t: Text;
}) {
  const locale = useLocale();
  const idx = runningIndex(tree.periods, now);
  return (
    <Card
      title={title}
      description={t.balance(
        lordName(tree.balance.lord, locale),
        tree.balance.years.toFixed(1),
        idx >= 0 ? lordName(tree.periods[idx].lord, locale) : null,
      )}
    >
      <p className="caption-4 mb-2 px-3 text-ink-soft">{levels[0]}</p>
      <div className="space-y-1">
        {tree.periods.map((p) => (
          <DashaNodeRow key={p.start} p={p} depth={0} levels={levels} now={now} t={t} />
        ))}
      </div>
    </Card>
  );
}

function SavCard({ s, t }: { s: Sheet; t: Text }) {
  const max = Math.max(...s.sav);
  return (
    <Card title={t.sav} description={t.savHint(s.sav_total)}>
      <ol className="grid grid-cols-6 gap-2 md:grid-cols-12 lg:grid-cols-6 xl:grid-cols-12">
        {s.sav.map((b, i) => (
          <li key={i} className="flex flex-col items-center gap-1">
            <span className="flex h-20 w-full items-end overflow-hidden rounded-xl bg-surface-sunken" aria-hidden>
              <span className="block w-full rounded-xl bg-brand" style={{ height: `${Math.round((b / max) * 100)}%` }} />
            </span>
            <span className="caption-3 text-ink">{b}</span>
            <span className="caption-5 text-center text-ink-muted">{t.house(i + 1)}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function GocharCard({ s, t }: { s: Sheet; t: Text }) {
  const locale = useLocale();
  const g = s.gochar!;
  const fromLagna = g.planets.every((p) => p.house_from_lagna !== null);
  const baseRashi = fromLagna ? s.rows.find((r) => r.graha === "Lagna")!.rashi : s.rows.find((r) => r.graha === "Moon")!.rashi;
  const houses: ChartHouse[] = Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    rashi: ((baseRashi - 1 + i) % 12) + 1,
    planets: g.planets
      .filter((p) => (fromLagna ? p.house_from_lagna : p.house_from_moon) === i + 1)
      .map((p) => ({ graha: p.graha, retro: p.retro })),
  }));

  return (
    <Card title={t.gochar} description={t.gocharHint(day(g.at), fromLagna)}>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <div className="mx-auto w-full max-w-sm">
          {/* The chart's own label under house 1 is the lagna; counted from the Moon, it says so. */}
          <NorthIndianChart houses={houses} label={t.gochar} lagnaLabel={fromLagna ? undefined : t.moon} />
        </div>
        <KV
          rows={g.planets.map((p) => [
            grahaName(p.graha, locale),
            t.gocharRow(
              rashiName(p.rashi, locale),
              p.dms,
              p.retro && p.graha !== "Rahu" && p.graha !== "Ketu",
              p.house_from_lagna ?? p.house_from_moon,
            ),
          ])}
        />
      </div>
    </Card>
  );
}
