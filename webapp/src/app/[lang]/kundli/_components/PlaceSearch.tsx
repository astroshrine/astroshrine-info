"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { PiCircleNotch, PiMagnifyingGlass, PiMapPin } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { geocodePlace } from "@/lib/endpoints";
import { coords, type BirthPlace } from "@/lib/jyotish";
import { useAuth } from "@/components/AuthProvider";
import type { PlaceSuggestion } from "@/app/api/places/route";
import { LoginLink, inputCls, labelCls } from "./ui";
import { jyotishErrorText } from "./useJyotish";

const text = defineMessages({
  hi: {
    notFound: "यह जगह नहीं मिली। शहर के साथ राज्य या देश लिखकर देखें।",
    placeholder: "शहर या गाँव का नाम लिखें, जैसे उज्जैन",
    searching: "खोज रहे हैं…",
    noMatch: "कोई जगह नहीं मिली। नाम की वर्तनी जाँचें।",
    suggestFailed: "सुझाव अभी नहीं आ रहे। पूरा नाम लिखकर Enter दबाएँ।",
    pick: "सूची में से अपनी जगह चुनें।",
    /** `login` renders the login link around its label. */
    loginHint: (login: (label: string) => ReactNode): ReactNode => (
      <>भारत से बाहर की जगह के लिए {login("लॉगिन करें")}। आपकी भरी हुई जानकारी यहीं रहेगी।</>
    ),
    hint: "2 अक्षर लिखते ही जगहों की सूची खुलेगी। अक्षांश, देशांतर और समय क्षेत्र अपने आप आ जाएंगे।",
    places: "जगहों के सुझाव",
  },
  en: {
    notFound: "This place was not found. Try the city with its state or country.",
    placeholder: "Type a city or village, e.g. Ujjain",
    searching: "Searching…",
    noMatch: "No place found. Check the spelling.",
    suggestFailed: "Suggestions aren't available right now. Type the full name and press Enter.",
    pick: "Pick your place from the list.",
    loginHint: (login) => <>{login("Log in")} to use a place outside India. What you have filled in stays here.</>,
    hint: "A list of places opens as you type. Latitude, longitude and time zone are filled in for you.",
    places: "Place suggestions",
  },
});

