"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PiChatCircleText, PiDiamond, PiPower } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { isPackOpen } from "@/lib/services/chat";
import { clientOf, fetchClientSheet, getClientBirth, isForbidden, isMissing } from "@/lib/services/astrologerSession";
import { getChatQueue } from "@/lib/services/astrologerHome";
import { getOrders } from "@/lib/services/astrologerEarnings";
import { listSessions } from "@/lib/services/chat";
import { fetchPanchang, fetchTransits } from "@/lib/services/jyotish";
import { generateChart } from "@/lib/endpoints";
import { useRealtimeAccount } from "@/lib/services/useRealtime";
import { useJyotish } from "../../../kundli/_components/useJyotish";
import { Accent, Button, Card, Ornament, Page, PageTitle } from "../../_console/ui";
import Analysis, { Notes } from "./Analysis";
import Chat, { clockParts } from "./Chat";
import ChartsTab from "./ChartsTab";
import Chooser from "./Chooser";
import CustomerCard, { AskBirth } from "./CustomerCard";
import DashaExplorer from "./DashaExplorer";
import KundliTab from "./KundliTab";
import NewKundliTab from "./NewKundliTab";
import PredictionsTab from "./PredictionsTab";
import RemediesTab from "./RemediesTab";
import TransitTab from "./TransitTab";
import { dt } from "./design";
import { cityOf, clockText } from "./kundliData";
import { text } from "./messages";
import { useSessionChat } from "./useSessionChat";

const TABS = ["kundli", "transit", "predictions", "charts", "remedies", "newk"] as const;
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
  const d = useT(dt);
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>("kundli");
  const [confirming, setConfirming] = useState(false);
  const chat = useSessionChat({ chatId, clientId, selfId, bookingId });

  const birth = useJyotish(`cbirth|${clientId}`, (signal) => getClientBirth(clientId, signal));
  const sheet = useJyotish(`csheet|${clientId}`, (signal) => fetchClientSheet(clientId, signal));
  const s = sheet.data;
  const bk = s ? `${s.birth.date}T${s.birth.time}|${s.birth.lat},${s.birth.lon}` : null;
  const transits = useJyotish(bk ? `ctransit|${bk}` : null, (signal) => fetchTransits(s!.birth, 36, undefined, signal));
  const chart = useJyotish(bk ? `cchart|${bk}` : null, (signal) => generateChart(s!.birth, signal));
  const panchang = useJyotish(bk ? `cpanchang|${bk}` : null, (signal) => fetchPanchang(s!.birth.date, { name: "", lat: s!.birth.lat, lon: s!.birth.lon, tz: s!.birth.tz }, signal));
  // The sessions I have had with this customer in the last year (the earnings records), and who else is waiting on Home.
  const orders = useJyotish(`corders|${selfId}|${clientId}`, async (signal) => {
    const end = Date.now();
    return (await getOrders(selfId, end - 365 * 24 * 60 * 60 * 1000, end, signal)).filter((o) => o.customerId === clientId && o.orderType !== "livestream");
  });
  const queue = useJyotish(`cqueue|${selfId}`, (signal) => getChatQueue(signal));
  const waitingOthers = queue.data ? queue.data.filter((w) => w.userId !== clientId).length : 0;

  const name = birth.data?.name || clientName;
  const first = name.split(/\s+/)[0] ?? name;
  const open = !!chat.pack && isPackOpen(chat.pack.status) && !chat.pack.expired;
  const place = s ? cityOf(s.profile.place) : "";
  const intl = INTL_LOCALE[locale];
  const born = s
    ? d.born(new Intl.DateTimeFormat(intl, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(Date.parse(`${s.birth.date}T00:00:00Z`)), clockText(locale, s.birth.time.slice(0, 5)), place)
    : "";
  const clock = clockParts(chat);

  const needSheet = (node: React.ReactNode) =>
    sheet.loading ? (
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
      node
    );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          className="min-w-0 flex-[1_1_520px]"
          eyebrow={t.eyebrow}
          title={first ? <>{d.titlePre}<Accent>{first}</Accent>{d.titlePost}</> : t.title}
          sub={waitingOthers > 0 ? d.waiting(waitingOthers) : undefined}
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
      <div className="grid grid-cols-1 items-stretch gap-6 min-[1101px]:grid-cols-[minmax(0,1fr)_430px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="px-6 py-[22px]">
            <div className="flex items-center gap-3.5">
              <span aria-hidden className="inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-surface-inverse text-brand shadow-[0_0_0_4px_var(--color-surface-sunken)]">
                <PiDiamond className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-bold leading-tight">{first ? d.kundliOf(first) : t.kundliOfCustomer}</h2>
                {born && <div className="text-sm text-ink-soft">{born}</div>}
              </div>
            </div>
            <div role="tablist" aria-label={d.toolsLabel} className="mt-4 flex flex-wrap gap-1.5">
              {TABS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={k === tab}
                  onClick={() => setTab(k)}
                  className={`h-11 cursor-pointer rounded-full px-[13px] text-sm font-bold transition ${k === tab ? "bg-surface-inverse text-brand shadow-[0_8px_16px_-10px_rgba(20,33,61,.8)]" : "border border-line-strong bg-surface-page text-ink hover:bg-surface-sunken"}`}
                >
                  {d.tabs[k]}
                </button>
              ))}
            </div>
          </Card>
          {tab === "kundli" && needSheet(s && <KundliTab sheet={s} now={sheet.at} name={first} />)}
          {tab === "transit" && needSheet(s && <TransitTab sheet={s} transits={transits} now={sheet.at} name={first} />)}
          {tab === "predictions" && needSheet(s && <PredictionsTab sheet={s} now={sheet.at} />)}
          {tab === "charts" && needSheet(s && <ChartsTab sheet={s} name={first} />)}
          {tab === "remedies" && needSheet(s && <RemediesTab sheet={s} now={sheet.at} chatId={chatId} clientId={clientId} astrologerId={selfId} />)}
          {tab === "newk" && <NewKundliTab />}
        </div>
        <aside aria-label={t.customer} className="flex min-w-0 flex-col gap-6">
          <Chat chat={chat} selfId={selfId} name={name} ppUrl={ppUrl} place={place} kundliShared={!!s} />
          <CustomerCard clientName={clientName} birth={birth} sheet={sheet} orders={orders.data ?? null} />
        </aside>
      </div>
      <div className="flex flex-col gap-6">
        {s && (
          <>
            <DashaExplorer sheet={s} now={sheet.at} />
            <Analysis sheet={s} now={sheet.at} name={first} chart={chart} transits={transits} panchang={panchang} orders={orders.data ?? null} />
          </>
        )}
        <Notes clientId={clientId} />
        <div className="pointer-events-none sticky bottom-4 z-20 flex justify-end">
          <a
            href="#chatbox"
            className="pointer-events-auto inline-flex h-[54px] items-center justify-center gap-2 whitespace-nowrap rounded-[14px] bg-surface-inverse px-6 text-[15px] font-bold text-ink-inverse shadow-[0_16px_30px_-12px_rgba(20,33,61,.75)] transition hover:bg-surface-inverse-raised motion-safe:active:scale-[0.97]"
          >
            <PiChatCircleText className="h-[18px] w-[18px]" aria-hidden />
            {d.backChat(first)}
            {clock && <span className="inline-flex h-7 items-center rounded-full bg-brand px-3 text-[13px] tabular-nums text-brand-ink">{clock.time}</span>}
          </a>
        </div>
      </div>
    </>
  );
}
