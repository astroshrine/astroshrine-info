"use client";

import Link from "next/link";
import { PiPrinter } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";
import {
  CHARA_HI,
  DIGNITY_HI,
  STHIRA_HI,
  TARA_HI,
  VAAR_HI,
  coords,
  day,
  grahaHi,
  lordHi,
  nakshatraHi,
  rashiHi,
  runningIndex,
  sheetChartHouses,
  sheetLagnaHouses,
  type ChartHouse,
  type DashaNode,
  type Graha,
  type Sheet,
} from "@/lib/jyotish";
import { fetchOwnSheet } from "@/lib/services/jyotish";
import NorthIndianChart from "../_components/NorthIndianChart";
import { Card, CardSkeleton, Disclaimer, ErrorBox, KV, Notice, PageHeader, SignInPrompt, btnPrimary, btnSmall } from "../_components/ui";
import { jyotishErrorText, useJyotish } from "../_components/useJyotish";

/** The app's "My Kundli" sheet: GET /v1/jyotish/sheet/:userId from the account's own birth details (shared DB). */
export default function SheetView() {
  const { status, session } = useAuth();
  const userId = session?.user.id ?? null;
  const req = useJyotish(status === "signedIn" && userId ? `sheet|${userId}` : null, (signal) => fetchOwnSheet(userId!, signal));

  const missing = req.error instanceof ApiError && req.error.status === 404;

  return (
    <div className="space-y-6">
      {status === "loading" || req.loading ? (
        <>
          <PageHeader eyebrow="मेरी विस्तृत कुंडली" title="आपकी कुंडली शीट" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <CardSkeleton chart rows={1} />
            <CardSkeleton chart rows={1} />
          </div>
        </>
      ) : status === "signedOut" || (req.error instanceof ApiError && req.error.status === 401) ? (
        <>
          <PageHeader eyebrow="मेरी विस्तृत कुंडली" title="आपकी कुंडली शीट">
            यह शीट आपके खाते में सहेजे जन्म विवरण से बनती है, वही जो AstroShrine ऐप में है।
          </PageHeader>
          <SignInPrompt what="अपनी विस्तृत कुंडली" />
        </>
      ) : missing ? (
        <>
          <PageHeader eyebrow="मेरी विस्तृत कुंडली" title="खाते में जन्म विवरण नहीं है" />
          <div className="rounded-3xl border border-line bg-surface-card p-6">
            <p className="body-3 max-w-2xl text-ink-soft">
              विस्तृत कुंडली आपके खाते के जन्म विवरण से बनती है। नई कुंडली जोड़ते समय “यह मेरी अपनी कुंडली है, खाते में भी सहेजें”
              चुनें, या ऐप में प्रोफ़ाइल में जन्म तिथि, समय और स्थान भरें।
            </p>
            <Link href="/kundli?new=1" className={`${btnPrimary} mt-4`}>
              अपनी कुंडली जोड़ें
            </Link>
          </div>
        </>
      ) : req.error ? (
        <>
          <PageHeader eyebrow="मेरी विस्तृत कुंडली" title="आपकी कुंडली शीट" />
          <ErrorBox message={jyotishErrorText(req.error)} onRetry={req.retry} />
        </>
      ) : req.data ? (
        <SheetBody s={req.data} now={req.at} />
      ) : null}

      <Disclaimer />
    </div>
  );
}

