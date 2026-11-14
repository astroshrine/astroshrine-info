"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PiUserCircle } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { refreshAiBirthChart, saveBirthDetails } from "@/lib/endpoints";
import { localToday, profileReady, wallToEpoch, type BirthPlace, type BirthProfile } from "@/lib/jyotish";
import PlaceSearch from "./_components/PlaceSearch";
import { ACCOUNT_ID, useKundlis, type KundliEntry } from "./_components/kundlis";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "./_components/ui";

type Form = { name: string; dob: string; tob: string; timeUnknown: boolean; place: BirthPlace | null; toAccount: boolean };
const EMPTY: Form = { name: "", dob: "", tob: "", timeUnknown: false, place: null, toAccount: false };

// The form survives a trip through /login (place search and the account option need a session) in this tab.
const DRAFT = "jyotish:draft";
type Draft = { mode: string; form: Form };
function readDraft(mode: string): Form | null {
  try {
    const raw = sessionStorage.getItem(DRAFT);
    const d = raw ? (JSON.parse(raw) as Draft) : null;
    return d && d.mode === mode ? { ...EMPTY, ...d.form } : null;
  } catch {
    return null;
  }
}
function writeDraft(mode: string, form: Form | null) {
  try {
    if (form) sessionStorage.setItem(DRAFT, JSON.stringify({ mode, form } satisfies Draft));
    else sessionStorage.removeItem(DRAFT);
  } catch {
    /* best effort */
  }
}

// A one line confirmation shown on the hub after a save (the form's URL is replaced, so it cannot carry it).
const FLASH = "jyotish:flash";
export function setFlash(message: string) {
  try {
    sessionStorage.setItem(FLASH, message);
  } catch {
    /* best effort */
  }
}
export function takeFlash(): string | null {
  try {
    const m = sessionStorage.getItem(FLASH);
    sessionStorage.removeItem(FLASH);
    return m;
  } catch {
    return null;
  }
}

function validate(f: Form): string | null {
  const name = f.name.trim();
  if (!name || name.length > 100) return "नाम लिखें (100 अक्षरों तक)।";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.dob)) return "जन्म तिथि चुनें।";
  if (f.dob > localToday()) return "जन्म तिथि आज के बाद की नहीं हो सकती।";
  if (f.dob < "1900-01-01") return "1900 के बाद की जन्म तिथि चुनें।";
  if (!f.timeUnknown && !/^\d{2}:\d{2}$/.test(f.tob)) return "जन्म समय चुनें, या “सटीक समय ज्ञात नहीं” चुनें।";
  if (!f.place) return "जन्म स्थान खोजकर चुनें।";
  return null;
}

/**
 * Add a new kundli (`target` null) or change a saved one. The account's own kundli is saved to users.profile
 * (shared with the app); every other kundli is saved in this browser for the signed in account.
 */
