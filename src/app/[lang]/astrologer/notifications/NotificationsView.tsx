"use client";

import { useEffect, useState } from "react";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import {
  getNotifications,
  getPreferences,
  markNotificationRead,
  PREFERENCE_KEYS,
  setPreferences,
  type AppNotification,
  type PreferenceKey,
  type Preferences,
} from "@/lib/services/astrologerHub";
import { Accent, Button, Card, Page, PageTitle, Pill } from "../_console/ui";
import { useAstrologer } from "../_console/useAstrologer";

const text = defineMessages({
  hi: {
    eyebrow: "सूचनाएँ",
    titleA: "आपकी ",
    titleB: "सूचनाएँ",
    sub: "AstroShrine से आई हाल की सूचनाएँ, और आप कौन-सी सूचनाएँ पाना चाहते हैं।",
    loading: "लोड हो रहा है…",
    failed: "यह भाग नहीं खुल सका।",
    retry: "फिर कोशिश करें",
    inbox: "हाल की सूचनाएँ",
    empty: "अभी कोई सूचना नहीं।",
    unread: "नई",
    markRead: "पढ़ा हुआ मानें",
    prefs: "कौन-सी सूचनाएँ चाहिए",
    prefsNote: "ये सेटिंग आपके खाते पर लागू होती हैं और ऐप की सूचनाओं में भी यही रहेंगी। वेबसाइट पर पुश सूचना नहीं भेजी जाती।",
    saveFailed: "सेटिंग सहेजी नहीं जा सकी।",
    keys: {
      booking_reminders: ["बुकिंग की याद", "बुकिंग और प्रतीक्षा से जुड़ी सूचनाएँ"],
      session_start: ["सत्र शुरू", "जब कोई सत्र शुरू होने वाला हो"],
      chat_messages: ["चैट संदेश", "ग्राहक का नया संदेश"],
      wallet_updates: ["वॉलेट", "भुगतान और राशि की जानकारी"],
      admin_broadcasts: ["टीम की घोषणाएँ", "AstroShrine टीम की ओर से सूचना"],
      promo_offers: ["ऑफ़र", "प्रचार और ऑफ़र"],
    } as Record<PreferenceKey, [string, string]>,
  },
  en: {
    eyebrow: "Notifications",
    titleA: "Your ",
    titleB: "notifications",
    sub: "Recent notices from AstroShrine, and which kinds you want to receive.",
    loading: "Loading…",
    failed: "Could not open this section.",
    retry: "Try again",
    inbox: "Recent notifications",
    empty: "No notifications yet.",
    unread: "New",
    markRead: "Mark as read",
    prefs: "What you want to hear about",
    prefsNote: "These settings are on your account, so they also apply to the app's notifications. The website does not send push notifications.",
    saveFailed: "Could not save the setting.",
    keys: {
      booking_reminders: ["Booking reminders", "Bookings and waiting list"],
      session_start: ["Session start", "When a session is about to begin"],
      chat_messages: ["Chat messages", "A new message from a customer"],
      wallet_updates: ["Wallet", "Payments and amounts"],
      admin_broadcasts: ["Team announcements", "Notices from the AstroShrine team"],
      promo_offers: ["Offers", "Promotions and offers"],
    },
  },
});

const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
const Txt = ({ children, className }: { children: string; className?: string }) => (
  <span lang={hasDevanagari(children) ? "hi" : undefined} className={className}>
    {children}
  </span>
);

type Load<T> = { id: string; data: T } | "error" | null;

export default function NotificationsView() {
  const t = useT(text);
  const { id, status } = useAstrologer();
  return (
    <Page>
      <PageTitle
        eyebrow={t.eyebrow}
        title={
          <>
            {t.titleA}
            <Accent>{t.titleB}</Accent>
          </>
        }
        sub={t.sub}
      />
      {status === "ready" && id && (
        <div className="grid items-start gap-7 lg:grid-cols-[1.4fr_1fr]">
          <Inbox id={id} />
          <Prefs />
        </div>
      )}
    </Page>
  );
}

