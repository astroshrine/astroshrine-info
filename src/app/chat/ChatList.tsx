"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiArrowClockwise, PiChatCircleDots, PiPlus, PiSignIn } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import AstrologerAvatar from "@/components/consult/AstrologerAvatar";
import { primaryButton, secondaryButton } from "@/components/consult/Dialog";
import { listAstrologers } from "@/lib/services/astrologers";
import { getOpenPacksByAstrologer, isUnread, listSessions, type OpenPackSummary } from "@/lib/services/chat";
import { globalChannel } from "@/lib/services/realtime";
import { useRealtimeAccount, useRealtimeChannel } from "@/lib/services/useRealtime";

type Row = {
  astrologerId: string;
  chatId: string;
  name: string;
  photo: string | null;
  lastActivity: number;
  unread: boolean;
  pack?: OpenPackSummary;
};

/** My-channel events that add, start, end or bump a conversation (the app's CHAT_LIST_EVENTS). */
const LIST_EVENTS = new Set(["NewMessage", "ChatPackActivated", "ChatSessionClosed", "ChatSessionReopened", "ChatListChanged", "ChatClockChanged"]);

const timeFormat = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

function activityLabel(ms: number, today: string) {
  if (!ms) return "";
  const d = new Date(ms);
  return d.toDateString() === today ? timeFormat.format(d) : dateFormat.format(d);
}

function packLabel(p?: OpenPackSummary): { text: string; tone: string } | null {
  if (!p) return null;
  if (p.status === "WAITING") return { text: "लाइन में इंतज़ार", tone: "text-warning" };
  if (p.status === "IN_PROGRESS" && p.timerStarted) return { text: "चैट चालू है", tone: "text-success" };
  if (p.status === "IN_PROGRESS") return { text: "जवाब का इंतज़ार", tone: "text-warning" };
  return { text: "बुक है", tone: "text-ink-soft" };
}

/** My conversations with astrologers, newest first, with unread dots and the state of an open chat. */
export default function ChatList({ activeId }: { activeId: string | null }) {
  const { session, status } = useAuth();
  const pathname = usePathname();
  const selfId = session?.user.id ?? null;
  useRealtimeAccount(selfId);

  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [today, setToday] = useState("");

  useEffect(() => {
    if (!selfId) return;
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      listSessions(selfId, signal),
      getOpenPacksByAstrologer(signal).catch(() => new Map<string, OpenPackSummary>()),
      listAstrologers(signal).catch(() => []),
    ]).then(
      ([sessions, packs, astrologers]) => {
        const photos = new Map(astrologers.map((a) => [a.id, a]));
        const list: Row[] = [];
        for (const s of sessions) {
          const other = s.users.find((u) => u.id && u.id !== selfId);
          const me = s.users.find((u) => u.id === selfId);
          if (!other?.id) continue;
          const listed = photos.get(other.id);
          list.push({
            astrologerId: other.id,
            chatId: s.id,
            name: other.name || listed?.name || "ज्योतिषी",
            photo: listed?.photo ?? other.ppUrl ?? null,
            lastActivity: Math.max(me?.lastReceived || 0, other.lastReceived || 0),
            unread: isUnread(s, selfId) && other.id !== activeId,
            pack: packs.get(other.id),
          });
        }
        list.sort((a, b) => Number(!!b.pack) - Number(!!a.pack) || b.lastActivity - a.lastActivity);
        setRows(list);
        setFailed(false);
        setToday(new Date().toDateString());
      },
      () => {
        if (!signal.aborted) setFailed(true);
      },
    );
    return () => controller.abort();
  }, [selfId, reloadKey, activeId]);

  // A message, a started or ended chat: refresh a beat later (the server bumps the times right after).
  useRealtimeChannel(selfId ? globalChannel(selfId) : null, (event) => {
    if (!LIST_EVENTS.has(event)) return;
    setTimeout(() => setReloadKey((k) => k + 1), 600);
  });
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setReloadKey((k) => k + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <nav aria-label="आपकी चैट" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-line bg-surface-card">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h1 className="heading-6 text-ink">चैट</h1>
        <Link href="/astrologers" className="button-sm inline-flex items-center gap-1 rounded-full px-3 py-2 text-brand-strong transition hover:bg-surface-sunken active:scale-98">
          <PiPlus className="h-4 w-4" aria-hidden />
          नई चैट
        </Link>
      </div>

      {status === "signedOut" ? (
        <div className="flex flex-col items-start gap-3 p-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-sunken text-brand-strong">
            <PiChatCircleDots className="h-6 w-6" aria-hidden />
          </span>
          <p className="body-5 text-ink">अपनी चैट देखने के लिए लॉगिन करें</p>
          <p className="caption-2 text-ink-soft">ऐप वाले मोबाइल नंबर से लॉगिन करें। ज्योतिषियों से आपकी सारी बातचीत यहां मिलेगी, और wallet वही रहेगा।</p>
          <Link href={`/login?next=${encodeURIComponent(pathname || "/chat")}`} className={primaryButton}>
            <PiSignIn className="h-5 w-5" aria-hidden />
            लॉगिन करें
          </Link>
        </div>
      ) : rows === null ? (
        failed ? (
          <div role="alert" className="flex flex-col items-start gap-3 p-4">
            <p className="body-5 text-ink">चैट लोड नहीं हो सकीं।</p>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={secondaryButton}>
              <PiArrowClockwise className="h-4 w-4" aria-hidden />
              फिर से कोशिश करें
            </button>
          </div>
        ) : (
          <ul aria-busy="true" className="flex flex-col gap-2 p-3">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="h-16 animate-pulse rounded-2xl bg-surface-sunken" />
            ))}
          </ul>
        )
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-start gap-3 p-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-sunken text-brand-strong">
            <PiChatCircleDots className="h-6 w-6" aria-hidden />
          </span>
          <p className="body-5 text-ink">अभी कोई चैट नहीं है।</p>
          <p className="caption-2 text-ink-soft">किसी ज्योतिषी से अपना सवाल पूछें। आपकी सभी बातचीत यहां दिखेगी, ऐप और वेबसाइट दोनों पर।</p>
          <Link href="/astrologers" className={primaryButton}>
            ज्योतिषी चुनें
          </Link>
        </div>
      ) : (
        // relative: keeps the sr-only unread labels inside this scroll box, so a long list cannot stretch the page.
        <ul className="relative flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
          {rows.map((r) => {
            const active = r.astrologerId === activeId;
            const state = packLabel(r.pack);
            return (
              <li key={r.chatId}>
                <Link
                  href={`/chat/${encodeURIComponent(r.astrologerId)}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-2xl p-2 transition active:scale-98 ${active ? "bg-surface-sunken" : "hover:bg-surface-sunken"}`}
                >
                  <AstrologerAvatar name={r.name} photo={r.photo} size={48} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`title-4 truncate capitalize ${r.unread ? "text-ink" : "text-ink-soft"}`}>{r.name}</span>
                      <span className="caption-5 shrink-0 text-ink-muted">{activityLabel(r.lastActivity, today)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className={`caption-5 truncate ${state?.tone ?? "text-ink-muted"}`}>{state?.text ?? (r.unread ? "नया संदेश" : "बातचीत देखें")}</span>
                      {r.unread && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-brand">
                          <span className="sr-only">अनपढ़ा संदेश</span>
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