export default function KundliForm({ target }: { target: KundliEntry | null }) {
  const router = useRouter();
  const { status, session, refresh } = useAuth();
  const kundlis = useKundlis();
  const mode = target ? `edit:${target.id}` : "new";
  const isAccount = target?.isAccount ?? false;
  const [form, setFormState] = useState<Form>(
    () => readDraft(mode) ?? (target ? { ...EMPTY, ...target.profile, toAccount: target.isAccount } : EMPTY),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signedIn = status === "signedIn";

  const setForm = (patch: Partial<Form>) =>
    setFormState((f) => {
      const next = { ...f, ...patch };
      writeDraft(mode, next);
      return next;
    });

  const leave = (k: string | null) => router.replace(k ? `/kundli?k=${encodeURIComponent(k)}` : "/kundli", { scroll: false });

  async function submit() {
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }
    const p: BirthProfile = {
      name: form.name.trim(),
      dob: form.dob,
      tob: form.timeUnknown ? "" : form.tob,
      timeUnknown: form.timeUnknown,
      place: form.place!,
    };
    if (!profileReady(p)) return;
    const userId = session?.user.id;
    const toAccount = (isAccount || form.toAccount) && !p.timeUnknown && signedIn && !!userId;
    if (isAccount && !toAccount) {
      setError(p.timeUnknown ? "खाते के जन्म विवरण में सटीक समय चाहिए।" : "खाते का विवरण बदलने के लिए लॉगिन करें।");
      return;
    }
    setBusy(true);
    setError(null);

    if (toAccount) {
      try {
        await saveBirthDetails(userId!, {
          dateTimeOfBirth: wallToEpoch(p.dob, p.tob, p.place.tz),
          place: p.place.name,
          lat: p.place.lat,
          lon: p.place.lon,
          tz: p.place.tz,
        });
        // Non fatal, as in the app: keeps the AI astrologer's stored chart in step with the profile.
        refreshAiBirthChart({ date: p.dob, time: p.tob, place: p.place.name, lat: p.place.lat, lon: p.place.lon, tz: p.place.tz }).catch(
          (e) => console.warn("[kundli] AI birth chart refresh failed (non fatal):", e),
        );
        await refresh();
        kundlis.activateAccount(p);
        // A browser kundli marked as the user's own moves to the account (no second copy in the list).
        if (target && !target.isAccount) kundlis.remove(target.id);
        writeDraft(mode, null);
        setFlash("आपकी अपनी कुंडली खाते में सहेजी गई। ऐप में भी यही दिखेगी।");
        leave(ACCOUNT_ID);
        return;
      } catch (e) {
        console.error("[kundli] saving birth details to the account failed:", e);
        if (isAccount) {
          setBusy(false);
          setError("खाते में सेव नहीं हो सका। थोड़ी देर बाद फिर कोशिश करें।");
          return;
        }
        setFlash("कुंडली इस browser में सहेजी गई, पर खाते में सेव नहीं हो सकी। बाद में फिर कोशिश करें।");
      }
    }

    writeDraft(mode, null);
    if (target) {
      kundlis.edit(target.id, p, true);
      if (!toAccount) setFlash(`${p.name} की कुंडली बदल दी गई।`);
      leave(target.id);
    } else {
      const id = kundlis.add(p);
      if (!toAccount) setFlash(`${p.name} की कुंडली जुड़ गई।`);
      leave(id);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) void submit();
      }}
      className="space-y-4"
      aria-label={target ? "कुंडली बदलें" : "नई कुंडली जोड़ें"}
    >
      <div>
        <label htmlFor="jv-name" className={labelCls}>
          नाम
        </label>
        <input
          id="jv-name"
          autoComplete="name"
          maxLength={100}
          autoFocus
          value={form.name}
          onChange={(e) => setForm({ name: e.target.value })}
          placeholder="जैसे राहुल शर्मा"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="jv-dob" className={labelCls}>
            जन्म तिथि
          </label>
          <input
            id="jv-dob"
            type="date"
            min="1900-01-01"
            max={localToday()}
            value={form.dob}
            onChange={(e) => setForm({ dob: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="jv-tob" className={labelCls}>
            जन्म समय
          </label>
          <input
            id="jv-tob"
            type="time"
            value={form.tob}
            disabled={form.timeUnknown}
            onChange={(e) => setForm({ tob: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>

      {!isAccount && (
        <label className="body-6 flex items-start gap-2 text-ink-soft">
          <input
            type="checkbox"
            checked={form.timeUnknown}
            onChange={(e) => setForm({ timeUnknown: e.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
          />
          <span>
            सटीक समय ज्ञात नहीं
            {form.timeUnknown && (
              <span className="caption-2 block text-ink-muted">
                कुंडली दोपहर 12:00 की बनेगी। तब लग्न और भाव भरोसेमंद नहीं, चंद्र राशि प्रायः सही रहती है।
              </span>
            )}
          </span>
        </label>
      )}

      <PlaceSearch id="jv-place" label="जन्म स्थान" value={form.place} onPick={(place) => setForm({ place })} />

      {isAccount ? (
        <p className="body-6 flex items-start gap-2 rounded-lg bg-surface-sunken p-3 text-ink-soft">
          <PiUserCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
          यह आपके खाते का जन्म विवरण है। बदलाव ऐप की “मेरी कुंडली” और AI ज्योतिषी में भी दिखेगा।
        </p>
      ) : (
        signedIn && (
          <label className="body-6 flex items-start gap-2 rounded-lg bg-surface-sunken p-3 text-ink-soft">
            <input
              type="checkbox"
              checked={form.toAccount && !form.timeUnknown}
              disabled={form.timeUnknown}
              onChange={(e) => setForm({ toAccount: e.target.checked })}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
            />
            <span>
              <span className="flex items-center gap-2 text-ink">
                <PiUserCircle className="h-4 w-4 shrink-0" aria-hidden /> यह मेरी अपनी कुंडली है, खाते में भी सहेजें
              </span>
              <span className="caption-2 block text-ink-muted">
                {form.timeUnknown
                  ? "समय ज्ञात न हो तो खाते में नहीं सहेजा जाता।"
                  : "ऐप की “मेरी कुंडली”, AI ज्योतिषी और आपकी विस्तृत कुंडली यही विवरण इस्तेमाल करेंगे।"}
              </span>
            </span>
          </label>
        )
      )}

      {error && (
        <p role="alert" className="body-5 text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy || status === "loading"} className={btnPrimary}>
          {busy ? "सहेज रहे हैं" : target ? "बदलाव सहेजें" : "कुंडली जोड़ें"}
        </button>
        <button
          type="button"
          onClick={() => {
            writeDraft(mode, null);
            leave(kundlis.active?.id ?? null);
          }}
          className={btnSecondary}
        >
          रद्द करें
        </button>
      </div>
    </form>
  );
}