function Failed({ onRetry }: { onRetry: () => void }) {
  const t = useT(text);
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-6" role="alert">
      <p className="text-danger">{t.failed}</p>
      <Button variant="line" size="sm" onClick={onRetry}>
        {t.retry}
      </Button>
    </Card>
  );
}

function Inbox({ id }: { id: string }) {
  const t = useT(text);
  const intl = INTL_LOCALE[useLocale()];
  const [state, setState] = useState<Load<AppNotification[]>>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getNotifications(id, controller.signal).then(
      (data) => setState({ id, data }),
      () => !controller.signal.aborted && setState("error"),
    );
    return () => controller.abort();
  }, [id, attempt]);

  const read = (n: AppNotification) => {
    setState((s) => (s && s !== "error" ? { ...s, data: s.data.map((x) => (x.id === n.id ? { ...x, read: true } : x)) } : s));
    markNotificationRead(id, n.id).catch(() => setAttempt((a) => a + 1));
  };
  const when = (ts: number) => new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(ts);

  return (
    <section aria-labelledby="inbox-h" className="flex flex-col gap-4">
      <h2 id="inbox-h" className="font-display text-2xl font-bold">{t.inbox}</h2>
      {state === "error" ? (
        <Failed onRetry={() => { setState(null); setAttempt((n) => n + 1); }} />
      ) : !state ? (
        <Card className="p-8 text-ink-soft" role="status">{t.loading}</Card>
      ) : state.data.length === 0 ? (
        <Card className="p-8 text-ink-soft">{t.empty}</Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {state.data.map((n) => (
            <li key={n.id}>
              <Card as="article" className={`p-5 ${n.read ? "" : "border-brand"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  {!n.read && <Pill tone="gold">{t.unread}</Pill>}
                  <span className="ml-auto text-sm text-ink-muted">{when(n.createdAt)}</span>
                </div>
                <h3 className="mt-2 font-bold"><Txt>{n.title}</Txt></h3>
                {n.body && <p className="mt-1 whitespace-pre-wrap break-words text-[15px] text-ink-soft"><Txt>{n.body}</Txt></p>}
                {!n.read && (
                  <button type="button" onClick={() => read(n)} className="mt-3 cursor-pointer text-sm font-semibold text-brand-strong underline underline-offset-2">
                    {t.markRead}
                  </button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Prefs() {
  const t = useT(text);
  const [state, setState] = useState<Load<Preferences>>(null);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getPreferences(controller.signal).then(
      (data) => setState({ id: "me", data }),
      () => !controller.signal.aborted && setState("error"),
    );
    return () => controller.abort();
  }, [attempt]);

  const toggle = (k: PreferenceKey, on: boolean) => {
    setError(false);
    setState((s) => (s && s !== "error" ? { ...s, data: { ...s.data, [k]: on } } : s));
    setPreferences({ [k]: on }).catch(() => {
      setError(true);
      setState((s) => (s && s !== "error" ? { ...s, data: { ...s.data, [k]: !on } } : s));
    });
  };

  return (
    <section aria-labelledby="prefs-h" className="flex flex-col gap-4">
      <h2 id="prefs-h" className="font-display text-2xl font-bold">{t.prefs}</h2>
      {state === "error" ? (
        <Failed onRetry={() => { setState(null); setAttempt((n) => n + 1); }} />
      ) : !state ? (
        <Card className="p-8 text-ink-soft" role="status">{t.loading}</Card>
      ) : (
        <Card className="p-2">
          <ul>
            {PREFERENCE_KEYS.map((k) => (
              <li key={k} className="border-b border-line last:border-0">
                <label className="flex cursor-pointer items-center gap-4 p-4">
                  <span className="min-w-0 flex-1">
                    <b className="block">{t.keys[k][0]}</b>
                    <span className="text-sm text-ink-soft">{t.keys[k][1]}</span>
                  </span>
                  <input type="checkbox" role="switch" checked={state.data[k]} onChange={(e) => toggle(k, e.target.checked)} className="h-6 w-11 shrink-0 cursor-pointer accent-[var(--color-brand-strong)]" />
                </label>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <p role="alert" className="text-danger">{error ? t.saveFailed : ""}</p>
      <p className="text-sm text-ink-soft">{t.prefsNote}</p>
    </section>
  );
}
