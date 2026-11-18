"use client";

import { useState } from "react";
import { PiUser } from "react-icons/pi";
import { INTL_LOCALE } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { coords, vaarName, wallToEpoch } from "@/lib/jyotish";
import type { OrderRow } from "@/lib/services/astrologerEarnings";
import { requestClientKundli, type ClientBirth, type ClientSheet } from "@/lib/services/astrologerSession";
import { Button, Card } from "../../_console/ui";
import type { Request } from "../../../kundli/_components/useJyotish";
import { dt } from "./design";
import { clockText, utcOffsetText } from "./kundliData";
import { text } from "./messages";
import { Head } from "./parts";

/** Who the customer is: their account and the birth details of the kundli, plus what is known of your earlier sessions. */
export default function CustomerCard({ clientName, birth, sheet, orders }: { clientName: string; birth: Request<ClientBirth>; sheet: Request<ClientSheet>; orders: OrderRow[] | null }) {
  const t = useT(dt);
  const locale = useLocale();
  const intl = INTL_LOCALE[locale];
  const s = sheet.data;
  const b = birth.data;
  const name = b?.name || clientName;
  const rows: [string, string][] = [[t.kName, name]];
  if (b?.gender) rows.push([t.kGender, t.genders[b.gender.toLowerCase()] ?? b.gender]);
  if (s) {
    const dob = `${s.birth.date.slice(8, 10)}/${s.birth.date.slice(5, 7)}/${s.birth.date.slice(0, 4)}`;
    rows.push([t.kDob, `${dob} · ${vaarName(s.vaar, locale)}`], [t.kTob, clockText(locale, s.birth.time.slice(0, 5))]);
    const place = s.profile.place || b?.placeOfBirth?.displayValue;
    if (place) rows.push([t.kPlace, place]);
    const at = wallToEpoch(s.birth.date, s.birth.time.slice(0, 5), s.birth.tz);
    rows.push([t.kCoords, `${coords(s.birth.lat, s.birth.lon)} · ${s.birth.tz} (${utcOffsetText(s.birth.tz, at)})`], [t.kSettings, t.settings(s.ayanamsha.name)]);
  } else if (b?.placeOfBirth?.displayValue) rows.push([t.kPlace, b.placeOfBirth.displayValue]);
  if (orders && orders.length > 0) {
    const last = new Intl.DateTimeFormat(intl, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kolkata" }).format(orders[0].orderTs);
    rows.push([t.kWith, t.withYou(orders.length, last)]);
  }
  return (
    <Card className="px-6 py-[22px]">
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
