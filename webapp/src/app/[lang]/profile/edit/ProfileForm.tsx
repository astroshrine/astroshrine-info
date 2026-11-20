"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { PiArrowLeft, PiCheck, PiSignIn, PiSparkle } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { stripLocale } from "@/i18n/paths";
import { birthMs, refreshAiBirthChart, saveProfile, type BackendUser, type Gender } from "@/lib/endpoints";
import { epochToWall, localToday, wallToEpoch, type BirthPlace } from "@/lib/jyotish";
import { fadeUp } from "@/lib/motion";
import { APP_HOME_PATH } from "@/lib/site";
import { ASTROLOGER_ROLE } from "../../astrologer/_console/useAstrologer";
import PlaceSearch from "../../kundli/_components/PlaceSearch";
import { inputCls, labelCls } from "../../kundli/_components/ui";

// The app's profile form (EditProfileUI), on the website: after the first login ("welcome") it asks for what the app
// asks at sign-up, so astrologers see the customer's kundli in chat; later it edits the same details.

const text = defineMessages({
  hi: {
    welcomeTitle: "अपनी जानकारी भरें",
    welcomeLead: "Astrologer आपकी कुंडली इन्हीं से देखते हैं, इसलिए chat से पहले एक बार भर दें। ऐप में भी यही जानकारी दिखेगी।",
    editTitle: "प्रोफ़ाइल बदलें",
    editLead: "यह जानकारी ऐप और वेबसाइट दोनों पर एक ही है।",
    back: "प्रोफ़ाइल पर वापस",
    firstName: "पहला नाम",
    lastName: "उपनाम",
    email: "ईमेल (ज़रूरी नहीं)",
    gender: "लिंग",
    male: "पुरुष",
    female: "महिला",
    dob: "जन्म तिथि",
    tob: "जन्म समय",
    place: "जन्म स्थान",
    save: "सेव करें",
    saving: "सेव हो रहा है…",
    continue: "आगे बढ़ें",
    saved: "प्रोफ़ाइल सेव हो गई।",
    signedOut: "प्रोफ़ाइल बदलने के लिए लॉगिन करें।",
    login: "लॉगिन करें",
    errors: {
      name: "पहला नाम और उपनाम लिखें।",
      firstName: "पहला नाम लिखें।",
      email: "सही ईमेल लिखें, या इसे खाली छोड़ दें।",
      gender: "लिंग चुनें।",
      dob: "जन्म तिथि और समय भरें।",
      adult: "AstroShrine इस्तेमाल करने के लिए आपकी उम्र 18 साल या ज़्यादा होनी चाहिए।",
      place: "जन्म स्थान खोजकर चुनें।",
      save: "प्रोफ़ाइल सेव नहीं हो पाई। फिर कोशिश करें।",
    },
  },
  en: {
    welcomeTitle: "Tell us about yourself",
    welcomeLead: "Astrologers read your kundli from these details, so fill them in once before your first chat. The app shows the same details.",
    editTitle: "Edit profile",
    editLead: "These details are the same on the app and the website.",
    back: "Back to profile",
    firstName: "First name",
    lastName: "Last name",
    email: "Email (optional)",
    gender: "Gender",
    male: "Male",
    female: "Female",
    dob: "Date of birth",
    tob: "Time of birth",
    place: "Place of birth",
    save: "Save",
    saving: "Saving…",
    continue: "Continue",
    saved: "Profile saved.",
    signedOut: "Log in to edit your profile.",
    login: "Log in",
    errors: {
      name: "Enter your first and last name.",
      firstName: "Enter your first name.",
      email: "Enter a valid email, or leave it empty.",
      gender: "Choose your gender.",
      dob: "Enter your date and time of birth.",
      adult: "You must be 18 or older to use AstroShrine.",
      place: "Search for your place of birth and pick it.",
      save: "Your profile couldn't be saved. Please try again.",
    },
  },
});

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  gender: Gender | "";
  dob: string;
  tob: string;
  place: BirthPlace | null;
};

/** The saved birth place, in the shape the place search uses (null when it lacks coordinates). */
function placeOf(user: BackendUser | null): BirthPlace | null {
  const p = user?.profile?.placeOfBirth;
  const name = p?.displayValue?.trim();
  const lat = p?.geolocation?.lat ?? p?.geoLocation?.lat;
  const lon = p?.geolocation?.lng ?? p?.geoLocation?.long;
  if (!name || typeof lat !== "number" || typeof lon !== "number") return null;
  const tz = p?.timezone || p?.geolocation?.timezone || p?.geoLocation?.timezone || "Asia/Kolkata";
  return { name, lat, lon, tz };
}

/** The form filled from the account, as the app fills its editor (name split at the first space). */
function formOf(user: BackendUser | null): Form {
  const [first = "", ...rest] = (user?.name ?? "").trim().split(/\s+/);
  const place = placeOf(user);
  const ms = birthMs(user);
  const wall = ms !== null ? epochToWall(ms, place?.tz || "Asia/Kolkata") : null;
  const g = user?.profile?.gender;
  return {
    firstName: first,
    lastName: rest.join(" "),
    email: user?.profile?.email ?? "",
    gender: g === "M" || g === "F" ? g : "",
    dob: wall?.date ?? "",
    tob: wall?.time ?? "",
    place,
  };
}

/** Whole years between a birth date ("YYYY-MM-DD") and today. */
function ageOn(dob: string, today: string) {
  const [y, m, d] = dob.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
}

/** Where to go after saving: ?next=/path on this site only, the profile otherwise (the app home after "welcome"). */
function nextPath(welcome: boolean) {
  const next = new URLSearchParams(window.location.search).get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) return stripLocale(next);
  return welcome ? APP_HOME_PATH : "/profile";
}

