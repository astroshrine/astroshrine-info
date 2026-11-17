/**
 * The Vastu Chakra overlay as one SVG string, drawn in plan-image pixels.
 *
 * The same string is rendered in the app (react-native-svg SvgXml over the plan
 * image), embedded in the PDF (with the plan as an <image>), and checked for label
 * overlap in a headless browser. Original artwork — nothing traced from any
 * third-party chakra. Pure: no React Native imports.
 */
// Drawn on the plan in the light palette (the plan is a white drawing in either site theme).
const colors = { navy: '#0C2340', navyRaised: '#1B3454', gold: '#F0C43A', goldDark: '#C79E22', saffron: '#C45C26', cream: '#FFFDF8', muted: '#667485', danger: '#C0392B' };
const status = { online: { fg: '#14532D', dot: '#22C55E' } };
import {
  Element,
  Lang,
  norm360,
  PADAS,
  PADA_SPAN,
  PLANETS,
  Pt,
  TaggedItem,
  ZONE_IDS,
  ZONE_SPAN,
  ZoneId,
  ZONES,
  ZoneStatus,
} from './engine';

export type Box = {x: number; y: number; w: number; h: number};

export type OverlayOptions = {
  /** Plan image size in px. */
  width: number;
  height: number;
  lang: Lang;
  polygon: Pt[];
  /** false while the boundary is still being drawn (open path). */
  closed?: boolean;
  showVertices?: boolean;
  centre?: Pt | null;
  centreAuto?: Pt | null;
  /** The chakra is drawn only when both centre and northOffset are known. */
  northOffset?: number | null;
  opacity?: number;
  zoneLines?: boolean;
  zoneStatus?: Partial<Record<ZoneId, ZoneStatus>>;
  selectedZone?: ZoneId | null;
  items?: TaggedItem[];
  /** First corner of a rectangle being drawn. */
  pendingPoint?: Pt | null;
  /** On-screen px per plan px. Labels that would render below MIN_LABEL_PX are left out (they return on zoom). */
  displayScale?: number;
  /** Plan image embedded as the first layer (PDF / browser). In the app the image sits under the SVG instead. */
  imageHref?: string;
  /** viewBox; defaults to canvasBox(). */
  box?: Box;
};

const MIN_LABEL_PX = 7;
// Ring radii as fractions of R: degrees [0.9, 1], padas [0.8, 0.9], zones [0.52, 0.8], planets [0.4, 0.52].
const RING = {deg: 0.9, pada: 0.8, zone: 0.52, planet: 0.4};

const ELEMENT_COLOR: Record<Element, string> = {
  water: colors.navyRaised,
  air: status.online.fg,
  fire: colors.saffron,
  earth: colors.goldDark,
  space: colors.muted,
};
const PADA_COLOR = {best: status.online.dot, good: colors.gold, avoid: colors.danger};

const f = (n: number) => String(Math.round(n * 100) / 100);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Chakra radius: fits the farthest boundary vertex with room for the degree ring outside the plot. */
export function chakraRadius(polygon: Pt[], centre: Pt): number {
  const far = Math.max(0, ...polygon.map(p => Math.hypot(p.x - centre.x, p.y - centre.y)));
  return far * 1.12;
}

const hasChakra = (o: OverlayOptions) => !!o.centre && o.northOffset != null && o.polygon.length >= 3;

/** The area to show: the plan plus the whole chakra circle, with a small margin. */
export function canvasBox(o: Pick<OverlayOptions, 'width' | 'height' | 'polygon' | 'centre' | 'northOffset'>): Box {
  let x0 = 0;
  let y0 = 0;
  let x1 = o.width;
  let y1 = o.height;
  if (hasChakra(o as OverlayOptions)) {
    const c = o.centre as Pt;
    const r = chakraRadius(o.polygon, c) * 1.09; // the north pointer reaches 1.07R
    x0 = Math.min(x0, c.x - r);
    y0 = Math.min(y0, c.y - r);
    x1 = Math.max(x1, c.x + r);
    y1 = Math.max(y1, c.y + r);
  }
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
}

