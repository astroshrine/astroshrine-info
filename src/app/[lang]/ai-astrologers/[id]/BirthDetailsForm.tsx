"use client";

import { useState } from "react";
import { PiCalendarStar } from "react-icons/pi";
import { primaryButton, quietButton } from "@/components/consult/Dialog";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import type { BirthPlace } from "@/lib/jyotish";
import { saveBirthChart } from "@/lib/services/aiAstrologers";
import PlaceSearch from "../../kundli/_components/PlaceSearch";

const text = defineMessages({
  hi: {
    title: "सही जवाब के लिए अपनी जन्म जानकारी दें",
    body: "यह ज्योतिषी आपकी कुंडली से जवाब देते हैं। जानकारी आपके account में सेव होती है और ऐप में भी काम आती है।",
    date: "जन्म की तारीख",
    time: "जन्म का समय",
    place: "जन्म का शहर",
    save: "सेव करें",
    saving: "सेव हो रहा है…",
    later: "अभी नहीं",
    failed: "जानकारी सेव नहीं हो सकी। कृपया फिर से कोशिश करें।",
  },
  en: {
    title: "Add your birth details for better answers",
    body: "This astrologer answers from your birth chart. The details are saved to your account and work in the app too.",
    date: "Date of birth",
    time: "Time of birth",
    place: "Birth city",
    save: "Save",
    saving: "Saving…",
    later: "Not now",
    failed: "The details could not be saved. Please try again.",
  },
});

const input = "body-6 rounded-xl border border-line-strong bg-surface-page px-3 py-2 text-ink";

export default function BirthDetailsForm({ onSaved, onSkip }: { onSaved: () => void; onSkip: () => void }) {
  const t = useT(text);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState<BirthPlace | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"failed" | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !place) return;
    setBusy(true);
    setError(null);
    try {
      await saveBirthChart({ birthDate: date, birthTime: time, birthPlace: place.name, latitude: place.lat, longitude: place.lon, timezone: place.tz });
      onSaved();
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-card p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-sunken text-brand-strong">
          <PiCalendarStar className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="title-4 text-ink">{t.title}</h2>
          <p className="caption-2 text-ink-soft">{t.body}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="caption-2 text-ink-soft">{t.date}</span>
          <input type="date" required value={date} max={new Date().toISOString().substring(0, 10)} min="1900-01-01" onChange={(e) => setDate(e.target.value)} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="caption-2 text-ink-soft">{t.time}</span>
          <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={input} />
        </label>
        <div className="sm:col-span-2">
          {/* The same place popup as every other birth form on the site. */}
          <PlaceSearch id="ai-birth-place" label={t.place} value={place} onPick={setPlace} />
        </div>
      </div>
      {error && (
        <p role="alert" className="caption-2 text-danger">
          {t.failed}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy || !date || !time || !place} className={primaryButton}>
          {busy ? t.saving : t.save}
        </button>
        <button type="button" onClick={onSkip} disabled={busy} className={quietButton}>
          {t.later}
        </button>
      </div>
    </form>
  );
}
