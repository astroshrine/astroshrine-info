import { ApiError } from "@/lib/api";
import type { Locale } from "@/i18n/config";

// Shared by the astrologer tools of the /tools section (khoya-paya, blind-kundli, integrated-reading, the
// muhurat tools and the vastu tools). The calls are the app's own; none of them is made until the visitor
// presses a button.

/** "Hello {{name}}" with {name: "Ravi"}: the app's i18next placeholders, so its strings can be reused as is. */
export function fill(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => String(vars[k] ?? ""));
}

/** The browser's IANA time zone, for a time the visitor types on this device's clock. */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
}

const p2 = (n: number) => String(n).padStart(2, "0");
/** "YYYY-MM-DDTHH:mm" in this browser's local time. */
export const localIso = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
/** Today's date as YYYY-MM-DD in this browser's time zone. */
export const todayYmd = () => localIso(new Date()).slice(0, 10);

/** The backend's 402: { error: "insufficient_balance", required }. null for any other error. */
export function lowBalance(error: unknown): { required?: number } | null {
  if (!(error instanceof ApiError) || error.status !== 402) return null;
  return {};
}

/** What the visitor can do about a failed call, from the status codes the tool routes answer. */
export type ToolErrorKind = "needLogin" | "astrologerOnly" | "disabled" | "rateLimited" | "badInput" | "notFound" | "offline" | "failed";

export function toolErrorKind(e: unknown): ToolErrorKind {
  if (e instanceof ApiError) {
    if (e.status === 401) return "needLogin";
    if (e.status === 403) return /astrolog/i.test(e.message) ? "astrologerOnly" : "disabled";
    if (e.status === 429) return "rateLimited";
    if (e.status === 400 || e.status === 422) return "badInput";
    if (e.status === 404) return "notFound";
    return "failed";
  }
  return e instanceof TypeError ? "offline" : "failed";
}

export const TOOL_ERROR_TEXT: Record<Locale, Record<ToolErrorKind, string>> = {
  hi: {
    needLogin: "लॉगिन की अवधि खत्म हो गई। दोबारा लॉगिन करें।",
    astrologerOnly: "यह टूल केवल AstroShrine के ज्योतिषियों के लिए है।",
    disabled: "यह सुविधा अभी आपके खाते के लिए चालू नहीं है।",
    rateLimited: "बहुत बार कोशिश हुई। थोड़ी देर बाद फिर कोशिश करें।",
    badInput: "भरी हुई जानकारी में कुछ गलत है। जाँचकर फिर कोशिश करें।",
    notFound: "यह जानकारी नहीं मिली।",
    offline: "इंटरनेट कनेक्शन नहीं मिला। कनेक्शन जाँचकर फिर कोशिश करें।",
    failed: "कुछ गड़बड़ हो गई। फिर कोशिश करें।",
  },
  en: {
    needLogin: "Your login has expired. Log in again.",
    astrologerOnly: "This tool is only for AstroShrine astrologers.",
    disabled: "This is not switched on for your account yet.",
    rateLimited: "Too many tries. Please wait a while and try again.",
    badInput: "Something in what you entered is not right. Check it and try again.",
    notFound: "This was not found.",
    offline: "No internet connection. Check your connection and try again.",
    failed: "Something went wrong. Please try again.",
  },
};

/** The backend's own message for a 400, when it sent a readable one (the app shows it as well). */
export function toolErrorText(e: unknown, locale: Locale): string {
  const kind = toolErrorKind(e);
  if (kind === "badInput" && e instanceof ApiError && e.message && !/^Request failed/.test(e.message)) return e.message;
  return TOOL_ERROR_TEXT[locale][kind];
}
