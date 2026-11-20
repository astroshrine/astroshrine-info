import { INTL_LOCALE, LOCALES, type Locale } from "@/i18n/config";
import { defineMessages } from "@/i18n/messages";
import { DEFAULT_CHAT_RATE, priceOf, type Availability, type PriceView } from "@/lib/endpoints";

// The astrologer data the website shows, mapped from the backend's records with the mobile app's rules
// (TopAstrologers / Astrologers / AstroProfile). Pure: used on the server (prerendered directory and
// profile) and in the browser. Only listed fields are copied, so nothing else from the backend's public
// payload (phone numbers, waitlists with customers' names, earnings) ever reaches the page.
//
// The mapped records hold no UI text, only values (the name fallbacks "Astrologer" and "AstroShrine user" read
// the same in both languages), so the server's cached copies serve every language. Labels come from
// ASTROLOGER_TEXT, and dates from the formatters below, at render time in the page's language.

/** The backend's five-value availability. `live` (broadcasting) is shown as busy: livestream is not on the website. */
export type AstrologerStatus = "online" | "busy" | "live" | "scheduled" | "offline";

type ChannelPrice = Parameters<typeof priceOf>[0];

/** Fields read from GET /v1/astrologer-view/search/... and GET /v1/astrologer-view/:id. Everything else is ignored. */
export type RawAstrologer = {
  id: string;
  name?: string | null;
  display_name?: string | null;
  status?: string | null;
  isLive?: boolean;
  nextAvailableAt?: number | null;
  lastOnlineTs?: number | null;
  ranking?: number | null;
  isCelebrity?: boolean;
  orders?: number | null;
  pricingData?: { chat?: ChannelPrice; call?: ChannelPrice } | null;
  currentChannel?: { chat?: { enabled?: boolean } | null } | null;
  hostProfile?: {
    profilePic?: string | null;
    expertise?: string[] | null;
    languages?: string[] | null;
    experience?: number | null;
    rating?: number | null;
    totalReviews?: number | null;
    orders?: number | null;
    followers?: number | null;
    gender?: string | null;
    aboutMe?: string | null;
    media?: { path?: string | null }[] | null;
  } | null;
  stats?: { orders?: number; counts?: { chats?: number; calls?: number; followers?: number } } | null;
};

export type AstrologerCard = {
  id: string;
  name: string;
  photo: string | null;
  expertise: string[];
  languages: string[];
  experience: number;
  /** Average rating, null when there is none yet. */
  rating: number | null;
  reviews: number;
  orders: number;
  /** Per-minute chat price as billed (offer applied). */
  chat: PriceView;
  /** Per-minute call price as billed (shown in the directory's call view). */
  call: PriceView;
  /** Whole % off the chat rate, 0 without an offer. */
  offerPercent: number;
  status: AstrologerStatus;
  availability: Availability;
  /** Online but Chat switched off in their app: the server refuses a chat (409 CHAT_OFF). */
  chatOff: boolean;
  nextAvailableAt: number | null;
  ranking: number;
};

export type AstrologerProfile = AstrologerCard & {
  aboutMe: string;
  /** Profile photos the astrologer added (images only). */
  media: string[];
  stats: { orders: number; chats: number; calls: number; followers: number };
};

export type StatusInfo = {
  id: string;
  status?: string | null;
  isLive?: boolean;
  nextAvailableAt?: number | null;
  chatEnabled?: boolean | null;
};

/** The app treats an astrologer seen within this window as online when no status was sent (server ASTRO_PRESENCE_TTL_MS). */
const PRESENCE_TTL_MS = 12 * 60 * 60 * 1000;

const STATUSES: AstrologerStatus[] = ["online", "busy", "live", "scheduled", "offline"];

