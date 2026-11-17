"use client";

import { useState } from "react";
import { PiMapPin } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { todayYmd } from "@/lib/services/toolsBCommon";
import PlaceSearch from "../../kundli/_components/PlaceSearch";
import { Card, btnSmall } from "../../kundli/_components/ui";
import { Check, Choice, Field } from "../delivery-muhurat/fields";
import type { Draft, Place } from "./_logic/draft";
import { tagName, traditionsOf, type Kb, type Sanskar } from "./_logic/kb";
import { VAAR_EN } from "./_logic/names";
import { defaultMonthSystem } from "./_logic/sankalpa";
import { smText } from "./messages";

type Patch = (p: Partial<Draft>) => void;
const WEEKDAYS_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

const asPlace = (p: Place | null) => (p ? { name: p.name, lat: p.lat, lon: p.lng, tz: p.tz } : null);

function Place_({ id, label, value, onPick }: { id: string; label: string; value: Place | null; onPick: (p: Place | null) => void }) {
  return <PlaceSearch id={id} label={label} value={asPlace(value)} onPick={(b) => onPick(b ? { name: b.name, lat: b.lat, lng: b.lon, tz: b.tz } : null)} />;
}

export function ChildStep({ d, patch }: { d: Draft; patch: Patch }) {
  const t = useT(smText);
  const c = d.child;
  const set = (p: Partial<Draft["child"]>) => patch({ child: { ...c, ...p } });
  return (
    <div className="space-y-4">
      <h2 className="heading-6 text-ink">{t.step.child}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.childName} value={c.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} />
        <Choice
          label={t.step.child}
          value={c.gender}
          options={[
            { value: "M", label: t.boy },
            { value: "F", label: t.girl },
          ]}
          onChange={(gender) => set({ gender })}
        />
        <Field label={t.dob} type="date" value={c.date} max={todayYmd()} onChange={(e) => set({ date: e.target.value })} />
        <Field label={t.tob} type="time" value={c.time} onChange={(e) => set({ time: e.target.value })} />
      </div>
      <Place_ id="sm-birth" label={t.birthPlace} value={c.place} onPick={(place) => set({ place })} />
      <Check label={t.isEldest} checked={c.isEldest} onChange={(isEldest) => set({ isEldest })} />
      <p className="caption-2 text-ink-soft">{t.ageAuto}</p>
    </div>
  );
}

