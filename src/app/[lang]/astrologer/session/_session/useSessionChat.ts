"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  endChat,
  getOpenPackWith,
  getPackStatus,
  isPackOpen,
  listLatestMessages,
  listMessagesBefore,
  listMessagesSince,
  markSeen,
  mergeMessages,
  packEnded,
  packFields,
  secondsLeft,
  sendImage,
  sendText,
  sendTyping,
  toMessage,
  type ChatMessage,
  type PackState,
} from "@/lib/services/chat";
import { answerExtend, extendFailureOf, getPendingExtend, toExtendRequest, type ExtendFailure, type ExtendRequest } from "@/lib/services/astrologerExtend";
import { globalChannel, isRealtimeOpen, sessionChannel } from "@/lib/services/realtime";
import { useRealtimeChannel, useRealtimeOpen } from "@/lib/services/useRealtime";

const PAGE = 50;
const CATCH_UP_MS = 20_000;
const PACK_POLL_MS = 15_000;
const TYPING_SEND_MS = 3_000;
const TYPING_IDLE_MS = 4_000;
const PEER_TYPING_MS = 6_000;

type Payload = Record<string, unknown>;
const obj = (v: unknown): Payload => (v && typeof v === "object" ? (v as Payload) : {});
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const RANK: Record<string, number> = { sent: 1, delivered: 2, seen: 3, read: 3 };
const rank = (s?: string) => RANK[String(s || "sent").toLowerCase()] ?? 1;

/** Why a send failed, as a key the view words in its language. */
export type SendError = "contact" | "noPack" | "timeOver" | "tooLarge" | "other";
export const sendErrorOf = (e: ApiError | unknown): SendError => {
  const code = e instanceof ApiError ? e.code : undefined;
  if (code === "ContactSharingNotAllowed") return "contact";
  if (code === "NoActiveChatPack") return "noPack";
  if (code === "ChatTimeOver") return "timeOver";
  if (e instanceof ApiError && e.status === 413) return "tooLarge";
  return "other";
};

/**
 * The astrologer's side of one live chat, on the same endpoints and realtime events the customer's chat room uses:
 * history, send, typing, ticks, and the pack's clock (it starts with the astrologer's first reply).
 */
