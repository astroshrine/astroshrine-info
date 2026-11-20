"use client";

import { PiChatCircleText } from "react-icons/pi";
import { useT } from "@/i18n/LocaleProvider";
import { listMyChats } from "@/lib/services/astrologerSession";
import { useJyotish } from "../../../kundli/_components/useJyotish";
import { Button, Card, Pill } from "../../_console/ui";
import { text } from "./messages";

/** Without ?chat=<id>: the astrologer's chats, running ones first, each linking to its session. */
export default function Chooser({ selfId }: { selfId: string }) {
  const t = useT(text);
  const req = useJyotish(`chats|${selfId}`, (signal) => listMyChats(selfId, signal));
  const list = req.data;

  return (
    <Card className="px-[22px] py-5">
      <h2 className="font-display text-2xl font-bold leading-tight">{t.chooseTitle}</h2>
      <p className="m-0 mt-1 text-sm text-ink-soft">{t.chooseSub}</p>
      {req.loading ? (
        <div aria-busy="true" aria-label={t.loading} className="mt-4 flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-surface-sunken" />
          ))}
        </div>
      ) : req.error ? (
        <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-[14px] bg-danger-soft px-4 py-3 text-sm text-danger">
          {t.loadFailed}
          <button type="button" onClick={req.retry} className="cursor-pointer font-bold underline">
            {t.retry}
          </button>
        </div>
      ) : list && list.length === 0 ? (
        <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl bg-surface-sunken px-5 py-6">
          <b className="text-lg">{t.noChatsTitle}</b>
          <p className="m-0 text-[15px]">{t.noChatsBody}</p>
          <Button href="/astrologer" size="sm">
            {t.goHome}
          </Button>
        </div>
      ) : (
        <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
          {list?.map((c) => {
            const running = c.pack?.status === "IN_PROGRESS";
            return (
              <li key={c.chatId} className={`flex flex-wrap items-center gap-3.5 rounded-2xl px-4 py-3.5 ${running ? "border-[1.5px] border-brand bg-surface-sunken" : "border border-line bg-surface-page"}`}>
                <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-inverse text-brand">
                  <PiChatCircleText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-[1_1_160px]">
                  <div className="truncate text-base font-bold">{c.name || t.customer}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Pill tone={running ? "green" : c.waiting ? "amber" : "neutral"} className="h-6 text-xs">
                      {running ? t.stRunning : c.waiting ? t.stWaiting : t.stPast}
                    </Pill>
                    {c.unread && <Pill tone="gold" className="h-6 text-xs">{t.stNew}</Pill>}
                  </div>
                </div>
                <Button href={`/astrologer/session?chat=${encodeURIComponent(c.chatId)}${c.pack ? `&booking=${encodeURIComponent(c.pack.bookingId)}` : ""}`} size="sm" variant={running ? "navy" : "line"}>
                  {t.open}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