/** Streaming wins over the status string, then the status, then how recently they were seen (the app's statusFromPayload). */
export function statusOf(a: { status?: string | null; isLive?: boolean; lastOnlineTs?: number | null }, now = Date.now()): AstrologerStatus {
  if (a.isLive) return "live";
  if (a.status && (STATUSES as string[]).includes(a.status)) return a.status as AstrologerStatus;
  const seen = Number(a.lastOnlineTs) || 0;
  return seen > 0 && now - seen <= PRESENCE_TTL_MS ? "online" : "offline";
}

/** What the website shows: online, busy (in a session, or live), or offline (scheduled later included). */
export function availabilityOf(status: AstrologerStatus): Availability {
  if (status === "online") return "online";
  if (status === "busy" || status === "live") return "busy";
  return "offline";
}

/** "On the app" for the Online filter and the online-first order: online, in a session or live. */
export const isOnApp = (status: AstrologerStatus) => status === "online" || status === "busy" || status === "live";

export const percentOff = (v: PriceView) => (v.hasOffer && v.rate > 0 ? Math.round(((v.rate - v.price) / v.rate) * 100) : 0);

const list = (v: string[] | null | undefined) => (Array.isArray(v) ? v.filter((s) => typeof s === "string" && s.trim()) : []);

const cleanName = (raw: RawAstrologer) => {
  const name = (raw.display_name || raw.name || "").trim();
  return name || "Astrologer";
};

export function toAstrologerCard(raw: RawAstrologer, now = Date.now()): AstrologerCard {
  const p = raw.hostProfile ?? {};
  const chat = priceOf(raw.pricingData?.chat, DEFAULT_CHAT_RATE);
  const status = statusOf(raw, now);
  const rating = Number(p.rating);
  return {
    id: raw.id,
    name: cleanName(raw),
    photo: p.profilePic || null,
    expertise: list(p.expertise),
    languages: list(p.languages),
    experience: Number(p.experience) || 0,
    rating: Number.isFinite(rating) && rating > 0 ? rating : null,
    reviews: Number(p.totalReviews) || 0,
    orders: Number(raw.stats?.orders ?? p.orders ?? raw.orders) || 0,
    chat,
    call: priceOf(raw.pricingData?.call, DEFAULT_CHAT_RATE),
    offerPercent: percentOff(chat),
    status,
    availability: availabilityOf(status),
    chatOff: status === "online" && raw.currentChannel?.chat?.enabled === false,
    nextAvailableAt: typeof raw.nextAvailableAt === "number" ? raw.nextAvailableAt : null,
    ranking: Number(raw.ranking) || 100,
  };
}

const IMAGE_PATH = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i;

export function toAstrologerProfile(raw: RawAstrologer, now = Date.now()): AstrologerProfile {
  const card = toAstrologerCard(raw, now);
  const p = raw.hostProfile ?? {};
  const media = (p.media ?? [])
    .map((m) => (typeof m?.path === "string" ? m.path : ""))
    .filter((path) => /^https:\/\//.test(path) && IMAGE_PATH.test(path));
  return {
    ...card,
    aboutMe: (p.aboutMe || "").trim(),
    media,
    stats: {
      orders: card.orders,
      chats: Number(raw.stats?.counts?.chats) || 0,
      calls: Number(raw.stats?.counts?.calls) || 0,
      followers: Number(raw.stats?.counts?.followers ?? p.followers) || 0,
    },
  };
}

/** Applies a fresh status read (GET /v1/astrologer-view/status) to a card. */
export function withStatus<T extends AstrologerCard>(a: T, info: StatusInfo | undefined, now = Date.now()): T {
  if (!info) return a;
  const status = statusOf({ status: info.status, isLive: info.isLive }, now);
  const chatOff = status === "online" && (info.chatEnabled === false || (info.chatEnabled == null && a.chatOff));
  return {
    ...a,
    status,
    availability: availabilityOf(status),
    chatOff,
    nextAvailableAt: typeof info.nextAvailableAt === "number" ? info.nextAvailableAt : null,
  };
}

// ─── Directory filters and sorting (the app's Astrologers tab) ───────────────────────────────────

export const FILTERS = ["all", "online", "Vedic", "Tarot", "Numerology", "Vastu", "Kundli", "Hindi", "English"] as const;
export type Filter = (typeof FILTERS)[number];

export const SORTS = ["popularity", "rating", "experience", "price"] as const;
export type Sort = (typeof SORTS)[number];

export const isFilter = (v: unknown): v is Filter => typeof v === "string" && (FILTERS as readonly string[]).includes(v);
export const isSort = (v: unknown): v is Sort => typeof v === "string" && (SORTS as readonly string[]).includes(v);

export function matchesFilter(a: AstrologerCard, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "online") return isOnApp(a.status);
  const f = filter.toLowerCase();
  return a.expertise.some((e) => e.toLowerCase().includes(f)) || a.languages.some((l) => l.toLowerCase().includes(f));
}

