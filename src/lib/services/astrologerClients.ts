import { api } from "@/lib/api";

// The astrologer's past clients and the 24-hour "come back" invite (the astrologer app's AstroClientsScreen).

export type Segment = "top" | "loyal";

export type Client = {
  id: string;
  name: string;
  photo: string | null;
  totalSpent: number;
  sessions: number;
  lastSessionAt: string | null;
  lastChannel: "chat" | "call" | null;
  lastInvitedAt: string | null;
  /** Earliest time another invite is allowed; null or in the past means now. */
  canInviteAt: string | null;
};

type Raw = Partial<Omit<Client, "photo">> & { profileImage?: string | null };

export async function getClients(astrologerId: string, segment: Segment, signal?: AbortSignal): Promise<Client[]> {
  const res = await api<{ clients?: Raw[] }>(`/v1/astrologer/${encodeURIComponent(astrologerId)}/clients?segment=${segment}`, { signal });
  return (Array.isArray(res?.clients) ? res.clients : []).map((c) => ({
    id: String(c.id),
    name: (c.name || "").trim(),
    photo: c.profileImage || null,
    totalSpent: Number(c.totalSpent) || 0,
    sessions: Number(c.sessions) || 0,
    lastSessionAt: c.lastSessionAt || null,
    lastChannel: c.lastChannel === "chat" || c.lastChannel === "call" ? c.lastChannel : null,
    lastInvitedAt: c.lastInvitedAt || null,
    canInviteAt: c.canInviteAt || null,
  }));
}

/** Sends the invite; answers the time the next one is allowed. A 429 means one already went out in the last 24 hours. */
export async function inviteClient(astrologerId: string, userId: string, channel: "chat" | "call"): Promise<{ delivered: boolean; canInviteAt: string }> {
  const res = await api<{ delivered?: boolean; canInviteAt?: string }>(
    `/v1/astrologer/${encodeURIComponent(astrologerId)}/clients/${encodeURIComponent(userId)}/invite`,
    { method: "POST", body: { channel } },
  );
  return { delivered: res?.delivered === true, canInviteAt: res?.canInviteAt || new Date(Date.now() + 86_400_000).toISOString() };
}
