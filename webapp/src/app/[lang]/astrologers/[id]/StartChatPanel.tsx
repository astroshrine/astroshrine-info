"use client";

import { useEffect, useState } from "react";
import { PiChatCircleDots, PiHourglassMedium, PiSignIn, PiWallet } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import AstrologerAvatar from "@/components/consult/AstrologerAvatar";
import AvailabilityBadge from "@/components/consult/AvailabilityBadge";
import Dialog, { primaryButton, quietButton, secondaryButton } from "@/components/consult/Dialog";
import WithName from "@/components/consult/WithName";
import { INTL_LOCALE } from "@/i18n/config";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { localizeHref } from "@/i18n/paths";
import { listAstrologers } from "@/lib/services/astrologers";
import { contentLang, formatNextAvailable, rupees, type AstrologerCard } from "@/lib/services/astrologerModel";
import {
  NO_BOOKING,
  codeOf,
  formatClock,
  getChatPrecheck,
  getChatPricing,
  getConsultConfig,
  getQueueSummary,
  getRemovalCooldown,
  isRemovedCooldown,
  lowBalanceInfo,
  rechargeHref,
  startChat,
  statusOfError,
  type ChatPricing,
  type ConsultConfig,
  type QueueSummary,
} from "@/lib/services/chat";

