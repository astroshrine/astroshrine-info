"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PiArrowLeft, PiArrowClockwise, PiHourglassMedium, PiPause, PiPlanet, PiPlus, PiStop, PiUsersThree, PiX } from "react-icons/pi";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import AstrologerAvatar from "@/components/consult/AstrologerAvatar";
import Dialog, { primaryButton, quietButton, secondaryButton } from "@/components/consult/Dialog";
import { useAstrologerStatus } from "@/components/consult/useAstrologerStatus";
import WithName from "@/components/consult/WithName";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { localizeHref } from "@/i18n/paths";
import { getAstrologerProfile } from "@/lib/services/astrologers";
import { ASTROLOGER_TEXT, contentLang, rupees, withStatus, type AstrologerProfile } from "@/lib/services/astrologerModel";
import {
  codeOf,
  endChat,
  extendChat,
  findSession,
  formatClock,
  getOpenPackWith,
  getPackStatus,
  getQueueSpot,
  isPackOpen,
  leaveQueue,
  listLatestMessages,
  listMessagesBefore,
  listMessagesSince,
  lowBalanceInfo,
  markSeen,
  mergeMessages,
  packEnded,
  packFields,
  rechargeHref,
  secondsLeft,
  sendImage,
  sendText,
  sendTyping,
  statusOfError,
  toMessage,
  type ChatMessage,
  type ChatSession,
  type PackState,
} from "@/lib/services/chat";
import { globalChannel, isRealtimeOpen, sessionChannel } from "@/lib/services/realtime";
import { useRealtimeAccount, useRealtimeChannel, useRealtimeOpen } from "@/lib/services/useRealtime";
import Composer from "./Composer";
import MessageList from "./MessageList";
import RateAstrologer from "./RateAstrologer";

type Sheet = "ask" | "over" | "free" | "freeDone" | "freeChatOver" | "noPoints" | "end" | "leave";
type Notice = { tone: "info" | "error"; text: string };
type Payload = Record<string, unknown>;

