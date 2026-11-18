"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { PiCamera, PiCheck, PiPlus, PiUser } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { NAME_MAX, NAME_MIN, uploadPhoto, type ProfileInput } from "@/lib/services/astrologerProfile";
import { Button, fieldClass, labelClass } from "../_console/ui";

/**
 * The profile details form pieces shared by the one-time setup page and the profile page: photo, name, about,
 * experience, and expertise and language pickers. Both pages save through saveProfile (the real endpoint).
 */

export const BIO_MAX = 500;

const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);

/** Text that may be Devanagari (an astrologer's own words) inside a page that is not in Hindi. */
export const Text = ({ children, className }: { children: string; className?: string }) => (
  <span lang={hasDevanagari(children) ? "hi" : undefined} className={className}>
    {children}
  </span>
);

export function messageOf(e: unknown, fallback: string) {
  return e instanceof ApiError || e instanceof Error ? e.message || fallback : fallback;
}

export const whole = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v.trim()) : NaN);

/** The expertise and languages offered as one-tap choices. `value` is what is stored (English, as the app stores it). */
const EXPERTISE: { value: string; hi: string }[] = [
  { value: "Vedic Astrology", hi: "वैदिक ज्योतिष" },
  { value: "Kundli Reading", hi: "कुंडली विश्लेषण" },
  { value: "Kundli Matching", hi: "कुंडली मिलान" },
  { value: "Career", hi: "करियर" },
  { value: "Marriage", hi: "विवाह" },
  { value: "Vastu", hi: "वास्तु" },
  { value: "Palmistry", hi: "हस्तरेखा" },
  { value: "Tarot", hi: "टैरो" },
  { value: "Numerology", hi: "अंक ज्योतिष" },
  { value: "Prashna", hi: "प्रश्न ज्योतिष" },
  { value: "Shubh Muhurat", hi: "शुभ मुहूर्त" },
  { value: "Lal Kitab", hi: "लाल किताब" },
  { value: "KP System", hi: "केपी पद्धति" },
];

const LANGUAGES: { value: string; hi: string }[] = [
  { value: "Hindi", hi: "हिंदी" },
  { value: "English", hi: "अंग्रेज़ी" },
  { value: "Sanskrit", hi: "संस्कृत" },
  { value: "Marathi", hi: "मराठी" },
  { value: "Gujarati", hi: "गुजराती" },
  { value: "Bengali", hi: "बांग्ला" },
  { value: "Punjabi", hi: "पंजाबी" },
  { value: "Tamil", hi: "तमिल" },
  { value: "Telugu", hi: "तेलुगु" },
];

export const EXPERTISE_CHOICES = EXPERTISE;
export const LANGUAGE_CHOICES = LANGUAGES;

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Maps a stored value to the preset spelling when it is one (case-insensitive), so it shows as selected. */
export function canonical(list: { value: string }[], v: string) {
  return list.find((o) => same(o.value, v))?.value ?? v.trim();
}

/** What to show for a stored value in the current language. */
export function labelOf(list: { value: string; hi: string }[], v: string, hi: boolean) {
  const hit = list.find((o) => same(o.value, v));
  return hit ? (hi ? hit.hi : hit.value) : v;
}

