"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PiDiamond, PiPower } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { useT } from "@/i18n/LocaleProvider";
import { isPackOpen } from "@/lib/services/chat";
import { clientOf, fetchClientSheet, getClientBirth, isForbidden, isMissing } from "@/lib/services/astrologerSession";
import { listSessions } from "@/lib/services/chat";
import { fetchTransits } from "@/lib/services/jyotish";
import { generateChart } from "@/lib/endpoints";
import { useRealtimeAccount } from "@/lib/services/useRealtime";
import { day } from "@/lib/jyotish";
import { useJyotish } from "../../../kundli/_components/useJyotish";
import { Accent, Button, Card, Ornament, Page, PageTitle } from "../../_console/ui";
import Chat from "./Chat";
import ChartsTab from "./ChartsTab";
import Chooser from "./Chooser";
import KundliTab from "./KundliTab";
import RemediesTab from "./RemediesTab";
import Sidebar, { AskBirth } from "./Sidebar";
import TransitTab from "./TransitTab";
import YogasTab from "./YogasTab";
import { text } from "./messages";
import { useSessionChat } from "./useSessionChat";

const TABS = ["kundli", "transit", "charts", "yogas", "remedies"] as const;
type Tab = (typeof TABS)[number];
const ID = /^[\w-]{1,64}$/;

/** /astrologer/session?chat=<chat id>[&booking=<pack id>]: the live console. Without a chat id, a chooser of my chats. */
export default function SessionView() {
  const t = useT(text);
  const { status, session } = useAuth();
  const params = useSearchParams();
  const raw = params.get("chat");
  const chatId = raw && ID.test(raw) ? raw : null;
  const rawBooking = params.get("booking");
  const booking = rawBooking && ID.test(rawBooking) ? rawBooking : null;
  const selfId = session?.user.id ?? null;
  useRealtimeAccount(selfId);

  return (
    <Page>
      {status === "loading" ? (
        <div aria-busy="true" aria-label={t.loading} className="h-64 animate-pulse rounded-[22px] bg-surface-sunken" />
      ) : !selfId ? (
        <>
          <PageTitle eyebrow={t.eyebrow} title={t.title} sub={t.sub} />
          <Card className="flex flex-col items-start gap-3 px-6 py-6">
            <h2 className="font-display text-2xl font-bold">{t.signedOutTitle}</h2>
            <p className="m-0 text-[15px] text-ink-soft">{t.signedOutBody}</p>
            <Button href="/astrologer/login">{t.signIn}</Button>
          </Card>
        </>
      ) : chatId ? (
        <Room key={`${chatId}:${booking ?? ""}`} chatId={chatId} bookingId={booking} selfId={selfId} />
      ) : (
        <>
          <PageTitle eyebrow={t.eyebrow} title={t.title} sub={t.sub} />
          <Ornament />
          <Chooser selfId={selfId} />
        </>
      )}
    </Page>
  );
}

/** One conversation: finds the customer in my conversations, then loads their chat and kundli. */
function Room({ chatId, bookingId, selfId }: { chatId: string; bookingId: string | null; selfId: string }) {
  const t = useT(text);
  const sessions = useJyotish(`sessions|${selfId}`, (signal) => listSessions(selfId, signal));
  const found = sessions.data?.find((s) => s.id === chatId);
  const client = found ? clientOf(found, selfId) : null;

  if (sessions.loading) return <div aria-busy="true" aria-label={t.loading} className="h-64 animate-pulse rounded-[22px] bg-surface-sunken" />;
  if (sessions.error)
    return (
      <Card className="flex flex-wrap items-center gap-3 px-6 py-5 text-danger" role="alert">
        {t.loadFailed}
        <button type="button" onClick={sessions.retry} className="cursor-pointer font-bold underline">
          {t.retry}
        </button>
      </Card>
    );
  if (!client)
    return (
      <>
        <PageTitle eyebrow={t.eyebrow} title={t.notFoundTitle} sub={t.notFoundBody} />
        <div>
          <Button href="/astrologer/session" variant="line">
            {t.allChats}
          </Button>
        </div>
      </>
    );
  return <RoomBody chatId={chatId} bookingId={bookingId} selfId={selfId} clientId={client.id} clientName={client.name ?? ""} ppUrl={client.ppUrl} />;
}

