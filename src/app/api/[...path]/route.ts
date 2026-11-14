import type { NextRequest } from "next/server";

/**
 * Same-origin proxy to the AstroShrine backend (the Express API the mobile app uses, on the same
 * Supabase database). The browser calls /api/v1/..., this forwards to BACKEND_URL/v1/....
 *
 * Why a proxy instead of calling the backend from the browser: the backend's CORS only allows
 * https://*.astroshrine.in, so localhost and preview URLs would be refused. Server-to-server there
 * is no CORS, and BACKEND_URL stays out of the client bundle.
 *
 * Only a small set of headers is forwarded on purpose: the browser's X-Forwarded-Proto ("http" in
 * local dev) would trip the backend's HTTPS-only guard, and cookies are not the backend's business.
 *
 * Livestream is not part of the website: its backend routes are refused here, not just unused.
 */

const FORWARD_REQUEST_HEADERS = ["authorization", "content-type", "accept", "accept-language", "x-astro-context"];
const FORWARD_RESPONSE_HEADERS = ["content-type", "cache-control", "date", "retry-after"];
const TIMEOUT_MS = 30_000;

/** /v1/live/... (live rooms) and /v1/channel/livestream/... (broadcast channels). */
function isLivestreamRoute(path: string[]) {
  const [, area, kind] = path.map((p) => p.toLowerCase());
  return area === "live" || (area === "channel" && kind === "livestream");
}

async function proxy(request: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  const backend = process.env.BACKEND_URL?.replace(/\/+$/, "");
  if (!backend) {
    return Response.json({ error: "BACKEND_URL is not set (see .env.example)" }, { status: 500 });
  }

  const { path } = await ctx.params;
  // Only the versioned API is reachable through here: not /doc, /health-check or static assets.
  if (path[0] !== "v1" || isLivestreamRoute(path)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const target = `${backend}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return Response.json(
      { error: timedOut ? "The server took too long to answer" : "Could not reach the server" },
      { status: timedOut ? 504 : 502 },
    );
  }

  const responseHeaders = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
