// The website opens on the login, as the app does: a visitor who opens the home page (/hi, /en) without having
// signed in on this browser, or chosen to look around first, is sent to /login (src/proxy.ts). The choice is kept
// in a cookie the proxy can read (the Supabase session itself lives in localStorage, out of the server's sight).

export const FRONT_COOKIE = "AS_FRONT";

/** Signed in on this browser: a year, refreshed on every visit while the session lasts. */
export const FRONT_MEMBER = "member";
/** "Continue without login": until the browser is closed, so a new visit starts on the login again. */
export const FRONT_GUEST = "guest";

/** Search engines and link previews always get the home page itself, never the login redirect. */
export const BOT_AGENT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|lighthouse|embedly|quora link|pinterest|vkshare|skype/i;

export function setFrontCookie(value: typeof FRONT_MEMBER | typeof FRONT_GUEST) {
  const age = value === FRONT_MEMBER ? "; max-age=31536000" : "";
  document.cookie = `${FRONT_COOKIE}=${value}; path=/${age}; samesite=lax`;
}

export function clearFrontCookie() {
  document.cookie = `${FRONT_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