const text = defineMessages({
  hi: {
    astrologer: "ज्योतिषी",
    sendErrors: {
      contact: "फ़ोन नंबर या दूसरी संपर्क जानकारी भेजना मना है।",
      noPack: "इस ज्योतिषी से अभी कोई चालू चैट नहीं है।",
      timeOver: "समय पूरा हो गया। चैट बढ़ाने के बाद भेजें।",
      tooLarge: "तस्वीर बहुत बड़ी है।",
      other: "नहीं भेजा जा सका।",
    },
    loading: "चैट लोड हो रही है",
    // Notices and closing lines
    paused: (name: string) => `${name} ने चैट छोड़ी है, समय रुका है। उनके लौटते ही फिर चलेगा।`,
    resumed: (name: string) => `${name} लौट आए, समय फिर से चल रहा है।`,
    started: (minutes: number) => `सत्र शुरू: घड़ी में ${minutes} मिनट।`,
    extended: (minutes: number) => `चैट ${minutes} मिनट बढ़ा दी गई।`,
    removedFromLine: (name: string) => `${name} ने आपको लाइन से हटाया है। आपके पॉइंट्स वापस कर दिए गए हैं।`,
    noReply: (name: string, points: number) =>
      `${name} ने 5 मिनट में जवाब नहीं दिया। ${points > 0 ? `${points} पॉइंट्स आपके wallet में वापस आ गए हैं।` : "इस चैट के पॉइंट्स वापस आ गए हैं।"} अभी ऑनलाइन किसी दूसरे ज्योतिषी को चुनें।`,
    notBegun: (points: number) => `इस बार सेशन शुरू नहीं हो सका। पूरे ${points} पॉइंट्स आपके wallet में वापस आ गए हैं।`,
    endedWithRefund: (points: number) => `चैट समाप्त हुई। बचे हुए समय के ${points} पॉइंट्स आपके wallet में वापस आ गए हैं।`,
    endedByAstrologer: (name: string) => `${name} ने चैट समाप्त कर दी।`,
    ended: "चैट समाप्त हो गई।",
    lowBalance: (minutes: number) => `Wallet में लगभग ${minutes} मिनट के पॉइंट्स बचे हैं।`,
    declined: (name: string) => `${name} ने अनुरोध स्वीकार नहीं किया। कोई पॉइंट नहीं कटे।`,
    extendFailed: "चैट नहीं बढ़ सकी। कोई पॉइंट नहीं कटे।",
    nowFree: (name: string) => `${name} अब फ़्री हैं। सत्र शुरू करने के लिए संदेश भेजें।`,
    sessionComplete: "सत्र पूरा हुआ।",
    noAnswer: (name: string) => `${name} ने जवाब नहीं दिया। कोई पॉइंट नहीं कटे।`,
    olderFailed: "पुराने संदेश लोड नहीं हो सके।",
    requestSent: (name: string, minutes: number) =>
      `अनुरोध भेजा गया। ${name} के स्वीकार करते ही आपके ${minutes} मिनट शुरू होंगे, तभी पॉइंट्स कटेंगे।`,
    extendWindowOver: "बढ़ाने का समय निकल गया। बात जारी रखने के लिए नई चैट शुरू करें।",
    chatOver: "यह चैट समाप्त हो चुकी है। बात जारी रखने के लिए नई चैट शुरू करें।",
    extendRetry: "चैट नहीं बढ़ सकी। कोई पॉइंट नहीं कटे। कृपया फिर से कोशिश करें।",
    endFailed: "चैट समाप्त नहीं हो सकी। कृपया फिर से कोशिश करें।",
    leftLine: (points: number) => `आपने लाइन छोड़ दी। ${points > 0 ? `${points} पॉइंट्स` : "आपके पॉइंट्स"} वापस कर दिए गए हैं।`,
    leaveFailed: "लाइन छोड़ी नहीं जा सकी। कृपया फिर से कोशिश करें।",
    // The room
    signedOutTitle: "यह चैट देखने के लिए लॉगिन करें",
    signedOutBody: "ऐप वाले मोबाइल नंबर से लॉगिन करें। बातचीत, समय और wallet वही रहेंगे जो ऐप में हैं।",
    logIn: "लॉगिन करें",
    seeAstrologers: "ज्योतिषी देखें",
    loadFailed: "यह चैट अभी लोड नहीं हो सकी।",
    checkConnection: "इंटरनेट कनेक्शन देखें और फिर से कोशिश करें।",
    retry: "फिर से कोशिश करें",
    typing: "लिख रहे हैं…",
    chatWith: (name: string) => `${name} के साथ चैट`,
    allChats: "सभी चैट",
    timeLeft: (clock: string) => `बचा समय ${clock}`,
    startsOnReply: (clock: string) => `${clock}, पहले जवाब पर शुरू होगा`,
    extend: "बढ़ाएं",
    endChat: "चैट समाप्त करें",
    end: "समाप्त",
    dismiss: "सूचना बंद करें",
    inLine: (name: string, position: number, minutes: number | null) =>
      `आप ${name} की लाइन में ${position} नंबर पर हैं${minutes ? ` · लगभग ${minutes} मिनट` : ""}। अपने सवाल अभी लिख सकते हैं।`,
    startsWhenFree: (name: string) => `${name} के फ़्री होते ही आपकी चैट शुरू होगी। अपने सवाल अभी लिख सकते हैं।`,
    leaveLine: "लाइन छोड़ें",
    clockStartsOnReply: (name: string) =>
      `${name} के पहले जवाब से समय शुरू होगा। 5 मिनट में सेशन शुरू न हो तो पूरे पॉइंट्स वापस आ जाएंगे।`,
    away: (name: string, minutes: number) =>
      `${name} कुछ देर से जवाब नहीं दे रहे। ${minutes} मिनट में वे न लौटे तो चैट अपने आप समाप्त हो जाएगी।`,
    extendPending: (name: string) => `चैट बढ़ाने का अनुरोध भेजा गया है। ${name} के जवाब का इंतज़ार…`,
    saveBirth: "ज्योतिषी आपकी कुंडली देख सकें, इसके लिए जन्म विवरण सेव करें।",
    makeKundli: "कुंडली बनाएं",
    firstQuestion: "अपना पहला सवाल लिखें। ज्योतिषी के जवाब देते ही समय शुरू होगा।",
    noChatYet: (name: string) => `अभी ${name} से आपकी कोई चैट नहीं है।`,
    underAMinute: "1 मिनट से कम समय बचा है।",
    extending: "बढ़ रही है…",
    extendFor: (minutes: number, points: string) => `${points} में ${minutes} मिनट बढ़ाएं`,
    waitingPlaceholder: "अपना सवाल लिखें, बारी आने पर ज्योतिषी जवाब देंगे",
    placeholder: "संदेश लिखें",
    timeUp: "समय पूरा हुआ।",
    addMore: (minutes: number) => `${minutes} मिनट और जोड़ें`,
    chatEnded: "यह चैट समाप्त हो चुकी है।",
    startToTalk: (name: string) => `${name} से बात करने के लिए चैट शुरू करें।`,
    startNewChat: "नई चैट शुरू करें",
    startChat: "चैट शुरू करें",
    otherAstrologers: "दूसरे ज्योतिषी देखें",
    // Dialogs
    yourWallet: (amount: string) => `आपका wallet: ${amount}`,
    rechargeWallet: "Wallet रिचार्ज करें",
    notNow: "अभी नहीं",
    extendTitle: "चैट बढ़ाएं",
    moreMinutesFor: (minutes: number, points: string) => `${points} में ${minutes} मिनट और`,
    freeChatOverTitle: "आपकी फ्री चैट पूरी हुई",
    timeUpTitle: "समय पूरा हुआ",
    requestBody: (minutes: number, name: string, points: string, normalPrice: boolean) =>
      `${minutes} मिनट और जोड़ने का अनुरोध ${name} को जाएगा। वे स्वीकार करें तभी ${points} कटेंगे${normalPrice ? " (सामान्य कीमत)" : ""}।`,
    sending: "भेजा जा रहा है…",
    sendRequest: "अनुरोध भेजें",
    freeMoreTitle: (minutes: number) => `मुफ़्त में ${minutes} मिनट और`,
    freeMoreBody: "यह मुफ़्त चैट एक बार और बढ़ाई जा सकती है।",
    freeDoneTitle: "मुफ़्त चैट पूरी हुई",
    freeDoneBody: "मुफ़्त चैट एक ही बार बढ़ सकती है। बात जारी रखने के लिए नई चैट शुरू करें।",
    close: "बंद करें",
    noPointsTitle: "पॉइंट्स कम हैं",
    noPointsBody: (points: string, wallet: string | null) =>
      `चैट बढ़ाने के लिए ${points} चाहिए${wallet ? `, आपके wallet में ${wallet} हैं` : ""}। कोई पॉइंट नहीं कटे।`,
    endTitle: "चैट समाप्त करें?",
    endRefundUnused: "बचे हुए समय के पॉइंट्स आपके wallet में वापस आ जाएंगे।",
    endRefundAll: (name: string) => `${name} ने अभी जवाब नहीं दिया है, इसलिए पूरे पॉइंट्स वापस आ जाएंगे।`,
    keepChatting: "चैट जारी रखें",
    ending: "समाप्त हो रही है…",
    endConfirm: "समाप्त करें",
    leaveTitle: "लाइन छोड़ें?",
    leaveBody: "चैट अभी शुरू नहीं हुई है, इसलिए पूरे पॉइंट्स आपके wallet में वापस आ जाएंगे।",
    stayInLine: "लाइन में रहें",
    leaving: "छोड़ी जा रही है…",
  },
  en: {
    astrologer: "Astrologer",
    sendErrors: {
      contact: "Phone numbers and other contact details cannot be sent.",
      noPack: "You have no active chat with this astrologer right now.",
      timeOver: "Time is up. Extend the chat, then send.",
      tooLarge: "This photo is too large.",
      other: "Not sent.",
    },
    loading: "Loading chat",
    paused: (name) => `${name} has left the chat, so the clock is paused. It runs again when they are back.`,
    resumed: (name) => `${name} is back and the clock is running again.`,
    started: (minutes) => `Session started: ${minutes} minutes on the clock.`,
    extended: (minutes) => `Chat extended by ${minutes} minutes.`,
    removedFromLine: (name) => `${name} removed you from the line. Your points have been refunded.`,
    noReply: (name, points) =>
      `${name} did not reply within 5 minutes. ${
        points > 0 ? `${points === 1 ? "1 point is" : `${points} points are`} back in your wallet.` : "The points for this chat are back in your wallet."
      } Pick another astrologer who is online now.`,
    notBegun: (points) =>
      `The session could not begin this time. ${points === 1 ? "1 point is" : `All ${points} points are`} back in your wallet.`,
    endedWithRefund: (points) =>
      `Chat ended. ${points === 1 ? "1 point for the unused time is" : `${points} points for the unused time are`} back in your wallet.`,
    endedByAstrologer: (name) => `${name} ended the chat.`,
    ended: "The chat has ended.",
    lowBalance: (minutes) => `Your wallet has points for about ${minutes} more ${minutes === 1 ? "minute" : "minutes"}.`,
    declined: (name) => `${name} declined the request. No points were deducted.`,
    extendFailed: "The chat could not be extended. No points were deducted.",
    nowFree: (name) => `${name} is free now. Send a message to start your session.`,
    sessionComplete: "Session complete.",
    noAnswer: (name) => `${name} did not respond. No points were deducted.`,
    olderFailed: "Older messages could not be loaded. Please try again.",
    requestSent: (name, minutes) => `Request sent. Your ${minutes} minutes start when ${name} accepts, and points are deducted only then.`,
    extendWindowOver: "The time to extend has passed. Start a new chat to continue.",
    chatOver: "This chat has ended. Start a new chat to continue.",
    extendRetry: "The chat could not be extended. No points were deducted. Please try again.",
    endFailed: "The chat could not be ended. Please try again.",
    leftLine: (points) =>
      `You left the line. ${points > 0 ? (points === 1 ? "1 point has" : `${points} points have`) : "Your points have"} been refunded.`,
    leaveFailed: "You could not leave the line. Please try again.",
    signedOutTitle: "Log in to see this chat",
    signedOutBody: "Log in with the mobile number you use on the app. Your conversations, time and wallet are the same as on the app.",
    logIn: "Log in",
    seeAstrologers: "See astrologers",
    loadFailed: "This chat could not be loaded.",
    checkConnection: "Check your internet connection and try again.",
    retry: "Try again",
    typing: "Typing…",
    chatWith: (name) => `Chat with ${name}`,
    allChats: "All chats",
    timeLeft: (clock) => `${clock} left`,
    startsOnReply: (clock) => `${clock}, starts with the first reply`,
    extend: "Extend",
    endChat: "End chat",
    end: "End",
    dismiss: "Dismiss notice",
    inLine: (name, position, minutes) =>
      `You are number ${position} in line for ${name}${minutes ? ` · about ${minutes} min` : ""}. You can write your questions now.`,
    startsWhenFree: (name) => `Your chat starts as soon as ${name} is free. You can write your questions now.`,
    leaveLine: "Leave line",
    clockStartsOnReply: (name) =>
      `The clock starts with ${name}'s first reply. If the session does not start within 5 minutes, all your points come back.`,
    away: (name, minutes) =>
      `${name} has not replied for a while. If they are not back within ${minutes} ${minutes === 1 ? "minute" : "minutes"}, the chat ends on its own.`,
    extendPending: (name) => `Your request to extend the chat has been sent. Waiting for ${name} to answer…`,
    saveBirth: "Save your birth details so the astrologer can see your Kundli.",
    makeKundli: "Make a Kundli",
    firstQuestion: "Write your first question. The clock starts when the astrologer replies.",
    noChatYet: (name) => `You have no chat with ${name} yet.`,
    underAMinute: "Less than 1 minute left.",
    extending: "Extending…",
    extendFor: (minutes, points) => `Extend ${minutes} min for ${points}`,
    waitingPlaceholder: "Write your question while you wait",
    placeholder: "Write a message",
    timeUp: "Time is up.",
    addMore: (minutes) => `Add ${minutes} more minutes`,
    chatEnded: "This chat has ended.",
    startToTalk: (name) => `Start a chat to talk with ${name}.`,
    startNewChat: "Start a new chat",
    startChat: "Start chat",
    otherAstrologers: "See other astrologers",
    yourWallet: (amount) => `Your wallet: ${amount}`,
    rechargeWallet: "Recharge wallet",
    notNow: "Not now",
    extendTitle: "Extend chat",
    moreMinutesFor: (minutes, points) => `${minutes} more minutes for ${points}`,
    freeChatOverTitle: "Your free chat is over",
    timeUpTitle: "Time is up",
    requestBody: (minutes, name, points, normalPrice) =>
      `A request for ${minutes} more minutes goes to ${name}. ${points}${normalPrice ? " (the normal price)" : ""} is deducted only if they accept.`,
    sending: "Sending…",
    sendRequest: "Send request",
    freeMoreTitle: (minutes) => `${minutes} more minutes, free`,
    freeMoreBody: "This free chat can be extended once more.",
    freeDoneTitle: "Free chat complete",
    freeDoneBody: "A free chat can be extended only once. Start a new chat to continue.",
    close: "Close",
    noPointsTitle: "Not enough points",
    noPointsBody: (points, wallet) =>
      `Extending the chat needs ${points}${wallet ? `, and your wallet has ${wallet}` : ""}. No points were deducted.`,
    endTitle: "End the chat?",
    endRefundUnused: "Points for the unused time come back to your wallet.",
    endRefundAll: (name) => `${name} has not replied yet, so all your points come back.`,
    keepChatting: "Keep chatting",
    ending: "Ending…",
    endConfirm: "End chat",
    leaveTitle: "Leave the line?",
    leaveBody: "The chat has not started yet, so all your points come back to your wallet.",
    stayInLine: "Stay in line",
    leaving: "Leaving…",
  },
});