function RoomBody({ chatId, bookingId, selfId, clientId, clientName, ppUrl }: { chatId: string; bookingId: string | null; selfId: string; clientId: string; clientName: string; ppUrl?: string }) {
  const t = useT(text);
  const [tab, setTab] = useState<Tab>("kundli");
  const [confirming, setConfirming] = useState(false);
  const chat = useSessionChat({ chatId, clientId, selfId, bookingId });

  const birth = useJyotish(`cbirth|${clientId}`, (signal) => getClientBirth(clientId, signal));
  const sheet = useJyotish(`csheet|${clientId}`, (signal) => fetchClientSheet(clientId, signal));
  const s = sheet.data;
  const bk = s ? `${s.birth.date}T${s.birth.time}|${s.birth.lat},${s.birth.lon}` : null;
  const transits = useJyotish(bk ? `ctransit|${bk}` : null, (signal) => fetchTransits(s!.birth, 36, undefined, signal));
  const chart = useJyotish(bk ? `cchart|${bk}` : null, (signal) => generateChart(s!.birth, signal));

  const name = birth.data?.name || clientName;
  const open = !!chat.pack && isPackOpen(chat.pack.status) && !chat.pack.expired;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          className="min-w-0 flex-[1_1_520px]"
          eyebrow={t.eyebrow}
          title={name ? <Accent>{t.titleWith(name)}</Accent> : t.title}
          sub={t.sub}
        />
        {open && !confirming && (
          <Button onClick={() => setConfirming(true)} variant="red">
            <PiPower className="h-[18px] w-[18px]" />
            {t.end}
          </Button>
        )}
        {!open && (
          <Button href="/astrologer/session" variant="line">
            {t.allChats}
          </Button>
        )}
      </div>
      {confirming && open && (
        <Card role="alertdialog" aria-labelledby="end-t" className="flex flex-wrap items-center gap-x-5 gap-y-3 border-danger px-5 py-4">
          <div className="min-w-0 flex-[1_1_320px]">
            <b id="end-t" className="block text-base">
              {t.endTitle}
            </b>
            <span className="text-sm text-ink-soft">{t.endBody}</span>
            {chat.endFailed && (
              <span role="alert" className="mt-1 block text-sm font-bold text-danger">
                {t.endFailed}
              </span>
            )}
          </div>
          <Button
            variant="red"
            disabled={chat.ending}
            onClick={async () => {
              await chat.end();
              setConfirming(false);
            }}
          >
            {chat.ending ? t.ending : t.endConfirm}
          </Button>
          <Button variant="line" onClick={() => setConfirming(false)}>
            {t.endKeep}
          </Button>
        </Card>
      )}
      <Ornament />
      <div className="grid grid-cols-1 items-start gap-6 min-[1101px]:grid-cols-[minmax(0,1fr)_430px]">
        <aside aria-label={t.customer} className="order-first flex min-w-0 flex-col gap-6 p-0.5 min-[1101px]:sticky min-[1101px]:top-4 min-[1101px]:order-last min-[1101px]:max-h-[max(900px,calc(100vh-32px))] min-[1101px]:overflow-y-auto">
          <Chat chat={chat} selfId={selfId} name={name} ppUrl={ppUrl} />
          <Sidebar clientId={clientId} clientName={clientName} birth={birth} sheet={sheet} />
        </aside>
        <div className="flex min-w-0 flex-col gap-6">
          {sheet.loading ? (
            <div aria-busy="true" aria-label={t.loading} className="flex flex-col gap-6">
              <div className="h-32 animate-pulse rounded-[22px] bg-surface-sunken" />
              <div className="h-96 animate-pulse rounded-[22px] bg-surface-sunken" />
            </div>
          ) : !s ? (
            <Card className="flex flex-col items-start gap-3 px-6 py-6">
              {isMissing(sheet.error) ? (
                <AskBirth chatId={chatId} />
              ) : isForbidden(sheet.error) ? (
                <>
                  <h2 className="font-display text-2xl font-bold">{t.noAccessTitle}</h2>
                  <p className="m-0 text-[15px] text-ink-soft">{t.noAccessBody}</p>
                </>
              ) : (
                <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-danger">
                  {t.calcFailed}
                  <button type="button" onClick={sheet.retry} className="cursor-pointer font-bold underline">
                    {t.retry}
                  </button>
                </div>
              )}
            </Card>
          ) : (
            <>
              <Card className="px-[22px] py-5">
                <div className="flex items-center gap-3.5">
                  <span aria-hidden className="inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-surface-inverse text-brand shadow-[0_0_0_4px_var(--color-surface-sunken)]">
                    <PiDiamond className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl font-bold leading-tight">{name ? t.kundliOf(name) : t.kundliOfCustomer}</h2>
                    <div className="text-sm text-ink-soft">{t.born(day(s.birth.date), s.birth.time.slice(0, 5), s.profile.place)}</div>
                  </div>
                </div>
                <div role="tablist" aria-label={t.toolsLabel} className="mt-4 flex flex-wrap gap-1.5">
                  {TABS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="tab"
                      aria-selected={k === tab}
                      onClick={() => setTab(k)}
                      className={`h-11 cursor-pointer rounded-full px-[13px] text-sm font-bold transition ${k === tab ? "bg-surface-inverse text-brand shadow-[0_8px_16px_-10px_rgba(20,33,61,.8)]" : "border border-line-strong bg-surface-page text-ink hover:bg-surface-sunken"}`}
                    >
                      {t.tabs[k]}
                    </button>
                  ))}
                </div>
              </Card>
              {tab === "kundli" && <KundliTab sheet={s} now={sheet.at} />}
              {tab === "transit" && <TransitTab sheet={s} transits={transits} now={sheet.at} />}
              {tab === "charts" && <ChartsTab sheet={s} />}
              {tab === "yogas" && <YogasTab chart={chart} />}
              {tab === "remedies" && <RemediesTab sheet={s} chatId={chatId} clientId={clientId} astrologerId={selfId} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}
