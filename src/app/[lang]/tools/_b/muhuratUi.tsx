"use client";

import { useMemo, useState } from "react";
import { PiCaretDown, PiMagnifyingGlass } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { makeBi, hasDevanagari, type LagnaRows } from "@/lib/services/toolsBBi";
import { CITIES } from "@/lib/services/toolsBEngines/cities";
import type { PlaceForm } from "@/lib/services/toolsBMuhurat";
import { inputCls, labelCls } from "../../kundli/_components/ui";

// Building blocks shared by the Muhurat and Yagyopavit tools, on the kundli pages' design tokens.

/** [English, Hindi] text by the page's language, as the app's tool screens do. */
export function useBi() {
  const locale = useLocale();
  return useMemo(() => makeBi(locale), [locale]);
}

/** Text the engine wrote. Where it is still Hindi on an English page (a few rule names), it is marked as Hindi. */
export function Tx({ children }: { children: string }) {
  const locale = useLocale();
  if (locale === "en" && hasDevanagari(children)) return <span lang="hi">{children}</span>;
  return <>{children}</>;
}

export const toggleCls = (on: boolean) =>
  `button-sm rounded-full border px-3 py-1.5 text-left transition active:scale-98 ${
    on ? "border-ink bg-surface-inverse text-ink-inverse on-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"
  }`;

/** A row of choices, one active (the app's chips). */
export function ChipRow<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className={labelCls}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <button key={String(v)} type="button" aria-pressed={v === value} onClick={() => onChange(v)} className={toggleCls(v === value)}>
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="body-5 flex cursor-pointer items-start gap-3 text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--color-ink)]" />
      <span className="min-w-0">{label}</span>
    </label>
  );
}

