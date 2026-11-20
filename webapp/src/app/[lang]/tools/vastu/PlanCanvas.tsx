"use client";

import { useEffect, useRef, useState } from "react";
import type { Pt } from "@/lib/vastu/engine";
import type { Box } from "@/lib/vastu/chakraSvg";

/**
 * The plan image with the chakra drawing on top, one SVG in plan-image pixels. A click hands back plan
 * coordinates; `scale` (screen px per plan px) lets the drawing keep its labels readable at any width.
 */
export default function PlanCanvas({
  plan,
  box,
  onPoint,
  label,
  buildOverlay,
}: {
  plan: { url?: string; width: number; height: number };
  box: Box;
  onPoint?: (p: Pt) => void;
  label: string;
  /** The drawing as inner SVG markup, for the screen px per plan px of the moment. */
  buildOverlay: (scale: number) => string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.getBoundingClientRect().width / box.w);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [box.w]);

  function click(e: React.MouseEvent<SVGSVGElement>) {
    const svg = ref.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m || !onPoint) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(m.inverse());
    onPoint({ x: p.x, y: p.y });
  }

  return (
    <svg
      ref={ref}
      role="img"
      aria-label={label}
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      onClick={click}
      className={`block h-auto w-full max-h-[80vh] rounded-2xl border border-line bg-white ${onPoint ? "cursor-crosshair" : ""}`}
    >
      {plan.url ? (
        <image href={plan.url} x={0} y={0} width={plan.width} height={plan.height} preserveAspectRatio="none" />
      ) : (
        <>
          <rect x={0} y={0} width={plan.width} height={plan.height} fill="#FFFDF8" />
          <g stroke="#0C2340" strokeOpacity={0.08} strokeWidth={plan.width / 600}>
            {Array.from({ length: 9 }, (_, i) => (
              <g key={i}>
                <line x1={((i + 1) * plan.width) / 10} y1={0} x2={((i + 1) * plan.width) / 10} y2={plan.height} />
                <line x1={0} y1={((i + 1) * plan.height) / 10} x2={plan.width} y2={((i + 1) * plan.height) / 10} />
              </g>
            ))}
          </g>
        </>
      )}
      {/* The markup is built here from numbers and the engine's fixed zone and item names (escaped), never from raw input. */}
      <g dangerouslySetInnerHTML={{ __html: scale ? buildOverlay(scale) : "" }} />
    </svg>
  );
}
