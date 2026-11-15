"use client";

import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { grahaAbbr, grahaName, rashiName, type ChartHouse } from "@/lib/jyotish";

const text = defineMessages({
  hi: { lagna: "लग्न", house: (n: number) => `भाव ${n}` },
  en: { lagna: "Asc", house: (n) => `House ${n}` },
});

// North Indian (diamond) chart: the app's KundliChart geometry (viewBox 400). House 1 is the top diamond and
// the houses run anticlockwise; each house shows its rashi number and the grahas in it (ᴿ = retrograde).
const VB = 400;
const PAD = 10;
const TL = [PAD, PAD], TR = [VB - PAD, PAD], BL = [PAD, VB - PAD], BR = [VB - PAD, VB - PAD];
const MT = [VB / 2, PAD], MR = [VB - PAD, VB / 2], MB = [VB / 2, VB - PAD], ML = [PAD, VB / 2];
const CTR = [VB / 2, VB / 2];
// Inner corners of the top diamond (house 1, the lagna), which is shaded.
const D_TL = [105, 105], D_TR = [295, 105];

const pts = (...p: number[][]) => p.map(([x, y]) => `${x},${y}`).join(" ");

const HOUSE_CENTER: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 115 },
  2: { x: 115, y: 52 },
  3: { x: 52, y: 115 },
  4: { x: 115, y: 200 },
  5: { x: 52, y: 285 },
  6: { x: 115, y: 348 },
  7: { x: 200, y: 285 },
  8: { x: 285, y: 348 },
  9: { x: 348, y: 285 },
  10: { x: 285, y: 200 },
  11: { x: 348, y: 115 },
  12: { x: 285, y: 52 },
};

const isDiamond = (h: number) => h === 1 || h === 4 || h === 7 || h === 10;

export default function NorthIndianChart({
  houses,
  label,
  lagnaLabel,
  className = "",
}: {
  houses: ChartHouse[];
  label: string;
  /** The word under house 1 (the lagna by default; the Moon on a Chandra chart); empty to hide. */
  lagnaLabel?: string;
  className?: string;
}) {
  const locale = useLocale();
  const t = useT(text);
  const centre = lagnaLabel ?? t.lagna;
  const summary = houses
    .map(
      (h) =>
        `${t.house(h.house)}, ${rashiName(h.rashi, locale)}${
          h.planets.length ? `: ${h.planets.map((p) => grahaName(p.graha, locale)).join(", ")}` : ""
        }`,
    )
    .join("; ");

  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} role="img" aria-label={`${label}. ${summary}`} className={`h-auto w-full ${className}`}>
      <rect x={PAD} y={PAD} width={VB - 2 * PAD} height={VB - 2 * PAD} rx={8} className="fill-surface-sunken" />
      <polygon points={pts(MT, D_TR, CTR, D_TL)} className="fill-brand-soft" opacity={0.55} />
      <g className="stroke-brand-strong" strokeWidth={1.5} fill="none" strokeLinejoin="round">
        <rect x={PAD} y={PAD} width={VB - 2 * PAD} height={VB - 2 * PAD} rx={8} />
        <line x1={TL[0]} y1={TL[1]} x2={BR[0]} y2={BR[1]} />
        <line x1={TR[0]} y1={TR[1]} x2={BL[0]} y2={BL[1]} />
        <polygon points={pts(MT, MR, MB, ML)} />
      </g>

      {houses.map((h) => {
        const c = HOUSE_CENTER[h.house];
        const perRow = isDiamond(h.house) ? 3 : 2;
        const rows: ChartHouse["planets"][] = [];
        for (let i = 0; i < h.planets.length; i += perRow) rows.push(h.planets.slice(i, i + perRow));
        const lineHeight = 18;
        const startY = c.y - (rows.length * lineHeight) / 2 + 13;
        const signY = c.y + (isDiamond(h.house) ? (rows.length ? -26 - (rows.length - 1) * 6 : -4) : rows.length ? -18 : 0);

        return (
          <g key={h.house}>
            <text x={c.x} y={signY} textAnchor="middle" fontSize={13} fontWeight={500} className="fill-ink-muted">
              {h.rashi}
            </text>
            {rows.map((row, r) =>
              row.map((p, i) => (
                <text
                  key={p.graha}
                  x={c.x - ((row.length - 1) * 36) / 2 + i * 36}
                  y={startY + r * lineHeight}
                  textAnchor="middle"
                  fontSize={16}
                  fontWeight={600}
                  className={p.graha === "Sun" || p.graha === "Mars" || p.graha === "Ketu" ? "fill-brand-strong" : "fill-ink"}
                >
                  {grahaAbbr(p.graha, locale)}
                  {p.retro && p.graha !== "Rahu" && p.graha !== "Ketu" ? "ᴿ" : ""}
                </text>
              )),
            )}
          </g>
        );
      })}

      {centre && (
        <text x={200} y={182} textAnchor="middle" fontSize={12} fontWeight={500} className="fill-brand-strong">
          {centre}
        </text>
      )}
    </svg>
  );
}