function SheetBody({ s, now }: { s: Sheet; now: number }) {
  const lagnaRow = s.rows.find((r) => r.graha === "Lagna")!;
  const moonRow = s.rows.find((r) => r.graha === "Moon")!;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader eyebrow="मेरी विस्तृत कुंडली" title={s.profile.name || "मेरी कुंडली"}>
          {day(s.birth.date)} · {s.birth.time} · {VAAR_HI[s.vaar]} · {s.profile.place}
        </PageHeader>
        <button type="button" onClick={() => window.print()} className={btnSmall}>
          <PiPrinter className="h-4 w-4" aria-hidden /> प्रिंट या PDF
        </button>
      </div>

      <Card title="जन्म का विवरण">
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["अक्षांश, देशांतर", coords(s.birth.lat, s.birth.lon)],
            ["समय क्षेत्र", s.birth.tz],
            ["लाहिड़ी अयनांश", `${s.ayanamsha.deg.toFixed(4)}°`],
            ["लग्न · राशि", `${rashiHi(lagnaRow.rashi)} · ${rashiHi(moonRow.rashi)}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-surface-sunken p-3">
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
          चार्ट
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <MiniChart title="लग्न कुंडली" houses={sheetLagnaHouses(s)} />
          <MiniChart title="भाव चलित" houses={sheetChartHouses(s.charts.lagna_chalit)} />
          <MiniChart title="चंद्र कुंडली" houses={sheetChartHouses(s.charts.chandra)} lagnaLabel="चंद्र" />
          <MiniChart title="नवांश (D9)" houses={sheetChartHouses(s.charts.navamsha)} />
        </div>
      </section>

      <PlanetTable s={s} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <DashaTreeCard title="विंशोत्तरी दशा" tree={s.dasha.vimshottari} levels={["महादशा", "अंतर्दशा", "प्रत्यंतर"]} now={now} />
        <div className="space-y-6">
          <DashaTreeCard title="योगिनी दशा" tree={s.dasha.yogini} levels={["महादशा", "अंतर्दशा"]} now={now} />
          <SavCard s={s} />
        </div>
      </div>

      {s.gochar && <GocharCard s={s} />}
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

function PlanetTable({ s }: { s: Sheet }) {
  return (
    <Card title="ग्रह तालिका" description="नवांश स्वामी = ग्रह की नवांश राशि का स्वामी। शड्बल 1 या अधिक = पर्याप्त बल।">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left">
          <thead>
            <tr className="text-ink-soft">
              {["ग्रह", "राशि · अंश", "नक्षत्र · पद", "नक्षत्र स्वामी", "उप स्वामी", "नवांश स्वामी", "स्थिति", "शड्बल", "कारक", "तारा"].map((h) => (
                <th key={h} scope="col" className="caption-4 pb-2 pr-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {s.rows.map((r) => {
              const tags = [r.dignity ? DIGNITY_HI[r.dignity] : null, r.retro && r.graha !== "Rahu" && r.graha !== "Ketu" ? "वक्री" : null, r.combust ? "अस्त" : null].filter(Boolean);
              const karaka = [r.chara_karaka ? CHARA_HI[r.chara_karaka] ?? r.chara_karaka : null, r.sthira_karaka ? STHIRA_HI[r.sthira_karaka] ?? r.sthira_karaka : null].filter(Boolean);
              return (
                <tr key={r.graha} className="body-6 text-ink">
                  <th scope="row" className="body-4 py-2 pr-4">
                    {r.graha === "Lagna" ? "लग्न" : grahaHi(r.graha)}
                  </th>
                  <td className="py-2 pr-4">
                    {rashiHi(r.rashi)} <span className="caption-5 text-ink-muted">{r.dms}</span>
                  </td>
                  <td className="py-2 pr-4">
                    {nakshatraHi(r.nakshatra)} {r.pada}
                  </td>
                  <td className="py-2 pr-4">{grahaHi(r.nak_lord)}</td>
                  <td className="py-2 pr-4">{grahaHi(r.sub_lord)}</td>
                  <td className="py-2 pr-4">{grahaHi(r.ansh_lord)}</td>
                  <td className="py-2 pr-4">{tags.length ? tags.join(", ") : "सम"}</td>
                  <td className="py-2 pr-4">
                    {r.shadbala ? (
                      <span className={r.shadbala.ratio >= 1 ? "text-success" : "text-warning"}>{r.shadbala.ratio.toFixed(2)}</span>
                    ) : (
                      <span className="text-ink-muted">नहीं</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">{karaka.length ? karaka.join(", ") : <span className="text-ink-muted">नहीं</span>}</td>
                  <td className="py-2 pr-4">{TARA_HI[r.tara - 1] ?? r.tara}</td>
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
function DashaNodeRow({ p, depth, levels, now }: { p: DashaNode; depth: number; levels: string[]; now: number }) {
  const running = Date.parse(p.start) <= now && now < Date.parse(p.end);
  const label = (
    <span className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
      <span className={depth === 0 ? "body-4 text-ink" : "body-5 text-ink"}>
        {lordHi(p.lord)}
        {p.graha ? <span className="caption-5 ml-1 text-ink-muted">({grahaHi(p.graha as Graha)})</span> : null}
        {running && <span className="caption-3 ml-2 text-brand-strong">चल रही</span>}
      </span>
      <span className="caption-5 text-ink-muted">
        {day(p.start)} से {day(p.end)} तक
      </span>
    </span>
  );
  if (!p.sub?.length) return <div className={`flex rounded-lg px-3 py-2 ${running ? "bg-surface-sunken" : ""}`}>{label}</div>;
  return (
    <details open={running} className={`rounded-lg ${running ? "bg-surface-sunken" : ""}`}>
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-surface-sunken">
        {label}
      </summary>
      <div className="space-y-1 pb-2 pl-4">
        <p className="caption-4 px-3 text-ink-soft">{levels[depth + 1]}</p>
        {p.sub.map((c) => (
          <DashaNodeRow key={c.start} p={c} depth={depth + 1} levels={levels} now={now} />
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
}: {
  title: string;
  tree: { balance: { lord: string; years: number }; periods: DashaNode[] };
  levels: string[];
  now: number;
}) {
  const idx = runningIndex(tree.periods, now);
  return (
    <Card
      title={title}
      description={`जन्म के समय शेष: ${lordHi(tree.balance.lord)} ${tree.balance.years.toFixed(1)} वर्ष${idx >= 0 ? ` · अभी ${lordHi(tree.periods[idx].lord)} महादशा` : ""}`}
    >
      <p className="caption-4 mb-2 px-3 text-ink-soft">{levels[0]}</p>
      <div className="space-y-1">
        {tree.periods.map((p) => (
          <DashaNodeRow key={p.start} p={p} depth={0} levels={levels} now={now} />
        ))}
      </div>
    </Card>
  );
}

function SavCard({ s }: { s: Sheet }) {
  const max = Math.max(...s.sav);
  return (
    <Card title="सर्वाष्टकवर्ग" description={`हर भाव के बिंदु, लग्न से गिने गए। कुल ${s.sav_total}।`}>
      <ol className="grid grid-cols-6 gap-2 md:grid-cols-12 lg:grid-cols-6 xl:grid-cols-12">
        {s.sav.map((b, i) => (
          <li key={i} className="flex flex-col items-center gap-1">
            <span className="flex h-20 w-full items-end overflow-hidden rounded-lg bg-surface-sunken" aria-hidden>
              <span className="block w-full rounded-lg bg-brand" style={{ height: `${Math.round((b / max) * 100)}%` }} />
            </span>
            <span className="caption-3 text-ink">{b}</span>
            <span className="caption-5 text-ink-muted">भाव {i + 1}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function GocharCard({ s }: { s: Sheet }) {
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
    <Card title="आज का गोचर" description={`${day(g.at)} को ग्रह, जन्म कुंडली के भावों पर (${fromLagna ? "लग्न से" : "चंद्र से"})।`}>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <div className="mx-auto w-full max-w-sm">
          <NorthIndianChart houses={houses} label="आज का गोचर" lagnaLabel={fromLagna ? "लग्न" : "चंद्र"} />
        </div>
        <KV
          rows={g.planets.map((p) => [
            grahaHi(p.graha),
            `${rashiHi(p.rashi)} ${p.dms}${p.retro && p.graha !== "Rahu" && p.graha !== "Ketu" ? " वक्री" : ""} · भाव ${
              p.house_from_lagna ?? p.house_from_moon
            }`,
          ])}
        />
      </div>
    </Card>
  );
}
