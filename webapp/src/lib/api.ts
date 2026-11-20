import { getSupabase } from "./supabase";

/** An error answer from the backend, with its HTTP status and machine-readable code when it sent one. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The backend refuses a deactivated or just-deleted account with these codes (403, not 401). */
export const ACCOUNT_BLOCKED_CODES = new Set(["ACCOUNT_DEACTIVATED", "ACCOUNT_RECENTLY_DELETED"]);

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Send the signed-in user's Supabase access token (default). Public endpoints can skip it. */
  auth?: boolean;
  signal?: AbortSignal;
};

async function accessToken(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token ?? null;
}

function parse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

type ErrorBody = { error?: unknown; message?: unknown; err?: unknown; code?: unknown };

/**
 * Calls the AstroShrine backend through the same-origin proxy (/api/v1/... -> BACKEND_URL/v1/...).
 * `path` starts at the API version, e.g. "/v1/wallet/balance".
 */
export async function api<T>(path: string, { method = "GET", body, auth = true, signal }: RequestOptions = {}): Promise<T> {
  const send = (token: string | null) =>
    fetch(`/api${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal,
    });

  let token = auth ? await accessToken() : null;
  let res = await send(token);

  // Same as the mobile app: a 401 is usually an access token that expired by this device's clock.
  // Refresh it once and retry.
  if (res.status === 401 && token) {
    const { data } = await getSupabase().auth.refreshSession();
    token = data.session?.access_token ?? null;
    if (token) res = await send(token);
  }

  const text = await res.text();
  const data = text ? parse(text) : null;

  if (!res.ok) {
    const body: ErrorBody = data && typeof data === "object" ? (data as ErrorBody) : {};
    const message = body.error || body.message || body.err || `Request failed (${res.status})`;
    throw new ApiError(res.status, String(message), typeof body.code === "string" ? body.code : undefined);
  }
  return data as T;
}