const text = defineMessages({
  hi: {
    startFailed: "चैट शुरू नहीं हो सकी। कृपया फिर से कोशिश करें।",
    pricingFailed: "चैट की कीमत लोड नहीं हो सकी। कृपया फिर से कोशिश करें।",
    nobodyWaiting: "कोई इंतज़ार में नहीं है, अगला नंबर आपका होगा।",
    waiting: (people: number) => `${people} लोग इंतज़ार में`,
    aboutMinutes: (minutes: number) => ` · लगभग ${minutes} मिनट`,
    startChat: "चैट शुरू करें",
    busyNow: "अभी व्यस्त",
    offlineNow: "अभी ऑफ़लाइन",
    againIn: (clock: string) => `${clock} में फिर से`,
    chatOff: "चैट अभी बंद है",
    availableIn: (clock: string) => `${clock} में उपलब्ध`,
    seeWaitlist: "वेटलिस्ट देखें",
    starting: "शुरू हो रही है…",
    chatWith: (name: string) => `${name} से चैट`,
    available: (when: string) => `उपलब्ध ${when}`,
    free: "मुफ़्त",
    perMinute: "प्रति मिनट",
    off: (percent: number) => `${percent}% छूट`,
    logInToChat: "चैट के लिए लॉगिन करें",
    rules: (name: string) => [
      `समय तभी शुरू होता है जब ${name} पहला जवाब देते हैं।`,
      "5 मिनट में सेशन शुरू न हो तो पूरे पॉइंट्स वापस।",
      "चैट जल्दी खत्म करें तो बचे समय के पॉइंट्स वापस।",
    ],
    wallet: (amount: string) => `Wallet: ${amount}`,
    recharge: "रिचार्ज करें",
    // Dialogs
    confirmTitle: (name: string) => `${name} से चैट करें`,
    blockPrice: (minutes: number, points: string) => `${points} में ${minutes} मिनट`,
    blockRate: (rate: string) => `(${rate}/मिनट)`,
    confirmRules: (name: string, minutes: number) => [
      `बिलिंग तभी शुरू होगी जब ${name} बातचीत से जुड़ेंगे, इसलिए इंतज़ार के समय का कोई शुल्क नहीं लगता।`,
      "अगर 5 मिनट में सेशन शुरू नहीं होता, तो पूरे पॉइंट्स आपके wallet में वापस आ जाएंगे।",
      `आप कभी भी ${minutes} मिनट और बढ़ा सकते हैं।`,
      `${name} के साथ पहले से चैट चल रही है? वह बिना किसी अतिरिक्त शुल्क के जारी रहेगी।`,
    ],
    cancel: "रद्द करें",
    startFor: (points: string) => `चैट शुरू करें · ${points}`,
    lowTitle: "पॉइंट्स कम हैं",
    lowNeed: (need: number, balance: number, short: number) =>
      `इस चैट के लिए ${need} पॉइंट्स चाहिए, आपके पास ${balance} हैं। आगे बढ़ने के लिए ${short} पॉइंट्स और जोड़ें।`,
    lowBody: "इसके लिए आपके पास पर्याप्त पॉइंट्स नहीं हैं। आगे बढ़ने के लिए wallet रिचार्ज करें।",
    rechargeWallet: "Wallet रिचार्ज करें",
    inChatTitle: (name: string) => `${name} अभी चैट में हैं`,
    inSessionTitle: (name: string) => `${name} अभी सत्र में हैं`,
    freeIn: (clock: string) => `${clock} में फ़्री`,
    inChatBody: "यह चैट ख़त्म होते ही नई चैट शुरू हो सकेगी। तब तक नीचे अभी ऑनलाइन ज्योतिषी देखें।",
    waitlistBody:
      "वे फ़्री होते ही आपकी चैट शुरू होगी, और लाइन में रहते हुए भी आप अपने सवाल लिख सकते हैं। शुरू होने से पहले कभी भी लाइन छोड़ें, पूरा रिफ़ंड मिलेगा।",
    joinWaitlist: "वेटलिस्ट में जुड़ें",
    notNow: "अभी नहीं",
    busyTitle: (name: string) => `${name} अभी व्यस्त हैं`,
    offlineTitle: (name: string) => `${name} अभी ऑफ़लाइन हैं`,
    awayBody: "यह ज्योतिषी अभी उपलब्ध नहीं हैं, इसलिए अभी चैट बुक नहीं हो सकती। कोई पैसा नहीं कटा।",
    mayBeAvailable: (when: string) => ` ये ${when} से उपलब्ध हो सकते हैं।`,
    chatOffBody: (name: string) => `${name} ऑनलाइन हैं, पर अभी चैट नहीं ले रहे। थोड़ी देर बाद देखें। कोई पैसा नहीं कटा।`,
    removedTitle: "अभी आपके लिए उपलब्ध नहीं",
    removedBody: "आपको इस ज्योतिषी की प्रतीक्षा सूची से हटाया गया है।",
    removedUntil: (at: string) => ` आप ${at} के बाद फिर से जुड़ सकते हैं।`,
    removedLater: " थोड़ी देर बाद फिर से कोशिश करें।",
    freeChatInUseTitle: "फ्री चैट पहले से खुली है",
    freeChatInUseBody:
      "आपकी फ्री चैट किसी दूसरे ज्योतिषी के साथ पहले से खुली है। पहले उसे पूरा करें, या पेड चैट शुरू करें। कोई पैसा नहीं कटा।",
    openMyChats: "मेरी चैट खोलें",
    close: "बंद करें",
    noneOnline: "अभी कोई और ज्योतिषी ऑनलाइन नहीं है।",
    onlineNow: "अभी ऑनलाइन · तुरंत चैट करें",
    perMin: (price: string) => `${price}/मिनट`,
  },
  en: {
    startFailed: "The chat could not be started. Please try again.",
    pricingFailed: "The chat price could not be loaded. Please try again.",
    nobodyWaiting: "No one is waiting, so you would be next.",
    waiting: (people) => (people === 1 ? "1 person waiting" : `${people} people waiting`),
    aboutMinutes: (minutes) => ` · about ${minutes} min`,
    startChat: "Start chat",
    busyNow: "Busy right now",
    offlineNow: "Offline right now",
    againIn: (clock) => `Try again in ${clock}`,
    chatOff: "Chat is off right now",
    availableIn: (clock) => `Available in ${clock}`,
    seeWaitlist: "See waitlist",
    starting: "Starting…",
    chatWith: (name) => `Chat with ${name}`,
    available: (when) => `Available ${when}`,
    free: "Free",
    perMinute: "per minute",
    off: (percent) => `${percent}% off`,
    logInToChat: "Log in to chat",
    rules: (name) => [
      `The clock starts only when ${name} sends the first reply.`,
      "If the session does not start within 5 minutes, all your points come back.",
      "End the chat early and the points for the unused time come back.",
    ],
    wallet: (amount) => `Wallet: ${amount}`,
    recharge: "Recharge",
    confirmTitle: (name) => `Chat with ${name}`,
    blockPrice: (minutes, points) => `${minutes} minutes for ${points}`,
    blockRate: (rate) => `(${rate}/min)`,
    confirmRules: (name, minutes) => [
      `Billing begins only when ${name} joins the conversation, so time spent waiting is never charged.`,
      "If the session does not begin within 5 minutes, all your points come back to your wallet.",
      `You can add ${minutes} more minutes at any time.`,
      `Already chatting with ${name}? That chat simply continues, at no extra charge.`,
    ],
    cancel: "Cancel",
    startFor: (points) => `Start chat · ${points}`,
    lowTitle: "Not enough points",
    lowNeed: (need, balance, short) =>
      `This chat needs ${need} points and you have ${balance}. Add ${short} more ${short === 1 ? "point" : "points"} to continue.`,
    lowBody: "You do not have enough points for this. Recharge your wallet to continue.",
    rechargeWallet: "Recharge wallet",
    inChatTitle: (name) => `${name} is in a chat`,
    inSessionTitle: (name) => `${name} is in a session`,
    freeIn: (clock) => `Free in ${clock}`,
    inChatBody: "A new chat can start as soon as this one ends. Until then, see who is online now below.",
    waitlistBody:
      "Your chat starts as soon as they are free, and you can write your questions while you wait in line. Leave the line any time before it starts for a full refund.",
    joinWaitlist: "Join waitlist",
    notNow: "Not now",
    busyTitle: (name) => `${name} is busy right now`,
    offlineTitle: (name) => `${name} is offline right now`,
    awayBody: "This astrologer is not available right now, so a chat cannot be booked. Nothing was charged.",
    mayBeAvailable: (when) => ` They may be available ${when}.`,
    chatOffBody: (name) => `${name} is online but not taking chats right now. Check again in a little while. Nothing was charged.`,
    removedTitle: "Not available to you right now",
    removedBody: "You were removed from this astrologer's waitlist.",
    removedUntil: (at) => ` You can join again after ${at}.`,
    removedLater: " Please try again in a little while.",
    freeChatInUseTitle: "Your free chat is already open",
    freeChatInUseBody:
      "Your free chat is already open with another astrologer. Finish it first, or start a paid chat. Nothing was charged.",
    openMyChats: "Open my chats",
    close: "Close",
    noneOnline: "No other astrologer is online right now.",
    onlineNow: "Online now · chat right away",
    perMin: (price) => `${price}/min`,
  },
});