export function RitualStep({ d, patch }: { d: Draft; patch: Patch }) {
  const t = useT(smText);
  const locale = useLocale();
  const toggle = (x: Sanskar) => patch({ sanskars: d.sanskars.includes(x) ? d.sanskars.filter((y) => y !== x) : [...d.sanskars, x] });
  const band = d.timeBand;
  const pill = (on: boolean) =>
    `body-6 rounded-full border px-3 py-1.5 transition active:scale-98 ${on ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"}`;
  return (
    <div className="space-y-4">
      <h2 className="heading-6 text-ink">{t.step.ritual}</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t.step.ritual}>
        {(["annaprashan", "mundan"] as const).map((sk) => (
          <button key={sk} type="button" aria-pressed={d.sanskars.includes(sk)} className={pill(d.sanskars.includes(sk))} onClick={() => toggle(sk)}>
            {t[sk]}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.from} type="date" value={d.from} min={todayYmd()} onChange={(e) => patch({ from: e.target.value })} />
        <Field label={t.to} type="date" value={d.to} min={d.from || todayYmd()} onChange={(e) => patch({ to: e.target.value })} />
      </div>
      <p className="caption-2 text-ink-soft">{t.rangeNote}</p>
      <div>
        <p className="title-4 mb-2 text-ink">{t.weekdays}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.weekdays}>
          <button type="button" aria-pressed={!d.weekdays} className={pill(!d.weekdays)} onClick={() => patch({ weekdays: null })}>
            {t.allDays}
          </button>
          {WEEKDAYS_HI.map((w, i) => {
            const on = !!d.weekdays?.includes(i);
            return (
              <button
                key={w}
                type="button"
                aria-pressed={on}
                className={pill(on)}
                onClick={() => {
                  const cur = d.weekdays ?? [];
                  patch({ weekdays: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort() });
                }}
              >
                {locale === "hi" ? w : VAAR_EN[i].slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>
      <Choice
        label={t.timeBand}
        value={typeof band === "object" ? "range" : band}
        options={[
          { value: "any", label: t.band.any },
          { value: "morning", label: t.band.morning },
          { value: "afternoon", label: t.band.afternoon },
          { value: "range", label: t.band.range },
        ]}
        onChange={(b) => patch({ timeBand: b === "range" ? { from: "07:00", to: "11:00" } : b })}
      />
      {typeof band === "object" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.bandFrom} type="time" value={band.from} onChange={(e) => patch({ timeBand: { ...band, from: e.target.value } })} />
          <Field label={t.bandTo} type="time" value={band.to} onChange={(e) => patch({ timeBand: { ...band, to: e.target.value } })} />
        </div>
      )}
      <p className="caption-2 text-ink-soft">{t.forenoonNote}</p>
      {d.sanskars.includes("mundan") && (
        <div className="space-y-2 rounded-2xl border border-line p-4">
          <p className="caption-2 text-ink-soft">{t.expectingQ}</p>
          <Check label={t.expecting} checked={d.motherExpecting} onChange={(motherExpecting) => patch({ motherExpecting })} />
        </div>
      )}
    </div>
  );
}

export function VenueStep({ d, patch }: { d: Draft; patch: Patch }) {
  const t = useT(smText);
  const v = d.venue;
  const set = (p: Partial<Draft["venue"]>) => patch({ venue: { ...v, ...p } });
  return (
    <div className="space-y-4">
      <h2 className="heading-6 text-ink">{t.step.venue}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.venueName} value={v.name} maxLength={120} onChange={(e) => set({ name: e.target.value })} />
        <Field label={t.city} value={v.city} maxLength={80} onChange={(e) => set({ city: e.target.value })} />
        <Field label={t.state} value={v.state} maxLength={80} onChange={(e) => set({ state: e.target.value })} />
        <Field label={t.country} value={v.country} maxLength={60} onChange={(e) => set({ country: e.target.value })} />
      </div>
      <Place_ id="sm-venue" label={t.venueLocate} value={v.place} onPick={(place) => set({ place, confirmed: false, city: v.city || (place ? place.name.split(",")[0] : "") })} />
      {v.place && (
        <Card>
          <dl className="divide-y divide-line">
            {(
              [
                [t.coords, `${v.place.lat.toFixed(5)}, ${v.place.lng.toFixed(5)}`],
                [t.tz, v.place.tz || "-"],
              ] as const
            ).map(([k, val]) => (
              <div key={k} className="flex flex-wrap justify-between gap-2 py-2">
                <dt className="caption-1 text-ink-soft">{k}</dt>
                <dd className="body-5 text-ink">{val}</dd>
              </div>
            ))}
          </dl>
          <a className={`${btnSmall} mt-3`} target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${v.place.lat},${v.place.lng}`}>
            <PiMapPin className="h-4 w-4" aria-hidden /> {t.openMaps}
          </a>
        </Card>
      )}
      <Check label={t.venueConfirm} checked={v.confirmed} onChange={(confirmed) => set({ confirmed })} />
      <p className="caption-2 text-ink-soft">{t.venueNote}</p>
    </div>
  );
}

export function TraditionStep({ d, patch, kb }: { d: Draft; patch: Patch; kb: Kb }) {
  const t = useT(smText);
  const locale = useLocale();
  const tags = [...new Set(d.sanskars.flatMap((x) => traditionsOf(kb, x)))];
  const unit = d.sanskars.length === 1 && d.sanskars[0] === "annaprashan" ? "months" : "years";
  const fam = d.family;
  const ms = d.monthSystem ?? defaultMonthSystem(d.venue.state);
  const [ages, setAges] = useState(fam.ages.join(", "));
  return (
    <div className="space-y-4">
      <h2 className="heading-6 text-ink">{t.step.tradition}</h2>
      <div>
        <p className="title-4 mb-2 text-ink">{t.traditionPick}</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.traditionPick}>
          {tags.map((tag) => {
            const on = d.tradition === tag;
            const label = tag === "DPJ-104" ? t.traditionBase : tagName(tag, locale);
            return (
              <button
                key={tag}
                type="button"
                role="radio"
                aria-checked={on}
                lang={locale === "en" && /[ऀ-ॿ]/.test(label) ? "hi" : undefined}
                onClick={() => patch({ tradition: tag })}
                className={`body-6 rounded-full border px-3 py-1.5 transition active:scale-98 ${on ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-card text-ink hover:border-brand"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="caption-2 mt-2 text-ink-soft">{t.traditionNote}</p>
      </div>

      <Choice
        label={t.family}
        value={fam.mode}
        options={[
          { value: "default", label: t.familyDefault },
          ...(d.sanskars.includes("mundan") ? [{ value: "oddYear" as const, label: t.familyOdd }] : []),
          { value: "custom", label: t.familyCustom },
        ]}
        onChange={(mode) => patch({ family: { ...fam, mode } })}
      />
      {d.sanskars.length > 1 && fam.mode === "custom" && <p className="caption-2 text-warning">{t.familyBoth}</p>}
      {fam.mode === "custom" && (
        <Field
          label={unit === "months" ? t.familyMonths : t.familyYears}
          value={ages}
          inputMode="numeric"
          onChange={(e) => {
            const v = e.target.value;
            setAges(v);
            const n = [...new Set(v.split(/[^\d]+/).filter(Boolean).map(Number).filter((x) => x >= 1 && x <= (unit === "months" ? 36 : 16)))].sort((a, b) => a - b);
            patch({ family: { ...fam, ages: n } });
          }}
        />
      )}
      <Field label={t.familyNote} value={fam.note} maxLength={200} onChange={(e) => patch({ family: { ...fam, note: e.target.value } })} />

      <div>
        <Choice
          label={t.monthSystem}
          value={ms}
          options={[
            { value: "purnimanta", label: t.purnimanta },
            { value: "amanta", label: t.amanta },
          ]}
          onChange={(monthSystem) => patch({ monthSystem })}
        />
        <p className="caption-2 mt-2 text-ink-soft">{t.monthSystemNote}</p>
      </div>

      <h3 className="title-3 text-ink">{t.sankalpaDetails}</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t.gotra} value={d.gotra} maxLength={60} onChange={(e) => patch({ gotra: e.target.value })} />
        <Field label={t.father} value={d.father} maxLength={60} onChange={(e) => patch({ father: e.target.value })} />
        <Field label={t.mother} value={d.mother} maxLength={60} onChange={(e) => patch({ mother: e.target.value })} />
      </div>
    </div>
  );
}