export function overlaySvg(o: OverlayOptions): string {
  const box = o.box ?? canvasBox(o);
  const ds = o.displayScale;
  const unit = Math.min(o.width, o.height) / 100; // 1% of the plan's short side
  // Screen-constant sizes when the display scale is known, plan-relative otherwise.
  const px = (screenPx: number) => (ds ? screenPx / ds : screenPx * unit * 0.3);
  const out: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(box.x)} ${f(box.y)} ${f(box.w)} ${f(box.h)}" width="${f(box.w)}" height="${f(box.h)}">`,
  ];
  if (o.imageHref) out.push(`<image href="${esc(o.imageHref)}" x="0" y="0" width="${f(o.width)}" height="${f(o.height)}" preserveAspectRatio="none"/>`);

  if (hasChakra(o)) out.push(chakra(o, px));

  // Boundary.
  if (o.polygon.length) {
    const pts = o.polygon.map(p => `${f(p.x)},${f(p.y)}`).join(' ');
    const sw = f(px(2.5));
    out.push(
      o.closed && o.polygon.length >= 3
        ? `<polygon points="${pts}" fill="${colors.gold}" fill-opacity="0.08" stroke="${colors.goldDark}" stroke-width="${sw}" stroke-linejoin="round"/>`
        : `<polyline points="${pts}" fill="none" stroke="${colors.goldDark}" stroke-width="${sw}" stroke-dasharray="${f(px(8))} ${f(px(5))}"/>`,
    );
    if (o.showVertices) {
      o.polygon.forEach((p, i) =>
        out.push(
          `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(px(i === 0 ? 9 : 7))}" fill="${i === 0 ? colors.saffron : colors.gold}" stroke="${colors.navy}" stroke-width="${f(px(1.5))}"/>`,
        ),
      );
    }
  }

  // Tagged items: a numbered badge (names go in the legend) so they never cover ring labels.
  (o.items ?? []).forEach((it, i) => {
    const p = it.kind === 'point' ? it.p : {x: (it.a.x + it.b.x) / 2, y: (it.a.y + it.b.y) / 2};
    if (it.kind === 'rect') {
      const x = Math.min(it.a.x, it.b.x);
      const y = Math.min(it.a.y, it.b.y);
      out.push(
        `<rect x="${f(x)}" y="${f(y)}" width="${f(Math.abs(it.a.x - it.b.x))}" height="${f(Math.abs(it.a.y - it.b.y))}" fill="${colors.saffron}" fill-opacity="0.14" stroke="${colors.saffron}" stroke-width="${f(px(2))}" stroke-dasharray="${f(px(6))} ${f(px(4))}"/>`,
      );
    }
    out.push(
      `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(px(9))}" fill="${colors.saffron}" stroke="${colors.cream}" stroke-width="${f(px(2))}"/>`,
      label(p.x, p.y, String(i + 1), px(10), colors.cream, true, false),
    );
  });
  if (o.pendingPoint) {
    const p = o.pendingPoint;
    const s = px(8);
    out.push(
      `<path d="M${f(p.x - s)} ${f(p.y)}H${f(p.x + s)}M${f(p.x)} ${f(p.y - s)}V${f(p.y + s)}" stroke="${colors.saffron}" stroke-width="${f(px(2.5))}"/>`,
    );
  }
  out.push('</svg>');
  return out.join('');
}

/** Upright text centred on (x, y); halo keeps it readable over the plan. */
function label(x: number, y: number, text: string, size: number, fill: string, bold = false, halo = true): string {
  const common = `x="${f(x)}" y="${f(y + size * 0.35)}" font-size="${f(size)}" text-anchor="middle"${bold ? ' font-weight="bold"' : ''}`;
  return (
    (halo ? `<text ${common} fill="none" stroke="${colors.cream}" stroke-width="${f(size * 0.28)}" stroke-linejoin="round">${text}</text>` : '') +
    `<text ${common} fill="${fill}">${text}</text>`
  );
}

