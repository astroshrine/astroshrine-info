"use client";

import { useEffect, useMemo, useState } from "react";
import { PiCalendarPlus, PiClockCounterClockwise } from "react-icons/pi";
import { primaryButton, secondaryButton } from "@/components/consult/Dialog";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { bookingInstant, isCancelled, isOpen, type Booking } from "@/lib/services/bookings";
import BookingCard from "./_parts/BookingParts";
import { EmptyState, ListSkeleton, LoadError, PageFrame, useRequireSignIn } from "./_parts/shared";
import { useBookings } from "./_parts/useBookings";

const text = defineMessages({
  hi: {
    title: "मेरी अपॉइंटमेंट",
    intro: "ज्योतिषी के साथ बुक किए गए कॉल और चैट। समय पर यहीं से जुड़ें। वही बुकिंग ऐप में भी दिखती हैं।",
    tabs: "बुकिंग की सूची",
    upcoming: "आने वाली",
    completed: "पूरी हुई",
    cancelled: "रद्द",
    book: "नई बुकिंग",
    history: "पुरानी सेशन और रिव्यू",
    loadFailed: "आपकी बुकिंग लोड नहीं हो सकीं।",
    emptyUpcomingTitle: "कोई आने वाली बुकिंग नहीं",
    emptyUpcomingBody: "किसी ज्योतिषी के खाली समय में कॉल या चैट बुक करें। वह यहां दिखेगी।",
    emptyCompletedTitle: "अभी कोई पूरी हुई बुकिंग नहीं",
    emptyCompletedBody: "पूरी हुई सलाह यहां जमा रहेगी।",
    emptyCancelledTitle: "कोई रद्द बुकिंग नहीं",
    emptyCancelledBody: "आपकी सारी बुकिंग ठीक चल रही हैं।",
    choose: "ज्योतिषी चुनें",
    reschedule: "समय बदलना हो तो बुकिंग रद्द करके नए समय पर फिर से बुक करें (ऐप में भी यही तरीका है)।",
  },
  en: {
    title: "My appointments",
    intro: "Calls and chats you booked with astrologers. Join from here at the time. The same bookings show in the app.",
    tabs: "Booking lists",
    upcoming: "Upcoming",
    completed: "Completed",
    cancelled: "Cancelled",
    book: "Book a slot",
    history: "Past sessions and reviews",
    loadFailed: "Your bookings could not be loaded.",
    emptyUpcomingTitle: "No upcoming bookings",
    emptyUpcomingBody: "Book a call or chat in an astrologer's free time and it will show up here.",
    emptyCompletedTitle: "No completed bookings yet",
    emptyCompletedBody: "Your finished consultations are kept here.",
    emptyCancelledTitle: "No cancelled bookings",
    emptyCancelledBody: "All your bookings are running smoothly.",
    choose: "Choose an astrologer",
    reschedule: "To change the time, cancel the booking and book again for the new time (the app works the same way).",
  },
});

type Tab = "upcoming" | "completed" | "cancelled";
const TABS: Tab[] = ["upcoming", "completed", "cancelled"];

function sortFor(tab: Tab, list: Booking[]): Booking[] {
  const at = (b: Booking) => bookingInstant(b.date, b.start) || b.createdAt;
  // Upcoming: the soonest first. The others: the latest first.
  return [...list].sort((a, b) => (tab === "upcoming" ? at(a) - at(b) : at(b) - at(a)));
}

export default function BookingsView() {
  const signedIn = useRequireSignIn();
  if (!signedIn) return <PageFrame><ListSkeleton /></PageFrame>;
  return <SignedIn />;
}

function SignedIn() {
  const t = useT(text);
  const { bookings, photos, failed, reload } = useBookings(true);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // The join buttons open on their own as the time comes.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const groups = useMemo(() => {
    const all = bookings ?? [];
    return {
      upcoming: sortFor("upcoming", all.filter(isOpen)),
      completed: sortFor("completed", all.filter((b) => b.status === "COMPLETED" || b.status === "EXPIRED")),
      cancelled: sortFor("cancelled", all.filter(isCancelled)),
    } satisfies Record<Tab, Booking[]>;
  }, [bookings]);

  const list = groups[tab];

  return (
    <PageFrame narrow>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-xl flex-col gap-2">
          <h1 className="heading-3 text-ink">{t.title}</h1>
          <p className="body-6 text-ink-soft">{t.intro}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/astrologers" className={primaryButton}>
            <PiCalendarPlus className="h-5 w-5" aria-hidden />
            {t.book}
          </Link>
          <Link href="/history" className={secondaryButton}>
            <PiClockCounterClockwise className="h-5 w-5" aria-hidden />
            {t.history}
          </Link>
        </div>
      </header>

      <div role="tablist" aria-label={t.tabs} className="flex gap-1 rounded-2xl bg-surface-sunken p-1">
        {TABS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`tab-${k}`}
            aria-selected={tab === k}
            aria-controls="bookings-panel"
            onClick={() => setTab(k)}
            className={`button-sm flex-1 rounded-xl px-3 py-2 transition ${tab === k ? "bg-surface-card text-ink shadow-sm" : "text-ink-soft hover:text-ink"}`}
          >
            {t[k]}
            {bookings && groups[k].length > 0 && <span className="caption-4 ml-1 text-ink-muted">({groups[k].length})</span>}
          </button>
        ))}
      </div>

      {notice && (
        <p role="status" className="body-6 rounded-2xl bg-success-soft px-4 py-3 text-success">
          {notice}
        </p>
      )}

      <div id="bookings-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="flex flex-col gap-3">
        {bookings === null ? (
          failed ? <LoadError message={t.loadFailed} onRetry={reload} /> : <ListSkeleton />
        ) : list.length === 0 ? (
          <EmptyState title={t[`empty${cap(tab)}Title`]} body={t[`empty${cap(tab)}Body`]}>
            {tab === "upcoming" && (
              <Link href="/astrologers" className={primaryButton}>
                {t.choose}
              </Link>
            )}
          </EmptyState>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {list.map((b) => (
                <BookingCard
                  key={b.id}
                  b={b}
                  photo={photos.get(b.astrologerId) ?? null}
                  now={now}
                  onCancelled={(message) => {
                    setNotice(message);
                    reload();
                  }}
                />
              ))}
            </ul>
            {tab === "upcoming" && <p className="caption-2 text-ink-soft">{t.reschedule}</p>}
          </>
        )}
      </div>
    </PageFrame>
  );
}

const cap = <T extends Tab>(s: T) => (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>;
