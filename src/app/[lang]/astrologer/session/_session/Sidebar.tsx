"use client";

import { useState } from "react";
import { PiDiamond, PiNotePencil, PiUser } from "react-icons/pi";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { day, lordName, nakshatraName, rashiName, runningIndex } from "@/lib/jyotish";
import { requestClientKundli, type ClientBirth, type ClientSheet } from "@/lib/services/astrologerSession";
import { Button, Card } from "../../_console/ui";
import { text } from "./messages";
import { Head } from "./parts";
import type { Request } from "../../../kundli/_components/useJyotish";

const card = "px-[22px] py-5";
const NOTES_KEY = (clientId: string) => `astroshrine.astrologer.notes.${clientId}`;

function readNotes(clientId: string): string {
  try {
    return localStorage.getItem(NOTES_KEY(clientId)) ?? "";
  } catch {
    return "";
  }
}

/** The cards beside the chat: who the customer is (from their account and kundli), and your notes on this device. */
export default function Sidebar({
  clientId,
  clientName,
  birth,
  sheet,
}: {
  clientId: string;
  clientName: string;
  birth: Request<ClientBirth>;
  sheet: Request<ClientSheet>;
}) {
  const t = useT(text);
  const locale = useLocale();
  const s = sheet.data;
  const b = birth.data;
  const name = b?.name || clientName;
  const rows: [string, string][] = [
    [t.name, name],
    ...(b?.gender ? ([[t.gender, t.genders[b.gender.toLowerCase()] ?? b.gender]] as [string, string][]) : []),
    ...(s ? ([[t.dob, day(s.birth.date)], [t.tob, s.birth.time.slice(0, 5)]] as [string, string][]) : []),
    ...(s?.profile.place || b?.placeOfBirth?.displayValue ? ([[t.place, s?.profile.place || b?.placeOfBirth?.displayValue || ""]] as [string, string][]) : []),
  ];

  const lagna = s?.rows.find((r) => r.graha === "Lagna");
  const moon = s?.rows.find((r) => r.graha === "Moon");
  const maha = s ? s.dasha.vimshottari.periods[runningIndex(s.dasha.vimshottari.periods, sheet.at)] : undefined;
  const basic: [string, string][] = lagna && moon ? [
    [t.lagna, rashiName(lagna.rashi, locale)],
    [t.moonSign, rashiName(moon.rashi, locale)],
    [t.nakshatra, `${nakshatraName(moon.nakshatra, locale)} ${moon.pada}`],
    ...(maha ? ([[t.dashaNow, lordName(maha.lord, locale)]] as [string, string][]) : []),
  ] : [];

  return (
    <>
      <Card className={card}>
        <Head icon={PiUser} small>
          {t.custTitle}
        </Head>
        <dl className="m-0 mt-3 flex flex-col">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[120px_1fr] gap-2.5 border-t border-line py-[9px] text-[14.5px]">
              <dt className="font-semibold text-ink-soft">{k}</dt>
              <dd className="m-0 break-words font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {basic.length > 0 && (
        <Card className={card}>
          <Head icon={PiDiamond} small>
            {t.basicTitle}
          </Head>
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            {basic.map(([k, v]) => (
              <div key={k} className="min-w-0 rounded-xl border border-line bg-surface-page px-3 py-[9px]">
                <div className="text-xs font-bold text-brand-strong">{k}</div>
                <div className="text-[14.5px] font-bold">{v}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Notes clientId={clientId} />
    </>
  );
}

/** No birth details saved by the customer: ask them in the chat (POST /v1/chat/:id/kundli {kind: 'request'}). */
export function AskBirth({ chatId }: { chatId: string }) {
  const t = useT(text);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const ask = async () => {
    setState("sending");
    try {
      await requestClientKundli(chatId);
      setState("sent");
    } catch {
      setState("failed");
    }
  };
  return (
    <div className="rounded-[14px] border border-[#F2D58A] bg-[#FFF7E3] px-3.5 py-3">
      <b className="block text-[15px]">{t.noBirthTitle}</b>
      <p className="m-0 mt-1 text-sm">{t.noBirthBody}</p>
      <Button onClick={ask} disabled={state === "sending" || state === "sent"} size="sm" variant="navy" className="mt-3">
        {state === "sending" ? t.askSending : t.askKundli}
      </Button>
      <div role="status" className="mt-2 text-sm font-semibold">
        {state === "sent" && <span className="text-success">{t.askSent}</span>}
        {state === "failed" && <span className="text-danger">{t.askFailed}</span>}
      </div>
    </div>
  );
}

/** Notes have no backend: they stay in this browser, per customer, and say so. */
function Notes({ clientId }: { clientId: string }) {
  const t = useT(text);
  const [notes, setNotes] = useState(() => readNotes(clientId));
  const change = (value: string) => {
    setNotes(value);
    try {
      if (value) localStorage.setItem(NOTES_KEY(clientId), value);
      else localStorage.removeItem(NOTES_KEY(clientId));
    } catch {
      /* private window: the notes last until the page closes */
    }
  };
  return (
    <Card className={card}>
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-surface-inverse text-brand shadow-[0_0_0_4px_var(--color-surface-sunken)]">
          <PiNotePencil className="h-5 w-5" />
        </span>
        <label htmlFor="nt" className="font-display text-[21px] font-bold leading-tight">
          {t.notesTitle}
        </label>
      </div>
      <div className="mb-2.5 mt-1.5 text-sm text-ink-soft">{t.notesSub}</div>
      <textarea
        id="nt"
        value={notes}
        onChange={(e) => change(e.target.value)}
        rows={5}
        placeholder={t.notesPlaceholder}
        className="w-full resize-y rounded-[14px] border border-line-strong bg-surface-page px-3.5 py-3 text-[15px] leading-[1.55] text-ink"
      />
    </Card>
  );
}