type DialogState =
  | { kind: "confirm"; pricing: ChatPricing }
  | { kind: "lowBalance"; need?: number; balance?: number }
  | { kind: "busy" }
  | { kind: "away"; reason: "offline" | "busy" }
  | { kind: "chatOff" }
  | { kind: "removed" }
  | { kind: "freeChatInUse" }
  | null;

/** Ticks once a second while `active`, for the countdowns. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, [active]);
  return now;
}

const waitMinutes = (ms: number | null | undefined) => (ms && ms > 0 ? Math.max(1, Math.ceil(ms / 60_000)) : null);

/**
 * The profile's "Chat" action, with the app's rules (AstroProfileButtonLayout): offline or live astrologers
 * cannot be booked, Chat switched off is explained, a busy astrologer offers the waitlist, a removal pause
 * counts down, the price is confirmed before anything is charged, and a short wallet sends the user to
 * recharge first. (The app's "notify me when free" is left out: it arrives as a phone push notification.)
 */
export default function StartChatPanel({ astrologer: a }: { astrologer: AstrologerCard }) {
  const router = useRouter();
  const { status: authStatus, balance, refresh } = useAuth();
  const signedIn = authStatus === "signedIn";
  const t = useT(text);
  const locale = useLocale();

  const [config, setConfig] = useState<ConsultConfig | null>(null);
  const [removedUntil, setRemovedUntil] = useState<number | null>(null);
  const [busyUntil, setBusyUntil] = useState<number | null>(null);
  const [queue, setQueue] = useState<QueueSummary | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "info" | "error"; text: string } | null>(null);

  const isBusy = a.status === "busy";
  const blocked = a.availability === "offline" || a.status === "live";

  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    getConsultConfig(controller.signal).then(setConfig);
    getRemovalCooldown(a.id).then(setRemovedUntil);
    return () => controller.abort();
  }, [signedIn, a.id]);

  // In a session: until when nobody else can book them, and the line.
  useEffect(() => {
    if (!signedIn || !isBusy) return;
    let live = true;
    getChatPrecheck(a.id).then(
      (p) => live && setBusyUntil(p.busyUntil),
      () => live && setBusyUntil(null),
    );
    getQueueSummary(a.id).then(
      (q) => live && setQueue(q),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [signedIn, isBusy, a.id]);

  const now = useNow(!!busyUntil || !!removedUntil);
  const chatLocked = isBusy && !!busyUntil && busyUntil > now;
  const removedLock = !!removedUntil && removedUntil > now;
  const free = config?.free === true;
  const freeChat = config?.freeChat.available === true;
  const disabledLook = blocked || a.chatOff || removedLock || chatLocked;

  const start = async () => {
    if (starting) return;
    setStarting(true);
    setNotice(null);
    try {
      const r = await startChat(a.id);
      void refresh(); // the wallet balance after the block was charged
      router.push(`/chat/${encodeURIComponent(a.id)}?booking=${encodeURIComponent(r.pack.bookingId)}`);
    } catch (error) {
      const status = statusOfError(error);
      const code = codeOf(error);
      setDialog(null);
      if (status === 409 && code === "FREE_CHAT_IN_USE") setDialog({ kind: "freeChatInUse" });
      else if (status === 409 && code === "CHAT_OFF") setDialog({ kind: "chatOff" });
      else if (status === 409 && code === "ASTROLOGER_LIVE") setDialog({ kind: "away", reason: "busy" });
      else if (status === 409 && (code === "ASTROLOGER_OFFLINE" || code === "ASTROLOGER_OFFLINE_CONFIRM")) setDialog({ kind: "away", reason: "offline" });
      else if (status === 409 && code === "ASTROLOGER_IN_CHAT") {
        // Someone else's chat started first: show the countdown instead of an error.
        getChatPrecheck(a.id).then((p) => setBusyUntil(p.busyUntil), () => undefined);
        setDialog({ kind: "busy" });
      } else if (isRemovedCooldown(error)) {
        getRemovalCooldown(a.id).then(setRemovedUntil);
        setDialog({ kind: "removed" });
      } else {
        const low = lowBalanceInfo(error);
        if (low) setDialog({ kind: "lowBalance", ...low });
        // The backend's own message is shown as it comes; otherwise this page's text.
        else
          setNotice({
            tone: "error",
            text: codeOf(error) !== NO_BOOKING && error instanceof Error && error.message ? error.message : t.startFailed,
          });
      }
    } finally {
      setStarting(false);
    }
  };

  /** Price first: free chats start at once; otherwise check the wallet, then confirm. */
  const chatNow = async () => {
    if (starting) return;
    setNotice(null);
    let pricing: ChatPricing;
    try {
      pricing = await getChatPricing(a.id);
    } catch {
      setNotice({ tone: "error", text: t.pricingFailed });
      return;
    }
    if (pricing.free || pricing.freeChatAvailable || freeChat) return void start();
    const wallet = balance?.points_balance;
    if (pricing.blockPoints > 0 && typeof wallet === "number" && wallet < pricing.blockPoints) {
      setDialog({ kind: "lowBalance", need: pricing.blockPoints, balance: wallet });
      return;
    }
    setDialog({ kind: "confirm", pricing });
  };

  const onChatTap = () => {
    if (starting) return;
    if (blocked) setDialog({ kind: "away", reason: a.status === "live" ? "busy" : "offline" });
    else if (removedLock) setDialog({ kind: "removed" });
    else if (a.chatOff) setDialog({ kind: "chatOff" });
    else if (isBusy || chatLocked) setDialog({ kind: "busy" });
    else void chatNow();
  };

  const next = formatNextAvailable(a.nextAvailableAt, locale);
  const wait = queue ? waitMinutes(queue.estimatedWaitMs) : null;
  const queueLine = queue
    ? queue.length === 0
      ? t.nobodyWaiting
      : `${t.waiting(queue.length)}${wait ? t.aboutMinutes(wait) : ""}`
    : null;

  let label = t.startChat;
  if (blocked) label = a.status === "live" ? t.busyNow : t.offlineNow;
  else if (removedLock) label = t.againIn(formatClock((removedUntil! - now) / 1000));
  else if (a.chatOff) label = t.chatOff;
  else if (chatLocked) label = t.availableIn(formatClock((busyUntil! - now) / 1000));
  else if (isBusy) label = t.seeWaitlist;
  else if (starting) label = t.starting;

  return (
    <section aria-labelledby="chat-panel-title" className="flex flex-col gap-4 rounded-3xl border border-line bg-surface-card p-6">
      <h2 id="chat-panel-title" className="sr-only">
        <WithName text={t.chatWith(a.name)} name={a.name} />
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AvailabilityBadge availability={a.availability} />
        {a.availability === "offline" && next && <span className="caption-5 text-ink-muted">{t.available(next)}</span>}
        {isBusy && queueLine && <span className="caption-5 text-ink-muted">{queueLine}</span>}
      </div>

      <p className="flex items-baseline gap-2">
        {free || a.chat.price === 0 ? (
          <span className="heading-5 text-success">{t.free}</span>
        ) : (
          <>
            <span className="heading-5 text-ink">{rupees(a.chat.price)}</span>
            <span className="body-6 text-ink-soft">{t.perMinute}</span>
            {a.chat.hasOffer && (
              <span className="caption-5 text-ink-muted">
                <s>{rupees(a.chat.rate)}</s> · {t.off(a.offerPercent)}
              </span>
            )}
          </>
        )}
      </p>

      {signedIn ? (
        <button
          type="button"
          onClick={onChatTap}
          disabled={starting}
          aria-disabled={disabledLook || undefined}
          className={`${disabledLook ? secondaryButton : primaryButton} w-full`}
        >
          {chatLocked || removedLock ? <PiHourglassMedium className="h-5 w-5" aria-hidden /> : <PiChatCircleDots className="h-5 w-5" aria-hidden />}
          <span className="tabular-nums">{label}</span>
        </button>
      ) : authStatus === "loading" ? (
        <div aria-hidden className="h-10 animate-pulse rounded-full bg-surface-sunken" />
      ) : (
        <Link href={`/login?next=${encodeURIComponent(localizeHref(locale, `/astrologers/${a.id}`))}`} className={`${primaryButton} w-full`}>
          <PiSignIn className="h-5 w-5" aria-hidden />
          {t.logInToChat}
        </Link>
      )}

      {notice && (
        <p role={notice.tone === "error" ? "alert" : "status"} className={`caption-2 rounded-xl px-3 py-2 ${notice.tone === "error" ? "bg-danger-soft text-danger" : "bg-surface-sunken text-ink"}`}>
          {notice.text}
        </p>
      )}

      <ul className="caption-5 flex list-disc flex-col gap-1 pl-4 text-ink-soft">
        {t.rules(a.name).map((rule) => (
          <li key={rule}>
            <WithName text={rule} name={a.name} />
          </li>
        ))}
      </ul>

      {signedIn && balance && (
        <p className="caption-2 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-ink-soft">
          <span className="inline-flex items-center gap-2">
            <PiWallet className="h-4 w-4" aria-hidden />
            {t.wallet(rupees(balance.points_balance))}
          </span>
          <Link href={rechargeHref()} className="button-sm rounded-full px-2 py-1 text-brand-strong underline-offset-4 transition hover:underline">
            {t.recharge}
          </Link>
        </p>
      )}

      <ChatDialogs
        dialog={dialog}
        onClose={() => setDialog(null)}
        astrologer={a}
        queueLine={queueLine}
        chatLocked={chatLocked}
        countdown={chatLocked ? formatClock((busyUntil! - now) / 1000) : null}
        removedUntil={removedLock ? removedUntil : null}
        starting={starting}
        onConfirm={() => void start()}
        onJoinWaitlist={() => void chatNow()}
      />
    </section>
  );
}

function ChatDialogs({
  dialog,
  onClose,
  astrologer: a,
  queueLine,
  chatLocked,
  countdown,
  removedUntil,
  starting,
  onConfirm,
  onJoinWaitlist,
}: {
  dialog: DialogState;
  onClose: () => void;
  astrologer: AstrologerCard;
  queueLine: string | null;
  chatLocked: boolean;
  countdown: string | null;
  /** Set while the removal pause still runs. */
  removedUntil: number | null;
  starting: boolean;
  onConfirm: () => void;
  onJoinWaitlist: () => void;
}) {
  const t = useT(text);
  const locale = useLocale();
  const kind = dialog?.kind ?? null;
  const showAlternatives = kind === "busy" || kind === "away" || kind === "chatOff";
  const next = formatNextAvailable(a.nextAvailableAt, locale);

  let title = "";
  let body: React.ReactNode = null;

  if (dialog?.kind === "confirm") {
    const p = dialog.pricing;
    title = t.confirmTitle(a.name);
    body = (
      <>
        <p className="title-2 text-ink">
          {t.blockPrice(p.blockMinutes, rupees(p.blockPoints))} <span className="body-6 text-ink-soft">{t.blockRate(rupees(p.ratePerMin))}</span>
        </p>
        <ul className="body-6 flex list-disc flex-col gap-2 pl-4 text-ink-soft">
          {t.confirmRules(a.name, p.blockMinutes).map((rule) => (
            <li key={rule}>
              <WithName text={rule} name={a.name} />
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className={secondaryButton}>
            {t.cancel}
          </button>
          <button type="button" onClick={onConfirm} disabled={starting} className={primaryButton}>
            {starting ? t.starting : t.startFor(rupees(p.blockPoints))}
          </button>
        </div>
      </>
    );
  } else if (dialog?.kind === "lowBalance") {
    title = t.lowTitle;
    const { need, balance } = dialog;
    body = (
      <>
        <p className="body-6 text-ink-soft">
          {need != null && balance != null && need > balance ? t.lowNeed(need, Math.floor(balance), Math.ceil(need - balance)) : t.lowBody}
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className={secondaryButton}>
            {t.cancel}
          </button>
          <Link href={rechargeHref(need != null && balance != null ? need - balance : undefined)} className={primaryButton}>
            <PiWallet className="h-5 w-5" aria-hidden />
            {t.rechargeWallet}
          </Link>
        </div>
      </>
    );
  } else if (dialog?.kind === "busy") {
    title = chatLocked ? t.inChatTitle(a.name) : t.inSessionTitle(a.name);
    body = (
      <>
        {chatLocked && countdown ? (
          <p className="title-2 tabular-nums text-ink">{t.freeIn(countdown)}</p>
        ) : (
          queueLine && <p className="title-3 text-ink">{queueLine}</p>
        )}
        <p className="body-6 text-ink-soft">{chatLocked ? t.inChatBody : t.waitlistBody}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onJoinWaitlist} disabled={chatLocked || starting} className={primaryButton}>
            {t.joinWaitlist}
          </button>
          <button type="button" onClick={onClose} className={secondaryButton}>
            {t.notNow}
          </button>
        </div>
      </>
    );
  } else if (dialog?.kind === "away") {
    title = dialog.reason === "busy" ? t.busyTitle(a.name) : t.offlineTitle(a.name);
    body = (
      <p className="body-6 text-ink-soft">
        {t.awayBody}
        {dialog.reason === "offline" && next ? t.mayBeAvailable(next) : ""}
      </p>
    );
  } else if (dialog?.kind === "chatOff") {
    title = t.chatOff;
    body = (
      <p className="body-6 text-ink-soft">
        <WithName text={t.chatOffBody(a.name)} name={a.name} />
      </p>
    );
  } else if (dialog?.kind === "removed") {
    title = t.removedTitle;
    const at = removedUntil
      ? new Intl.DateTimeFormat(INTL_LOCALE[locale], { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(removedUntil))
      : null;
    body = (
      <p className="body-6 text-ink-soft">
        {t.removedBody}
        {at ? t.removedUntil(at) : t.removedLater}
      </p>
    );
  } else if (dialog?.kind === "freeChatInUse") {
    title = t.freeChatInUseTitle;
    body = (
      <>
        <p className="body-6 text-ink-soft">{t.freeChatInUseBody}</p>
        <Link href="/chat" className={`${secondaryButton} w-fit`}>
          {t.openMyChats}
        </Link>
      </>
    );
  }

  return (
    <Dialog open={!!dialog} onClose={onClose} title={<WithName text={title} name={a.name} />}>
      {body}
      {showAlternatives && <OnlineAlternatives exclude={a} onPick={onClose} />}
      {(kind === "away" || kind === "chatOff" || kind === "removed") && (
        <button type="button" onClick={onClose} className={`${quietButton} self-end`}>
          {t.close}
        </button>
      )}
    </Dialog>
  );
}

/** Who can be chatted with right now, same expertise first (the app's "online now" strip in its sheets). */
function OnlineAlternatives({ exclude, onPick }: { exclude: AstrologerCard; onPick: () => void }) {
  const t = useT(text);
  const [list, setList] = useState<AstrologerCard[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    listAstrologers(controller.signal).then(
      (all) => {
        const wanted = new Set(exclude.expertise.map((e) => e.toLowerCase()));
        const online = all.filter((x) => x.id !== exclude.id && x.status === "online" && !x.chatOff);
        const score = (x: AstrologerCard) => x.expertise.filter((e) => wanted.has(e.toLowerCase())).length;
        setList(online.sort((x, y) => score(y) - score(x) || (y.rating ?? 0) - (x.rating ?? 0)).slice(0, 4));
      },
      () => setList([]),
    );
    return () => controller.abort();
  }, [exclude.id, exclude.expertise]);

  if (list === null) return <div aria-hidden className="h-24 animate-pulse rounded-2xl bg-surface-sunken" />;
  if (!list.length) return <p className="caption-2 text-ink-soft">{t.noneOnline}</p>;

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <h3 className="title-4 text-ink">{t.onlineNow}</h3>
      <ul className="flex flex-col gap-1">
        {list.map((x) => (
          <li key={x.id}>
            <Link
              href={`/astrologers/${x.id}`}
              onClick={onPick}
              className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-surface-sunken active:scale-98"
            >
              <AstrologerAvatar name={x.name} photo={x.photo} size={40} availability={x.availability} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span lang={contentLang(x.name)} className="title-4 truncate capitalize text-ink">
                  {x.name}
                </span>
                <span lang={contentLang(x.expertise.join(" "))} className="caption-5 truncate text-ink-muted">
                  {x.expertise.slice(0, 2).join(", ")}
                </span>
              </span>
              <span className="caption-4 shrink-0 text-ink">{x.chat.price === 0 ? t.free : t.perMin(rupees(x.chat.price))}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
