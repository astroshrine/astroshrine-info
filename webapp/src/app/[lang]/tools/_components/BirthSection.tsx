"use client";

import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import type { BirthPlace } from "@/lib/jyotish";
import type { ToolPlace } from "@/lib/services/tools";
import type { ReportLang } from "@/lib/services/toolsMansik";
import PlaceSearch from "../../kundli/_components/PlaceSearch";
import { Choice, Field, todayISO } from "./forms";

const text = defineMessages({
  hi: {
    name: "नाम",
    dob: "जन्म तिथि",
    tob: "जन्म समय (वैकल्पिक)",
    place: "जन्म स्थान",
    language: "रिपोर्ट की भाषा",
    hinglish: "Hinglish",
    english: "English",
  },
  en: {
    name: "Name",
    dob: "Date of birth",
    tob: "Time of birth (optional)",
    place: "Place of birth",
    language: "Report language",
    hinglish: "Hinglish",
    english: "English",
  },
});

export type Birth = { name: string; dob: string; tob: string; place: BirthPlace | null; language: ReportLang };

export const emptyBirth = (hi: boolean): Birth => ({ name: "", dob: "", tob: "", place: null, language: hi ? "hinglish" : "english" });

/** The place as the tool endpoints take it (lng, not lon). */
export const toToolPlace = (p: BirthPlace): ToolPlace => ({ name: p.name, lat: p.lat, lng: p.lon, tz: p.tz });

/** Birth details of the person the report is for: shared by the Mansik and Jeevan forms. */
export default function BirthSection({ value, onChange, idPrefix }: { value: Birth; onChange: (next: Birth) => void; idPrefix: string }) {
  const t = useT(text);
  const set = <K extends keyof Birth>(k: K, v: Birth[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t.name} value={value.name} maxLength={100} autoComplete="off" onChange={(e) => set("name", e.target.value)} />
      <Field label={t.dob} type="date" value={value.dob} min="1920-01-01" max={todayISO()} onChange={(e) => set("dob", e.target.value)} />
      <Field label={t.tob} type="time" value={value.tob} onChange={(e) => set("tob", e.target.value)} />
      <PlaceSearch id={`${idPrefix}-place`} label={t.place} value={value.place} onPick={(p) => set("place", p)} />
      <div className="sm:col-span-2">
        <Choice
          label={t.language}
          value={value.language}
          onChange={(v) => set("language", v)}
          options={[
            { value: "hinglish", label: t.hinglish },
            { value: "english", label: t.english },
          ]}
        />
      </div>
    </div>
  );
}