export function useSessionChat({ chatId, clientId, selfId, bookingId }: { chatId: string; clientId: string; selfId: string; bookingId: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [pack, setPack] = useState<PackState | null | undefined>(undefined);
  const [peerTyping, setPeerTyping] = useState(false);
  const [clockOffset, setClockOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [reloadKey, setReloadKey] = useState(0);
  const [ending, setEnding] = useState(false);
  const [endFailed, setEndFailed] = useState(false);
  const [sendFailures, setSendFailures] = useState<Record<string, SendError>>({});
  const realtimeOpen = useRealtimeOpen();
  // The customer's request for more time (after theirs ran out), waiting for Accept or Decline.
  const [extendReq, setExtendReq] = useState<ExtendRequest | null>(null);
  const [extendBusy, setExtendBusy] = useState<"accept" | "decline" | null>(null);
  const [extendError, setExtendError] = useState<ExtendFailure | null>(null);
  const [extendDone, setExtendDone] = useState<"accepted" | "declined" | null>(null);

  const messagesRef = useRef(messages);
  const packRef = useRef(pack);
  const offsetRef = useRef(clockOffset);
  useEffect(() => {
    messagesRef.current = messages;
    packRef.current = pack;
    offsetRef.current = clockOffset;
  });
  const seenSent = useRef(new Set<string>());
  const typing = useRef<{ on: boolean; at: number; idle?: ReturnType<typeof setTimeout> }>({ on: false, at: 0 });
  const peerTypingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const catchUpTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Load: history and the open pack with this customer ────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    listLatestMessages(chatId, signal).then(
      (list) => {
        setMessages(list);
        setHasOlder(list.length >= PAGE);
        setLoaded(true);
      },
      () => {
        if (!signal.aborted) setLoadFailed(true);
      },
    );
    const open = async () => {
      if (bookingId) {
        try {
          const p = await getPackStatus(bookingId, signal);
          if (isPackOpen(p.status)) return p;
        } catch (error) {
          if (signal.aborted) throw error;
        }
      }
      return getOpenPackWith(clientId, signal);
    };
    open().then(setPack, () => {
      if (!signal.aborted) setPack(null);
    });
    return () => controller.abort();
  }, [chatId, clientId, bookingId, reloadKey]);

  const refetchPack = () => {
    getOpenPackWith(clientId).then(
      (p) => setPack(p),
      () => undefined,
    );
  };

  const catchUp = () => {
    const newest = [...messagesRef.current].reverse().find((m) => m.messageId)?.sentTs ?? 0;
    listMessagesSince(chatId, newest).then(
      (fresh) => fresh.length && setMessages((prev) => mergeMessages(prev, fresh)),
      () => undefined,
    );
  };
  const scheduleCatchUp = () => {
    clearTimeout(catchUpTimer.current);
    catchUpTimer.current = setTimeout(catchUp, 1500);
  };

  /** A request for more time: from the realtime event, or read from the server. Only this customer's. */
  const showExtend = (raw: unknown) => {
    const d = obj(raw);
    if (str(d.userId) && str(d.userId) !== clientId) return;
    const r = toExtendRequest(d);
    if (!r) return;
    setExtendReq(r);
    setExtendError(null);
    setExtendDone(null);
  };

  const applyClock = (d: Payload) => {
    if (typeof d.secondsAllowed !== "number") return;
    // The clock restarted (accepted here or on another device): nothing is waiting any more.
    if (d.reason === "extended" || d.reason === "revived") setExtendReq(null);
    const serverNow = num(d.serverNow);
    if (serverNow) setClockOffset(serverNow - Date.now());
    setPack((prev) => ({
      ...(prev ?? { bookingId: "" }),
      ...packFields(d),
      bookingId: str(d.bookingId) || prev?.bookingId || "",
      status: "IN_PROGRESS",
      timeBased: true,
      paused: d.paused === true,
      expired: false,
    }));
  };

  const markEnded = (d: Payload) => {
    const id = str(d.bookingId);
    setPack((prev) =>
      prev && (!id || !prev.bookingId || id === prev.bookingId)
        ? { ...prev, status: str(d.status) || (packEnded(prev) ? prev.status : "COMPLETED"), expired: true, secondsRemaining: 0 }
        : prev,
    );
    setPeerTyping(false);
  };

  // ── Realtime ──────────────────────────────────────────────────────────────────────────────────
  useRealtimeChannel(sessionChannel(chatId), (event, raw) => {
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
      case "ChatPackActivated":
      case "ChatSessionReopened":
        return refetchPack();
      case "ChatSessionClosed":
      case "ChatPackEnded":
        return markEnded(d);
      case "ChatSessionEnded":
        return markEnded({ ...d, status: "COMPLETED" });
      case "ChatExtendRequested":
        return showExtend(d);
    }
  });

  useRealtimeChannel(globalChannel(selfId), (event, raw) => {
    const d = obj(raw);
    if (event === "MessageDelivered" || event === "MessageDeliveredAck" || event === "MessageSeenAck" || event === "MessageREAD") {
      const messageId = str(d.messageId);
      if (!messageId || str(d.sessionId) !== chatId) return;
      const status = event === "MessageSeenAck" || event === "MessageREAD" ? "seen" : "delivered";
      setMessages((prev) => prev.map((m) => (m.messageId === messageId && rank(status) > rank(m.status) ? { ...m, status } : m)));
    } else if (event === "ChatClockChanged") {
      if (str(d.bookingId) && str(d.bookingId) === packRef.current?.bookingId) applyClock(d);
    } else if (event === "ChatExtendRequested") {
      showExtend(d);
    } else if (event === "NewMessage") {
      if (str(d.sessionId) === chatId) scheduleCatchUp();
    }
  });

  // ── Timers ────────────────────────────────────────────────────────────────────────────────────
  const running = !!pack?.timeBased && !!pack.timerStarted && !pack.paused && isPackOpen(pack.status) && !pack.expired;
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (secondsLeft(packRef.current, t + offsetRef.current) <= 0) {
        setPack((prev) => (prev && !prev.expired ? { ...prev, expired: true, secondsRemaining: 0 } : prev));
      }
    };
    const first = setTimeout(tick, 0);
    const h = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(h);
    };
  }, [running]);

  // The request that is already waiting when the chat opens, and a re-read now and then while realtime is down.
  useEffect(() => {
    const controller = new AbortController();
    const read = () =>
      getPendingExtend(clientId, controller.signal).then(
        (r) => r && setExtendReq((prev) => (prev?.bookingId === r.bookingId && prev.requestedAt === r.requestedAt ? prev : r)),
        () => undefined,
      );
    void read();
    const h = setInterval(() => {
      if (!isRealtimeOpen()) void read();
    }, PACK_POLL_MS);
    return () => {
      controller.abort();
      clearInterval(h);
    };
  }, [clientId, reloadKey]);

  // The request lapses on its own (about two minutes): the banner goes with it.
  const extendExpires = extendReq?.expiresAt ?? 0;
  useEffect(() => {
    if (!extendExpires) return;
    const h = setTimeout(() => setExtendReq(null), Math.max(extendExpires - Date.now(), 0));
    return () => clearTimeout(h);
  }, [extendExpires]);

  // A running or waiting pack is re-read now and then: realtime can be missed.
  const packId = pack?.bookingId || null;
  const open = !!packId && isPackOpen(pack?.status) && !pack?.expired;
  useEffect(() => {
    if (!open || !packId) return;
    const h = setInterval(() => {
      getPackStatus(packId).then(
        (fresh) => setPack((prev) => (prev && prev.bookingId === packId ? { ...prev, ...fresh, paused: !!fresh.paused } : prev)),
        () => undefined,
      );
    }, PACK_POLL_MS);
    return () => clearInterval(h);
  }, [open, packId]);

  // Messages missed while the socket was down.
  useEffect(() => {
    if (!loaded) return;
    const first = realtimeOpen ? setTimeout(catchUp, 0) : undefined;
    const h = setInterval(() => {
      if (!isRealtimeOpen()) catchUp();
    }, CATCH_UP_MS);
    return () => {
      clearTimeout(first);
      clearInterval(h);
    };
    // catchUp reads refs; chatId and the socket state decide when to run it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, loaded, realtimeOpen]);

  // Read receipts for the customer's messages while this tab is visible.
  const [visibleAt, setVisibleAt] = useState(0);
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && setVisibleAt(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  useEffect(() => {
    if (document.visibilityState !== "visible") return;
    const ids = messages.filter((m) => m.sentBy !== selfId && m.messageId && rank(m.status) < 3 && !seenSent.current.has(m.messageId)).map((m) => m.messageId as string);
    if (!ids.length) return;
    ids.forEach((id) => seenSent.current.add(id));
    void markSeen(chatId, ids);
  }, [messages, chatId, selfId, visibleAt]);

  useEffect(
    () => () => {
      clearTimeout(peerTypingTimer.current);
      clearTimeout(catchUpTimer.current);
      clearTimeout(typing.current.idle);
    },
    [],
  );

  // ── Actions ───────────────────────────────────────────────────────────────────────────────────
  const onTyping = (on: boolean) => {
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
      setMessages((prev) => mergeMessages(prev, fresh).map((m) => (m.key === local.key && m.local ? { ...m, local: undefined, status: "sent", retry: undefined } : m)));
    } catch (error) {
      const reason = sendErrorOf(error);
      setMessages((prev) => prev.map((m) => (m.key === local.key ? { ...m, local: "failed", retry: reason === "contact" ? undefined : m.retry } : m)));
      setSendFailures((prev) => ({ ...prev, [local.key]: reason }));
      if (reason === "noPack" || reason === "timeOver") refetchPack();
    }
  };

  const send = (text: string) => {
    const sentTs = Date.now();
    const local: ChatMessage = { key: `${selfId}#${sentTs}`, sentBy: selfId, sentTs, type: "text", message: text, local: "sending", retry: { text } };
    void deliver(local, () => sendText(chatId, selfId, text, sentTs, newestServerTs()));
  };

  const sendPhoto = (file: File) => {
    const sentTs = Date.now();
    const local: ChatMessage = { key: `${selfId}#${sentTs}`, sentBy: selfId, sentTs, type: "image", message: URL.createObjectURL(file), local: "sending", retry: { file } };
    void deliver(local, () => sendImage(chatId, selfId, file, sentTs, newestServerTs()));
  };

  const retry = (m: ChatMessage) => {
    setMessages((prev) => prev.filter((x) => x.key !== m.key));
    if (m.retry?.text) send(m.retry.text);
    else if (m.retry?.file) sendPhoto(m.retry.file);
  };

  const loadOlder = async () => {
    const oldest = messagesRef.current.find((m) => m.messageId);
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const older = await listMessagesBefore(chatId, oldest.sentTs);
      setMessages((prev) => mergeMessages(prev, older));
      setHasOlder(older.length >= PAGE);
    } catch {
      /* the button stays */
    } finally {
      setLoadingOlder(false);
    }
  };

  /** Ends the chat for both sides (POST /v1/booking/chat/:bookingId/end); the unused time goes back to the customer. */
  const end = async () => {
    const id = packRef.current?.bookingId;
    if (!id || ending) return;
    setEnding(true);
    setEndFailed(false);
    try {
      await endChat(id);
      markEnded({ bookingId: id, status: "COMPLETED" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) markEnded({ bookingId: id, status: "COMPLETED" });
      else setEndFailed(true);
    } finally {
      setEnding(false);
    }
  };

  /** POST .../extend/accept (charges the customer's block and restarts the clock) or .../extend/decline. */
  const answerExtendRequest = async (accept: boolean) => {
    const req = extendReq;
    if (!req || extendBusy) return;
    setExtendBusy(accept ? "accept" : "decline");
    setExtendError(null);
    try {
      const fields = await answerExtend(req.bookingId, accept);
      setExtendReq(null);
      setExtendDone(accept ? "accepted" : "declined");
      if (fields) {
        setPack((prev) => ({ ...(prev ?? { bookingId: req.bookingId }), ...fields, bookingId: req.bookingId, status: "IN_PROGRESS", expired: false }));
        // The server's own read settles the clock (ChatClockChanged follows too).
        getPackStatus(req.bookingId).then(
          (fresh) => setPack((prev) => (prev && prev.bookingId === req.bookingId ? { ...prev, ...fresh, paused: !!fresh.paused } : prev)),
          () => undefined,
        );
      }
    } catch (error) {
      const why = extendFailureOf(error);
      if (why === "expired" || why === "answered") setExtendReq(null);
      setExtendError(why);
    } finally {
      setExtendBusy(null);
    }
  };

  const secs = pack ? secondsLeft(pack, now + clockOffset) : 0;
  const elapsed = pack?.startedAt && pack.timerStarted ? Math.max(0, Math.floor((now + clockOffset - pack.startedAt) / 1000)) : null;

  return {
    messages,
    loaded,
    loadFailed,
    hasOlder,
    loadingOlder,
    loadOlder,
    pack,
    peerTyping,
    secondsLeft: secs,
    elapsed,
    ending,
    endFailed,
    sendFailures,
    reload: () => {
      setLoadFailed(false);
      setLoaded(false);
      setReloadKey((k) => k + 1);
    },
    send,
    sendPhoto,
    retry,
    onTyping,
    end,
    extendReq,
    extendBusy,
    extendError,
    extendDone,
    answerExtend: answerExtendRequest,
  };
}

export type SessionChat = ReturnType<typeof useSessionChat>;
