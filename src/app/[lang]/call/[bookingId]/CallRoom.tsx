"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { PiMicrophone, PiMicrophoneSlash, PiPhoneDisconnect, PiPhoneCall, PiWarningCircle } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import AstrologerAvatar from "@/components/consult/AstrologerAvatar";
import { primaryButton, secondaryButton } from "@/components/consult/Dialog";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { contentLang } from "@/lib/services/astrologerModel";
import {
  AGORA_APP_ID,
  acceptCall,
  endCall,
  fetchRtcToken,
  getCallChannel,
  isAccepted,
  isTerminated,
  joinBookingCall,
  randomUid,
  setCallUid,
} from "@/lib/services/bookingCall";
import { clockLabel, joinState, type Booking } from "@/lib/services/bookings";
import { formatClock } from "@/lib/services/chat";
import { ChannelBadge, ListSkeleton, LoadError, PageFrame, longDate, useRequireSignIn } from "../../bookings/_parts/shared";
import { useBookings } from "../../bookings/_parts/useBookings";

const text = defineMessages({
  hi: {
    astrologer: "ज्योतिषी",
    loadFailed: "यह बुकिंग लोड नहीं हो सकी।",
    notFound: "यह बुकिंग नहीं मिली।",
    notCall: "यह वॉइस कॉल की बुकिंग नहीं है।",
    chatInstead: "चैट खोलें",
    allBookings: "मेरी अपॉइंटमेंट",
    closed: "यह बुकिंग अब कॉल के लिए खुली नहीं है।",
    early: (clock: string) => `कॉल समय से 5 मिनट पहले खुलती है। यह ${clock} पर है।`,
    over: "कॉल का समय निकल चुका है।",
    intro: "कॉल ब्राउज़र में होती है, ऐप की ज़रूरत नहीं। ज्योतिषी जब कॉल शुरू करेंगे, आपको यहां से जुड़ना है। माइक की अनुमति चाहिए।",
    join: "कॉल से जुड़ें",
    setupMissing: "ब्राउज़र से कॉल अभी इस वेबसाइट पर चालू नहीं की गई है। कृपया ऐप से जुड़ें।",
    micDenied: "माइक की अनुमति नहीं मिली। ब्राउज़र की सेटिंग में माइक की अनुमति दें और फिर से कोशिश करें।",
    micMissing: "कोई माइक नहीं मिला। माइक जोड़कर फिर से कोशिश करें।",
    waiting: "ज्योतिषी ने अभी कॉल शुरू नहीं की है। शुरू होते ही हम आपको जोड़ देंगे। यह पन्ना खुला रखें।",
    connecting: "जुड़ रहे हैं…",
    live: "कॉल चालू है",
    ended: "कॉल खत्म हुई",
    endedBody: "आपकी कॉल पूरी हो गई। बिलिंग सर्वर ने अपने आप कर दी।",
    mute: "म्यूट करें",
    unmute: "म्यूट हटाएं",
    muted: "आपका माइक बंद है",
    hangUp: "कॉल खत्म करें",
    cancelWaiting: "रुकना बंद करें",
    failed: "कॉल जुड़ नहीं सकी। कुछ देर बाद फिर से कोशिश करें।",
    windowError: "अभी कॉल में जुड़ा नहीं जा सकता: समय का मेल नहीं बैठा।",
    retry: "फिर से कोशिश करें",
    remoteJoined: "ज्योतिषी जुड़ गए हैं",
    remoteWaiting: "ज्योतिषी के आवाज़ में आने का इंतज़ार",
    when: "बुकिंग",
    review: "रिव्यू दें",
    keepOpen: "कॉल के दौरान यह पन्ना बंद न करें।",
  },
  en: {
    astrologer: "Astrologer",
    loadFailed: "This booking could not be loaded.",
    notFound: "We could not find this booking.",
    notCall: "This is not a voice call booking.",
    chatInstead: "Open the chat",
    allBookings: "My appointments",
    closed: "This booking is not open for a call any more.",
    early: (clock) => `The call opens 5 minutes before the time. This one is at ${clock}.`,
    over: "The time for this call has passed.",
    intro: "The call happens in your browser, no app needed. When the astrologer starts the call you join from here. You will be asked for the microphone.",
    join: "Join the call",
    setupMissing: "Calling from the browser is not switched on for this website yet. Please join from the app.",
    micDenied: "The microphone was not allowed. Allow it in your browser settings and try again.",
    micMissing: "No microphone was found. Connect one and try again.",
    waiting: "The astrologer has not started the call yet. We will connect you as soon as they do. Keep this page open.",
    connecting: "Connecting…",
    live: "Call in progress",
    ended: "Call ended",
    endedBody: "Your call is over. The server settles the billing by itself.",
    mute: "Mute",
    unmute: "Unmute",
    muted: "Your microphone is off",
    hangUp: "End call",
    cancelWaiting: "Stop waiting",
    failed: "The call could not connect. Please try again in a moment.",
    windowError: "You cannot join this call right now: it is outside the call window.",
    retry: "Try again",
    remoteJoined: "The astrologer has joined",
    remoteWaiting: "Waiting for the astrologer's voice",
    when: "Booking",
    review: "Leave a review",
    keepOpen: "Do not close this page during the call.",
  },
});

