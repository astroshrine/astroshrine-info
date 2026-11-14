"use client";

import { use, useEffect, useState } from "react";
import { browser } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PiArrowRight, PiCheckCircle, PiPencilSimple, PiPlanet, PiPlus, PiUserCircle } from "react-icons/pi";
import { day } from "@/lib/jyotish";
import { fadeUp } from "@/lib/motion";
import KundliForm, { takeFlash } from "./KundliForm";
import { useKundlis } from "./_components/kundlis";
import { profileToHash } from "./_components/profile";
import { Skeleton, btnPrimary, btnSecondary, btnSmall } from "./_components/ui";

/**
 * The hub's main panel. The URL says what it shows: /kundli?k=<id> the active kundli, ?new=1 the add form,
 * ?edit=<id> the edit form, so Back and shared links work. Browser only (kundlis are in localStorage).
 */
export default function ActiveKundli() {
  use(browser("Saved kundlis are kept in this browser (localStorage)."));
  const kundlis = useKundlis();
  const router = useRouter();
  const params = useSearchParams();
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
        <h2 className="heading-6 text-ink">{editId ? "कुंडली बदलें" : "नई कुंडली जोड़ें"}</h2>
        <p className="caption-2 mb-4 mt-1 text-ink-soft">
          {editId ? "विवरण बदलकर सहेजें।" : "परिवार के किसी सदस्य की या अपनी, जितनी चाहें उतनी कुंडलियाँ जोड़ें।"}
        </p>
        {editId && !target ? (
          <p role="alert" className="body-6 text-danger">
            यह कुंडली नहीं मिली। शायद इसे हटा दिया गया है।{" "}
            <Link href="/kundli" className="text-brand-strong underline underline-offset-2">
              कुंडलियों पर लौटें
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
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-surface-sunken text-brand-strong">
          <PiPlanet className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h2 className="heading-6 text-ink">अभी कोई कुंडली सहेजी नहीं है</h2>
          <p className="body-6 mt-1 max-w-md text-ink-soft">
            नाम, जन्म तिथि, समय और स्थान भरकर पहली कुंडली जोड़ें। फिर कुंडली, गोचर और बाकी टूल उसी से खुलेंगे।
          </p>
        </div>
        <Link href="/kundli?new=1" className={btnPrimary}>
          <PiPlus className="h-5 w-5" aria-hidden /> पहली कुंडली जोड़ें
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
            अभी चुनी हुई कुंडली
            {active.isAccount && (
              <span className="caption-3 inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-brand-strong">
                <PiUserCircle className="h-3.5 w-3.5" aria-hidden /> आपके खाते से
              </span>
            )}
          </p>
          <h2 className="title-1 mt-1 break-words text-ink">{active.profile.name}</h2>
          <p className="body-6 mt-1 text-ink-soft">
            {day(active.profile.dob)} · {active.profile.timeUnknown ? "समय ज्ञात नहीं" : active.profile.tob} · {active.profile.place.name}
          </p>
        </div>
        <Link href={`/kundli?edit=${encodeURIComponent(active.id)}`} className={btnSmall}>
          <PiPencilSimple className="h-4 w-4" aria-hidden /> बदलें
        </Link>
      </div>
      {flash && (
        <p role="status" className="body-6 mt-4 flex items-start gap-2 rounded-lg bg-success-soft p-3 text-success">
          <PiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {flash}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={`/kundli/chart${hash}`} className={btnPrimary}>
          कुंडली देखें <PiArrowRight className="h-5 w-5" aria-hidden />
        </Link>
        <Link href={`/kundli/gochar${hash}`} className={btnSecondary}>
          गोचर देखें
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