type Text = (typeof text)["hi"];

/** Waiting, or booked before the astrologer's first reply: the app re-reads the pack this often. */
const PACK_POLL_MS = 5_000;
/** Clock running: realtime can be missed (paused, closed), so it is re-read this often too. */
const PACK_SYNC_MS = 15_000;
const QUEUE_POLL_MS = 30_000;
/** Messages are fetched this often only while the realtime socket is down. */
const CATCH_UP_MS = 20_000;
const TYPING_SEND_MS = 3_000;
const TYPING_IDLE_MS = 4_000;
const PEER_TYPING_MS = 6_000;
const PAGE = 50;

const obj = (v: unknown): Payload => (v && typeof v === "object" ? (v as Payload) : {});
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const TICK_RANK: Record<string, number> = { sent: 1, delivered: 2, seen: 3, read: 3 };
const rank = (s?: string) => TICK_RANK[String(s || "sent").toLowerCase()] ?? 1;

/** The pack this conversation runs on: the one in the link if still open, else the open one with this astrologer. */
async function loadPack(astrologerId: string, bookingId: string | null, signal: AbortSignal): Promise<PackState | null> {
  if (bookingId) {
    try {
      const p = await getPackStatus(bookingId, signal);
      if (isPackOpen(p.status)) return p;
      return (await getOpenPackWith(astrologerId, signal)) ?? p;
    } catch (error) {
      if (signal.aborted) throw error;
    }
  }
  return getOpenPackWith(astrologerId, signal);
}

function sendErrorText(error: unknown, t: Text["sendErrors"]): string {
  const code = codeOf(error);
  if (code === "ContactSharingNotAllowed") return t.contact;
  if (code === "NoActiveChatPack") return t.noPack;
  if (code === "ChatTimeOver") return t.timeOver;
  if (statusOfError(error) === 413) return t.tooLarge;
  return t.other;
}

export function ChatRoomSkeleton() {
  const t = useT(text);
  return (
    <div aria-busy="true" aria-label={t.loading} className="flex h-full min-h-0 flex-col gap-3 rounded-3xl border border-line bg-surface-card p-4">
      <div className="h-12 animate-pulse rounded-2xl bg-surface-sunken" />
      {["w-1/2", "ml-auto w-2/5", "w-2/3", "ml-auto w-1/3", "w-1/2"].map((w, i) => (
        <div key={i} className={`h-10 animate-pulse rounded-2xl bg-surface-sunken ${w}`} />
      ))}
      <div className="mt-auto h-12 animate-pulse rounded-2xl bg-surface-sunken" />
    </div>
  );
}

