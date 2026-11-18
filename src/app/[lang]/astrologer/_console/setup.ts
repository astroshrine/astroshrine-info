import type { BackendUser } from "@/lib/endpoints";
import type { OwnAstrologer } from "@/lib/services/astrologerProfile";

/**
 * Has this astrologer filled in the first sign-in profile details the profile page edits: name, expertise,
 * languages, about and experience? True means they still have to (the console sends them to /astrologer/setup).
 *
 * The users row (GET /v1/user-supabase/:id) always carries the name and, for some accounts, `languages`;
 * the astrologer details (expertise, about, experience) sit in the astrologer's hostProfile. When a row does not
 * include them, only the fields that are present are judged, so a missing field never traps someone in setup.
 * The console shell completes the picture with the astrologer's own record (see ownNeedsSetup).
 */
export function profileNeedsSetup(user: BackendUser): boolean {
  const u = user as BackendUser & {
    languages?: unknown;
    hostProfile?: Record<string, unknown> | null;
    astrologer?: { hostProfile?: Record<string, unknown> | null; host_profile?: Record<string, unknown> | null } | null;
  };
  if (!(u.name ?? "").trim()) return true;
  const host = u.hostProfile ?? u.astrologer?.hostProfile ?? u.astrologer?.host_profile ?? null;
  if (host) {
    return ownNeedsSetup({
      name: u.name ?? "",
      expertise: strings(host.expertise),
      languages: strings(host.languages).length ? strings(host.languages) : strings(u.languages),
      aboutMe: String(host.aboutMe ?? ""),
      experience: Number(host.experience) || 0,
    });
  }
  return false;
}

const strings = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string" && s.trim() !== "") : []);

/** The same check on the astrologer's own record (GET /v1/astrologer/:id). Experience is not judged on its own: 0 years is a valid answer for a new astrologer. */
export function ownNeedsSetup(own: Pick<OwnAstrologer, "name" | "expertise" | "languages" | "aboutMe" | "experience">): boolean {
  return !own.name.trim() || own.expertise.length === 0 || own.languages.length === 0 || !own.aboutMe.trim();
}
