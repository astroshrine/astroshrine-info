"use client";

import { useState } from "react";
import { PiMagnifyingGlass, PiMapPin } from "react-icons/pi";
import { ApiError } from "@/lib/api";
import { geocodePlace } from "@/lib/endpoints";
import { coords, type BirthPlace } from "@/lib/jyotish";
import { useAuth } from "@/components/AuthProvider";
import { LoginLink, inputCls, labelCls } from "./ui";
import { jyotishErrorText } from "./useJyotish";

/**
 * Place name -> coordinates and IANA time zone through the backend geocoder the app's birth forms use
 * (one best match). The lookup needs a signed in account; a visitor is pointed to login.
 */
export default function PlaceSearch({
  id,
  label,
  value,
  onPick,
}: {
  id: string;
  label: string;
  value: BirthPlace | null;
  onPick: (place: BirthPlace | null) => void;
}) {
  const { status } = useAuth();
  const [query, setQuery] = useState(value?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    const q = query.trim();
    if (q.length < 2) {
      setError("जगह का नाम लिखें, जैसे Ujjain, Madhya Pradesh।");
      return;
    }
    if (status !== "signedIn") {
      setError("login");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const g = await geocodePlace(q);
      const place = { name: g.formattedAddress, lat: g.latitude, lon: g.longitude, tz: g.timezone };
      setQuery(place.name);
      onPick(place);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 404
          ? "यह जगह नहीं मिली। शहर के साथ राज्य या देश लिखकर देखें।"
          : jyotishErrorText(e),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          autoComplete="off"
          maxLength={200}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(null);
            if (value) onPick(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!busy) void search();
            }
          }}
          placeholder="शहर, राज्य"
          aria-describedby={`${id}-hint`}
          className={`${inputCls} min-w-0 flex-1`}
        />
        <button
          type="button"
          onClick={() => void search()}
          disabled={busy}
          className="button-sm inline-flex shrink-0 items-center gap-2 rounded-lg bg-surface-inverse px-3 py-2 text-ink-inverse transition on-inverse hover:bg-surface-inverse-raised active:scale-98 disabled:opacity-60"
        >
          <PiMagnifyingGlass className="h-4 w-4" aria-hidden />
          {busy ? "खोज रहे हैं" : "खोजें"}
        </button>
      </div>
      <div id={`${id}-hint`} className="mt-2" aria-live="polite">
        {error === "login" ? (
          <p className="caption-2 text-ink-soft">
            जगह खोजने के लिए{" "}
            <LoginLink className="text-brand-strong underline underline-offset-2">लॉगिन करें</LoginLink>। आपकी भरी हुई
            जानकारी यहीं रहेगी।
          </p>
        ) : error ? (
          <p role="alert" className="caption-2 text-danger">
            {error}
          </p>
        ) : value ? (
          <p className="caption-2 flex items-start gap-2 text-ink-soft">
            <PiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
            <span className="min-w-0 break-words">
              {value.name} · {coords(value.lat, value.lon)} · {value.tz}
            </span>
          </p>
        ) : (
          <p className="caption-2 text-ink-muted">“खोजें” दबाकर सही जगह चुनें। अक्षांश, देशांतर और समय क्षेत्र अपने आप आ जाएंगे।</p>
        )}
      </div>
    </div>
  );
}
