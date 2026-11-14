"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PiCheck, PiLink, PiPlus } from "react-icons/pi";
import { day, type BirthProfile } from "@/lib/jyotish";
import { fadeUp } from "@/lib/motion";
import { useKundlis } from "./kundlis";
import { btnSmall } from "./ui";

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
          <h1 className="heading-5 mt-1 break-words text-ink md:heading-4">{profile.name}</h1>
          <p className="body-6 mt-1 text-ink-soft">
            {day(profile.dob)} · {profile.timeUnknown ? "समय ज्ञात नहीं" : profile.tob} · {profile.place.name}
          </p>
        </div>
        <button type="button" onClick={() => void copyLink()} className={btnSmall} aria-live="polite">
          {copied ? <PiCheck className="h-4 w-4" aria-hidden /> : <PiLink className="h-4 w-4" aria-hidden />}
          {copied ? "लिंक कॉपी हो गया" : "लिंक कॉपी करें"}
        </button>
      </div>
      {fromLink && !added && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface-sunken p-3">
          <p className="body-6 text-ink-soft">यह कुंडली एक लिंक से खुली है और आपकी सहेजी कुंडलियों में नहीं है।</p>
          <button
            type="button"
            onClick={() => {
              kundlis.add(profile);
              setAdded(true);
            }}
            className={btnSmall}
          >
            <PiPlus className="h-4 w-4" aria-hidden /> मेरी कुंडलियों में जोड़ें
          </button>
        </div>
      )}
      {added && (
        <p role="status" className="body-6 rounded-2xl bg-success-soft p-3 text-success">
          {profile.name} की कुंडली आपकी सहेजी कुंडलियों में जुड़ गई।
        </p>
      )}
    </motion.header>
  );
}
