"use client";

import { use, useState } from "react";
import { browser } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PiCheck, PiPencilSimple, PiPlus, PiTrash, PiUserCircle } from "react-icons/pi";
import { day } from "@/lib/jyotish";
import { base } from "@/lib/motion";
import { useKundlis, type KundliEntry } from "./_components/kundlis";
import { Skeleton, btnPrimary, btnSmall } from "./_components/ui";

/** Every saved kundli: open one (it becomes the active kundli), change it, or delete it after a confirm step. */
export default function KundliList() {
  use(browser("Saved kundlis are kept in this browser (localStorage)."));
  const kundlis = useKundlis();
  const router = useRouter();
  const [confirming, setConfirming] = useState<string | null>(null);
  const activeId = kundlis.active?.id ?? null;

  const open = (e: KundliEntry) => {
    kundlis.activate(e.id);
    router.push(`/kundli?k=${encodeURIComponent(e.id)}`, { scroll: false });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="kundli-list-title" className="heading-6 text-ink">
            मेरी कुंडलियाँ
          </h2>
          <p className="caption-2 mt-1 text-ink-soft">
            {kundlis.signedIn ? "आपकी अपनी कुंडली खाते में, बाकी इसी browser में।" : "लॉगिन किए बिना कुंडलियाँ इसी browser में रहती हैं।"}
          </p>
        </div>
        <Link href="/kundli?new=1" className={btnPrimary}>
          <PiPlus className="h-5 w-5" aria-hidden /> नई कुंडली जोड़ें
        </Link>
      </div>

      {!kundlis.ready ? (
        <div aria-hidden className="mt-4 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : kundlis.entries.length === 0 ? (
        <p className="body-6 mt-4 rounded-lg border border-line p-4 text-ink-soft">
          अभी कोई कुंडली नहीं। “नई कुंडली जोड़ें” से अपनी या परिवार के किसी सदस्य की कुंडली जोड़ें।
        </p>
      ) : (
        <ul aria-labelledby="kundli-list-title" className="mt-4 space-y-2">
          <AnimatePresence initial={false}>
            {kundlis.entries.map((e) => {
              const active = e.id === activeId;
              return (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={base}
                  className={`rounded-lg border p-3 transition ${active ? "border-brand bg-surface-sunken" : "border-line bg-surface-card"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="title-3 break-words text-ink">{e.profile.name}</span>
                        {e.isAccount && (
                          <span className="caption-3 inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-brand-strong">
                            <PiUserCircle className="h-3.5 w-3.5" aria-hidden /> खाते से
                          </span>
                        )}
                        {active && (
                          <span className="caption-3 inline-flex items-center gap-1 rounded-full bg-surface-inverse px-2 py-0.5 text-ink-inverse">
                            <PiCheck className="h-3.5 w-3.5" aria-hidden /> चुनी हुई
                          </span>
                        )}
                      </p>
                      <p className="caption-2 mt-1 text-ink-soft">
                        {day(e.profile.dob)} · {e.profile.timeUnknown ? "समय ज्ञात नहीं" : e.profile.tob} · {e.profile.place.name}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!active && (
                        <button type="button" onClick={() => open(e)} className={btnSmall} aria-label={`${e.profile.name} की कुंडली खोलें`}>
                          खोलें
                        </button>
                      )}
                      <Link
                        href={`/kundli?edit=${encodeURIComponent(e.id)}`}
                        className={btnSmall}
                        aria-label={`${e.profile.name} की कुंडली बदलें`}
                      >
                        <PiPencilSimple className="h-4 w-4" aria-hidden />
                        <span className="sr-only sm:not-sr-only">बदलें</span>
                      </Link>
                      {!e.isAccount && (
                        <button
                          type="button"
                          onClick={() => setConfirming(e.id)}
                          className={btnSmall}
                          aria-label={`${e.profile.name} की कुंडली हटाएं`}
                          aria-expanded={confirming === e.id}
                        >
                          <PiTrash className="h-4 w-4" aria-hidden />
                          <span className="sr-only sm:not-sr-only">हटाएं</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {confirming === e.id && (
                    <div role="alertdialog" aria-label="कुंडली हटाने की पुष्टि" className="mt-3 rounded-lg border border-line bg-danger-soft p-3">
                      <p className="body-5 text-danger">{e.profile.name} की कुंडली इस browser से हट जाएगी। हटाएं?</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          autoFocus
                          onClick={() => {
                            kundlis.remove(e.id);
                            setConfirming(null);
                          }}
                          className="button-sm inline-flex items-center gap-2 rounded-full bg-danger px-3 py-2 text-ink-inverse transition hover:opacity-90 active:scale-98"
                        >
                          <PiTrash className="h-4 w-4" aria-hidden /> हाँ, हटाएं
                        </button>
                        <button type="button" onClick={() => setConfirming(null)} className={btnSmall}>
                          रद्द करें
                        </button>
                      </div>
                    </div>
                  )}
                  {e.isAccount && (
                    <p className="caption-5 mt-2 text-ink-muted">खाते की कुंडली यहाँ से हटती नहीं, सिर्फ़ बदली जा सकती है।</p>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
