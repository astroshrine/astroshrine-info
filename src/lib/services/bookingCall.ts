import { api } from "@/lib/api";

// The customer's side of a booked voice call, with the same calls as the app's useBookingCallJoin and
// PrivateCallManager: join the booking, accept the astrologer's ring, take an Agora token for the astrologer's
// channel, talk, and tell the server when it ends. The astrologer starts the call from their own app or console.

export type TempHost = { id?: string; uid?: number; status?: string; name?: string; bookingId?: string; orderTentativeEndTs?: number };

export type CallChannel = {
  channelId: string;
  tempHost?: TempHost | null;
};

export type JoinResult = {
  /** accept_required: the astrologer has rung you and you must accept; join: you are already on it. */
  action: "accept_required" | "join" | "chat";
  channel: CallChannel | null;
};

/** The calls' states the server uses. Terminated ones end with who ended it. */
export const isTerminated = (status?: string | null) => String(status ?? "").toUpperCase().includes("TERMINATED") || String(status ?? "").toUpperCase() === "REJECTED";
export const isAccepted = (status?: string | null) => String(status ?? "").toUpperCase() === "ACCEPTED";

type RawJoin = { action?: string; channel?: { channelId?: string; tempHost?: TempHost | null } };

/** POST /v1/booking/:id/join-session. 409 = the astrologer has not started the call yet; 400 = outside the call window. */
export async function joinBookingCall(bookingId: string): Promise<JoinResult> {
  const r = await api<RawJoin>(`/v1/booking/${encodeURIComponent(bookingId)}/join-session`, { method: "POST" });
  const channel = r?.channel?.channelId ? { channelId: r.channel.channelId, tempHost: r.channel.tempHost ?? null } : null;
  return { action: r?.action === "accept_required" ? "accept_required" : r?.action === "chat" ? "chat" : "join", channel };
}

export async function getCallChannel(channelId: string, signal?: AbortSignal): Promise<CallChannel> {
  const r = await api<{ channelId?: string; tempHost?: TempHost | null }>(`/v1/channel/call/${encodeURIComponent(channelId)}`, { signal });
  return { channelId: r?.channelId || channelId, tempHost: r?.tempHost ?? null };
}

const tempHostUrl = (channelId: string, userId: string) => `/v1/channel/call/${encodeURIComponent(channelId)}/temp-host/${encodeURIComponent(userId)}`;

/** Accept the ring: PATCH temp-host status ACCEPTED. */
export function acceptCall(channelId: string, userId: string) {
  return api<unknown>(tempHostUrl(channelId, userId), { method: "PATCH", body: { op: "REPLACE", path: "status", value: "ACCEPTED" } });
}

/** Tell the server which Agora uid this device speaks with, so the astrologer binds the audio to it. */
export function setCallUid(channelId: string, userId: string, uid: number) {
  return api<unknown>(tempHostUrl(channelId, userId), { method: "PATCH", body: { op: "REPLACE", path: "uid", value: uid } });
}

/** Hang up (or reject while still ringing). The server answers 404 / 403 when the seat is already gone: that is fine. */
export async function endCall(channelId: string, userId: string, ringing: boolean): Promise<void> {
  try {
    await api<unknown>(tempHostUrl(channelId, userId), {
      method: "PATCH",
      body: { op: "REPLACE", path: "status", value: ringing ? "REJECTED" : "TERMINATED_BY_CLIENT" },
    });
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status !== 404 && status !== 403) throw e;
  }
}

/** GET /v1/token/rtc/:channel/publisher/uid/:uid: the Agora token for this call (the customer speaks, so publisher). */
export async function fetchRtcToken(channelId: string, uid: number, signal?: AbortSignal): Promise<string> {
  const r = await api<{ rtcToken?: string }>(`/v1/token/rtc/${encodeURIComponent(channelId)}/publisher/uid/${uid}/?expiry=3600`, { signal });
  if (!r?.rtcToken) throw new Error("No token");
  return r.rtcToken;
}

/** The Agora project id (a public client value). Without it the browser cannot join a call. */
export const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? "";

/** A random uid in Agora's 32-bit range, as the app picks one per session. */
export const randomUid = () => Math.floor(Math.random() * 2_147_483_646) + 1;