/** Suggestions for what has been typed so far (GET /api/places, cached per query in this tab). */
const suggestionCache = new Map<string, PlaceSuggestion[]>();
async function suggest(q: string, signal: AbortSignal): Promise<PlaceSuggestion[]> {
  const key = q.toLowerCase();
  const hit = suggestionCache.get(key);
  if (hit) return hit;
  const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Place suggestions failed (${res.status})`);
  const places = (await res.json()) as PlaceSuggestion[];
  suggestionCache.set(key, places);
  return places;
}

type Panel =
  | { state: "closed" }
  | { state: "loading" }
  | { state: "list"; places: PlaceSuggestion[] }
  | { state: "empty" }
  | { state: "failed" };

/**
 * Birth place as a popup of suggestions under the field, like the app's place picker: type two letters, pick a place
 * (mouse, touch, or arrows and Enter). An Indian place gets Asia/Kolkata; a place abroad asks the backend geocoder,
 * the one the app's birth forms use, for its time zone (that lookup needs an account). If suggestions can't load,
 * Enter falls back to that geocoder's single best match.
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
  const t = useT(text);
  const locale = useLocale();
  const listId = useId();
  const [query, setQuery] = useState(value?.name ?? "");
  const [panel, setPanel] = useState<Panel>({ state: "closed" });
  const [active, setActive] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef<AbortController | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      request.current?.abort();
    },
    [],
  );

  // A click or tap outside closes the popup.
  useEffect(() => {
    if (panel.state === "closed") return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setPanel({ state: "closed" });
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [panel.state]);

  function typed(next: string) {
    setQuery(next);
    setError(null);
    setActive(-1);
    if (value) onPick(null);
    if (timer.current) clearTimeout(timer.current);
    request.current?.abort();
    const q = next.trim();
    if (q.length < 2) {
      setPanel({ state: "closed" });
      return;
    }
    setPanel({ state: "loading" });
    timer.current = setTimeout(() => {
      const ctrl = new AbortController();
      request.current = ctrl;
      suggest(q, ctrl.signal).then(
        (places) => {
          if (ctrl.signal.aborted) return;
          setPanel(places.length ? { state: "list", places } : { state: "empty" });
          setActive(places.length ? 0 : -1);
        },
        (e) => {
          if (ctrl.signal.aborted) return;
          console.error("[place] suggestions failed:", e);
          setPanel({ state: "failed" });
        },
      );
    }, 250);
  }

  /** The chosen suggestion, with its time zone. */
  async function choose(p: PlaceSuggestion) {
    setPanel({ state: "closed" });
    setQuery(p.label);
    setError(null);
    if (p.countryCode === "IN") {
      onPick({ name: p.label, lat: p.lat, lon: p.lon, tz: "Asia/Kolkata" });
      return;
    }
    if (status !== "signedIn") {
      setError("login");
      return;
    }
    setBusy(true);
    try {
      const g = await geocodePlace(p.label);
      onPick({ name: p.label, lat: p.lat, lon: p.lon, tz: g.timezone });
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? t.notFound : jyotishErrorText(e, locale));
    } finally {
      setBusy(false);
    }
  }

  /** No suggestions to pick from: the backend geocoder's single best match for the typed name (the old search). */
  async function searchTyped() {
    const q = query.trim();
    if (q.length < 2) return;
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
      setPanel({ state: "closed" });
      onPick(place);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? t.notFound : jyotishErrorText(e, locale));
    } finally {
      setBusy(false);
    }
  }

  const places = panel.state === "list" ? panel.places : [];
  const open = panel.state !== "closed";
  const optionId = (i: number) => `${listId}-o${i}`;

  return (
    <div ref={root}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <div className="relative">
        <PiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 && places[active] ? optionId(active) : undefined}
          aria-describedby={`${id}-hint`}
          autoComplete="off"
          maxLength={100}
          value={query}
          onChange={(e) => typed(e.target.value)}
          onFocus={() => {
            if (!value && query.trim().length >= 2 && panel.state === "closed") typed(query);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && places.length) {
              e.preventDefault();
              setActive((i) => (i + 1) % places.length);
            } else if (e.key === "ArrowUp" && places.length) {
              e.preventDefault();
              setActive((i) => (i <= 0 ? places.length - 1 : i - 1));
            } else if (e.key === "Escape" && open) {
              e.preventDefault();
              setPanel({ state: "closed" });
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (busy) return;
              if (places[active]) void choose(places[active]);
              else if (panel.state === "failed" || panel.state === "empty") void searchTyped();
              else if (!value && query.trim().length >= 2) setError(t.pick);
            }
          }}
          placeholder={t.placeholder}
          className={`${inputCls} pl-10 pr-10`}
        />
        {(busy || panel.state === "loading") && (
          <PiCircleNotch className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-ink-muted" aria-hidden />
        )}

        {/* The popup: always in the DOM for aria-controls, shown while open. */}
        <ul
          id={listId}
          role="listbox"
          aria-label={t.places}
          hidden={!open}
          className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-line-strong bg-surface-card p-1 shadow-[0_18px_40px_rgba(20,33,61,0.16)]"
        >
          {panel.state === "loading" && <li className="caption-2 px-3 py-2.5 text-ink-muted">{t.searching}</li>}
          {panel.state === "empty" && <li className="caption-2 px-3 py-2.5 text-ink-soft">{t.noMatch}</li>}
          {panel.state === "failed" && <li className="caption-2 px-3 py-2.5 text-ink-soft">{t.suggestFailed}</li>}
          {places.map((p, i) => {
            const [name, ...rest] = p.label.split(", ");
            return (
              <li
                key={p.label}
                id={optionId(i)}
                role="option"
                aria-selected={i === active}
                onPointerEnter={() => setActive(i)}
                // pointerdown, not click: the input keeps focus and the outside-click handler doesn't run first.
                onPointerDown={(e) => {
                  e.preventDefault();
                  void choose(p);
                }}
                className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 ${i === active ? "bg-surface-sunken" : ""}`}
              >
                <PiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
                <span className="min-w-0">
                  <span className="title-4 block text-ink">{name}</span>
                  {rest.length > 0 && <span className="caption-5 block text-ink-soft">{rest.join(", ")}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div id={`${id}-hint`} className="mt-2" aria-live="polite">
        {error === "login" ? (
          <p className="caption-2 text-ink-soft">
            {t.loginHint((linkText) => (
              <LoginLink className="text-brand-strong underline underline-offset-2">{linkText}</LoginLink>
            ))}
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
          <p className="caption-2 text-ink-muted">{t.hint}</p>
        )}
      </div>
    </div>
  );
}
