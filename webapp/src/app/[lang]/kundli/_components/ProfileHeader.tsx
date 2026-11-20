"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PiCheck, PiLink, PiPlus } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { day, type BirthProfile } from "@/lib/jyotish";
import { fadeUp } from "@/lib/motion";
import { useKundliName, useKundlis } from "./kundlis";
import { btnSmall } from "./ui";

const text = defineMessages({
  hi: {
    timeUnknown: "समय ज्ञात नहीं",
    copied: "लिंक कॉपी हो गया",
    copy: "लिंक कॉपी करें",
    fromLink: "यह कुंडली एक लिंक से खुली है और आपकी सहेजी कुंडलियों में नहीं है।",
    add: "मेरी कुंडलियों में जोड़ें",
    added: (name: string) => `${name} की कुंडली आपकी सहेजी कुंडलियों में जुड़ गई।`,
  },
  en: {
    timeUnknown: "Time unknown",
    copied: "Link copied",
    copy: "Copy link",
    fromLink: "This kundli was opened from a link and is not in your saved kundlis.",
    add: "Add to my kundlis",
    added: (name) => `${name}'s kundli has been added to your saved kundlis.`,
  },
});

/** Whose kundli this is, with a copyable link (the details travel in the URL hash, never to the server). */
export default function ProfileHeader({
  eyebrow,
  profile,
  fromLink,
}: {
  eyebrow: string;
  profile: BirthProfile;
  fromLink: boolean;
}) {
  const kundlis = useKundlis();
  const nameOf = useKundliName();
  const t = useT(text);
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <motion.header variants={fadeUp} initial="hidden" animate="show" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="caption-4 text-brand-strong">{eyebrow}</p>
          <h2 className="heading-5 mt-1 break-words text-ink md:heading-4">{nameOf(profile)}</h2>
          <p className="body-6 mt-1 text-ink-soft">
            {day(profile.dob)} · {profile.timeUnknown ? t.timeUnknown : profile.tob} · {profile.place.name}
          </p>
        </div>
        <button type="button" onClick={() => void copyLink()} className={btnSmall} aria-live="polite">
          {copied ? <PiCheck className="h-4 w-4" aria-hidden /> : <PiLink className="h-4 w-4" aria-hidden />}
          {copied ? t.copied : t.copy}
        </button>
      </div>
      {fromLink && !added && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface-sunken p-3">
          <p className="body-6 text-ink-soft">{t.fromLink}</p>
          <button
            type="button"
            onClick={() => {
              kundlis.add(profile);
              setAdded(true);
            }}
            className={btnSmall}
          >
            <PiPlus className="h-4 w-4" aria-hidden /> {t.add}
          </button>
        </div>
      )}
      {added && (
        <p role="status" className="body-6 rounded-2xl bg-success-soft p-3 text-success">
          {t.added(nameOf(profile))}
        </p>
      )}
    </motion.header>
  );
}
