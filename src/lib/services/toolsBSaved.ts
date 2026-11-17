import { api } from "@/lib/api";

// Saved tool results (backend /v1/tool-results, table tool_results), the same history the app's "Saved" button
// opens. Tools run on the server save their answer themselves and reply with `savedId`; tools run in the
// browser (the muhurat engines, Vastu Check) POST their result after showing it.

export type SavedTool =
  | "khoya_paya"
  | "muhurat"
  | "yagyopavit"
  | "sanskar_muhurat"
  | "mahavastu_analyser"
  | "vastu_check"
  | "kp_question";

export type SavedSummary = { id: string; tool: string; title: string; createdAt: string };
export type SavedResult<R = unknown, I = unknown> = SavedSummary & { input: I; result: R };

export const SAVED_PAGE_SIZE = 20;

/** GET /v1/tool-results?tool=…: newest first. */
export function listSaved(tool: SavedTool, offset = 0, signal?: AbortSignal) {
  return api<{ results: SavedSummary[]; hasMore: boolean }>(`/v1/tool-results?tool=${tool}&limit=${SAVED_PAGE_SIZE}&offset=${offset}`, { signal });
}

/** GET /v1/tool-results/:id */
export function getSaved<R = unknown, I = unknown>(id: string) {
  return api<SavedResult<R, I>>(`/v1/tool-results/${encodeURIComponent(id)}`);
}

/** DELETE /v1/tool-results/:id */
export function deleteSaved(id: string) {
  return api<unknown>(`/v1/tool-results/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** POST /v1/tool-results. Never throws: the result is on screen already, so a failed save only costs the history entry. */
export async function saveResult(tool: SavedTool, result: object, input: object = {}, title?: string): Promise<string | undefined> {
  try {
    const r = await api<{ id?: string }>("/v1/tool-results", { method: "POST", body: { tool, result, input, ...(title ? { title } : {}) } });
    return r?.id;
  } catch {
    return undefined;
  }
}