function chakra(o: OverlayOptions, px: (n: number) => number): string {
  const c = o.centre as Pt;
  const north = o.northOffset as number;
  const R = chakraRadius(o.polygon, c);
  const ds = o.displayScale;
  const readable = (sizePlan: number) => !ds || sizePlan * ds >= MIN_LABEL_PX;
  const at = (bearing: number, r: number): Pt => {
    const s = ((bearing + north) * Math.PI) / 180;
    return {x: c.x + r * Math.sin(s), y: c.y - r * Math.cos(s)};
  };
  const seg = (b0: number, b1: number, r0: number, r1: number) => {
    const p0 = at(b0, r1);
    const p1 = at(b1, r1);
    const p2 = at(b1, r0);
    const p3 = at(b0, r0);
    const large = norm360(b1 - b0) > 180 ? 1 : 0;
    return `M${f(p0.x)} ${f(p0.y)}A${f(r1)} ${f(r1)} 0 ${large} 1 ${f(p1.x)} ${f(p1.y)}L${f(p2.x)} ${f(p2.y)}A${f(r0)} ${f(r0)} 0 ${large} 0 ${f(p3.x)} ${f(p3.y)}Z`;
  };
  const line = (b: number, r0: number, r1: number, width: number, dash = '') => {
    const a = at(b, r0);
    const e = at(b, r1);
    return `<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(e.x)}" y2="${f(e.y)}" stroke="${colors.navy}" stroke-width="${f(width)}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  };
  const thin = R * 0.003;
  const g: string[] = [`<g opacity="${f(o.opacity ?? 0.85)}">`];

  // Zone ring: element tint, or cut/extended status; selected zone outlined.
  ZONE_IDS.forEach((z, i) => {
    const b0 = i * ZONE_SPAN - ZONE_SPAN / 2;
    const st = o.zoneStatus?.[z];
    const fill = st === 'cut' ? colors.danger : st === 'extended' ? colors.gold : ELEMENT_COLOR[ZONES[z].element];
    const op = st === 'cut' || st === 'extended' ? 0.4 : 0.14;
    const sel = o.selectedZone === z;
    g.push(
      `<path d="${seg(b0, b0 + ZONE_SPAN, R * RING.zone, R * RING.pada)}" fill="${fill}" fill-opacity="${op}" stroke="${sel ? colors.saffron : colors.navy}" stroke-width="${f(sel ? R * 0.012 : thin)}"/>`,
    );
  });
  // Pada ring: traditional door verdict tint.
  PADAS.forEach((p, i) => {
    const b0 = 315 + i * PADA_SPAN;
    g.push(`<path d="${seg(b0, b0 + PADA_SPAN, R * RING.pada, R * RING.deg)}" fill="${PADA_COLOR[p.verdict]}" fill-opacity="0.12" stroke="${colors.navy}" stroke-width="${f(thin)}"/>`);
  });
  // Planet ring: each ruler spans 45° around its direction.
  PLANETS.forEach(p => {
    g.push(`<path d="${seg(p.bearing - 22.5, p.bearing + 22.5, R * RING.planet, R * RING.zone)}" fill="${colors.cream}" fill-opacity="0.55" stroke="${colors.navy}" stroke-width="${f(thin)}"/>`);
  });
  // Degree ring.
  g.push(
    `<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(R)}" fill="${colors.cream}" fill-opacity="0.2" stroke="${colors.navy}" stroke-width="${f(thin * 1.5)}"/>`,
    `<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(R * RING.deg)}" fill="none" stroke="${colors.navy}" stroke-width="${f(thin)}"/>`,
  );
  for (let d = 0; d < 360; d += 5) g.push(line(d, R * (d % 10 ? 0.975 : 0.955), R, thin));
  // North pointer just outside the ring.
  {
    const tip = at(0, R * 1.07);
    const l = at(-2.2, R * 1.005);
    const r = at(2.2, R * 1.005);
    g.push(`<path d="M${f(tip.x)} ${f(tip.y)}L${f(l.x)} ${f(l.y)}L${f(r.x)} ${f(r.y)}Z" fill="${colors.saffron}"/>`);
  }
  // Optional zone lines through the plot.
  if (o.zoneLines) {
    ZONE_IDS.forEach((_, i) => g.push(line(i * ZONE_SPAN - ZONE_SPAN / 2, 0, R * RING.pada, R * 0.004, `${f(R * 0.02)} ${f(R * 0.012)}`)));
  }

  // Labels last so no ring paints over them.
  const lang = o.lang === 'hi' ? 1 : 0;
  const degSize = R * 0.032;
  const degStep = readable(degSize) ? 10 : readable(degSize * 1.3) ? 30 : 0;
  if (degStep) {
    const size = degStep === 10 ? degSize : degSize * 1.3;
    for (let d = 0; d < 360; d += degStep) {
      const p = at(d, R * 0.925);
      g.push(label(p.x, p.y, String(d), size, colors.navy, false, false));
    }
  }
  const padaSize = R * 0.03;
  if (readable(padaSize)) {
    PADAS.forEach((p, i) => {
      const q = at(315 + (i + 0.5) * PADA_SPAN, R * 0.85);
      g.push(label(q.x, q.y, p.id, padaSize, colors.navy, false, false));
    });
  }
  // Name and purpose sit 0.14R apart: at the E/W sides that gap runs sideways, so it
  // must exceed half the two labels' widths or WNW/Detox and ESE/Churning touch.
  const zoneSize = R * 0.046;
  const purposeSize = R * 0.028;
  ZONE_IDS.forEach((z, i) => {
    const q = at(i * ZONE_SPAN, R * 0.735);
    g.push(label(q.x, q.y, z, Math.max(zoneSize, ds ? px(9) : 0), colors.navy, true));
    if (readable(purposeSize)) {
      const r = at(i * ZONE_SPAN, R * 0.59);
      g.push(label(r.x, r.y, esc(ZONES[z].short[lang]), purposeSize, colors.navyRaised));
    }
  });
  const planetSize = R * 0.03;
  if (readable(planetSize)) {
    PLANETS.forEach(p => {
      const q = at(p.bearing, R * 0.46);
      g.push(label(q.x, q.y, esc(p.name[lang]), planetSize, colors.navy, false, false));
    });
  }

  // Brahmasthan (and the auto centre when the user nudged it away).
  const a = o.centreAuto;
  if (a && Math.hypot(a.x - c.x, a.y - c.y) > R * 0.01) {
    g.push(`<circle cx="${f(a.x)}" cy="${f(a.y)}" r="${f(R * 0.018)}" fill="none" stroke="${colors.navy}" stroke-width="${f(thin * 1.5)}" stroke-dasharray="${f(R * 0.008)} ${f(R * 0.006)}"/>`);
  }
  g.push(
    `<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(Math.max(R * 0.022, px(5)))}" fill="${colors.navy}" stroke="${colors.gold}" stroke-width="${f(Math.max(R * 0.006, px(2)))}"/>`,
  );
  g.push('</g>');
  return g.join('');
}
