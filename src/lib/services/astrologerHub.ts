import { api } from "@/lib/api";

// The astrologer's hub on the shared backend (the astrologer app's AstroSupportChat, TrainingVideos,
// CeoFeedback and notification screens). Every call is for the signed-in astrologer only.

const base = (id: string) => `/v1/astrologer/${encodeURIComponent(id)}`;

// ─── Support chat ──────────────────────────────────────────────────────────────

export const SUPPORT_MAX = 2000;

export type SupportMessage = { id: string; sender: "astrologer" | "admin"; body: string; createdAt: string };
export type SupportThread = { messages: SupportMessage[]; unread: number };

type RawMessage = { id?: string; sender?: string; body?: string; createdAt?: string };
const toMessage = (m: RawMessage): SupportMessage => ({
  id: String(m.id ?? ""),
  sender: m.sender === "admin" ? "admin" : "astrologer",
  body: String(m.body ?? ""),
  createdAt: String(m.createdAt ?? ""),
});

/** GET .../hub/support: the thread (oldest first, last 100) and the count of unread admin replies. */
export async function getSupport(id: string, signal?: AbortSignal): Promise<SupportThread> {
  const raw = await api<{ messages?: RawMessage[]; unread?: number }>(`${base(id)}/hub/support`, { signal });
  return { messages: (raw?.messages ?? []).map(toMessage), unread: Number(raw?.unread) || 0 };
}

/** POST .../hub/support {body}: up to 2000 characters. */
export async function sendSupport(id: string, body: string): Promise<SupportMessage> {
  return toMessage(await api<RawMessage>(`${base(id)}/hub/support`, { method: "POST", body: { body } }));
}

/** POST .../hub/support/read: marks the admin replies as read. */
export function markSupportRead(id: string) {
  return api<unknown>(`${base(id)}/hub/support/read`, { method: "POST", body: {} });
}

// ─── Training videos ───────────────────────────────────────────────────────────

export type TrainingVideo = { id: string; title: string; category: string; youtubeId: string; youtubeUrl: string; description: string };

type RawVideo = { id?: string; title?: string; category?: string; youtubeId?: string | null; youtubeUrl?: string; description?: string | null };

/** GET .../hub/training-videos: active videos, ordered by category. Videos without a usable YouTube id are dropped. */
export async function getTrainingVideos(id: string, signal?: AbortSignal): Promise<TrainingVideo[]> {
  const raw = await api<{ videos?: RawVideo[] }>(`${base(id)}/hub/training-videos`, { signal });
  return (raw?.videos ?? [])
    .filter((v) => v.youtubeId && /^[A-Za-z0-9_-]{11}$/.test(v.youtubeId))
    .map((v) => ({
      id: String(v.id ?? v.youtubeId),
      title: String(v.title ?? ""),
      category: String(v.category || "General"),
      youtubeId: v.youtubeId as string,
      youtubeUrl: String(v.youtubeUrl ?? ""),
      description: String(v.description ?? ""),
    }));
}

/** Privacy-friendly embed (no cookies until played). */
export const embedUrl = (youtubeId: string) => `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`;
/** Thumbnail from YouTube's image host (what the backend itself returns). */
export const thumbUrl = (youtubeId: string) => `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

// ─── Feedback ──────────────────────────────────────────────────────────────────

export const FEEDBACK_CATEGORIES = ["app", "payments", "users", "support", "suggestion", "other"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export const FEEDBACK_MIN = 5;
export const FEEDBACK_MAX = 3000;

export type Feedback = {
  id: string;
  category: string;
  message: string;
  anonymous: boolean;
  status: string;
  adminNote: string;
  createdAt: string;
};

type RawFeedback = { id?: string; category?: string; message?: string; is_anonymous?: boolean; status?: string; admin_note?: string | null; created_at?: string };
const toFeedback = (f: RawFeedback): Feedback => ({
  id: String(f.id ?? ""),
  category: String(f.category ?? "other"),
  message: String(f.message ?? ""),
  anonymous: !!f.is_anonymous,
  status: String(f.status ?? "new"),
  adminNote: String(f.admin_note ?? ""),
  createdAt: String(f.created_at ?? ""),
});

/** GET .../hub/feedback: the astrologer's last 50, newest first. */
export async function getFeedback(id: string, signal?: AbortSignal): Promise<Feedback[]> {
  const raw = await api<{ feedback?: RawFeedback[] }>(`${base(id)}/hub/feedback`, { signal });
  return (raw?.feedback ?? []).map(toFeedback);
}

/** POST .../hub/feedback: message 5-3000 characters; at most 5 a day (429 afterwards). */
export async function sendFeedback(id: string, input: { category: FeedbackCategory; message: string; anonymous: boolean }): Promise<Feedback> {
  return toFeedback(await api<RawFeedback>(`${base(id)}/hub/feedback`, { method: "POST", body: input }));
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export type AppNotification = { id: string; title: string; body: string; createdAt: number; read: boolean };

type RawNotification = { id?: string; createTs?: number; read?: boolean; message?: string; viewData?: { title?: string; body?: string } };

/** GET /v1/astrologer/:id/notification: the last 100 in-app notifications, newest first. */
export async function getNotifications(id: string, signal?: AbortSignal): Promise<AppNotification[]> {
  const raw = await api<{ inAppNotifications?: RawNotification[] }>(`${base(id)}/notification`, { signal });
  return (raw?.inAppNotifications ?? []).map((n) => ({
    id: String(n.id ?? ""),
    title: String(n.viewData?.title || n.message || ""),
    body: String(n.viewData?.body ?? ""),
    createdAt: Number(n.createTs) || 0,
    read: !!n.read,
  }));
}

/** PATCH .../notification/type/in-app/:nid {op:REPLACE,path:READ,value}. */
export function markNotificationRead(id: string, notificationId: string, read = true) {
  return api<unknown>(`${base(id)}/notification/type/inAppNotifications/${encodeURIComponent(notificationId)}`, {
    method: "PATCH",
    body: { op: "REPLACE", path: "READ", value: read },
  });
}

export const PREFERENCE_KEYS = ["booking_reminders", "session_start", "chat_messages", "wallet_updates", "admin_broadcasts", "promo_offers"] as const;
export type PreferenceKey = (typeof PREFERENCE_KEYS)[number];
export type Preferences = Record<PreferenceKey, boolean>;

/** GET /v1/notifications/preferences: everything is on unless the user turned it off. */
export async function getPreferences(signal?: AbortSignal): Promise<Preferences> {
  const raw = await api<Partial<Record<PreferenceKey, unknown>>>("/v1/notifications/preferences", { signal });
  return Object.fromEntries(PREFERENCE_KEYS.map((k) => [k, raw?.[k] !== false])) as Preferences;
}

/** PUT /v1/notifications/preferences with the changed keys. */
export function setPreferences(prefs: Partial<Preferences>) {
  return api<unknown>("/v1/notifications/preferences", { method: "PUT", body: prefs });
}