export const fieldText = defineMessages({
  hi: {
    photoTitle: "प्रोफ़ाइल फ़ोटो",
    photoHelp: "आपके चेहरे की साफ़ फ़ोटो। ग्राहक इसे आपके कार्ड पर देखते हैं।",
    upload: "फ़ोटो अपलोड करें",
    change: "फ़ोटो बदलें",
    uploading: "अपलोड हो रही है…",
    photoSaved: "फ़ोटो बदल दी गई।",
    photoType: "केवल JPG, PNG या WebP फ़ोटो चुनें।",
    photoSize: "फ़ोटो 5 MB से छोटी होनी चाहिए।",
    name: "ग्राहकों को दिखने वाला नाम",
    bio: "आपके बारे में",
    bioHelp: "सरल शब्दों में दो-तीन पंक्तियाँ। ग्राहक आपको चुनने से पहले इसे पढ़ते हैं।",
    count: (n: number) => `${n} / ${BIO_MAX}`,
    experience: "अनुभव (वर्ष)",
    expertise: "आपकी विशेषज्ञता",
    languages: "आप कौन-सी भाषाएँ बोलते हैं",
    pick: "जो लागू हों, सभी चुनें",
    other: "कुछ और जोड़ें",
    add: "जोड़ें",
    errName: `नाम ${NAME_MIN} से ${NAME_MAX} अक्षरों का होना चाहिए।`,
    errExperience: "अनुभव 0 से 80 के बीच पूरी संख्या होनी चाहिए।",
    errBio: "अपने बारे में कुछ शब्द लिखें।",
    errExpertise: "कम से कम एक विशेषज्ञता चुनें।",
    errLanguages: "कम से कम एक भाषा चुनें।",
    genericError: "सहेजा नहीं जा सका। कृपया फिर कोशिश करें।",
  },
  en: {
    photoTitle: "Profile photo",
    photoHelp: "A clear photo of your face. Customers see it on your card.",
    upload: "Upload photo",
    change: "Change photo",
    uploading: "Uploading…",
    photoSaved: "Photo updated.",
    photoType: "Choose a JPG, PNG or WebP photo.",
    photoSize: "The photo must be smaller than 5 MB.",
    name: "Name shown to customers",
    bio: "About you",
    bioHelp: "Two or three lines in simple words. Customers read this before they choose you.",
    count: (n) => `${n} / ${BIO_MAX}`,
    experience: "Experience (years)",
    expertise: "Your expertise",
    languages: "Languages you speak",
    pick: "Choose all that apply",
    other: "Add another",
    add: "Add",
    errName: `Name must be ${NAME_MIN} to ${NAME_MAX} characters.`,
    errExperience: "Experience must be a whole number from 0 to 80.",
    errBio: "Write a few words about yourself.",
    errExpertise: "Choose at least one expertise.",
    errLanguages: "Choose at least one language.",
    genericError: "Could not save. Please try again.",
  },
});

export type FieldT = (typeof fieldText)["en"];

export type DetailsDraft = { name: string; experience: string; about: string; expertise: string[]; languages: string[] };

/** The first problem with the details, as a message, or the cleaned input to send. */
export function checkDetails(d: DetailsDraft, t: FieldT): { error: string } | { input: ProfileInput } {
  const name = d.name.trim().replace(/\s+/g, " ");
  const exp = whole(d.experience);
  if (name.length < NAME_MIN || name.length > NAME_MAX) return { error: t.errName };
  if (!(exp >= 0 && exp <= 80)) return { error: t.errExperience };
  if (!d.about.trim()) return { error: t.errBio };
  if (d.expertise.length === 0) return { error: t.errExpertise };
  if (d.languages.length === 0) return { error: t.errLanguages };
  return { input: { name, experience: exp, aboutMe: d.about.trim(), expertise: d.expertise, languages: d.languages } };
}

export function Note({ kind, children }: { kind: "ok" | "error"; children: React.ReactNode }) {
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`text-[15px] font-semibold ${kind === "error" ? "text-danger" : "text-success"}`}>
      {children}
    </p>
  );
}

const initialsOf = (name: string) =>
  name
    .replace(/^(Pt\.?|पं\.?)\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0])
    .join("")
    .toUpperCase();

/** A round photo, or the initials on navy when there is none. */
export function Avatar({ photo, name, size, className }: { photo: string | null; name: string; size: number; className?: string }) {
  const initials = initialsOf(name);
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-inverse font-display font-bold text-brand shadow-[0_0_0_5px_var(--color-surface-sunken)] ${className ?? ""}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {photo ? (
        <Image src={photo} alt="" fill sizes={`${size}px`} className="object-cover" unoptimized />
      ) : initials ? (
        <span lang={hasDevanagari(initials) ? "hi" : undefined} aria-hidden="true">
          {initials}
        </span>
      ) : (
        <PiUser size={size * 0.42} aria-hidden="true" />
      )}
    </span>
  );
}

