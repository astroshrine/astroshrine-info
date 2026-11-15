/**
 * Updates one query parameter of the current URL without a navigation. Next.js syncs these native
 * history calls with useSearchParams, so the page re-renders from the URL.
 * "push" adds a history entry (the back button undoes it), "replace" does not.
 */
export function setQueryParam(name: string, value: string | null, mode: "push" | "replace") {
  const params = new URLSearchParams(window.location.search);
  if (value === null) params.delete(name);
  else params.set(name, value);
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

/** The current path and query, for /login?next=… so a deep link survives signing in. */
export const currentLocation = () => `${window.location.pathname}${window.location.search}`;