export function matchesQuery(a: AstrologerCard, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [a.name, ...a.expertise, ...a.languages].some((s) => s.toLowerCase().includes(q));
}

const SORT_KEY: Record<Sort, (a: AstrologerCard) => number> = {
  popularity: (a) => -a.orders,
  rating: (a) => -(a.rating ?? 0),
  experience: (a) => -a.experience,
  price: (a) => a.chat.price,
};

/** On the app first (online, busy, live), then the chosen order: the app's sortBy([onApp, SORTS[sort]]). */
export function sortAstrologers(list: AstrologerCard[], sort: Sort): AstrologerCard[] {
  const key = SORT_KEY[sort];
  return [...list].sort((a, b) => Number(!isOnApp(a.status)) - Number(!isOnApp(b.status)) || key(a) - key(b) || a.ranking - b.ranking);
}

// ─── Reviews ─────────────────────────────────────────────────────────────────────────────────────

/** GET /v1/astrologer-view/:id/profile/review rows. */
export type RawReview = { comment?: string | null; rating?: number | null; reply?: string | null; userName?: string | null; ts?: number; userId?: string };

export type Review = {
  /** Pagination cursor "<ts>#<userId>": used for the next page only, never shown. */
  key: string;
  ts: number;
  rating: number;
  comment: string;
  reply: string;
  /** The reviewer's first name and initial ("Rahul S."): the website never shows customers' full names. */
  reviewer: string;
};

export function reviewerLabel(name: string | null | undefined): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AstroShrine user";
  const first = parts[0].slice(0, 20);
  return parts.length > 1 ? `${first} ${parts[parts.length - 1].charAt(0).toUpperCase()}.` : first;
}

export function toReview(r: RawReview): Review | null {
  const ts = Number(r.ts);
  const rating = Math.round(Number(r.rating));
  if (!Number.isFinite(ts) || !(rating >= 1 && rating <= 5)) return null;
  return {
    key: `${ts}#${r.userId ?? ""}`,
    ts,
    rating,
    comment: String(r.comment || "").trim(),
    reply: String(r.reply || "").trim(),
    reviewer: reviewerLabel(r.userName),
  };
}

/** Newest first, one entry per cursor. */
export function mergeReviews(a: Review[], b: Review[]): Review[] {
  const byKey = new Map<string, Review>();
  for (const r of [...a, ...b]) byKey.set(r.key, r);
  return [...byKey.values()].sort((x, y) => y.ts - x.ts);
}

export const REVIEW_PAGE_SIZE = 10;

/** One Intl date format per language: month names in the page's language, Latin digits in both. */
function dateFormats(options: Intl.DateTimeFormatOptions): Record<Locale, Intl.DateTimeFormat> {
  return Object.fromEntries(LOCALES.map((l) => [l, new Intl.DateTimeFormat(INTL_LOCALE[l], options)])) as Record<Locale, Intl.DateTimeFormat>;
}

const DATE_FORMAT = dateFormats({ day: "numeric", month: "short", year: "numeric" });
/** "15 Nov 2026" / "15 नव॰ 2026". */
export const formatDate = (ms: number, locale: Locale) => DATE_FORMAT[locale].format(new Date(ms));