/** Photo with the upload button. Uploads at once through the real endpoint, then calls onDone to reload the photo. */
export function PhotoField({ id, photo, name, onDone }: { id: string; photo: string | null; name: string; onDone: () => void }) {
  const t = useT(fieldText);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setNote({ kind: "error", text: t.photoType });
    if (file.size > 5 * 1024 * 1024) return setNote({ kind: "error", text: t.photoSize });
    setBusy(true);
    setNote(null);
    try {
      await uploadPhoto(id, file);
      setNote({ kind: "ok", text: t.photoSaved });
      onDone();
    } catch (e) {
      setNote({ kind: "error", text: messageOf(e, t.genericError) });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar photo={photo} name={name} size={104} />
      <div className="min-w-0 flex-1 basis-56">
        <p className="text-[15px] font-bold">{t.photoTitle}</p>
        <p className="mb-2.5 mt-0.5 text-[13.5px] text-ink-soft">{t.photoHelp}</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id={`photo-${id}`} aria-label={t.photoTitle} onChange={(e) => void pick(e.target.files?.[0])} />
        <Button size="sm" disabled={busy} onClick={() => input.current?.click()}>
          <PiCamera size={17} className="text-brand" aria-hidden="true" />
          {busy ? t.uploading : photo ? t.change : t.upload}
        </Button>
        {note && (
          <div className="mt-2">
            <Note kind={note.kind}>{note.text}</Note>
          </div>
        )}
      </div>
    </div>
  );
}

/** Tap-to-choose chips for expertise or languages, plus a box to add something that is not listed. */
export function ChipPicker({
  label,
  choices,
  value,
  onChange,
}: {
  label: string;
  choices: { value: string; hi: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const t = useT(fieldText);
  const hi = useLocale() === "hi";
  const [extra, setExtra] = useState("");
  // Everything shown: the presets, then anything chosen that is not a preset (an older or typed entry).
  const custom = value.filter((v) => !choices.some((c) => same(c.value, v)));
  const toggle = (v: string) => onChange(value.some((x) => same(x, v)) ? value.filter((x) => !same(x, v)) : [...value, v]);
  const add = () => {
    const v = extra.trim();
    if (!v) return;
    if (!value.some((x) => same(x, v))) onChange([...value, canonical(choices, v)]);
    setExtra("");
  };

  const chip = (v: string, shown: string) => {
    const on = value.some((x) => same(x, v));
    return (
      <button
        key={v}
        type="button"
        aria-pressed={on}
        onClick={() => toggle(v)}
        className={`inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-sm font-bold transition ${
          on ? "border-ink bg-surface-inverse text-ink-inverse" : "border-line-strong bg-surface-page text-ink hover:bg-surface-sunken"
        }`}
      >
        {on ? <PiCheck size={14} aria-hidden="true" /> : <PiPlus size={14} aria-hidden="true" />}
        <Text>{shown}</Text>
      </button>
    );
  };

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className={labelClass}>{label}</legend>
      <p className="-mt-1 text-[13.5px] text-ink-soft">{t.pick}</p>
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => chip(c.value, hi ? c.hi : c.value))}
        {custom.map((v) => chip(v, v))}
      </div>
      <div className="flex max-w-md gap-2">
        <input
          className={`${fieldClass} h-11`}
          value={extra}
          placeholder={t.other}
          aria-label={`${label}: ${t.other}`}
          onChange={(e) => setExtra(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button variant="line" size="sm" onClick={add}>
          {t.add}
        </Button>
      </div>
    </fieldset>
  );
}

/** Name, about, experience, expertise and languages inputs (the photo is separate). */
export function DetailsInputs({ draft, onChange }: { draft: DetailsDraft; onChange: (patch: Partial<DetailsDraft>) => void }) {
  const t = useT(fieldText);
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t.name}</span>
          <input className={fieldClass} value={draft.name} maxLength={NAME_MAX} autoComplete="name" onChange={(e) => onChange({ name: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t.experience}</span>
          <input className={fieldClass} value={draft.experience} inputMode="numeric" onChange={(e) => onChange({ experience: e.target.value })} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>{t.bio}</span>
        <span className="text-[13.5px] text-ink-soft">{t.bioHelp}</span>
        <textarea className={`${fieldClass} h-36 resize-y py-3`} value={draft.about} maxLength={BIO_MAX} onChange={(e) => onChange({ about: e.target.value })} />
        <span className="self-end text-[13px] text-ink-soft">{t.count(draft.about.length)}</span>
      </label>
      <ChipPicker label={t.expertise} choices={EXPERTISE} value={draft.expertise} onChange={(expertise) => onChange({ expertise })} />
      <ChipPicker label={t.languages} choices={LANGUAGES} value={draft.languages} onChange={(languages) => onChange({ languages })} />
    </div>
  );
}
