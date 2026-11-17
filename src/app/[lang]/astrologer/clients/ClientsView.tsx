"use client";

import { useEffect, useState } from "react";
import { PiChatCircleText, PiPhone } from "react-icons/pi";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { getClients, inviteClient, type Client, type Segment } from "@/lib/services/astrologerClients";
import { Accent, Button, Card, Page, PageTitle, Pill } from "../_console/ui";
import { useAstrologer } from "../_console/useAstrologer";

const text = defineMessages({
  hi: {
    eyebrow: "ग्राहक",
    titleA: "आपके ",
    titleB: "ग्राहक",
    sub: "जो लोग पहले आपसे परामर्श ले चुके हैं। चाहें तो उन्हें चैट या कॉल के लिए वापस बुलाएँ।",
    tabs: "ग्राहक सूची",
    top: "सबसे ज़्यादा खर्च",
    loyal: "नियमित",
    loading: "ग्राहक लोड हो रहे हैं…",
    failed: "ग्राहकों की सूची नहीं खुल सकी।",
    retry: "फिर कोशिश करें",
    emptyTop: "अभी कोई ग्राहक नहीं। पहला परामर्श पूरा होते ही यहाँ दिखेगा।",
    emptyLoyal: "अभी कोई नियमित ग्राहक नहीं। जो लोग आपके पास दोबारा आते हैं, वे यहाँ दिखेंगे।",
    spent: "कुल खर्च",
    sessions: (n: number) => `${n.toLocaleString("hi-IN")} परामर्श`,
    last: "आख़िरी परामर्श",
    never: "कोई नहीं",
    chat: "चैट",
    call: "कॉल",
    inviteChat: "चैट के लिए बुलाएँ",
    inviteCall: "कॉल के लिए बुलाएँ",
    sending: "भेजा जा रहा है…",
    invitedOk: "न्योता भेज दिया गया।",
    invitedQuiet: "न्योता दर्ज हुआ, पर ग्राहक को सूचना नहीं पहुँची।",
    again: (when: string) => `अगला न्योता ${when} के बाद`,
    alreadyInvited: "इस ग्राहक को 24 घंटे में न्योता जा चुका है।",
    onBreak: "पहले क्विक DND या विश्राम समय बंद करें, फिर न्योता भेजें।",
    inviteFailed: "न्योता नहीं भेज सके। फिर कोशिश करें।",
    customer: "ग्राहक",
  },
  en: {
    eyebrow: "Clients",
    titleA: "Your ",
    titleB: "clients",
    sub: "People who have consulted you before. Invite them back for a chat or a call if you like.",
    tabs: "Client list",
    top: "Top spenders",
    loyal: "Loyal",
    loading: "Loading your clients…",
    failed: "Could not load your clients.",
    retry: "Try again",
    emptyTop: "No clients yet. They show up here once your first consultation is done.",
    emptyLoyal: "No loyal clients yet. People who come back to you will show up here.",
    spent: "Total spent",
    sessions: (n) => `${n.toLocaleString("en-IN")} sessions`,
    last: "Last session",
    never: "None",
    chat: "Chat",
    call: "Call",
    inviteChat: "Invite to chat",
    inviteCall: "Invite to call",
    sending: "Sending…",
    invitedOk: "Invite sent.",
    invitedQuiet: "Invite recorded, but the client could not be notified.",
    again: (when) => `Next invite after ${when}`,
    alreadyInvited: "This client was already invited in the last 24 hours.",
    onBreak: "Turn off Quick DND or rest time first, then invite.",
    inviteFailed: "Could not send the invite. Try again.",
    customer: "Customer",
  },
});

const TZ = "Asia/Kolkata";
const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
const initials = (name: string) => {
  const w = name.split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[w.length - 1][0] : (w[0] ?? "").slice(0, 2)).toUpperCase();
};

type State = { id: string; segment: Segment; attempt: number; clients: Client[] | null };

