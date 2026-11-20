"use client";

import { useSearchParams } from "next/navigation";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { deletePalmTalentReport, getPalmTalentReport, listPalmTalentReports, palmTalentPrintPath, type PalmTalentReport } from "@/lib/services/toolsPalmTalent";
import { Notice } from "../../kundli/_components/ui";
import { Disclaimer, DeleteButton, PrintButton, ReportError, ReportSkeleton, TalentBody, useReport } from "../_reportkit/kit";
import ReportList, { type ListItem } from "../_reportkit/ReportList";

const text = defineMessages({
  hi: {
    empty: "अभी तक कोई प्रतिभा रिपोर्ट नहीं है।",
    moved: "नई प्रतिभा रिपोर्टें अब हस्त रेखा रीडिंग का हिस्सा हैं। यहाँ पहले बनी रिपोर्टें खुलती, प्रिंट होती और हटती हैं।",
    awaiting: "समीक्षा की प्रतीक्षा में",
    pending: "यह रिपोर्ट समीक्षा की प्रतीक्षा में है और अभी पूरी नहीं हुई। इसे AstroShrine ऐप में पूरा करें।",
    mirror: "केवल एक हाथ की तस्वीर ली गई; दूसरे हाथ के मान उसी से मिलाए गए हैं, स्वतंत्र पठन नहीं हैं।",
    all: "सभी रिपोर्टें",
  },
  en: {
    empty: "No talent reports yet.",
    moved: "New talent reports are now part of the palm reading. Reports made earlier open, print and delete here.",
    awaiting: "Awaiting review",
    pending: "This report is awaiting review and is not finished. Finish it in the AstroShrine app.",
    mirror: "Only one hand was photographed; the other hand's values mirror it, not an independent reading.",
    all: "All reports",
  },
});

async function fetchPage(offset: number, signal: AbortSignal) {
  const p = await listPalmTalentReports(offset, signal);
  return { hasMore: p.hasMore, reports: p.reports.map((r): ListItem => ({ id: r.id, name: r.name, createdAt: r.createdAt, note: r.status === "ready" ? undefined : "awaiting_review" })) };
}

export default function PalmTalentView() {
  const id = useSearchParams().get("id");
  const t = useT(text);
  if (id) return <TalentReport key={id} id={id} />;
  return (
    <ReportList
      fetchPage={async (o, s) => {
        const p = await fetchPage(o, s);
        return { ...p, reports: p.reports.map((r) => ({ ...r, note: r.note ? t.awaiting : undefined })) };
      }}
      href={(rid) => `/tools/palm-talent?id=${encodeURIComponent(rid)}`}
      remove={deletePalmTalentReport}
      emptyText={t.empty}
      header={<Notice>{t.moved}</Notice>}
    />
  );
}

function TalentReport({ id }: { id: string }) {
  const { load, reload } = useReport(id, getPalmTalentReport);
  if (load.state === "loading") return <ReportSkeleton />;
  if (load.state === "error") return <ReportError failure={load.failure} backHref="/tools/palm-talent" onRetry={reload} />;
  return <Body report={load.data} />;
}

function Body({ report }: { report: PalmTalentReport }) {
  const t = useT(text);
  const router = useRouter();
  const lang = report.subject.language === "hi" ? "hi" : "en";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p lang={/[ऀ-ॿ]/.test(report.subject.name) ? "hi" : undefined} className="title-2 text-ink">
          {report.subject.name}
        </p>
        <div className="flex flex-wrap items-start gap-2">
          {report.status === "ready" && <PrintButton path={palmTalentPrintPath(report.id)} />}
          <DeleteButton name={report.subject.name} onDelete={() => deletePalmTalentReport(report.id)} onDone={() => router.push("/tools/palm-talent")} />
        </div>
      </div>
      {report.status !== "ready" || !report.scores || !report.content ? (
        <Notice tone="warning">{t.pending}</Notice>
      ) : (
        <>
          <Notice>{t.mirror}</Notice>
          <TalentBody scores={report.scores} content={report.content} lang={lang} />
          <Disclaimer text={report.disclaimer} lang={lang} />
        </>
      )}
    </div>
  );
}
