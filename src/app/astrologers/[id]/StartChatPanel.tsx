"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PiChatCircleDots, PiHourglassMedium, PiSignIn, PiWallet } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import AstrologerAvatar from "@/components/consult/AstrologerAvatar";
import AvailabilityBadge from "@/components/consult/AvailabilityBadge";
import Dialog, { primaryButton, quietButton, secondaryButton } from "@/components/consult/Dialog";
import { listAstrologers } from "@/lib/services/astrologers";
import { formatNextAvailable, rupees, type AstrologerCard } from "@/lib/services/astrologerModel";
import {
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
        else setNotice({ tone: "error", text: error instanceof Error && error.message ? error.message : "चैट शुरू नहीं हो सकी। कृपया फिर से कोशिश करें।" });
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
      setNotice({ tone: "error", text: "चैट की कीमत लोड नहीं हो सकी। कृपया फिर से कोशिश करें।" });
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

  const next = formatNextAvailable(a.nextAvailableAt);
  const queueLine = queue
    ? queue.length === 0
      ? "कोई इंतज़ार में नहीं है, अगला नंबर आपका होगा।"
      : `${queue.length} लोग इंतज़ार में${waitMinutes(queue.estimatedWaitMs) ? ` · लगभग ${waitMinutes(queue.estimatedWaitMs)} मिनट` : ""}`
    : null;

  let label = "चैट शुरू करें";
  if (blocked) label = a.status === "live" ? "अभी व्यस्त" : "अभी ऑफ़लाइन";
  else if (removedLock) label = `${formatClock((removedUntil! - now) / 1000)} में फिर से`;
  else if (a.chatOff) label = "चैट अभी बंद है";
  else if (chatLocked) label = `${formatClock((busyUntil! - now) / 1000)} में उपलब्ध`;
  else if (isBusy) label = "वेटलिस्ट देखें";
  else if (starting) label = "शुरू हो रही है…";

  return (
    <section aria-labelledby="chat-panel-title" className="flex flex-col gap-4 rounded-3xl border border-line bg-surface-card p-6">
      <h2 id="chat-panel-title" className="sr-only">
        {a.name} से चैट
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AvailabilityBadge availability={a.availability} />
        {a.availability === "offline" && next && <span className="caption-5 text-ink-muted">उपलब्ध {next}</span>}
        {isBusy && queueLine && <span className="caption-5 text-ink-muted">{queueLine}</span>}
      </div>

      <p className="flex items-baseline gap-2">
        {free || a.chat.price === 0 ? (
          <span className="heading-5 text-success">मुफ़्त</span>
        ) : (
          <>
            <span className="heading-5 text-ink">{rupees(a.chat.price)}</span>
            <span className="body-6 text-ink-soft">प्रति मिनट</span>
            {a.chat.hasOffer && (
              <span className="caption-5 text-ink-muted">
                <s>{rupees(a.chat.rate)}</s> · {a.offerPercent}% छूट
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
        <Link href={`/login?next=${encodeURIComponent(`/astrologers/${a.id}`)}`} className={`${primaryButton} w-full`}>
          <PiSignIn className="h-5 w-5" aria-hidden />
          चैट के लिए लॉगिन करें
        </Link>
      )}

      {notice && (
        <p role={notice.tone === "error" ? "alert" : "status"} className={`caption-2 rounded-xl px-3 py-2 ${notice.tone === "error" ? "bg-danger-soft text-danger" : "bg-surface-sunken text-ink"}`}>
          {notice.text}
        </p>
      )}

      <ul className="caption-5 flex list-disc flex-col gap-1 pl-4 text-ink-soft">
        <li>समय तभी शुरू होता है जब {a.name} पहला जवाब देते हैं।</li>
        <li>5 मिनट में सेशन शुरू न हो तो पूरे पॉइंट्स वापस।</li>
        <li>चैट जल्दी खत्म करें तो बचे समय के पॉइंट्स वापस।</li>
      </ul>

      {signedIn && balance && (
        <p className="caption-2 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-ink-soft">
          <span className="inline-flex items-center gap-2">
            <PiWallet className="h-4 w-4" aria-hidden />
            Wallet: {rupees(balance.points_balance)}
          </span>
          <Link href={rechargeHref()} className="button-sm rounded-full px-2 py-1 text-brand-strong underline-offset-4 transition hover:underline">
            रिचार्ज करें
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
  const kind = dialog?.kind ?? null;
  const showAlternatives = kind === "busy" || kind === "away" || kind === "chatOff";
  const next = formatNextAvailable(a.nextAvailableAt);

  let title = "";
  let body: React.ReactNode = null;

  if (dialog?.kind === "confirm") {
    const p = dialog.pricing;
    title = `${a.name} से चैट करें`;
    body = (
      <>
        <p className="title-2 text-ink">
          {rupees(p.blockPoints)} में {p.blockMinutes} मिनट <span className="body-6 text-ink-soft">({rupees(p.ratePerMin)}/मिनट)</span>
        </p>
        <ul className="body-6 flex list-disc flex-col gap-2 pl-4 text-ink-soft">
          <li>बिलिंग तभी शुरू होगी जब {a.name} बातचीत से जुड़ेंगे, इसलिए इंतज़ार के समय का कोई शुल्क नहीं लगता।</li>
          <li>अगर 5 मिनट में सेशन शुरू नहीं होता, तो पूरे पॉइंट्स आपके wallet में वापस आ जाएंगे।</li>
          <li>आप कभी भी {p.blockMinutes} मिनट और बढ़ा सकते हैं।</li>
          <li>{a.name} के साथ पहले से चैट चल रही है? वह बिना किसी अतिरिक्त शुल्क के जारी रहेगी।</li>
        </ul>
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className={secondaryButton}>
            रद्द करें
          </button>
          <button type="button" onClick={onConfirm} disabled={starting} className={primaryButton}>
            {starting ? "शुरू हो रही है…" : `चैट शुरू करें · ${rupees(p.blockPoints)}`}
          </button>
        </div>
      </>
    );
  } else if (dialog?.kind === "lowBalance") {
    title = "पॉइंट्स कम हैं";
    const { need, balance } = dialog;
    body = (
      <>
        <p className="body-6 text-ink-soft">
          {need != null && balance != null && need > balance
            ? `इस चैट के लिए ${need} पॉइंट्स चाहिए, आपके पास ${Math.floor(balance)} हैं। आगे बढ़ने के लिए ${Math.ceil(need - balance)} पॉइंट्स और जोड़ें।`
            : "इसके लिए आपके पास पर्याप्त पॉइंट्स नहीं हैं। आगे बढ़ने के लिए wallet रिचार्ज करें।"}
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className={secondaryButton}>
            रद्द करें
          </button>
          <Link href={rechargeHref(need != null && balance != null ? need - balance : undefined)} className={primaryButton}>
            <PiWallet className="h-5 w-5" aria-hidden />
            Wallet रिचार्ज करें
          </Link>
        </div>
      </>
    );
  } else if (dialog?.kind === "busy") {
    title = chatLocked ? `${a.name} अभी चैट में हैं` : `${a.name} अभी सत्र में हैं`;
    body = (
      <>
        {chatLocked && countdown ? (
          <p className="title-2 tabular-nums text-ink">{countdown} में फ़्री</p>
        ) : (
          queueLine && <p className="title-3 text-ink">{queueLine}</p>
        )}
        <p className="body-6 text-ink-soft">
          {chatLocked
            ? "यह चैट ख़त्म होते ही नई चैट शुरू हो सकेगी। तब तक नीचे अभी ऑनलाइन ज्योतिषी देखें।"
            : "वे फ़्री होते ही आपकी चैट शुरू होगी, और लाइन में रहते हुए भी आप अपने सवाल लिख सकते हैं। शुरू होने से पहले कभी भी लाइन छोड़ें, पूरा रिफ़ंड मिलेगा।"}
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onJoinWaitlist} disabled={chatLocked || starting} className={primaryButton}>
            वेटलिस्ट में जुड़ें
          </button>
          <button type="button" onClick={onClose} className={secondaryButton}>
            अभी नहीं
          </button>
        </div>
      </>
    );
  } else if (dialog?.kind === "away") {
    title = dialog.reason === "busy" ? `${a.name} अभी व्यस्त हैं` : `${a.name} अभी ऑफ़लाइन हैं`;
    body = (
      <p className="body-6 text-ink-soft">
        यह ज्योतिषी अभी उपलब्ध नहीं हैं, इसलिए अभी चैट बुक नहीं हो सकती। कोई पैसा नहीं कटा।
        {dialog.reason === "offline" && next ? ` ये ${next} से उपलब्ध हो सकते हैं।` : ""}
      </p>
    );
  } else if (dialog?.kind === "chatOff") {
    title = "चैट अभी बंद है";
    body = <p className="body-6 text-ink-soft">{a.name} ऑनलाइन हैं, पर अभी चैट नहीं ले रहे। थोड़ी देर बाद देखें। कोई पैसा नहीं कटा।</p>;
  } else if (dialog?.kind === "removed") {
    title = "अभी आपके लिए उपलब्ध नहीं";
    const at = removedUntil
      ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(removedUntil))
      : null;
    body = (
      <p className="body-6 text-ink-soft">
        आपको इस ज्योतिषी की प्रतीक्षा सूची से हटाया गया है।{at ? ` आप ${at} के बाद फिर से जुड़ सकते हैं।` : " थोड़ी देर बाद फिर से कोशिश करें।"}
      </p>
    );
  } else if (dialog?.kind === "freeChatInUse") {
    title = "फ्री चैट पहले से खुली है";
    body = (
      <>
        <p className="body-6 text-ink-soft">आपकी फ्री चैट किसी दूसरे ज्योतिषी के साथ पहले से खुली है। पहले उसे पूरा करें, या पेड चैट शुरू करें। कोई पैसा नहीं कटा।</p>
        <Link href="/chat" className={`${secondaryButton} w-fit`}>
          मेरी चैट खोलें
        </Link>
      </>
    );
  }

  return (
    <Dialog open={!!dialog} onClose={onClose} title={title}>
      {body}
      {showAlternatives && <OnlineAlternatives exclude={a} onPick={onClose} />}
      {(kind === "away" || kind === "chatOff" || kind === "removed") && (
        <button type="button" onClick={onClose} className={`${quietButton} self-end`}>
          बंद करें
        </button>
      )}
    </Dialog>
  );
}

/** Who can be chatted with right now, same expertise first (the app's "online now" strip in its sheets). */
function OnlineAlternatives({ exclude, onPick }: { exclude: AstrologerCard; onPick: () => void }) {
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
  if (!list.length) return <p className="caption-2 text-ink-soft">अभी कोई और ज्योतिषी ऑनलाइन नहीं है।</p>;

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <h3 className="title-4 text-ink">अभी ऑनलाइन · तुरंत चैट करें</h3>
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
                <span className="title-4 truncate capitalize text-ink">{x.name}</span>
                <span className="caption-5 truncate text-ink-muted">{x.expertise.slice(0, 2).join(", ")}</span>
              </span>
              <span className="caption-4 shrink-0 text-ink">{x.chat.price === 0 ? "मुफ़्त" : `${rupees(x.chat.price)}/मिनट`}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