export default function ClientsView() {
  const t = useT(text);
  const locale = useLocale();
  const intl = INTL_LOCALE[locale];
  const { id, status } = useAstrologer();
  const [segment, setSegment] = useState<Segment>("top");
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, { tone: "ok" | "error"; msg: string }>>({});
  const [busy, setBusy] = useState<{ id: string; channel: "chat" | "call" } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== "ready" || !id) return;
    const c = new AbortController();
    getClients(id, segment, c.signal).then(
      (clients) => setState({ id, segment, attempt, clients }),
      () => !c.signal.aborted && setState({ id, segment, attempt, clients: null }),
    );
    return () => c.abort();
  }, [id, status, segment, attempt]);

  // Cooldowns lapse while the page is open: re-check once a minute.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const current = state && state.id === id && state.segment === segment && state.attempt === attempt ? state : null;
  const clients = current?.clients ?? null;
  const showSpent = !!clients && clients.some((c) => c.totalSpent > 0);

  const fmtDay = (iso: string) => new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(new Date(iso));
  const fmtWhen = (iso: string) => new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: TZ }).format(new Date(iso));

  const invite = async (c: Client, channel: "chat" | "call") => {
    setBusy({ id: c.id, channel });
    setNotes((n) => ({ ...n, [c.id]: undefined as never }));
    try {
      const r = await inviteClient(id, c.id, channel);
      setOverrides((o) => ({ ...o, [c.id]: r.canInviteAt }));
      setNotes((n) => ({ ...n, [c.id]: { tone: "ok", msg: r.delivered ? t.invitedOk : t.invitedQuiet } }));
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        setOverrides((o) => ({ ...o, [c.id]: new Date(Date.now() + 86_400_000).toISOString() }));
        setNotes((n) => ({ ...n, [c.id]: { tone: "error", msg: t.alreadyInvited } }));
      } else {
        const msg = e instanceof ApiError && e.status === 409 ? t.onBreak : t.inviteFailed;
        setNotes((n) => ({ ...n, [c.id]: { tone: "error", msg } }));
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <Page>
      <PageTitle eyebrow={t.eyebrow} title={<>{t.titleA}<Accent>{t.titleB}</Accent></>} sub={t.sub} />

      <div role="tablist" aria-label={t.tabs} className="flex w-fit rounded-[14px] border border-line bg-surface-card p-[3px]">
        {(["top", "loyal"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            id={`clients-tab-${s}`}
            aria-selected={segment === s}
            aria-controls="clients-panel"
            onClick={() => setSegment(s)}
            className={`h-11 cursor-pointer rounded-[10px] px-5 text-[15px] font-bold transition ${segment === s ? "bg-surface-inverse text-ink-inverse" : "text-ink hover:bg-surface-sunken"}`}
          >
            {t[s]}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="clients-panel" aria-labelledby={`clients-tab-${segment}`} className="flex flex-col gap-4">
        {!current ? (
          <p role="status" className="py-12 text-center text-ink-soft">{t.loading}</p>
        ) : clients === null ? (
          <div role="alert" className="py-12 text-center">
            <p className="text-danger">{t.failed}</p>
            <Button variant="line" size="sm" className="mt-3" onClick={() => setAttempt((n) => n + 1)}>{t.retry}</Button>
          </div>
        ) : clients.length === 0 ? (
          <Card className="p-8 text-center text-ink-soft">{segment === "top" ? t.emptyTop : t.emptyLoyal}</Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {clients.map((c) => {
              const name = c.name || t.customer;
              const next = overrides[c.id] ?? c.canInviteAt;
              const waiting = next && new Date(next).getTime() > now ? next : null;
              const note = notes[c.id];
              const sending = busy?.id === c.id;
              return (
                <li key={c.id}>
                  <Card as="div" className="flex flex-wrap items-center gap-x-5 gap-y-3 p-4 sm:p-5">
                    <span
                      lang={hasDevanagari(name) ? "hi" : undefined}
                      className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-sunken font-bold text-brand-strong"
                    >
                      {initials(name)}
                      {c.photo && (
                        // eslint-disable-next-line @next/next/no-img-element -- a user-uploaded photo from any storage host
                        <img src={c.photo} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1 basis-[220px]">
                      <b lang={hasDevanagari(name) ? "hi" : undefined} className="block truncate text-[17px]">{name}</b>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                        {showSpent && (
                          <span>
                            {t.spent}: <b className="text-ink">₹{c.totalSpent.toLocaleString(intl)}</b>
                          </span>
                        )}
                        <span>{t.sessions(c.sessions)}</span>
                        <span className="inline-flex items-center gap-1.5">
                          {c.lastChannel === "call" ? <PiPhone className="h-4 w-4" aria-hidden /> : c.lastChannel === "chat" ? <PiChatCircleText className="h-4 w-4" aria-hidden /> : null}
                          {t.last}: {c.lastSessionAt ? fmtDay(c.lastSessionAt) : t.never}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {waiting ? (
                        <Pill tone="neutral">{t.again(fmtWhen(waiting))}</Pill>
                      ) : (
                        <>
                          <Button variant="navy" size="sm" disabled={!!busy} onClick={() => invite(c, "chat")}>
                            <PiChatCircleText className="h-4 w-4" aria-hidden />
                            {sending && busy?.channel === "chat" ? t.sending : t.inviteChat}
                          </Button>
                          <Button variant="line" size="sm" disabled={!!busy} onClick={() => invite(c, "call")}>
                            <PiPhone className="h-4 w-4" aria-hidden />
                            {sending && busy?.channel === "call" ? t.sending : t.inviteCall}
                          </Button>
                        </>
                      )}
                    </div>
                    {note && (
                      <p role={note.tone === "error" ? "alert" : "status"} className={`basis-full text-sm font-semibold ${note.tone === "error" ? "text-danger" : "text-success"}`}>
                        {note.msg}
                      </p>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Page>
  );
}