// ─── Labels ──────────────────────────────────────────────────────────────────────────────────────

/** Directory filters and sort orders, availability, and next-availability times, in every language. Read with useT. */
export const ASTROLOGER_TEXT = defineMessages({
  hi: {
    filters: {
      all: "सभी",
      online: "ऑनलाइन",
      Vedic: "वैदिक",
      Tarot: "टैरो",
      Numerology: "अंक ज्योतिष",
      Vastu: "वास्तु",
      Kundli: "कुंडली",
      Hindi: "हिंदी",
      English: "English",
    } satisfies Record<Filter, string>,
    sorts: {
      popularity: "सबसे लोकप्रिय",
      rating: "सबसे अच्छी रेटिंग",
      experience: "सबसे ज़्यादा अनुभव",
      price: "कम कीमत पहले",
    } satisfies Record<Sort, string>,
    availability: { online: "ऑनलाइन", busy: "व्यस्त", offline: "ऑफ़लाइन" } satisfies Record<Availability, string>,
    // The next availability window, shown after "उपलब्ध" / "Available": today, tomorrow, or later (time only).
    nextToday: (time: string) => `आज ${time}`,
    nextTomorrow: (time: string) => `कल ${time}`,
    nextLater: (time: string) => time,
  },
  en: {
    filters: {
      all: "All",
      online: "Online",
      Vedic: "Vedic",
      Tarot: "Tarot",
      Numerology: "Numerology",
      Vastu: "Vastu",
      Kundli: "Kundli",
      Hindi: "Hindi",
      English: "English",
    },
    sorts: {
      popularity: "Most popular",
      rating: "Highest rated",
      experience: "Most experienced",
      price: "Lowest price first",
    },
    availability: { online: "Online", busy: "Busy", offline: "Offline" },
    nextToday: (time) => `today at ${time}`,
    nextTomorrow: (time) => `tomorrow at ${time}`,
    nextLater: (time) => `at ${time}`,
  },
});

/** Times are the same in both languages ("6:00 pm"). */
const timeFormat = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });

/**
 * "आज 6:00 pm" / "today at 6:00 pm" (or tomorrow, or only the time) for the next availability window, in the
 * visitor's own time zone. Reads after "उपलब्ध" / "Available".
 */
export function formatNextAvailable(ms: number | null | undefined, locale: Locale, now = Date.now()): string | null {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= now) return null;
  const at = new Date(ms);
  const today = new Date(now);
  const tomorrow = new Date(now + 24 * 60 * 60 * 1000);
  const sameDay = (x: Date, y: Date) => x.toDateString() === y.toDateString();
  const time = timeFormat.format(at);
  const t = ASTROLOGER_TEXT[locale];
  if (sameDay(at, today)) return t.nextToday(time);
  if (sameDay(at, tomorrow)) return t.nextTomorrow(time);
  return t.nextLater(time);
}

const DEVANAGARI_LETTERS = /[ऀ-ॿ]/g;
const LATIN_LETTERS = /[A-Za-z]/g;

/**
 * "hi" for backend content written mostly in Devanagari: an astrologer's name, a bio, a review, a chat message.
 * Such content stays as it was written; the element showing it gets lang="hi", so screen readers read it in a
 * Hindi voice on English pages. Latin-script content and mixed text that is mostly Latin get no attribute.
 */
export function contentLang(text: string | null | undefined): "hi" | undefined {
  const hindi = text?.match(DEVANAGARI_LETTERS)?.length ?? 0;
  if (!hindi) return undefined;
  return hindi >= (text?.match(LATIN_LETTERS)?.length ?? 0) ? "hi" : undefined;
}

/** 1,250 → "1.3k", like the app's counters. */
export function compactCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return `${n}`;
}

export const rupees = (n: number) => `₹${Math.floor(Math.max(n, 0)).toLocaleString("en-IN")}`;
