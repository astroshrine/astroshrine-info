/**
 * The AstroGems mark: a cut gem seen from above, set in a gold bezel. The table and the eight star facets around it are
 * the nine grahas (Surya at the center). Colors are baked in, and the bezel keeps the outline readable on white, cream
 * and navy alike, so it needs no tile. Decorative by default; pass `title` to make it a labelled image.
 */
export default function AstroGemsMark({ size = 40, className = "", title }: { size?: number; className?: string; title?: string }) {
  const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true };
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={`shrink-0 ${className}`} {...a11y}>
      {title ? <title>{title}</title> : null}
      {/* Painted back to front (bezel, stone, lit kites, star facets, table) so every edge blends two facets, never the page. */}
      <path fill="#fbbf24" d="M120 35.15 84.85 0 35.15 0 0 35.15 0 84.85 35.15 120 84.85 120 120 84.85Z" />
      <path fill="#0a1530" d="M114 37.63 82.37 6 37.63 6 6 37.63 6 82.37 37.63 114 82.37 114 114 82.37Z" />
      <path
        fill="#2a4a86"
        d="M67.46 42 98.18 21.82 82.37 6 60 6ZM42 52.54 21.82 21.82 6 37.63 6 60ZM52.54 78 21.82 98.18 37.63 114 60 114ZM78 67.46 98.18 98.18 114 82.37 114 60Z"
      />
      <path
        fill="#fbbf24"
        d="M60 60 67.46 42 60 6 52.54 42ZM60 60 42 52.54 6 60 42 67.46ZM60 60 52.54 78 60 114 67.46 78ZM60 60 78 67.46 114 60 78 52.54Z"
      />
      <path
        fill="#fde68a"
        d="M60 60 78 52.54 98.18 21.82 67.46 42ZM60 60 52.54 42 21.82 21.82 42 52.54ZM60 60 42 67.46 21.82 98.18 52.54 78ZM60 60 67.46 78 98.18 98.18 78 67.46Z"
      />
      <path fill="#fdfbf5" d="M78 52.54 67.46 42 52.54 42 42 52.54 42 67.46 52.54 78 67.46 78 78 67.46Z" />
    </svg>
  );
}
