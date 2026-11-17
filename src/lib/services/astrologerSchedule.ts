import { api } from "@/lib/api";

// The astrologer's weekly availability, special days and booked appointments (the astrologer app's
// AstroSchedule, WeeklyScheduleCard, DayBlocksSheet and SpecialDaysSheet), on /v1/booking.

export type ChannelType = "call" | "chat" | "both" | "live";

export type ScheduleSlot = {
  /** 0 = Sunday, as Date.getDay(). */
  day_of_week: number;
  /** HH:MM. */
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  channel_type: ChannelType | string;
};

export type ScheduleOverride = {
  id: string;
  override_date: string;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
  reason: string | null;
};

export type Appointment = {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  channel_type: string;
  status: string;
  user: { name: string | null } | null;
};

const hhmm = (v: unknown) => String(v ?? "").substring(0, 5);
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export async function getSchedule(signal?: AbortSignal): Promise<ScheduleSlot[]> {
  const raw = list<Partial<ScheduleSlot> & { is_active?: boolean }>(await api<unknown>("/v1/booking/schedule", { signal }));
  return raw
    .filter((s) => s.is_active !== false && typeof s.day_of_week === "number")
    .map((s) => ({
      day_of_week: s.day_of_week as number,
      start_time: hhmm(s.start_time),
      end_time: hhmm(s.end_time),
      slot_duration_minutes: Number(s.slot_duration_minutes) || 10,
      channel_type: s.channel_type || "both",
    }));
}

/** Replaces the whole week. */
export async function saveSchedule(slots: ScheduleSlot[]): Promise<void> {
  await api("/v1/booking/schedule", { method: "PUT", body: { slots } });
}

export async function getOverrides(fromDate: string, signal?: AbortSignal): Promise<ScheduleOverride[]> {
  const raw = list<ScheduleOverride>(await api<unknown>(`/v1/booking/schedule/overrides?fromDate=${encodeURIComponent(fromDate)}`, { signal }));
  return raw.map((o) => ({
    id: String(o.id),
    override_date: String(o.override_date).substring(0, 10),
    start_time: o.start_time ? hhmm(o.start_time) : null,
    end_time: o.end_time ? hhmm(o.end_time) : null,
    is_available: o.is_available === true,
    reason: o.reason || null,
  }));
}

export async function addOverride(o: { override_date: string; is_available: boolean; start_time?: string; end_time?: string; reason?: string }): Promise<void> {
  await api("/v1/booking/schedule/override", { method: "POST", body: o });
}

export async function deleteOverride(id: string): Promise<void> {
  await api(`/v1/booking/schedule/override/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getAppointments(signal?: AbortSignal): Promise<Appointment[]> {
  const raw = list<Partial<Appointment>>(await api<unknown>("/v1/booking/my-appointments", { signal }));
  return raw.map((b) => ({
    id: String(b.id),
    booking_date: String(b.booking_date).substring(0, 10),
    start_time: hhmm(b.start_time),
    end_time: hhmm(b.end_time),
    duration_minutes: Number(b.duration_minutes) || 0,
    channel_type: b.channel_type || "chat",
    status: b.status || "",
    user: b.user ? { name: b.user.name ?? null } : null,
  }));
}
