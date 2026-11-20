/**
 * Railway's deploy health check (railway.json). Every page path redirects to a language first (src/proxy.ts),
 * and the health check does not follow redirects, so it needs a plain 200 outside the pages: /api is skipped by
 * the proxy, and this static route wins over the backend proxy at /api/[...path].
 */
export function GET() {
  return Response.json({ ok: true });
}
