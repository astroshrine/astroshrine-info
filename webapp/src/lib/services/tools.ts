import { api, ApiError } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

// Shared pieces of the /tools pages on the shared backend (React-native-app: features/savedResults,
// features/*/…Api.ts). Per-tool calls live in tools<Name>.ts next to this file.

// ─── Multipart upload (photos) ──────────────────────────────────────────────

/** POST multipart/form-data through the same-origin proxy, with the signed-in token (and the one 401 refresh `api` does). */
export async function apiForm<T>(path: string, form: FormData, signal?: AbortSignal): Promise<T> {
  const send = (token: string | null) =>
    fetch(`/api${path}`, {
      method: "POST",
      // No Content-Type: the browser adds the multipart one with its boundary.
      headers: { Accept: "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      body: form,
      cache: "no-store",
      signal,
    });
  const supabase = getSupabase();
  let token = (await supabase.auth.getSession()).data.session?.access_token ?? null;
  let res = await send(token);
  if (res.status === 401 && token) {
    token = (await supabase.auth.refreshSession()).data.session?.access_token ?? null;
    if (token) res = await send(token);
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const b = data && typeof data === "object" ? (data as { error?: unknown; message?: unknown; code?: unknown }) : {};
    throw new ApiError(res.status, String(b.error || b.message || `Request failed (${res.status})`), typeof b.code === "string" ? b.code : undefined);
  }
  return data as T;
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export type ToolFailure = "notAllowed" | "insufficientBalance" | "rateLimited" | "disabled" | "tooLarge" | "failed";

/** The kind of failure the backend answered with (403 astrologer_only / *_disabled_for_users, 402, 413, 429). */
export function toolFailure(e: unknown): ToolFailure {
  if (!(e instanceof ApiError)) return "failed";
  if (e.status === 402 || e.message === "insufficient_balance") return "insufficientBalance";
  if (e.status === 429) return "rateLimited";
  if (e.status === 413) return "tooLarge";
  if (e.status === 403) return /disabled_for_users/.test(e.message) ? "disabled" : "notAllowed";
  return "failed";
}

/** The 400 {error, details:[{field,message}]} shape the tool modules use; the messages are English. */
export function fieldErrors(e: unknown): { field: string; message: string }[] {
  // `api` keeps only the message, so a 400 reaches the page as its first message.
  return e instanceof ApiError && e.status === 400 ? [{ field: "", message: e.message }] : [];
}

// ─── Saved results (/v1/tool-results) ───────────────────────────────────────

export type SavedTool =
  | "signature_analysis"
  | "tarot"
  | "numerology"
  | "mansik_pravritti"
  | "jeevan_margdarshan";

export type SavedSummary = { id: string; tool: SavedTool | string; title: string; createdAt: string };
export type SavedResult<R = unknown, I = unknown> = SavedSummary & { input: I; result: R };

/** Save what a tool just showed. Never throws: the result is on screen already, a failed save only costs the history entry. */
export async function saveToolResult(tool: SavedTool, result: object, input: object = {}, title?: string): Promise<string | undefined> {
  try {
    const r = await api<{ id: string }>("/v1/tool-results", { method: "POST", body: { tool, result, input, ...(title ? { title } : {}) } });
    return r?.id;
  } catch {
    return undefined;
  }
}

export function listToolResults(tool: SavedTool, offset = 0, signal?: AbortSignal) {
  return api<{ results: SavedSummary[]; hasMore: boolean }>(`/v1/tool-results?tool=${tool}&offset=${offset}&limit=20`, { signal });
}

export function getToolResult<R = unknown, I = unknown>(id: string, signal?: AbortSignal) {
  return api<SavedResult<R, I>>(`/v1/tool-results/${encodeURIComponent(id)}`, { signal });
}

export function deleteToolResult(id: string) {
  return api<unknown>(`/v1/tool-results/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ─── Printable report ───────────────────────────────────────────────────────

/** The reports' /pdf routes answer printable HTML (the app prints it): open it in a new tab to print or save as PDF. */
export async function openPrintable(path: string): Promise<void> {
  const html = await api<string>(path);
  const url = URL.createObjectURL(new Blob([String(html)], { type: "text/html" }));
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** A Place as the tool endpoints take it. */
export type ToolPlace = { name: string; lat: number; lng: number; tz: string };
