"use client";

import { PiPlus } from "react-icons/pi";
import { useSearchParams } from "next/navigation";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { deleteDmitReport, listDmitReports } from "@/lib/services/toolsDmit";
import { btnPrimary, btnSecondary } from "../../kundli/_components/ui";
import { LABELS, labelOf } from "../_reportkit/labels";
import ReportList, { type ListItem } from "../_reportkit/ReportList";
import DmitForm from "./DmitForm";
import DmitReportView from "./DmitReportView";

const text = defineMessages({
  hi: { newReport: "नई रिपोर्ट", empty: "अभी तक कोई रिपोर्ट नहीं है।", top: "मुख्य बुद्धि", all: "सभी रिपोर्टें" },
  en: { newReport: "New report", empty: "No reports yet.", top: "Top intelligence", all: "All reports" },
});

export default function DmitView() {
  const params = useSearchParams();
  const t = useT(text);
  const l = useT(LABELS);
  const id = params.get("id");
  if (id) return <DmitReportView key={id} id={id} />;
  if (params.get("new")) {
    return (
      <div className="space-y-4">
        <Link href="/tools/dmit" className={btnSecondary}>
          {t.all}
        </Link>
        <DmitForm />
      </div>
    );
  }
  const fetchPage = async (offset: number, signal: AbortSignal) => {
    const p = await listDmitReports(offset, signal);
    return {
      hasMore: p.hasMore,
      reports: p.reports.map((r): ListItem => ({ id: r.id, name: r.name, createdAt: r.createdAt, note: r.topIntelligence ? `${t.top}: ${labelOf(l, r.topIntelligence)}` : undefined })),
    };
  };
  return (
    <ReportList
      fetchPage={fetchPage}
      href={(rid) => `/tools/dmit?id=${encodeURIComponent(rid)}`}
      remove={deleteDmitReport}
      emptyText={t.empty}
      header={
        <Link href="/tools/dmit?new=1" className={btnPrimary}>
          <PiPlus className="h-5 w-5" aria-hidden /> {t.newReport}
        </Link>
      }
    />
  );
}
