import { joinBookingCall } from "@/lib/services/bookingCall";
import { findSession } from "@/lib/services/chat";

// Joining a booked chat from the console. The server lets a booking be joined from 5 minutes before it starts
// until it ends, on the day (IST). Calls cannot be taken in the browser by an astrologer: joining one rings the
// customer and needs the app's call screen, so the console only points to the app.

export const JOIN_EARLY_MS = 5 * 60_000;
const OPEN_STATUSES = ["CONFIRMED", "IN_PROGRESS"];

/** Booking dates and times are IST wall time. */
export function istMs(date?: string, time?: string): number | null {
  const d = String(date ?? "").substring(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !/^\d{1,2}:\d{2}/.test(time ?? "")) return null;
  const ms = Date.parse(`${d}T${String(time).slice(0, 5).padStart(5, "0")}:00+05:30`);
  return Number.isNaN(ms) ? null : ms;
}

/** True while the booking can be joined: confirmed or running, from 5 minutes before the start to the end. */
export function canJoinNow(status: string, startsAt: number | null, endsAt: number | null, now: number): boolean {
  if (!OPEN_STATUSES.includes(status) || startsAt === null) return false;
  const end = endsAt ?? startsAt;
  return now >= startsAt - JOIN_EARLY_MS && now <= end;
}

export class NoChatRoom extends Error {}

/** POST /v1/booking/:id/join-session (books the slot and opens the thread), then the chat room's id for this customer. */
export async function joinBookedChat(bookingId: string, selfId: string, userId: string): Promise<string> {
  await joinBookingCall(bookingId);
  const room = await findSession(selfId, userId);
  if (!room?.id) throw new NoChatRoom();
  return `/astrologer/session?chat=${encodeURIComponent(room.id)}&booking=${encodeURIComponent(bookingId)}`;
}