type Phase = "ready" | "waiting" | "connecting" | "live" | "ended" | "error";
type ErrorKind = "setup" | "mic" | "mic-missing" | "window" | "failed";

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const id = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(id); resolve(); }, { once: true });
  });

export default function CallRoom({ bookingId }: { bookingId: string }) {
  const signedIn = useRequireSignIn();
  if (!signedIn) return <PageFrame narrow><ListSkeleton rows={1} /></PageFrame>;
  return <Loaded bookingId={bookingId} />;
}

function Loaded({ bookingId }: { bookingId: string }) {
  const t = useT(text);
  const { bookings, photos, failed, reload } = useBookings(true);
  const b = bookings?.find((x) => x.id === bookingId) ?? null;

  return (
    <PageFrame narrow>
      {bookings === null ? (
        failed ? <LoadError message={t.loadFailed} onRetry={reload} /> : <ListSkeleton rows={1} />
      ) : !b ? (
        <Notice message={t.notFound} />
      ) : b.channel !== "call" ? (
        <Notice message={t.notCall}>
          <Link href={`/chat/${encodeURIComponent(b.astrologerId)}?booking=${encodeURIComponent(b.id)}`} className={primaryButton}>
            {t.chatInstead}
          </Link>
        </Notice>
      ) : (
        <Room b={b} photo={photos.get(b.astrologerId) ?? null} />
      )}
    </PageFrame>
  );
}

function Notice({ message, children }: { message: string; children?: React.ReactNode }) {
  const t = useT(text);
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface-card p-6">
      <p className="body-5 text-ink">{message}</p>
      <div className="flex flex-wrap gap-2">
        {children}
        <Link href="/bookings" className={secondaryButton}>
          {t.allBookings}
        </Link>
      </div>
    </div>
  );
}