export default function ChatRoom({ astrologerId, bookingId }: { astrologerId: string; bookingId: string | null }) {
  const { status: authStatus, session, user, balance, refresh } = useAuth();
  const t = useT(text);
  const labels = useT(ASTROLOGER_TEXT);
  const locale = useLocale();
  const selfId = session?.user.id ?? null;
  useRealtimeAccount(selfId);
  const realtimeOpen = useRealtimeOpen();

  const [astro, setAstro] = useState<AstrologerProfile | null>(null);
  const [chat, setChat] = useState<ChatSession | null | undefined>(undefined);
  const [pack, setPack] = useState<PackState | null | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [peerTyping, setPeerTyping] = useState(false);
  const [awayMins, setAwayMins] = useState<number | null>(null);
  const [closedText, setClosedText] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [lowTime, setLowTime] = useState(false);
  const [extending, setExtending] = useState(false);
  const [extendPendingUntil, setExtendPendingUntil] = useState<number | null>(null);
  const [acting, setActing] = useState(false);
  const [clockOffset, setClockOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [visibleAt, setVisibleAt] = useState(0);

  // Latest values for timers and realtime callbacks.
  const packRef = useRef(pack);
  const offsetRef = useRef(clockOffset);
  const messagesRef = useRef(messages);
  const chatRef = useRef(chat);
  useEffect(() => {
    packRef.current = pack;
    offsetRef.current = clockOffset;
    messagesRef.current = messages;
    chatRef.current = chat;
  });
  const lowWarned = useRef(false);
  const overPrompted = useRef(false);
  const endAnnounced = useRef(false);
  const seenSent = useRef(new Set<string>());
  const typing = useRef<{ on: boolean; at: number; idle?: ReturnType<typeof setTimeout> }>({ on: false, at: 0 });
  const peerTypingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const awayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const catchUpTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const liveStatus = useAstrologerStatus(astrologerId, authStatus === "signedIn");
  const astrologer = useMemo(() => (astro ? withStatus(astro, liveStatus) : null), [astro, liveStatus]);
  const name = astrologer?.name ?? t.astrologer;
  const chatId = chat?.id ?? null;

  // ── Load: the astrologer, the conversation and its messages, and the pack ──────────────────────
  useEffect(() => {
    if (!selfId) return;
    const controller = new AbortController();
    const { signal } = controller;
    getAstrologerProfile(astrologerId, { signal }).then(setAstro, () => undefined);
    findSession(selfId, astrologerId, signal)
      .then(async (s) => {
        if (signal.aborted) return;
        setChat(s);
        if (!s) return setMessagesLoaded(true);
        const list = await listLatestMessages(s.id, signal);
        setMessages(list);
        setHasOlder(list.length >= PAGE);
        setMessagesLoaded(true);
      })
      .catch(() => {
        if (!signal.aborted) setLoadFailed(true);
      });
    loadPack(astrologerId, bookingId, signal).then(setPack, () => {
      if (!signal.aborted) setPack(null);
    });
    return () => controller.abort();
  }, [selfId, astrologerId, bookingId, reloadKey]);

  // ── Shared reactions ──────────────────────────────────────────────────────────────────────────
  const catchUp = () => {
    const id = chatRef.current?.id;
    if (!id) return;
    const newest = [...messagesRef.current].reverse().find((m) => m.messageId)?.sentTs ?? 0;
    listMessagesSince(id, newest).then(
      (fresh) => fresh.length && setMessages((prev) => mergeMessages(prev, fresh)),
      () => undefined,
    );
  };
  const scheduleCatchUp = () => {
    clearTimeout(catchUpTimer.current);
    catchUpTimer.current = setTimeout(catchUp, 1500);
  };

  const refreshQueue = () => {
    const p = packRef.current;
    if (p?.status !== "WAITING" || !p.bookingId) return;
    const id = p.bookingId;
    getQueueSpot(id).then(
      (q) =>
        setPack((prev) =>
          prev && prev.bookingId === id ? { ...prev, queuePosition: q.position, queueLength: q.length, queueWaitMs: q.estimatedWaitMs, queueWaitAt: Date.now() } : prev,
        ),
      () => undefined,
    );
  };

  /** Ask for more time: 1 minute before the end (inline), and when it is over (a dialog). Once each. */
  const promptOver = () => {
    const p = packRef.current;
    if (!p?.timeBased || overPrompted.current) return;
    overPrompted.current = true;
    if (p.freeChat) return setSheet("freeChatOver");
    if (p.free) {
      const blockSec = (p.blockMinutes || 5) * 60;
      return setSheet((p.secondsAllowed || 0) >= blockSec * 2 ? "freeDone" : "free");
    }
    setSheet("over");
  };

  const applyClock = (d: Payload) => {
    if (typeof d.secondsAllowed !== "number") return;
    const serverNow = num(d.serverNow);
    if (serverNow) setClockOffset(serverNow - Date.now());
    endAnnounced.current = false;
    lowWarned.current = false;
    overPrompted.current = false;
    setLowTime(false);
    setExtendPendingUntil(null);
    setClosedText(null);
    setSheet((s) => (s === "over" || s === "free" || s === "freeChatOver" || s === "noPoints" ? null : s));
    setPack((prev) => ({
      ...(prev ?? { bookingId: "" }),
      ...packFields(d),
      bookingId: str(d.bookingId) || prev?.bookingId || "",
      status: "IN_PROGRESS",
      timeBased: true,
      freeChat: d.freeChat === true,
      paused: d.paused === true,
    }));
    const mins = num(d.blockMinutes) ?? 5;
    if (d.reason === "paused") setNotice({ tone: "info", text: t.paused(name) });
    else if (d.reason === "resumed") setNotice({ tone: "info", text: t.resumed(name) });
    else if (d.reason === "started") setNotice({ tone: "info", text: t.started(mins) });
    else if (d.reason === "extended" || d.reason === "revived") setNotice({ tone: "info", text: t.extended(mins) });
  };

  /** The chat or its pack ended (either side, no reply, the line): stop the clock and say what came back. */
  const announceEnd = (d: Payload) => {
    const id = str(d.bookingId);
    setPack((prev) =>
      prev && (!id || !prev.bookingId || id === prev.bookingId)
        ? { ...prev, status: str(d.status) || (packEnded(prev) ? prev.status : "COMPLETED"), expired: true, secondsRemaining: 0 }
        : prev,
    );
    setPeerTyping(false);
    setAwayMins(null);
    setLowTime(false);
    setExtendPendingUntil(null);
    setSheet((s) => (s === "end" || s === "leave" ? s : null));
    if (endAnnounced.current) return;
    endAnnounced.current = true;
    const pts = Math.round(num(d.refundAmount) ?? 0);
    const reason = str(d.reason) ?? "";
    let closing: string;
    if (reason === "REMOVED_BY_ASTROLOGER") closing = t.removedFromLine(name);
    else if (reason === "NO_REPLY_WAIT") closing = t.noReply(name, pts);
    else if (pts > 0 && /^NO_REPLY/.test(reason)) closing = t.notBegun(pts);
    else if (pts > 0) closing = t.endedWithRefund(pts);
    else if (d.endedBy === "astrologer") closing = t.endedByAstrologer(name);
    else closing = t.ended;
    setClosedText(closing);
    void refresh();
  };

  const handlers = useRef({ announceEnd, promptOver, refreshQueue, catchUp });
  useEffect(() => {
    handlers.current = { announceEnd, promptOver, refreshQueue, catchUp };
  });

  // ── Realtime: this conversation ───────────────────────────────────────────────────────────────
  useRealtimeChannel(chatId ? sessionChannel(chatId) : null, (event, raw) => {
    const d = obj(raw);
    switch (event) {
      case "NewMessage": {
        const m = toMessage(d as Parameters<typeof toMessage>[0]);
        if (!m) return;
        setMessages((prev) => mergeMessages(prev, [m]));
        if (m.sentBy !== selfId) setPeerTyping(false);
        return;
      }
      case "Typing": {
        if (d.userId === selfId) return;
        clearTimeout(peerTypingTimer.current);
        const on = d.typing === true;
        setPeerTyping(on);
        if (on) peerTypingTimer.current = setTimeout(() => setPeerTyping(false), PEER_TYPING_MS);
        return;
      }
      case "EditMessage":
        return scheduleCatchUp();
      case "ChatClockChanged":
        return applyClock(d);
      case "ChatLowBalance":
        return setNotice({ tone: "info", text: t.lowBalance(num(d.minutesLeft) ?? 1) });
      case "ChatBalanceOut":
        return setSheet("noPoints");
      case "ChatExtendDeclined": {
        setExtendPendingUntil(null);
        if (d.reason === "InsufficientBalance") return setSheet("noPoints");
        return setNotice({ tone: "info", text: d.reason === "declined" ? t.declined(name) : t.extendFailed });
      }
      case "ChatQuestionCountChanged":
        return setPack((prev) =>
          prev ? { ...prev, questionsAllowed: num(d.questionsAllowed) ?? prev.questionsAllowed, questionsRemaining: num(d.questionsRemaining) ?? prev.questionsRemaining } : prev,
        );
      case "ChatPackActivated": {
        const id = str(d.bookingId);
        setPack((prev) =>
          id && id !== prev?.bookingId
            ? { ...(prev ?? {}), bookingId: id, status: "IN_PROGRESS", expired: false, timerStarted: false, expiresAt: null, secondsRemaining: prev?.secondsAllowed }
            : prev
              ? { ...prev, status: "IN_PROGRESS" }
              : prev,
        );
        endAnnounced.current = false;
        setClosedText(null);
        return setNotice({ tone: "info", text: t.nowFree(name) });
      }
      case "ChatSessionReopened":
        endAnnounced.current = false;
        return setClosedText(null);
      case "AstrologerAway": {
        setAwayMins(Math.max(1, Math.ceil((num(d.endsInMs) ?? 0) / 60_000)));
        clearTimeout(awayTimer.current);
        awayTimer.current = setTimeout(() => setAwayMins(null), 45_000);
        return;
      }
      case "ChatSessionClosed":
      case "ChatPackEnded":
        return announceEnd(d);
      case "ChatSessionEnded": {
        const timeOver = d.reason === "TIME_OVER";
        setPack((prev) =>
          prev
            ? {
                ...prev,
                status: "COMPLETED",
                expired: prev.timeBased ? true : prev.expired,
                secondsRemaining: 0,
                freeChat: timeOver && d.freeChat === true ? true : prev.freeChat,
              }
            : prev,
        );
        setLowTime(false);
        if (timeOver) return promptOver();
        endAnnounced.current = true;
        return setClosedText(t.sessionComplete);
      }
    }
  });

  // ── Realtime: my own channel (ticks, the line, the clock) ─────────────────────────────────────
  useRealtimeChannel(selfId ? globalChannel(selfId) : null, (event, raw) => {
    const d = obj(raw);
    if (event === "MessageDelivered" || event === "MessageDeliveredAck" || event === "MessageSeenAck" || event === "MessageREAD") {
      const messageId = str(d.messageId);
      if (!messageId || str(d.sessionId) !== chatRef.current?.id) return;
      const status = event === "MessageSeenAck" || event === "MessageREAD" ? "seen" : "delivered";
      setMessages((prev) => prev.map((m) => (m.messageId === messageId && rank(status) > rank(m.status) ? { ...m, status } : m)));
    } else if (event === "CHAT_QUEUE_CHANGED") {
      const p = packRef.current;
      if (p?.status !== "WAITING") return;
      const position = num(d.position);
      if (str(d.bookingId) === p.bookingId && position !== undefined)
        setPack((prev) => (prev ? { ...prev, queuePosition: position, queueWaitMs: num(d.estimatedWaitMs) ?? null, queueWaitAt: Date.now() } : prev));
      else refreshQueue();
    } else if (event === "ChatClockChanged") {
      if (str(d.bookingId) && str(d.bookingId) === packRef.current?.bookingId) applyClock(d);
    } else if (event === "NewMessage") {
      if (str(d.sessionId) === chatRef.current?.id) scheduleCatchUp();
    }
  });

  // ── Timers and polling ────────────────────────────────────────────────────────────────────────
  const running = !!pack?.timeBased && !!pack.timerStarted && !pack.paused && isPackOpen(pack.status) && !pack.expired && !closedText;
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const p = packRef.current;
      const left = secondsLeft(p, t + offsetRef.current);
      if (left <= 60 && left > 0 && !lowWarned.current) {
        lowWarned.current = true;
        if (!p?.free && !p?.freeChat) setLowTime(true);
      }
      if (left <= 0) {
        // The server's ChatSessionEnded (TIME_OVER) follows within seconds; ask right away.
        setPack((prev) => (prev && !prev.expired ? { ...prev, expired: true, secondsRemaining: 0 } : prev));
        setLowTime(false);
        handlers.current.promptOver();
      }
    };
    const first = setTimeout(tick, 0);
    const h = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(h);
    };
  }, [running]);

  const packId = pack?.bookingId || null;
  const pending = !!packId && (pack?.status === "WAITING" || (!!pack?.timeBased && pack.status === "IN_PROGRESS" && !pack.timerStarted));
  const pollEvery = pending ? PACK_POLL_MS : running ? PACK_SYNC_MS : 0;
  useEffect(() => {
    if (!pollEvery || !packId) return;
    const h = setInterval(() => {
      getPackStatus(packId).then((fresh) => {
        setPack((prev) => (prev && prev.bookingId === packId ? { ...prev, ...fresh, paused: !!fresh.paused } : prev));
        if (fresh.endReason === "NO_REPLY_WAIT") handlers.current.announceEnd({ bookingId: packId, reason: "NO_REPLY_WAIT" });
        else if (fresh.timeBased && fresh.expired) handlers.current.promptOver();
        else if (fresh.status && !isPackOpen(fresh.status)) handlers.current.announceEnd({ bookingId: packId, status: fresh.status });
      }, () => undefined);
    }, pollEvery);
    return () => clearInterval(h);
  }, [pollEvery, packId]);

  const waiting = pack?.status === "WAITING" && !!packId;
  useEffect(() => {
    if (!waiting) return;
    const first = setTimeout(() => handlers.current.refreshQueue(), 0);
    const h = setInterval(() => handlers.current.refreshQueue(), QUEUE_POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(h);
    };
  }, [waiting]);

  // Messages missed while the socket was down: fetch them when it reconnects, and every 20 s while it is down.
  useEffect(() => {
    if (!chatId || !messagesLoaded) return;
    const first = realtimeOpen ? setTimeout(() => handlers.current.catchUp(), 0) : undefined;
    const h = setInterval(() => {
      if (!isRealtimeOpen()) handlers.current.catchUp();
    }, CATCH_UP_MS);
    return () => {
      clearTimeout(first);
      clearInterval(h);
    };
  }, [chatId, messagesLoaded, realtimeOpen]);

  // An unanswered extend request lapses on the server; say so then.
  useEffect(() => {
    if (!extendPendingUntil) return;
    const h = setTimeout(() => {
      setExtendPendingUntil(null);
      setNotice({ tone: "info", text: t.noAnswer(name) });
    }, Math.max(extendPendingUntil - Date.now(), 0) + 1500);
    return () => clearTimeout(h);
  }, [extendPendingUntil, name, t]);

  // Read receipts for the astrologer's messages, while this tab is on screen.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setVisibleAt(Date.now());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  useEffect(() => {
    if (!chatId || !selfId || document.visibilityState !== "visible") return;
    const ids = messages
      .filter((m) => m.sentBy !== selfId && m.messageId && rank(m.status) < 3 && !seenSent.current.has(m.messageId))
      .map((m) => m.messageId as string);
    if (!ids.length) return;
    ids.forEach((id) => seenSent.current.add(id));
    void markSeen(chatId, ids);
  }, [messages, chatId, selfId, visibleAt]);

  useEffect(
    () => () => {
      clearTimeout(peerTypingTimer.current);
      clearTimeout(awayTimer.current);
      clearTimeout(catchUpTimer.current);
      clearTimeout(typing.current.idle);
    },
    [],
  );

  // ── Actions ───────────────────────────────────────────────────────────────────────────────────
  const onTyping = (on: boolean) => {
    if (!chatId) return;
    const t = typing.current;
    const at = Date.now();
    clearTimeout(t.idle);
    if (on) {
      t.idle = setTimeout(() => {
        if (!t.on) return;
        t.on = false;
        void sendTyping(chatId, false);
      }, TYPING_IDLE_MS);
      if (t.on && at - t.at < TYPING_SEND_MS) return;
      t.on = true;
      t.at = at;
      void sendTyping(chatId, true);
    } else if (t.on) {
      t.on = false;
      t.at = at;
      void sendTyping(chatId, false);
    }
  };

  const newestServerTs = () => [...messagesRef.current].reverse().find((m) => m.messageId)?.sentTs ?? 0;

  const deliver = async (local: ChatMessage, run: () => Promise<ChatMessage[]>) => {
    setMessages((prev) => mergeMessages(prev, [local]));
    try {
      const fresh = await run();
      setMessages((prev) => {
        const merged = mergeMessages(prev, fresh);
        // The server's copy did not come back in this answer: the send still worked.
        return merged.map((m) => (m.key === local.key && m.local ? { ...m, local: undefined, status: "sent", retry: undefined } : m));
      });
    } catch (error) {
      setMessages((prev) => prev.map((m) => (m.key === local.key ? { ...m, local: "failed", error: sendErrorText(error, t.sendErrors) } : m)));
      const code = codeOf(error);
      if (code === "ChatTimeOver") handlers.current.promptOver();
      else if (code === "NoActiveChatPack") getOpenPackWith(astrologerId).then((p) => setPack(p), () => undefined);
      else if (code === "ContactSharingNotAllowed") setMessages((prev) => prev.map((m) => (m.key === local.key ? { ...m, retry: undefined } : m)));
    }
  };

  const onSendText = (text: string) => {
    if (!chatId || !selfId) return;
    const sentTs = Date.now();
    const local: ChatMessage = { key: `${selfId}#${sentTs}`, sentBy: selfId, sentTs, type: "text", message: text, local: "sending", retry: { text } };
    void deliver(local, () => sendText(chatId, selfId, text, sentTs, newestServerTs()));
  };

  const onSendImage = (file: File) => {
    if (!chatId || !selfId) return;
    const sentTs = Date.now();
    const local: ChatMessage = {
      key: `${selfId}#${sentTs}`,
      sentBy: selfId,
      sentTs,
      type: "image",
      message: URL.createObjectURL(file),
      local: "sending",
      retry: { file },
    };
    void deliver(local, () => sendImage(chatId, selfId, file, sentTs, newestServerTs()));
  };

  const onRetry = (m: ChatMessage) => {
    setMessages((prev) => prev.filter((x) => x.key !== m.key));
    if (m.retry?.text) onSendText(m.retry.text);
    else if (m.retry?.file) onSendImage(m.retry.file);
  };

  const loadOlder = async () => {
    const oldest = messages[0];
    if (!chatId || !oldest || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const older = await listMessagesBefore(chatId, oldest.sentTs);
      setMessages((prev) => mergeMessages(older, prev));
      setHasOlder(older.length >= PAGE);
    } catch {
      setNotice({ tone: "error", text: t.olderFailed });
    } finally {
      setLoadingOlder(false);
    }
  };

  const runExtend = async () => {
    const p = packRef.current;
    if (!p?.bookingId || extending || extendPendingUntil) return;
    const afterTimeOver = !!p.timeBased && (!!p.expired || packEnded(p) || secondsLeft(p, Date.now() + clockOffset) <= 0);
    setExtending(true);
    try {
      const r = await extendChat(p.bookingId, afterTimeOver);
      if (r.pending) {
        setExtendPendingUntil(r.requestExpiresAt ?? Date.now() + 120_000);
        setSheet(null);
        setNotice({ tone: "info", text: t.requestSent(name, r.minutes ?? 5) });
        return;
      }
      lowWarned.current = false;
      overPrompted.current = false;
      endAnnounced.current = false;
      setLowTime(false);
      setClosedText(null);
      setSheet(null);
      setPack((prev) => ({ ...(prev ?? { bookingId: p.bookingId }), ...r, bookingId: p.bookingId, status: "IN_PROGRESS", expired: false }));
      void refresh();
    } catch (error) {
      const code = codeOf(error);
      if (code === "InsufficientBalance" || lowBalanceInfo(error)) setSheet("noPoints");
      else if (code === "FreeExtendUsed") setSheet("freeDone");
      else if (code === "ChatNotActive" || code === "ExtendWindowOver") {
        setSheet(null);
        endAnnounced.current = true;
        setClosedText(code === "ExtendWindowOver" ? t.extendWindowOver : t.chatOver);
      } else {
        setSheet(null);
        setNotice({ tone: "error", text: t.extendRetry });
      }
    } finally {
      setExtending(false);
    }
  };

  const endNow = async () => {
    const id = pack?.bookingId;
    if (!id || acting) return;
    setActing(true);
    try {
      const r = await endChat(id);
      setSheet(null);
      announceEnd({ bookingId: id, refundAmount: r?.refundAmount ?? 0, status: "COMPLETED", endedBy: "user" });
    } catch (error) {
      if (statusOfError(error) === 409) {
        setSheet(null);
        announceEnd({ bookingId: id });
      } else setNotice({ tone: "error", text: error instanceof ApiError ? error.message : t.endFailed });
    } finally {
      setActing(false);
    }
  };

  const leaveLine = async () => {
    const id = pack?.bookingId;
    if (!id || acting) return;
    setActing(true);
    try {
      const r = await leaveQueue(id);
      setSheet(null);
      endAnnounced.current = true;
      setPack((prev) => (prev ? { ...prev, status: "CANCELLED_BY_USER" } : prev));
      const pts = Math.round(Number(r?.refundAmount) || 0);
      setClosedText(t.leftLine(pts));
      void refresh();
    } catch {
      setNotice({ tone: "error", text: t.leaveFailed });
    } finally {
      setActing(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────────────────────
  if (authStatus === "signedOut") {
    // Back to this conversation, in this language, after signing in.
    const next = localizeHref(locale, `/chat/${encodeURIComponent(astrologerId)}${bookingId ? `?booking=${encodeURIComponent(bookingId)}` : ""}`);
    return (
      <section aria-labelledby="room-login-title" className="flex h-full flex-col items-start justify-center gap-4 rounded-3xl border border-line bg-surface-card p-6 md:p-12">
        <h2 id="room-login-title" className="heading-5 text-ink">
          {t.signedOutTitle}
        </h2>
        <p className="body-6 max-w-[680px] text-ink-soft">{t.signedOutBody}</p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/login?next=${encodeURIComponent(next)}`} className={primaryButton}>
            {t.logIn}
          </Link>
          <Link href="/astrologers" className={secondaryButton}>
            {t.seeAstrologers}
          </Link>
        </div>
      </section>
    );
  }
  if (loadFailed) {
    return (
      <div role="alert" className="flex h-full flex-col items-start gap-3 rounded-3xl border border-line bg-surface-card p-6">
        <p className="body-5 text-ink">{t.loadFailed}</p>
        <p className="caption-2 text-ink-soft">{t.checkConnection}</p>
        <button
          type="button"
          onClick={() => {
            setLoadFailed(false);
            setReloadKey((k) => k + 1);
          }}
          className={secondaryButton}
        >
          <PiArrowClockwise className="h-4 w-4" aria-hidden />
          {t.retry}
        </button>
      </div>
    );
  }
  if (!selfId || chat === undefined || pack === undefined || !messagesLoaded) return <ChatRoomSkeleton />;

  const open = !!pack && isPackOpen(pack.status) && !closedText;
  const timeOver = !!pack?.timeBased && (!!pack.expired || (packEnded(pack) && overPrompted.current === true)) && !closedText;
  const canWrite = !!chat && open && !(pack?.timeBased && pack.expired);
  const clockSec = pack?.timeBased && open ? secondsLeft(pack, now + clockOffset) : null;
  const blockMinutes = pack?.blockMinutes || 5;
  const blockPoints = pack?.blockPoints ?? Math.ceil((pack?.ratePerMin ?? 0) * blockMinutes);
  const wallet = balance?.points_balance;
  const statusLine = peerTyping ? t.typing : astrologer ? labels.availability[astrologer.availability] : "";
  const noBirth = !(Number(user?.profile?.dateTimeOfBirth) > 0);
  const queueMins = pack?.queueWaitMs ? Math.max(1, Math.ceil(pack.queueWaitMs / 60_000)) : null;

  return (
    <section aria-label={t.chatWith(name)} className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-line bg-surface-page">
      <header className="flex items-center gap-2 border-b border-line bg-surface-card px-3 py-3 md:gap-3 md:px-6">
        <Link href="/chat" aria-label={t.allChats} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-surface-sunken hover:text-ink lg:hidden">
          <PiArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <Link href={`/astrologers/${astrologerId}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-1 transition hover:bg-surface-sunken">
          <AstrologerAvatar name={name} photo={astrologer?.photo ?? null} size={44} availability={astrologer?.availability} />
          <span className="flex min-w-0 flex-col">
            <span lang={contentLang(name)} className="title-3 truncate capitalize text-ink">
              {name}
            </span>
            <span className={`caption-5 truncate ${peerTyping ? "text-success" : "text-ink-muted"}`}>{statusLine}</span>
          </span>
        </Link>

        {clockSec !== null && (
          <span
            className={`caption-3 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 tabular-nums ${
              pack?.paused ? "bg-neutral-soft text-neutral" : clockSec <= 60 && pack?.timerStarted ? "bg-danger-soft text-danger" : "bg-surface-sunken text-ink"
            }`}
            aria-label={pack?.timerStarted ? t.timeLeft(formatClock(clockSec)) : t.startsOnReply(formatClock(clockSec))}
          >
            {pack?.paused ? <PiPause className="h-4 w-4" aria-hidden /> : <PiHourglassMedium className="h-4 w-4" aria-hidden />}
            {formatClock(clockSec)}
          </span>
        )}
        {open && pack?.timeBased && pack.timerStarted && !pack.freeChat && (
          <button
            type="button"
            onClick={() => setSheet(pack.free ? "free" : "ask")}
            disabled={extending || !!extendPendingUntil}
            className={`${quietButton} max-sm:hidden`}
          >
            <PiPlus className="h-4 w-4" aria-hidden />
            {t.extend}
          </button>
        )}
        {open && pack?.status !== "WAITING" && (
          <button type="button" onClick={() => setSheet("end")} className={quietButton} aria-label={t.endChat}>
            <PiStop className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{t.end}</span>
          </button>
        )}
      </header>

      {notice && (
        <div role={notice.tone === "error" ? "alert" : "status"} className={`flex items-start gap-2 px-3 py-2 md:px-6 ${notice.tone === "error" ? "bg-danger-soft text-danger" : "bg-surface-sunken text-ink"}`}>
          <p className="caption-2 flex-1">
            <WithName text={notice.text} name={name} />
          </p>
          <button type="button" onClick={() => setNotice(null)} aria-label={t.dismiss} className="grid h-6 w-6 shrink-0 place-items-center rounded-full transition hover:bg-surface-card">
            <PiX className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      {open && pack?.status === "WAITING" && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-warning-soft px-3 py-2 md:px-6">
          <p className="caption-2 text-warning">
            <PiUsersThree className="mr-1 inline h-4 w-4 align-text-bottom" aria-hidden />
            <WithName text={pack.queuePosition ? t.inLine(name, pack.queuePosition, queueMins) : t.startsWhenFree(name)} name={name} />
          </p>
          <button type="button" onClick={() => setSheet("leave")} className={quietButton}>
            {t.leaveLine}
          </button>
        </div>
      )}
      {open && pack?.status === "IN_PROGRESS" && pack.timeBased && !pack.timerStarted && (
        <p className="caption-2 border-b border-line bg-surface-sunken px-3 py-2 text-ink-soft md:px-6">
          <WithName text={t.clockStartsOnReply(name)} name={name} />
        </p>
      )}
      {open && pack?.paused && (
        <p className="caption-2 border-b border-line bg-neutral-soft px-3 py-2 text-neutral md:px-6">
          <WithName text={t.paused(name)} name={name} />
        </p>
      )}
      {open && awayMins !== null && !pack?.paused && (
        <p className="caption-2 border-b border-line bg-warning-soft px-3 py-2 text-warning md:px-6">
          <WithName text={t.away(name, awayMins)} name={name} />
        </p>
      )}
      {extendPendingUntil && (
        <p role="status" className="caption-2 border-b border-line bg-surface-sunken px-3 py-2 text-ink md:px-6">
          <WithName text={t.extendPending(name)} name={name} />
        </p>
      )}
      {open && noBirth && (
        <p className="caption-2 flex items-start gap-2 border-b border-line bg-surface-card px-3 py-2 text-ink-soft md:px-6">
          <PiPlanet className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
          <span>
            {t.saveBirth}{" "}
            <Link href="/kundli" className="caption-3 rounded-sm text-brand-strong underline underline-offset-4">
              {t.makeKundli}
            </Link>
          </span>
        </p>
      )}

      <MessageList
        messages={messages}
        selfId={selfId}
        peerName={name}
        peerTyping={peerTyping}
        hasOlder={hasOlder}
        loadingOlder={loadingOlder}
        onLoadOlder={() => void loadOlder()}
        onRetry={onRetry}
        now={now}
        empty={
          <p className="caption-2 mx-auto my-auto max-w-sm text-center text-ink-muted">
            {chat ? t.firstQuestion : <WithName text={t.noChatYet(name)} name={name} />}
          </p>
        }
      />

      {lowTime && open && !timeOver && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-warning-soft px-3 py-2 md:px-6">
          <p className="caption-2 text-warning">{t.underAMinute}</p>
          <button type="button" onClick={() => void runExtend()} disabled={extending} className={`${primaryButton} button-sm`}>
            {extending ? t.extending : t.extendFor(blockMinutes, rupees(blockPoints))}
          </button>
        </div>
      )}

      {canWrite ? (
        <Composer
          disabled={false}
          placeholder={pack?.status === "WAITING" ? t.waitingPlaceholder : t.placeholder}
          onSendText={onSendText}
          onSendImage={onSendImage}
          onTyping={onTyping}
        />
      ) : timeOver && !extendPendingUntil ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-card px-3 py-3 md:px-6">
          <p className="body-5 text-ink">{t.timeUp}</p>
          <button type="button" onClick={promptOverAgain} className={primaryButton}>
            {t.addMore(blockMinutes)}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 border-t border-line bg-surface-card px-3 py-4 md:px-6">
          <p className="body-5 text-ink">
            <WithName text={closedText ?? (chat ? t.chatEnded : t.startToTalk(name))} name={name} />
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/astrologers/${astrologerId}`} className={primaryButton}>
              {chat ? t.startNewChat : t.startChat}
            </Link>
            <Link href="/astrologers" className={secondaryButton}>
              {t.otherAstrologers}
            </Link>
          </div>
          {closedText && <RateAstrologer astrologerId={astrologerId} name={name} />}
        </div>
      )}

      <RoomDialogs
        sheet={sheet}
        onClose={() => setSheet(null)}
        name={name}
        astrologerId={astrologerId}
        blockMinutes={blockMinutes}
        blockPoints={blockPoints}
        wallet={wallet}
        timerStarted={!!pack?.timerStarted}
        busy={extending || acting}
        onExtend={() => void runExtend()}
        onEnd={() => void endNow()}
        onLeave={() => void leaveLine()}
      />
    </section>
  );

  function promptOverAgain() {
    overPrompted.current = false;
    promptOver();
  }
}

function RoomDialogs({
  sheet,
  onClose,
  name,
  astrologerId,
  blockMinutes,
  blockPoints,
  wallet,
  timerStarted,
  busy,
  onExtend,
  onEnd,
  onLeave,
}: {
  sheet: Sheet | null;
  onClose: () => void;
  name: string;
  astrologerId: string;
  blockMinutes: number;
  blockPoints: number;
  wallet: number | undefined;
  timerStarted: boolean;
  busy: boolean;
  onExtend: () => void;
  onEnd: () => void;
  onLeave: () => void;
}) {
  const t = useT(text);
  const short = typeof wallet === "number" && wallet < blockPoints;
  const walletLine =
    typeof wallet === "number" ? <p className="caption-2 text-ink-soft">{t.yourWallet(rupees(wallet))}</p> : null;
  const recharge = (
    <Link href={rechargeHref(typeof wallet === "number" ? blockPoints - wallet : blockPoints)} className={primaryButton}>
      {t.rechargeWallet}
    </Link>
  );
  const cancel = (label = t.notNow) => (
    <button type="button" onClick={onClose} className={secondaryButton}>
      {label}
    </button>
  );

  let title = "";
  let body: React.ReactNode = null;

  switch (sheet) {
    case "ask":
      title = t.extendTitle;
      body = (
        <>
          <p className="title-2 text-ink">{t.moreMinutesFor(blockMinutes, rupees(blockPoints))}</p>
          {walletLine}
          <div className="flex flex-wrap justify-end gap-3">
            {cancel()}
            {short ? recharge : (
              <button type="button" onClick={onExtend} disabled={busy} className={primaryButton}>
                {busy ? t.extending : t.extend}
              </button>
            )}
          </div>
        </>
      );
      break;
    case "over":
    case "freeChatOver":
      title = sheet === "freeChatOver" ? t.freeChatOverTitle : t.timeUpTitle;
      body = (
        <>
          <p className="body-6 text-ink-soft">
            <WithName text={t.requestBody(blockMinutes, name, rupees(blockPoints), sheet === "freeChatOver")} name={name} />
          </p>
          {walletLine}
          <div className="flex flex-wrap justify-end gap-3">
            {cancel()}
            {short ? recharge : (
              <button type="button" onClick={onExtend} disabled={busy} className={primaryButton}>
                {busy ? t.sending : t.sendRequest}
              </button>
            )}
          </div>
        </>
      );
      break;
    case "free":
      title = t.freeMoreTitle(blockMinutes);
      body = (
        <>
          <p className="body-6 text-ink-soft">{t.freeMoreBody}</p>
          <div className="flex flex-wrap justify-end gap-3">
            {cancel()}
            <button type="button" onClick={onExtend} disabled={busy} className={primaryButton}>
              {busy ? t.extending : t.extend}
            </button>
          </div>
        </>
      );
      break;
    case "freeDone":
      title = t.freeDoneTitle;
      body = (
        <>
          <p className="body-6 text-ink-soft">{t.freeDoneBody}</p>
          <div className="flex flex-wrap justify-end gap-3">
            {cancel(t.close)}
            <Link href={`/astrologers/${astrologerId}`} className={primaryButton}>
              {t.startNewChat}
            </Link>
          </div>
        </>
      );
      break;
    case "noPoints":
      title = t.noPointsTitle;
      body = (
        <>
          <p className="body-6 text-ink-soft">{t.noPointsBody(rupees(blockPoints), typeof wallet === "number" ? rupees(wallet) : null)}</p>
          <div className="flex flex-wrap justify-end gap-3">
            {cancel(t.close)}
            {recharge}
          </div>
        </>
      );
      break;
    case "end":
      title = t.endTitle;
      body = (
        <>
          <p className="body-6 text-ink-soft">{timerStarted ? t.endRefundUnused : <WithName text={t.endRefundAll(name)} name={name} />}</p>
          <div className="flex flex-wrap justify-end gap-3">
            {cancel(t.keepChatting)}
            <button
              type="button"
              onClick={onEnd}
              disabled={busy}
              className="button-md inline-flex items-center justify-center gap-2 rounded-xl bg-danger px-3 py-2 text-ink-inverse transition hover:opacity-90 active:scale-98 disabled:opacity-60"
            >
              {busy ? t.ending : t.endConfirm}
            </button>
          </div>
        </>
      );
      break;
    case "leave":
      title = t.leaveTitle;
      body = (
        <>
          <p className="body-6 text-ink-soft">{t.leaveBody}</p>
          <div className="flex flex-wrap justify-end gap-3">
            {cancel(t.stayInLine)}
            <button type="button" onClick={onLeave} disabled={busy} className={secondaryButton}>
              {busy ? t.leaving : t.leaveLine}
            </button>
          </div>
        </>
      );
      break;
  }

  return (
    <Dialog open={!!sheet} onClose={onClose} title={title}>
      {body}
    </Dialog>
  );
}
