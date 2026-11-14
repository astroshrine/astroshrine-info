import { connection } from "next/server";
import { getChatAstrologers, warmProfiles } from "@/lib/services/astrologers.server";

/**
 * GET /api/astrologers: the public chat astrologer list for the browser, from the server cache in
 * getChatAstrologers (refreshed in the background every 30 s). This static route takes precedence over
 * the /api/[...path] proxy for this one path.
 *
 * `connection()` keeps the handler per request (it is cheap: the data comes from the cache), so a backend
 * outage at build time can never be baked into a prerendered error response.
 */
export async function GET() {
  await connection();
  try {
    const list = await getChatAstrologers();
    // The home and landing pages show the first few: have their profiles ready before anyone clicks.
    warmProfiles(list.map((a) => a.id));
    return Response.json(list, {
      headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("[api/astrologers]", error);
    return Response.json({ error: "Astrologers की सूची अभी नहीं मिल पाई। थोड़ी देर बाद फिर कोशिश करें।" }, { status: 502 });
  }
}