function Room({ b, photo }: { b: Booking; photo: string | null }) {
  const t = useT(text);
  const locale = useLocale();
  const { session } = useAuth();
  const userId = session?.user.id ?? "";

  const [phase, setPhase] = useState<Phase>("ready");
  const [errorKind, setErrorKind] = useState<ErrorKind>("failed");
  const [muted, setMuted] = useState(false);
  const [remote, setRemote] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const run = useRef<AbortController | null>(null);
  const client = useRef<IAgoraRTCClient | null>(null);
  const mic = useRef<IMicrophoneAudioTrack | null>(null);
  const channelId = useRef<string>("");
  const ringing = useRef(false);
  const phaseRef = useRef<Phase>("ready");
  useEffect(() => {
    phaseRef.current = phase;
  });

  const name = b.astrologerName || t.astrologer;
  const state = joinState(b);

  /** Leave Agora and release the microphone. */
  const teardown = useCallback(async () => {
    const c = client.current;
    const m = mic.current;
    client.current = null;
    mic.current = null;
    m?.stop();
    m?.close();
    try {
      await c?.leave();
    } catch {
      /* already gone */
    }
  }, []);

  const finish = useCallback(
    async (tellServer: boolean) => {
      run.current?.abort();
      const id = channelId.current;
      await teardown();
      if (tellServer && id && userId) await endCall(id, userId, ringing.current).catch(() => undefined);
      ringing.current = false;
      setPhase("ended");
    },
    [teardown, userId],
  );

  const fail = useCallback(
    async (kind: ErrorKind) => {
      run.current?.abort();
      const id = channelId.current;
      const wasRinging = ringing.current;
      await teardown();
      // Free the astrologer's seat when the call had been joined but did not connect.
      if (id && userId && phaseRef.current !== "ready") await endCall(id, userId, wasRinging).catch(() => undefined);
      channelId.current = "";
      ringing.current = false;
      setErrorKind(kind);
      setPhase("error");
    },
    [teardown, userId],
  );

  // Leaving the page during a call hangs up, so the astrologer is not left talking to nobody.
  useEffect(() => {
    return () => {
      run.current?.abort();
      const id = channelId.current;
      const p = phaseRef.current;
      const c = client.current;
      const m = mic.current;
      client.current = null;
      mic.current = null;
      m?.stop();
      m?.close();
      void c?.leave().catch(() => undefined);
      if (id && userId && (p === "live" || p === "connecting")) void endCall(id, userId, false).catch(() => undefined);
    };
  }, [userId]);

  useEffect(() => {
    if (phase !== "live") return;
    const started = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const start = async () => {
    if (!AGORA_APP_ID) {
      setErrorKind("setup");
      setPhase("error");
      return;
    }
    const controller = new AbortController();
    run.current = controller;
    const { signal } = controller;
    setPhase("connecting");
    setRemote(false);
    setSeconds(0);
    setMuted(false);

    try {
      // The microphone first: nothing is changed on the server until we know we can talk.
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(3);
      try {
        mic.current = await AgoraRTC.createMicrophoneAudioTrack();
      } catch (e) {
        const n = (e as { code?: string; name?: string }).code ?? (e as Error).name ?? "";
        return fail(/NOT_FOUND|DEVICE_NOT_FOUND/i.test(n) ? "mic-missing" : "mic");
      }
      if (signal.aborted) return;

      // The astrologer starts the call: until they do the server answers 409, so ask again every few seconds.
      let joined = await tryJoin();
      while (joined === "wait" && !signal.aborted) {
        setPhase("waiting");
        await sleep(5000, signal);
        if (signal.aborted) return;
        joined = await tryJoin();
      }
      if (signal.aborted) return;
      if (joined === "window") return fail("window");
      if (joined === "error" || joined === "wait") return fail("failed");

      const { action, channel } = joined;
      channelId.current = channel.channelId;
      setPhase("connecting");
      ringing.current = action === "accept_required" || (channel.tempHost ? !isAccepted(channel.tempHost.status) : false);
      if (action === "accept_required") {
        await acceptCall(channel.channelId, userId);
      }
      ringing.current = false;

      const uid = randomUid();
      await setCallUid(channel.channelId, userId, uid).catch(() => undefined);
      const token = await fetchRtcToken(channel.channelId, uid, signal);

      const rtc = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      client.current = rtc;
      let sawRemote = false;
      rtc.on("user-published", async (user, mediaType) => {
        await rtc.subscribe(user, mediaType);
        if (mediaType === "audio") user.audioTrack?.play();
        sawRemote = true;
        setRemote(true);
      });
      rtc.on("user-left", () => {
        setRemote(false);
        // As in the app: the astrologer left Agora, so the call is over.
        if (sawRemote && phaseRef.current === "live") void finish(true);
      });
      rtc.on("token-privilege-will-expire", async () => {
        try {
          await rtc.renewToken(await fetchRtcToken(channel.channelId, uid));
        } catch {
          /* the next expiry ends the call, which the poll below notices */
        }
      });
      await rtc.join(AGORA_APP_ID, channel.channelId, token, uid);
      if (signal.aborted || !mic.current) return;
      await rtc.publish(mic.current);
      setPhase("live");

      // The server is the judge of when a call is over (the astrologer ended it, time ran out, no balance).
      while (!signal.aborted) {
        await sleep(3000, signal);
        if (signal.aborted) return;
        try {
          const ch = await getCallChannel(channel.channelId, signal);
          if (!ch.tempHost || isTerminated(ch.tempHost.status) || (ch.tempHost.id && ch.tempHost.id !== userId)) return finish(false);
        } catch (e) {
          if (e instanceof ApiError && e.status === 404) return finish(false);
          /* a hiccup: the next round tries again */
        }
      }
    } catch (e) {
      if (signal.aborted) return;
      if (e instanceof ApiError && e.status === 400) return fail("window");
      return fail("failed");
    }

    async function tryJoin() {
      try {
        const r = await joinBookingCall(b.id);
        return r.channel ? { action: r.action, channel: r.channel } : ("error" as const);
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) return "wait" as const;
        if (e instanceof ApiError && e.status === 400) return "window" as const;
        return "error" as const;
      }
    }
  };

  const toggleMute = async () => {
    const next = !muted;
    await mic.current?.setEnabled(!next);
    setMuted(next);
  };

  const busy = phase === "waiting" || phase === "connecting" || phase === "live";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-3xl border border-line bg-surface-card p-6 text-center sm:p-8">
      <AstrologerAvatar name={name} photo={photo} size={96} />
      <div className="flex flex-col items-center gap-2">
        <h1 lang={contentLang(name)} className="heading-4 text-ink">
          {name}
        </h1>
        <ChannelBadge channel="call" />
        <p className="caption-2 text-ink-soft">
          {t.when}: {longDate(b.date, locale)}, {clockLabel(b.start)} – {clockLabel(b.end)}
        </p>
      </div>

      <div role="status" aria-live="polite" className="flex min-h-16 flex-col items-center justify-center gap-1">
        {phase === "ready" && (state === "open" ? <p className="body-6 max-w-md text-ink-soft">{t.intro}</p> : <p className="body-5 text-ink">{state === "early" ? t.early(clockLabel(b.start)) : state === "over" ? t.over : t.closed}</p>)}
        {phase === "waiting" && <p className="body-5 max-w-md text-ink">{t.waiting}</p>}
        {phase === "connecting" && <p className="body-5 text-ink">{t.connecting}</p>}
        {phase === "live" && (
          <>
            <p className="heading-3 tabular-nums text-ink">{formatClock(seconds)}</p>
            <p className="caption-2 text-ink-soft">{remote ? t.remoteJoined : t.remoteWaiting}</p>
            {muted && <p className="caption-2 text-warning">{t.muted}</p>}
          </>
        )}
        {phase === "ended" && (
          <>
            <p className="heading-5 text-ink">{t.ended}</p>
            <p className="body-6 text-ink-soft">{t.endedBody}</p>
          </>
        )}
        {phase === "error" && (
          <p role="alert" className="body-5 inline-flex max-w-md items-start gap-2 text-danger">
            <PiWarningCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            {errorKind === "setup" ? t.setupMissing : errorKind === "mic" ? t.micDenied : errorKind === "mic-missing" ? t.micMissing : errorKind === "window" ? t.windowError : t.failed}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {(phase === "ready" && state === "open") || phase === "error" ? (
          <button type="button" onClick={start} className={primaryButton}>
            <PiPhoneCall className="h-5 w-5" aria-hidden />
            {phase === "error" ? t.retry : t.join}
          </button>
        ) : null}
        {phase === "live" && (
          <button type="button" onClick={toggleMute} aria-pressed={muted} className={secondaryButton}>
            {muted ? <PiMicrophoneSlash className="h-5 w-5" aria-hidden /> : <PiMicrophone className="h-5 w-5" aria-hidden />}
            {muted ? t.unmute : t.mute}
          </button>
        )}
        {busy && (
          <button type="button" onClick={() => void finish(true)} className="button-md inline-flex items-center justify-center gap-2 rounded-xl bg-danger px-3 py-2 text-surface-card transition hover:opacity-90 active:scale-98">
            <PiPhoneDisconnect className="h-5 w-5" aria-hidden />
            {phase === "waiting" ? t.cancelWaiting : t.hangUp}
          </button>
        )}
        {phase === "ended" && (
          <>
            <Link href="/history" className={primaryButton}>
              {t.review}
            </Link>
            <Link href="/bookings" className={secondaryButton}>
              {t.allBookings}
            </Link>
          </>
        )}
      </div>
      {busy && <p className="caption-2 text-ink-soft">{t.keepOpen}</p>}
    </div>
  );
}
