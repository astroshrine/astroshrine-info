import { cacheLife } from "next/cache";
import { BLOG_URL } from "@/lib/site";

// The latest articles from Future For You (futureforyou.co), AstroShrine's magazine, read from its public
// WordPress API on the server. Shown as plain text only: titles and excerpts arrive as HTML and are never
// injected as HTML. Only links and images on futureforyou.co are used.

const ORIGIN = new URL(BLOG_URL).origin;

export type BlogPost = {
  id: number;
  title: string;
  excerpt: string;
  /** The article on futureforyou.co. */
  link: string;
  /** ISO date of publication. */
  date: string;
  /** Featured image on futureforyou.co, or null. */
  image: string | null;
};

type WpMedia = { source_url?: string; media_details?: { sizes?: Record<string, { source_url?: string }> } };
type WpPost = {
  id?: number;
  date?: string;
  link?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  _embedded?: { "wp:featuredmedia"?: WpMedia[] };
};

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…",
  ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

function codePoint(n: number) {
  return Number.isInteger(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
}

/** WordPress HTML → plain text: tags dropped, entities decoded, whitespace collapsed. */
function plainText(html: string | undefined): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, n: string) => codePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => codePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name: string) => NAMED[name.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

/** Only absolute https URLs on futureforyou.co (encoded, since file names are often in Devanagari). */
function ownUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(encodeURI(decodeURI(url)));
    return u.protocol === "https:" && u.origin === ORIGIN ? u.toString() : null;
  } catch {
    return null;
  }
}

function toPost(p: WpPost): BlogPost | null {
  const link = ownUrl(p.link);
  const title = plainText(p.title?.rendered);
  if (!p.id || !link || !title || !p.date) return null;
  const media = p._embedded?.["wp:featuredmedia"]?.[0];
  const sizes = media?.media_details?.sizes ?? {};
  const image = ownUrl(sizes.medium_large?.source_url ?? sizes.large?.source_url ?? media?.source_url);
  // WordPress ends excerpts with "[…]" or "Read more": keep the sentence, add one ellipsis.
  const excerpt = plainText(p.excerpt?.rendered).replace(/\s*(\[…\]|\[\.\.\.\]|…|Read more.*)$/i, "");
  return { id: p.id, title, excerpt: excerpt ? `${excerpt}…` : "", link, date: p.date, image };
}

/**
 * The newest articles, newest first. Cached on the server for everyone and refreshed in the background every
 * 30 minutes, so pages never wait for the blog. [] when the blog cannot be reached (the section then just links to it).
 */
export async function getLatestBlogPosts(limit = 3): Promise<BlogPost[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 1800, expire: 86_400 });
  const fields = "id,date,link,title,excerpt,_links,_embedded";
  try {
    const res = await fetch(`${ORIGIN}/wp-json/wp/v2/posts?per_page=${limit}&_embed=wp:featuredmedia&_fields=${fields}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as WpPost[];
    return (Array.isArray(rows) ? rows : []).map(toPost).filter((p): p is BlogPost => p !== null);
  } catch {
    return [];
  }
}