export default function ProfileForm() {
  const { status, session, user, refresh } = useAuth();
  const t = useT(text);
  const router = useRouter();
  // ?welcome=1 (sent here by the login) is read on the client only: the page is the same HTML for both uses.
  const welcome = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("welcome") === "1",
    () => false,
  );
  // What has been typed, over the account's saved details (so a refresh of the account never wipes typing).
  const [edits, setEdits] = useState<Partial<Form>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form: Form | null = status === "signedIn" && user ? { ...formOf(user), ...edits } : null;

  // An astrologer's profile lives in the astrologer console.
  const isAstrologer = status === "signedIn" && user?.role === ASTROLOGER_ROLE;
  useEffect(() => {
    if (isAstrologer) router.replace("/astrologer/profile");
  }, [isAstrologer, router]);

  if (status === "signedOut") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12 md:px-8">
        <p className="body-3 text-ink">{t.signedOut}</p>
        <Link
          href="/login?next=/profile/edit"
          className="button-md mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-brand-ink transition hover:bg-brand-hover"
        >
          <PiSignIn className="h-5 w-5" aria-hidden />
          {t.login}
        </Link>
      </div>
    );
  }

  if (!form || isAstrologer) {
    return (
      <div aria-busy="true" className="mx-auto w-full max-w-2xl px-4 py-12 md:px-8">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-surface-sunken" />
        <div className="mt-8 h-96 animate-pulse rounded-3xl bg-surface-sunken" />
      </div>
    );
  }

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setEdits((e) => ({ ...e, [key]: value }));
    setError(null);
  };

  function validate(f: Form): string | null {
    // Sign-up asks for both names (as the app does); an existing account may have saved just one.
    if (!f.firstName.trim()) return t.errors.firstName;
    if (welcome && !f.lastName.trim()) return t.errors.name;
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return t.errors.email;
    if (!f.gender) return t.errors.gender;
    if (!f.dob || !f.tob) return t.errors.dob;
    // DPDP Act 2023, as in the app: 18+ only.
    if (ageOn(f.dob, localToday()) < 18) return t.errors.adult;
    if (!f.place) return t.errors.place;
    return null;
  }

  async function submit() {
    if (!form) return;
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }
    const userId = session?.user.id;
    if (!userId) return;
    const place = form.place!;
    setBusy(true);
    setError(null);
    try {
      await saveProfile(userId, {
        name: [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" "),
        email: form.email.trim() || null,
        gender: form.gender as Gender,
        dateTimeOfBirth: wallToEpoch(form.dob, form.tob, place.tz),
        place,
      });
      // Non fatal, as in the app: keeps the AI astrologer's stored chart in step with the profile.
      refreshAiBirthChart({ date: form.dob, time: form.tob, place: place.name, lat: place.lat, lon: place.lon, tz: place.tz }).catch((e) =>
        console.warn("[profile] AI birth chart refresh failed (non fatal):", e),
      );
      await refresh();
      router.replace(nextPath(welcome));
    } catch (e) {
      console.error("[profile] save failed:", e);
      setError(t.errors.save);
      setBusy(false);
    }
  }

  const genders: [Gender, string][] = [
    ["M", t.male],
    ["F", t.female],
  ];

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8 lg:py-14">
      {!welcome && (
        <Link href="/profile" className="caption-2 inline-flex items-center gap-1.5 text-ink-soft transition hover:text-ink">
          <PiArrowLeft className="h-4 w-4" aria-hidden />
          {t.back}
        </Link>
      )}
      <h1 className="heading-5 mt-4 flex items-center gap-2 text-ink">
        {welcome && <PiSparkle className="h-6 w-6 text-brand-strong" aria-hidden />}
        {welcome ? t.welcomeTitle : t.editTitle}
      </h1>
      <p className="body-6 mt-2 text-ink-soft">{welcome ? t.welcomeLead : t.editLead}</p>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void submit();
        }}
        className="mt-8 flex flex-col gap-5 rounded-3xl border border-line bg-surface-card p-5 md:p-8"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-first" className={labelCls}>
              {t.firstName}
            </label>
            <input id="pf-first" autoComplete="given-name" maxLength={60} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="pf-last" className={labelCls}>
              {t.lastName}
            </label>
            <input id="pf-last" autoComplete="family-name" maxLength={60} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label htmlFor="pf-email" className={labelCls}>
            {t.email}
          </label>
          <input id="pf-email" type="email" autoComplete="email" maxLength={120} value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
        </div>

        <fieldset>
          <legend className={labelCls}>{t.gender}</legend>
          <div className="flex gap-3">
            {genders.map(([value, label]) => {
              const on = form.gender === value;
              return (
                <label
                  key={value}
                  className={`title-4 flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
                    on ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong text-ink hover:border-brand"
                  }`}
                >
                  <input type="radio" name="pf-gender" value={value} checked={on} onChange={() => set("gender", value)} className="sr-only" />
                  {on && <PiCheck className="h-4 w-4" aria-hidden />}
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-dob" className={labelCls}>
              {t.dob}
            </label>
            <input id="pf-dob" type="date" max={localToday()} value={form.dob} onChange={(e) => set("dob", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="pf-tob" className={labelCls}>
              {t.tob}
            </label>
            <input id="pf-tob" type="time" value={form.tob} onChange={(e) => set("tob", e.target.value)} className={inputCls} />
          </div>
        </div>

        <PlaceSearch id="pf-place" label={t.place} value={form.place} onPick={(p) => set("place", p)} />

        {error && (
          <p role="alert" className="caption-2 text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="button-md inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-brand-ink transition hover:bg-brand-hover motion-safe:active:scale-98 disabled:opacity-60"
        >
          {busy ? t.saving : welcome ? t.continue : t.save}
        </button>
      </form>
    </motion.div>
  );
}