/** A collapsible group of form fields. */
export function Fold({ title, children, defaultOpen = false }: { title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-line">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 p-3 text-left">
        <span className="title-4 min-w-0 break-words text-ink">{title}</span>
        <PiCaretDown className={`h-4 w-4 shrink-0 text-ink-muted transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && <div className="space-y-4 border-t border-line p-3">{children}</div>}
    </div>
  );
}

export function Pill({ children, tone = "mid" }: { children: React.ReactNode; tone?: "good" | "mid" | "bad" | "gold" }) {
  const cls = {
    good: "bg-success-soft text-success",
    mid: "bg-warning-soft text-warning",
    bad: "bg-danger-soft text-danger",
    gold: "bg-brand text-brand-ink",
  }[tone];
  return <span className={`caption-2 inline-block rounded-full px-2.5 py-0.5 font-semibold ${cls}`}>{children}</span>;
}

export const GRADE_TONE = [null, "gold", "good", "mid"] as const;
export const GRADE_BAR = ["", "border-l-brand", "border-l-success", "border-l-busy"];

/** The grade counts of a search. */
export function Counts({ items }: { items: { n: number; label: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((x, i) => (
        <div key={i} className={`rounded-lg border-2 p-3 text-center ${["border-brand", "border-success", "border-busy"][i]}`}>
          <p className="heading-5 text-ink">{x.n}</p>
          <p className="caption-2 text-ink-soft">{x.label}</p>
        </div>
      ))}
    </div>
  );
}

export function Bullets({ items, tone }: { items: string[]; tone?: "good" | "bad" | "mid" | "muted" }) {
  const cls = tone === "good" ? "text-success" : tone === "bad" ? "text-danger" : tone === "mid" ? "text-warning" : tone === "muted" ? "text-ink-soft" : "text-ink";
  return (
    <ul className={`body-6 space-y-1 ${cls}`}>
      {items.map((x, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden>•</span>
          <span className="min-w-0 whitespace-pre-line">
            <Tx>{x}</Tx>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function H4({ children }: { children: React.ReactNode }) {
  return <h4 className="caption-4 mt-4 text-brand-strong first:mt-0">{children}</h4>;
}

/** A person (or batuk) card: role, name, rows. */
export function PersonCard({ role, name, rows }: { role: string; name: string; rows: [string, string][] }) {
  return (
    <div className="rounded-xl border border-line border-t-4 border-t-brand p-4">
      <p className="caption-4 text-brand-strong">
        <Tx>{role}</Tx>
      </p>
      <p className="title-2 mt-1 break-words text-ink">
        <Tx>{name}</Tx>
      </p>
      <dl className="mt-2 divide-y divide-line">
        {rows.map(([k, v], i) => (
          <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5">
            <dt className="caption-1 text-ink-soft">{k}</dt>
            <dd className="body-5 min-w-0 whitespace-pre-line text-right text-ink">
              <Tx>{v}</Tx>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const lagnaText = defineMessages({
  hi: {
    head: "दिन के श्रेष्ठ लग्न:",
    none: "इस दिन सूर्यास्त तक कोई पूर्ण शुद्ध (श्रेष्ठ) लग्न नहीं",
    none24: "इस दिन कोई पूर्ण शुद्ध (श्रेष्ठ) लग्न नहीं",
    title: "इस दिन की सम्पूर्ण लग्न सारणी (सूर्योदय से अगले सूर्योदय तक)",
    lagna: "लग्न",
    time: "समय",
    shuddhi: "लग्न शुद्धि",
    notes: "टिप्पणी",
    cls: { shreshth: "श्रेष्ठ", madhyam: "मध्यम", varjit: "वर्जित" },
    here: "यह मुहूर्त",
    full: "पूर्ण मुहूर्त",
    only: "अनुमत केवल",
    clean: "शुद्ध",
    note: "लग्न शुद्धि जातक की जन्मराशि/जन्मलग्न व ग्रह-स्थिति से है। 'पूर्ण मुहूर्त' वही समय है जब तिथि, नक्षत्र, वार, बल आदि सभी नियम भी शुद्ध हों।",
  },
  en: {
    head: "Best lagnas of the day:",
    none: "No fully clean (shreshth) lagna on this day before sunset",
    none24: "No fully clean (shreshth) lagna on this day",
    title: "Full lagna table of the day (sunrise to next sunrise)",
    lagna: "Lagna",
    time: "Time",
    shuddhi: "Lagna shuddhi",
    notes: "Remarks",
    cls: { shreshth: "Shreshth", madhyam: "Madhyam", varjit: "Varjit" },
    here: "This muhurat",
    full: "Full muhurat",
    only: "allowed only",
    clean: "clean",
    note: "Lagna shuddhi is from the native's janma rashi/janma lagna and the planets. A 'full muhurat' is a time when tithi, nakshatra, vaar, bala and every other rule are clean too.",
  },
});

/** The engines' lagna table for one day: sunrise to next sunrise, this window's rows marked, rows outside the karya's period dimmed. */
export function LagnaTable({ rows, card, hm }: { rows: LagnaRows; card: { s: number; e: number }; hm: (s: string) => string }) {
  const t = useT(lagnaText);
  const o = rows.o;
  const span = (x: { s: number; e: number }) => `${o.fmt(x.s)}–${o.fmt(x.e)}`;
  const tone = { shreshth: "good", madhyam: "mid", varjit: "bad" } as const;
  return (
    <div className="mt-3 rounded-xl border border-line p-3">
      <h4 className="caption-4 text-brand-strong">{t.title}</h4>
      <div className="mt-2 overflow-x-auto">
        <table className="body-6 w-full min-w-[34rem] text-left">
          <thead>
            <tr className="bg-surface-inverse text-ink-inverse on-inverse">
              {[t.lagna, t.time, t.shuddhi, t.notes].map((c) => (
                <th key={c} scope="col" className="caption-2 px-2 py-1.5 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const here = Math.min(r.e, card.e) - Math.max(r.s, card.s) >= 6e4;
              const partial = !r.out && (r.inSpans.length > 1 || r.inSpans[0].s > r.s || r.inSpans[0].e < r.e);
              const notes = [
                ...(r.why.length ? r.why : [t.clean]),
                ...(partial ? [`${t.only} ${r.inSpans.map(span).join(", ")}`] : []),
                ...r.kaal.map((k) => `${k.name} ${span(k)}`),
                ...(r.full.length ? [`${t.full}: ${r.full.map(span).join(", ")}`] : []),
                ...(r.outWhy ? [r.outWhy] : []),
              ];
              return (
                <tr key={r.s} className={`border-b border-line align-top ${here ? "bg-surface-sunken" : ""} ${r.out ? "opacity-60" : ""}`} data-here={here || undefined}>
                  <td className="px-2 py-1.5">
                    <span className="title-4 text-ink">
                      <Tx>{o.rashi(r.sign)}</Tx>
                    </span>
                    {here && <span className="caption-2 block text-brand-strong">{t.here}</span>}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-ink-soft">{hm(span(r))}</td>
                  <td className="px-2 py-1.5">
                    <Pill tone={tone[r.cls]}>{t.cls[r.cls]}</Pill>
                  </td>
                  <td className="px-2 py-1.5 text-ink-soft">
                    <Tx>{hm(notes.join("; "))}</Tx>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="caption-2 mt-2 text-ink-soft">{t.note}</p>
    </div>
  );
}

/** The "Best lagnas of the day" line above a lagna table. */
export function bestLagnasText(rows: LagnaRows, hm: (s: string) => string) {
  return hm(
    rows
      .filter((r) => r.cls === "shreshth")
      .flatMap((r) => r.inSpans.map((x) => `${rows.o.rashi(r.sign)} ${rows.o.fmt(x.s)}–${rows.o.fmt(x.e)}`))
      .join(" · "),
  );
}
export function useLagnaLines() {
  return useT(lagnaText);
}

// ─── Place ────────────────────────────────────────────────────────────────────────────────

export const placeOf = (i: number | null): PlaceForm => ({ city: i, custom: false, name: i == null ? "" : CITIES[i][0], lat: "", lon: "", tz: "5.5" });
export type Place = { name: string; lat: number; lon: number; tz: number };

/** A chosen city, or the custom latitude / longitude / time zone when they all parse; else null. */
export function placeVal(p: PlaceForm, other: string, hi: boolean): Place | null {
  if (p.custom) {
    const lat = parseFloat(p.lat);
    const lon = parseFloat(p.lon);
    const tz = parseFloat(p.tz);
    return isNaN(lat) || isNaN(lon) || isNaN(tz) ? null : { name: p.name.trim() || other, lat, lon, tz };
  }
  if (p.city == null) return null;
  const c = CITIES[p.city];
  return { name: hi ? c[1] : c[0], lat: c[2], lon: c[3], tz: c[4] };
}

const MAX_HITS = 8;

/**
 * A birthplace or venue: the app's city list filtered as you type, or "Other place" with latitude, longitude and
 * the time zone as hours from UTC. City names follow the page's language, and typing in either script finds them.
 */
export function PlaceField({ id, label, value, onChange }: { id: string; label: string; value: PlaceForm; onChange: (p: PlaceForm) => void }) {
  const bi = useBi();
  const locale = useLocale();
  const set = (p: Partial<PlaceForm>) => onChange({ ...value, ...p });
  const q = value.name.trim().toLowerCase();
  const nameOf = (i: number) => CITIES[i][locale === "hi" ? 1 : 0];
  const hits =
    value.city == null && !value.custom && q
      ? CITIES.flatMap((c, i) => (c[0].toLowerCase().includes(q) || c[1].toLowerCase().includes(q) ? [i] : [])).slice(0, MAX_HITS)
      : [];
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <div className="relative">
        <PiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input
          id={id}
          autoComplete="off"
          maxLength={120}
          value={value.custom ? value.name : value.city != null ? nameOf(value.city) : value.name}
          placeholder={value.custom ? bi("Place name", "स्थान का नाम") : bi("Type the city", "शहर का नाम लिखें")}
          onChange={(e) => set({ name: e.target.value, city: null })}
          className={`${inputCls} pl-9`}
        />
      </div>
      {hits.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface-card">
          {hits.map((i) => (
            <li key={i}>
              <button type="button" className="body-5 w-full px-3 py-2 text-left text-ink hover:bg-surface-sunken" onClick={() => set({ city: i, name: CITIES[i][0] })}>
                {nameOf(i)}
              </button>
            </li>
          ))}
        </ul>
      )}
      {value.city == null && !value.custom && !!q && hits.length === 0 && (
        <p className="caption-2 text-ink-soft">{bi("No city of that name in the list. Choose “Other place”.", "सूची में इस नाम का शहर नहीं। \"अन्य स्थान\" चुनें।")}</p>
      )}
      <button type="button" aria-pressed={value.custom} onClick={() => set({ custom: !value.custom, city: null })} className={toggleCls(value.custom)}>
        {bi("Other place (enter latitude/longitude)", "अन्य स्थान (अक्षांश/रेखांश भरें)")}
      </button>
      {value.custom && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor={`${id}-lat`} className={labelCls}>
              {bi("Latitude °N", "अक्षांश °N")}
            </label>
            <input id={`${id}-lat`} inputMode="decimal" value={value.lat} onChange={(e) => set({ lat: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label htmlFor={`${id}-lon`} className={labelCls}>
              {bi("Longitude °E", "रेखांश °E")}
            </label>
            <input id={`${id}-lon`} inputMode="decimal" value={value.lon} onChange={(e) => set({ lon: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label htmlFor={`${id}-tz`} className={labelCls}>
              {bi("Time zone (hours from UTC)", "समय-क्षेत्र (UTC से घंटे)")}
            </label>
            <input id={`${id}-tz`} inputMode="decimal" value={value.tz} onChange={(e) => set({ tz: e.target.value })} className={inputCls} />
          </div>
        </div>
      )}
    </div>
  );
}

/** A labelled native date or time input. */
export function DateField({
  id,
  label,
  type,
  value,
  onChange,
  min,
  max,
}: {
  id: string;
  label: string;
  type: "date" | "time";
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <input id={id} type={type} value={value} min={min} max={max} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}

export function TextField({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <input id={id} autoComplete="off" maxLength={100} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}

/** Hides the site's header, footer and the form when printing the result. */
export function PrintStyles() {
  return (
    <style>{`@media print{header,footer,[data-noprint]{display:none!important}main{padding-top:0!important}body{background:#fff!important}}`}</style>
  );
}
