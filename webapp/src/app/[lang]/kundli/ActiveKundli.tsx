"use client";

import { use, useEffect, useState } from "react";
import { browser } from "react-dom";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PiArrowRight, PiCheckCircle, PiPencilSimple, PiPlanet, PiPlus, PiUserCircle } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { day } from "@/lib/jyotish";
import { fadeUp } from "@/lib/motion";
import KundliForm, { takeFlash } from "./KundliForm";
import { useKundliName, useKundlis } from "./_components/kundlis";
import { profileToHash } from "./_components/profile";
import { Skeleton, btnPrimary, btnSecondary, btnSmall } from "./_components/ui";

const text = defineMessages({
  hi: {
    editTitle: "कुंडली बदलें",
    addTitle: "नई कुंडली जोड़ें",
    editHint: "विवरण बदलकर सहेजें।",
    addHint: "परिवार के किसी सदस्य की या अपनी, जितनी चाहें उतनी कुंडलियाँ जोड़ें।",
    missing: "यह कुंडली नहीं मिली। शायद इसे हटा दिया गया है।",
    back: "कुंडलियों पर लौटें",
    emptyTitle: "अभी कोई कुंडली सहेजी नहीं है",
    emptyBody: "नाम, जन्म तिथि, समय और स्थान भरकर पहली कुंडली जोड़ें। फिर कुंडली, गोचर और बाकी टूल उसी से खुलेंगे।",
    addFirst: "पहली कुंडली जोड़ें",
    selected: "अभी चुनी हुई कुंडली",
    fromAccount: "आपके खाते से",
    timeUnknown: "समय ज्ञात नहीं",
    edit: "बदलें",
    viewKundli: "कुंडली देखें",
    viewGochar: "गोचर देखें",
  },
  en: {
    editTitle: "Edit kundli",
    addTitle: "Add a new kundli",
    editHint: "Change the details and save.",
    addHint: "Add as many kundlis as you like, your own or a family member's.",
    missing: "This kundli was not found. It may have been deleted.",
    back: "Back to kundlis",
    emptyTitle: "No kundli saved yet",
    emptyBody: "Enter a name and the date, time and place of birth to add your first kundli. The kundli, transits and other tools then open with it.",
    addFirst: "Add your first kundli",
    selected: "Selected kundli",
    fromAccount: "From your account",
    timeUnknown: "Time unknown",
    edit: "Edit",
    viewKundli: "View kundli",
    viewGochar: "View transits",
  },
});

/**
 * The hub's main panel. The URL says what it shows: /kundli?k=<id> the active kundli, ?new=1 the add form,
 * ?edit=<id> the edit form, so Back and shared links work. Browser only (kundlis are in localStorage).
 */
export default function ActiveKundli() {
  use(browser("Saved kundlis are kept in this browser (localStorage)."));
  const kundlis = useKundlis();
  const nameOf = useKundliName();
  const router = useRouter();
  const params = useSearchParams();
  const t = useT(text);
  const isNew = params.get("new") === "1";
  const editId = params.get("edit");
  const urlK = params.get("k");
  const [flash] = useState(takeFlash);

  const activeId = kundlis.active?.id ?? null;
  const urlKExists = !!kundlis.find(urlK);
  const formOpen = isNew || !!editId;

  // ?k=<id> from Back or a link picks that kundli; without it, the URL is given the active one.
  useEffect(() => {
    if (kundlis.ready && urlK && urlKExists && urlK !== activeId) kundlis.activate(urlK);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kundlis.ready, urlK, urlKExists, activeId]);
  useEffect(() => {
    if (kundlis.ready && !formOpen && activeId && (!urlK || !urlKExists)) {
      router.replace(`/kundli?k=${encodeURIComponent(activeId)}`, { scroll: false });
    }
  }, [kundlis.ready, formOpen, activeId, urlK, urlKExists, router]);

  if (!kundlis.ready) return <PanelSkeleton />;

  if (isNew || editId) {
    const target = editId ? kundlis.find(editId) : null;
    return (
      <motion.div key={editId ?? "new"} variants={fadeUp} initial="hidden" animate="show">
        <h2 className="heading-6 text-ink">{editId ? t.editTitle : t.addTitle}</h2>
        <p className="caption-2 mb-4 mt-1 text-ink-soft">{editId ? t.editHint : t.addHint}</p>
        {editId && !target ? (
          <p role="alert" className="body-6 text-danger">
            {t.missing}{" "}
            <Link href="/kundli" className="text-brand-strong underline underline-offset-2">
              {t.back}
            </Link>
          </p>
        ) : (
          <KundliForm key={editId ?? "new"} target={target} />
        )}
      </motion.div>
    );
  }

  const active = kundlis.active;
  if (!active) {
    return (
      <div className="flex flex-col items-start gap-4 py-2">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-surface-sunken text-brand-strong">
          <PiPlanet className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h2 className="heading-6 text-ink">{t.emptyTitle}</h2>
          <p className="body-6 mt-1 max-w-md text-ink-soft">{t.emptyBody}</p>
        </div>
        <Link href="/kundli?new=1" className={btnPrimary}>
          <PiPlus className="h-5 w-5" aria-hidden /> {t.addFirst}
        </Link>
      </div>
    );
  }

  const hash = profileToHash(active.profile);
  return (
    <motion.div key={active.id} variants={fadeUp} initial="hidden" animate="show">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="caption-4 flex items-center gap-2 text-ink-soft">
            {t.selected}
            {active.isAccount && (
              <span className="caption-3 inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-brand-strong">
                <PiUserCircle className="h-3.5 w-3.5" aria-hidden /> {t.fromAccount}
              </span>
            )}
          </p>
          <h2 className="title-1 mt-1 break-words text-ink">{nameOf(active.profile)}</h2>
          <p className="body-6 mt-1 text-ink-soft">
            {day(active.profile.dob)} · {active.profile.timeUnknown ? t.timeUnknown : active.profile.tob} · {active.profile.place.name}
          </p>
        </div>
        <Link href={`/kundli?edit=${encodeURIComponent(active.id)}`} className={btnSmall}>
          <PiPencilSimple className="h-4 w-4" aria-hidden /> {t.edit}
        </Link>
      </div>
      {flash && (
        <p role="status" className="body-6 mt-4 flex items-start gap-2 rounded-xl bg-success-soft p-3 text-success">
          <PiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {flash}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={`/kundli/chart${hash}`} className={btnPrimary}>
          {t.viewKundli} <PiArrowRight className="h-5 w-5" aria-hidden />
        </Link>
        <Link href={`/kundli/gochar${hash}`} className={btnSecondary}>
          {t.viewGochar}
        </Link>
      </div>
    </motion.div>
  );
}

function PanelSkeleton() {
  return (
    <div aria-hidden className="space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
    </div>
  );
}
