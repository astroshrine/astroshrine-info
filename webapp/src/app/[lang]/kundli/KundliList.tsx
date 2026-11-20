"use client";

import { use, useState } from "react";
import { browser } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PiCheck, PiPencilSimple, PiPlus, PiTrash, PiUserCircle } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { day } from "@/lib/jyotish";
import { base } from "@/lib/motion";
import { useKundliName, useKundlis, type KundliEntry } from "./_components/kundlis";
import { Skeleton, btnPrimary, btnSmall } from "./_components/ui";

const text = defineMessages({
  hi: {
    title: "मेरी कुंडलियाँ",
    whereSignedIn: "आपकी अपनी कुंडली खाते में, बाकी इसी browser में।",
    whereGuest: "लॉगिन किए बिना कुंडलियाँ इसी browser में रहती हैं।",
    add: "नई कुंडली जोड़ें",
    empty: "अभी कोई कुंडली नहीं। “नई कुंडली जोड़ें” से अपनी या परिवार के किसी सदस्य की कुंडली जोड़ें।",
    fromAccount: "खाते से",
    selected: "चुनी हुई",
    timeUnknown: "समय ज्ञात नहीं",
    openLabel: (name: string) => `${name} की कुंडली खोलें`,
    open: "खोलें",
    editLabel: (name: string) => `${name} की कुंडली बदलें`,
    edit: "बदलें",
    deleteLabel: (name: string) => `${name} की कुंडली हटाएं`,
    delete: "हटाएं",
    confirmLabel: "कुंडली हटाने की पुष्टि",
    confirm: (name: string) => `${name} की कुंडली इस browser से हट जाएगी। हटाएं?`,
    yesDelete: "हाँ, हटाएं",
    cancel: "रद्द करें",
    accountNote: "खाते की कुंडली यहाँ से हटती नहीं, सिर्फ़ बदली जा सकती है।",
  },
  en: {
    title: "My kundlis",
    whereSignedIn: "Your own kundli is kept in your account, the others in this browser.",
    whereGuest: "Without logging in, kundlis stay in this browser.",
    add: "Add a new kundli",
    empty: "No kundlis yet. Use “Add a new kundli” to add your own or a family member's.",
    fromAccount: "From account",
    selected: "Selected",
    timeUnknown: "Time unknown",
    openLabel: (name) => `Open ${name}'s kundli`,
    open: "Open",
    editLabel: (name) => `Edit ${name}'s kundli`,
    edit: "Edit",
    deleteLabel: (name) => `Delete ${name}'s kundli`,
    delete: "Delete",
    confirmLabel: "Confirm deleting the kundli",
    confirm: (name) => `${name}'s kundli will be removed from this browser. Delete it?`,
    yesDelete: "Yes, delete",
    cancel: "Cancel",
    accountNote: "Your account kundli cannot be deleted here, only edited.",
  },
});

/** Every saved kundli: open one (it becomes the active kundli), change it, or delete it after a confirm step. */
export default function KundliList() {
  use(browser("Saved kundlis are kept in this browser (localStorage)."));
  const kundlis = useKundlis();
  const nameOf = useKundliName();
  const router = useRouter();
  const t = useT(text);
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
            {t.title}
          </h2>
          <p className="caption-2 mt-1 text-ink-soft">{kundlis.signedIn ? t.whereSignedIn : t.whereGuest}</p>
        </div>
        <Link href="/kundli?new=1" className={btnPrimary}>
          <PiPlus className="h-5 w-5" aria-hidden /> {t.add}
        </Link>
      </div>

      {!kundlis.ready ? (
        <div aria-hidden className="mt-4 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : kundlis.entries.length === 0 ? (
        <p className="body-6 mt-4 rounded-xl border border-line p-4 text-ink-soft">{t.empty}</p>
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
                  className={`rounded-xl border p-3 transition ${active ? "border-brand bg-surface-sunken" : "border-line bg-surface-card"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="title-3 break-words text-ink">{nameOf(e.profile)}</span>
                        {e.isAccount && (
                          <span className="caption-3 inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-brand-strong">
                            <PiUserCircle className="h-3.5 w-3.5" aria-hidden /> {t.fromAccount}
                          </span>
                        )}
                        {active && (
                          <span className="caption-3 inline-flex items-center gap-1 rounded-full bg-surface-inverse px-2 py-0.5 text-ink-inverse">
                            <PiCheck className="h-3.5 w-3.5" aria-hidden /> {t.selected}
                          </span>
                        )}
                      </p>
                      <p className="caption-2 mt-1 text-ink-soft">
                        {day(e.profile.dob)} · {e.profile.timeUnknown ? t.timeUnknown : e.profile.tob} · {e.profile.place.name}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!active && (
                        <button type="button" onClick={() => open(e)} className={btnSmall} aria-label={t.openLabel(nameOf(e.profile))}>
                          {t.open}
                        </button>
                      )}
                      <Link href={`/kundli?edit=${encodeURIComponent(e.id)}`} className={btnSmall} aria-label={t.editLabel(nameOf(e.profile))}>
                        <PiPencilSimple className="h-4 w-4" aria-hidden />
                        <span className="sr-only sm:not-sr-only">{t.edit}</span>
                      </Link>
                      {!e.isAccount && (
                        <button
                          type="button"
                          onClick={() => setConfirming(e.id)}
                          className={btnSmall}
                          aria-label={t.deleteLabel(nameOf(e.profile))}
                          aria-expanded={confirming === e.id}
                        >
                          <PiTrash className="h-4 w-4" aria-hidden />
                          <span className="sr-only sm:not-sr-only">{t.delete}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {confirming === e.id && (
                    <div role="alertdialog" aria-label={t.confirmLabel} className="mt-3 rounded-xl border border-line bg-danger-soft p-3">
                      <p className="body-5 text-danger">{t.confirm(nameOf(e.profile))}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          autoFocus
                          onClick={() => {
                            kundlis.remove(e.id);
                            setConfirming(null);
                          }}
                          className="button-sm inline-flex items-center gap-2 rounded-xl bg-danger px-3 py-2 text-ink-inverse transition hover:opacity-90 active:scale-98"
                        >
                          <PiTrash className="h-4 w-4" aria-hidden /> {t.yesDelete}
                        </button>
                        <button type="button" onClick={() => setConfirming(null)} className={btnSmall}>
                          {t.cancel}
                        </button>
                      </div>
                    </div>
                  )}
                  {e.isAccount && <p className="caption-5 mt-2 text-ink-muted">{t.accountNote}</p>}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
