import "./design.css";

type Node = { top: number; side: "lft" | "rgt"; kind: "orbit" | "bead" | "spark"; rev?: boolean; branch: number; delay: number };
type Star = [left: number, top: number, size: number, delay: number];

const tops = Array.from({ length: 12 }, (_, i) => +(4.17 + i * 8.333).toFixed(2));
const sideOf = (i: number, first: "lft" | "rgt") => ((i % 2 === 0) === (first === "rgt") ? "rgt" : "lft") as "lft" | "rgt";
const branch = (i: number) => +(i * 0.373).toFixed(1);

function nodes(first: "lft" | "rgt", kinds: Array<Node["kind"]>, sparkDelay: (i: number) => number, orbitK: number, revAt: number): Node[] {
  return tops.map((top, i) => {
    const kind = kinds[i % 3];
    return {
      top,
      side: sideOf(i, first),
      kind,
      rev: kind === "orbit" && i % 6 === revAt,
      branch: branch(i),
      delay: kind === "orbit" ? +(i * orbitK).toFixed(1) : sparkDelay(i),
    };
  });
}

const LEFT = nodes("rgt", ["orbit", "bead", "spark"], (i) => +(i * 0.45).toFixed(1), 0.7, 3);
const RIGHT = nodes("lft", ["bead", "spark", "orbit"], (i) => +(i * 0.45 + 0.05).toFixed(1), 0.7, 5);

const STARS_L: Star[] = [
  [32.5, 16.5, 3, 0.22], [51.2, 37.1, 3, 2.73], [22.9, 10.3, 5, 0.21], [12, 42.8, 6, 0.37], [23.6, 62.2, 3, 1.73], [38.9, 95.7, 3, 1.67], [15.7, 42.2, 6, 0.35],
  [31.1, 80.3, 4, 0.31], [54.3, 20, 3, 1.64], [9.5, 7.7, 4, 1.49], [50.8, 76.6, 5, 1.76], [43.9, 30.8, 4, 2.1], [25.5, 57.1, 6, 1.49], [34.2, 45.1, 6, 2.94],
];
const STARS_R: Star[] = [
  [43.8, 55.7, 5, 1.36], [79.2, 20.2, 6, 1.43], [58, 19.9, 5, 0.91], [12, 79.7, 3, 1.79], [38.9, 45.5, 6, 1.95], [58.8, 81.8, 3, 0.18], [20.7, 25.2, 3, 2.33],
  [32.7, 58.7, 4, 1.56], [60.3, 50, 3, 1.37], [28.5, 97.8, 3, 2.12], [31.7, 24, 4, 0.09], [53.6, 12.4, 3, 2.54], [38, 94, 3, 0.64], [85.6, 7, 5, 2.94],
];

function Rail({ side, list, stars }: { side: "l" | "r"; list: Node[]; stars: Star[] }) {
  return (
    <div className={`rail ${side}`}>
      <span className="rl-line" />
      <span className="rl-dash" />
      <span className="rl-comet" />
      <span className="rl-comet up d2" />
      {list.map((n) => (
        <span key={n.top} className="rl-node" style={{ top: `${n.top}%` }}>
          <span className={`rl-branch ${n.side}`}>
            <i style={{ animationDelay: `-${n.branch}s` }} />
          </span>
          {n.kind === "orbit" && <span className={`rl-orbit${n.rev ? " rev" : ""}`} style={{ animationDelay: `-${n.delay}s` }} />}
          {n.kind === "bead" && <span className="rl-bead" />}
          {n.kind === "spark" && (
            <svg className="rl-spark" style={{ animationDelay: `-${n.delay}s` }} viewBox="0 0 26 26" aria-hidden="true">
              <path d="M13 1.5 15.4 10.6 24.5 13 15.4 15.4 13 24.5 10.6 15.4 1.5 13 10.6 10.6Z" fill="#FFAE00" />
              <circle cx="13" cy="13" r="2.2" fill="#14213D" />
            </svg>
          )}
        </span>
      ))}
      {stars.map(([left, top, size, delay]) => (
        <span key={`${left}-${top}`} className="rl-star" style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, animationDelay: `-${delay}s` }} />
      ))}
    </div>
  );
}

/**
 * The animated gold rails (dashes, comets, orbits, beads, sparkles) in the page gutters of the sign in, join, help
 * and front pages. Decoration only; hidden below 1380px. It fills the nearest `.stage` ancestor.
 */
export default function Rails() {
  return (
    <div className="rails" aria-hidden="true">
      <Rail side="l" list={LEFT} stars={STARS_L} />
      <Rail side="r" list={RIGHT} stars={STARS_R} />
    </div>
  );
}
