"use client";

import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { deleteDmitReport, dmitPrintPath, getDmitReport, type DmitReport } from "@/lib/services/toolsDmit";
import { LABELS, labelOf } from "../_reportkit/labels";
import {
  DeleteButton,
  Disclaimer,
  PrintButton,
  RankedBars,
  ReportError,
  ReportSkeleton,
  Section,
  TextBlockView,
  useKitText,
  useReport,
} from "../_reportkit/kit";

const text = defineMessages({
  hi: {
    trc: "कुल रिज गणना (TRC)",
    atd: "ATD कोण",
    top: "शीर्ष 3 बुद्धियाँ",
    primary: "मुख्य व्यक्तित्व",
    secondary: "द्वितीयक व्यक्तित्व",
    brain: "बायाँ / दायाँ मस्तिष्क",
    born: "जन्म तिथि",
    personality: "व्यक्तित्व (पक्षी प्रकार)",
    lobes: "मस्तिष्क के लोब",
    leadership: "नेतृत्व शैली",
    thought: "विचार प्रक्रिया",
    riasec: "करियर रुचि (RIASEC)",
    stream: "उपयुक्त स्ट्रीम",
  },
  en: {
    trc: "Total ridge count (TRC)",
    atd: "ATD angle",
    top: "Top 3 intelligences",
    primary: "Primary personality",
    secondary: "Secondary personality",
    brain: "Left / right brain",
    born: "Date of birth",
    personality: "Personality (bird type)",
    lobes: "Brain lobes",
    leadership: "Leadership style",
    thought: "Thought process",
    riasec: "Career interests (RIASEC)",
    stream: "Suited stream",
  },
});

/** R1 / L1's pattern decides the primary bird, same lookup as the app's report. */
const PATTERN_BIRD: Record<string, string> = { whorl: "eagle", ulnar_loop: "dove", composite_whorl: "owl", radial_loop: "peacock", arch: "owl" };

export default function DmitReportView({ id }: { id: string }) {
  const { load, reload } = useReport(id, getDmitReport);
  if (load.state === "loading") return <ReportSkeleton />;
  if (load.state === "error") return <ReportError failure={load.failure} backHref="/tools/dmit" onRetry={reload} />;
  return <Report report={load.data} />;
}

function Report({ report }: { report: DmitReport }) {
  const t = useT(text);
  const k = useKitText();
  const l = useT(LABELS);
  const router = useRouter();
  const lang = report.subject.language === "hi" ? "hi" : "en";
  const { scores, content } = report;
  const key = (x: string) => labelOf(l, x);
  const mi = Object.entries(scores.multipleIntelligence).sort((a, b) => b[1] - a[1]);
  const bird = PATTERN_BIRD[scores.fingers.R1?.pattern] ?? "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="body-5 text-ink-soft">
          <b lang={/[ऀ-ॿ]/.test(report.subject.name) ? "hi" : undefined} className="text-ink">
            {report.subject.name}
          </b>{" "}
          · {t.born}: {report.subject.dateOfBirth}
        </p>
        <div className="flex flex-wrap items-start gap-2">
          <PrintButton path={dmitPrintPath(report.id)} />
          <DeleteButton name={report.subject.name} onDelete={() => deleteDmitReport(report.id)} onDone={() => router.push("/tools/dmit")} />
        </div>
      </div>

      <Section title={k.summary}>
        <h3 className="title-4 text-ink">{t.brain}</h3>
        <RankedBars data={{ left: scores.brainDominance.left, right: scores.brainDominance.right }} />
        <p className="body-6 text-ink">
          {t.trc}: <b>{scores.trc}</b> ({key(scores.trcBand)})
        </p>
        <p className="body-6 text-ink">
          {t.atd}: <b>{scores.atd.left}° / {scores.atd.right}°</b> ({key(scores.atd.band)})
        </p>
        {content.atdBand[scores.atd.band]?.description && (
          <p lang={lang} className="caption-1 text-ink-soft">
            {content.atdBand[scores.atd.band].description}
          </p>
        )}
        <h3 className="title-4 text-ink">{t.top}</h3>
        <ul className="body-6 list-disc pl-5 text-ink">
          {mi.slice(0, 3).map(([x, v]) => (
            <li key={x}>
              {key(x)}: {v}%
            </li>
          ))}
        </ul>
        <p className="body-6 text-ink">
          {t.primary}: <b>{key(scores.personality.primary)}</b> · {t.secondary}: <b>{key(scores.personality.secondary)}</b>
        </p>
      </Section>

      <Section title={t.personality}>
        <RankedBars data={scores.personality.birds} />
        {bird && <TextBlockView title={key(bird)} block={content.birds[bird]} lang={lang} />}
      </Section>
      <Section title={t.lobes}>
        <RankedBars data={scores.lobes} />
      </Section>
      <Section title={k.fingerStrength}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-80 text-left">
            <thead>
              <tr className="caption-3 border-b border-line text-ink-soft">
                <th className="py-1 pr-2 font-medium">{k.fingerCol}</th>
                <th className="py-1 pr-2 font-medium">{k.pattern}</th>
                <th className="py-1 pr-2 font-medium">%</th>
                <th className="py-1 font-medium">{k.bandCol}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(scores.fingers).map(([f, s]) => (
                <tr key={f} className="body-6 border-b border-line/60 text-ink">
                  <td className="py-1 pr-2">{f}</td>
                  <td className="py-1 pr-2">{l.patternName[s.pattern] ?? s.pattern}</td>
                  <td className="py-1 pr-2">{s.percent}</td>
                  <td className="py-1">{key(s.band)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title={k.multipleIntelligence}>
        <RankedBars data={scores.multipleIntelligence} />
        {mi.map(([x]) => (
          <TextBlockView key={x} title={key(x)} block={content.intelligence[x]} lang={lang} />
        ))}
      </Section>
      <Section title={k.quotients}>
        <RankedBars data={scores.quotients} />
        {Object.keys(scores.quotients).map((x) => (
          <TextBlockView key={x} title={key(x)} block={content.quotients[x]} lang={lang} />
        ))}
      </Section>
      <Section title={k.learningStyle}>
        <RankedBars data={scores.learningStyle} />
        {Object.keys(scores.learningStyle).map((x) => (
          <TextBlockView key={x} title={key(x)} block={content.learningStyle[x]} lang={lang} />
        ))}
      </Section>
      <Section title={k.acquiringMethods}>
        <RankedBars data={scores.learnerType} />
        {Object.keys(scores.learnerType).map((x) => (
          <TextBlockView key={x} title={key(x)} block={content.learnerType[x]} lang={lang} />
        ))}
      </Section>
      <Section title={t.leadership}>
        <RankedBars data={scores.leadership} />
      </Section>
      <Section title={t.thought}>
        <RankedBars data={scores.thoughtProcess} />
      </Section>
      <Section title={t.riasec}>
        <RankedBars data={scores.riasec} />
      </Section>
      <Section title={t.stream}>
        <RankedBars data={scores.stream} />
      </Section>
      <Section title={k.careerDomains}>
        <RankedBars data={scores.careerDomains} />
      </Section>
      <Section title={k.activities}>
        <RankedBars data={scores.activities} />
      </Section>
      <Disclaimer text={report.disclaimer} lang={lang} />
    </div>
  );
}
