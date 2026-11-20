"use client";

import { useState } from "react";
import { PiCaretRight, PiClock } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { grahaAbbr, lordName, type DashaNode, type Graha, type Sheet } from "@/lib/jyotish";
import { Card } from "../../_console/ui";
import { dt } from "./design";
import { badgeInk, GRAHA_COLOR, periodState, percentDone, ymd, type PeriodState } from "./kundliData";
import { Head } from "./parts";

/** Length of each mahadasha in the Vimshottari scheme. */
const MD_YEARS: Record<string, number> = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
const fn = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

const STATE_STYLE: Record<PeriodState, string> = {
  run: "bg-brand text-brand-ink",
  done: "bg-success-soft text-success",
  pre: "bg-neutral-soft text-ink-soft",
  up: "bg-surface-sunken text-brand-strong",
};

function Badge({ lord, size }: { lord: string; size: number }) {
  const locale = useLocale();
  return (
    <span
      className="flex flex-none items-center justify-center rounded-full font-extrabold"
      style={{ width: size, height: size, background: GRAHA_COLOR[lord] ?? "#14213D", color: badgeInk(lord), fontSize: size > 40 ? 15 : 11.5 }}
    >
      {grahaAbbr(lord as Graha, locale)}
    </span>
  );
}

/** The running mahadasha, antardasha and pratyantar, and the three-column explorer of the whole Vimshottari tree. */
export default function DashaExplorer({ sheet, now }: { sheet: Sheet; now: number }) {
  const t = useT(dt);
  const locale = useLocale();
  const tree = sheet.dasha.vimshottari;
  const birth = sheet.birth.date;
  const stateOf = (p: DashaNode) => periodState(p, now, birth);
  const runMd = tree.periods.findIndex((p) => stateOf(p) === "run");
  const [mdPick, setMdPick] = useState<number | null>(null);
  const [adPick, setAdPick] = useState<{ md: number; ad: number } | null>(null);
  const mdIdx = mdPick ?? (runMd >= 0 ? runMd : 0);
  const md = tree.periods[mdIdx];
  const ads = md?.sub ?? [];
  const runAd = ads.findIndex((a) => stateOf(a) === "run");
  const adIdx = adPick && adPick.md === mdIdx ? adPick.ad : runAd >= 0 ? runAd : 0;
  const ad = ads[adIdx];
  const pds = ad?.sub ?? [];

  const runCardMd = tree.periods[runMd];
  const runCardAd = runCardMd?.sub?.find((a) => stateOf(a) === "run");
  const runCardPd = runCardAd?.sub?.find((a) => stateOf(a) === "run");
  const name = (l: string) => lordName(l, locale);
  const range = (p: DashaNode, first = false) =>
    t.rangeT(first && Date.parse(p.start) < Date.parse(`${birth}T00:00:00Z`) ? `${t.fromBirth} ${fn(`${birth}`)}` : fn(p.start), fn(p.end));
  const bal = ymd(tree.balance.years);

  return (
    <Card className="px-6 py-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <Head icon={PiClock} id="dt">
          {t.dashaTitle}
        </Head>
        <span className="inline-flex h-8 items-center rounded-full bg-surface-sunken px-3 text-[13px] font-bold text-brand-strong">{t.balance(name(tree.balance.lord), bal.y, bal.m, bal.d)}</span>
      </div>
      {runCardMd && (
        <>
          <div className="mt-[18px] flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
            <span className="inline-block h-[9px] w-[9px] flex-none animate-pulse rounded-full bg-online" />
            {t.runNow}
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-3 min-[1101px]:grid-cols-3">
            {[
              { p: runCardMd, label: t.maha, dark: true },
              { p: runCardAd, label: t.antar, dark: false },
              { p: runCardPd, label: t.praty, dark: false },
            ].map(({ p, label, dark }) =>
              p ? (
                <div key={label} className={`flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-2xl px-4 py-3.5 motion-safe:animate-reveal-down ${dark ? "bg-surface-inverse text-ink-inverse" : "border border-[#F2D58A] bg-surface-sunken text-ink"}`}>
                  <Badge lord={p.lord} size={44} />
                  <div className="min-w-0 flex-[1_1_160px]">
                    <div className={`text-[13px] font-semibold ${dark ? "text-[#FFE29A]" : "text-brand-strong"}`}>{label}</div>
                    <div className="font-display text-xl font-bold leading-[1.15]">{name(p.lord)}</div>
                    <div className={`text-[13.5px] ${dark ? "text-[#E7E9F0]" : ""}`}>{t.rangeT(fn(p.start), fn(p.end))}</div>
                  </div>
                  <div className="min-w-[120px] flex-[1_1_140px]">
                    <div className="h-2 overflow-hidden rounded-lg bg-[rgba(20,33,61,.14)]">
                      <div className="h-full rounded-lg bg-brand" style={{ width: `${percentDone(p, now)}%` }} />
                    </div>
                    <div className={`mt-[5px] text-[13px] font-bold ${dark ? "text-[#E7E9F0]" : ""}`}>{t.pctDone(percentDone(p, now))}</div>
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </>
      )}
      <div className="mb-3 mt-[22px] text-[13.5px] text-ink-soft">{t.exHint}</div>
      <div className="grid grid-cols-1 items-start gap-4 min-[1101px]:grid-cols-3">
        <Column label={t.maha}>
          {tree.periods.map((p, i) => (
            <Row key={p.start} p={p} state={stateOf(p)} on={i === mdIdx} title={`${name(p.lord)} · ${t.years(MD_YEARS[p.lord] ?? 0)}`} range={range(p, i === 0)} onClick={() => { setMdPick(i); setAdPick(null); }} />
          ))}
        </Column>
        <Column label={md ? t.exAd(name(md.lord)) : t.antar}>
          {ads.map((p, j) => (
            <Row key={p.start} p={p} state={stateOf(p)} on={j === adIdx} title={name(p.lord)} range={range(p)} onClick={() => setAdPick({ md: mdIdx, ad: j })} />
          ))}
        </Column>
        <Column label={md && ad ? t.exPd(name(md.lord), name(ad.lord)) : t.praty}>
          {pds.map((p) => (
            <Row key={p.start} p={p} state={stateOf(p)} on={false} title={name(p.lord)} range={range(p)} />
          ))}
        </Column>
      </div>
    </Card>
  );
}

function Column({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="min-h-[22px] px-0.5 pb-1 text-[13px] font-semibold text-ink-soft">{label}</div>
      {children}
    </div>
  );
}

function Row({ p, state, on, title, range, onClick }: { p: DashaNode; state: PeriodState; on: boolean; title: string; range: string; onClick?: () => void }) {
  const t = useT(dt);
  const cls = `flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
    on ? "border border-surface-inverse bg-surface-inverse text-ink-inverse" : state === "run" ? "border-[1.5px] border-brand bg-surface-sunken text-ink" : "border border-line bg-surface-page text-ink"
  }`;
  const body = (
    <>
      <Badge lord={p.lord} size={30} />
      <span className="min-w-0 flex-1 text-left leading-[1.3]">
        <b className="block text-[14.5px]">{title}</b>
        <span className={`text-[12.5px] tabular-nums ${on ? "text-[#E7E9F0]" : ""}`}>{range}</span>
      </span>
      <span className={`inline-flex h-[22px] flex-none items-center rounded-full px-2 text-[11px] font-bold ${STATE_STYLE[state]}`}>{t.state[state]}</span>
      {onClick && <PiCaretRight className="h-[15px] w-[15px] flex-none" aria-hidden />}
    </>
  );
  return onClick ? (
    <button type="button" aria-pressed={on} onClick={onClick} className={`${cls} cursor-pointer`}>
      {body}
    </button>
  ) : (
    <div className={`${cls} min-h-12`}>{body}</div>
  );
}
