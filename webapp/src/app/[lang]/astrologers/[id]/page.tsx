import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { defineMessages } from "@/i18n/messages";
import { getT, languageAlternates } from "@/i18n/server";
import { getDirectoryCard, getProfilePageData } from "@/lib/services/astrologers.server";
import { shareImages } from "@/lib/share";
import AstrologerProfileView, { ProfileSkeleton } from "./AstrologerProfileView";

const text = defineMessages({
  hi: {
    notFound: "Astrologer नहीं मिले · AstroShrine",
    title: (name: string) => `${name} · Astrologer · AstroShrine`,
    experience: (years: number) => `${years} साल अनुभव`,
    description: (facts: string, name: string) =>
      `${facts}. AstroShrine पर ${name} से chat करें: समय तभी शुरू होता है जब वे जवाब देते हैं।`,
    fallbackTitle: "Astrologer · AstroShrine",
  },
  en: {
    notFound: "Astrologer not found · AstroShrine",
    title: (name) => `${name} · Astrologer · AstroShrine`,
    experience: (years) => (years === 1 ? "1 year of experience" : `${years} years of experience`),
    description: (facts, name) => `${facts}. Chat with ${name} on AstroShrine. The clock starts only when they reply.`,
    fallbackTitle: "Astrologer · AstroShrine",
  },
});

export async function generateMetadata({ params }: PageProps<"/[lang]/astrologers/[id]">): Promise<Metadata> {
  const { id } = await params;
  const t = await getT(text);
  try {
    const data = await getProfilePageData(id);
    // Unknown id: the 404 view streams in after the status line was sent (200), so keep it out of search results.
    if (!data) return { title: t.notFound, robots: { index: false } };
    const p = data.profile;
    const title = t.title(p.name);
    const facts = [
      p.expertise.slice(0, 3).join(", "),
      p.experience ? t.experience(p.experience) : null,
      p.languages.slice(0, 3).join(", "),
    ].filter(Boolean);
    const description = t.description(facts.join(" · "), p.name);
    return {
      title,
      description,
      alternates: await languageAlternates(`/astrologers/${p.id}`),
      openGraph: { title, description, type: "profile", images: p.photo ? [{ url: p.photo, alt: p.name }] : await shareImages() },
    };
  } catch {
    /* fall through to the generic title */
  }
  return { title: t.fallbackTitle };
}

/**
 * Two speeds. The astrologer's directory entry (name, photo, rating, price, status) comes from the shared list
 * cache at once, so the header and the chat button render immediately. The full profile (about, stats, photos,
 * first reviews) is requested at the same time and streams into its own placeholders when it arrives
 * (~1.8 s from the backend the first time, instant once cached).
 */
async function Profile({ params }: { params: PageProps<"/[lang]/astrologers/[id]">["params"] }) {
  const { id } = await params;

  // undefined = the backend could not be reached while rendering: the browser loads the profile instead.
  const full = getProfilePageData(id).catch((error: unknown) => {
    console.error("[astrologers] profile prerender failed:", error);
    return undefined;
  });

  const preview = await getDirectoryCard(id);
  if (preview) return <AstrologerProfileView id={id} preview={preview} full={full} />;

  // Not in the public list (or the list is unavailable): wait for the full profile, as before.
  const data = await full;
  if (data === null) notFound();
  return <AstrologerProfileView id={id} preview={data?.profile ?? null} full={full} />;
}

export default function AstrologerPage({ params }: PageProps<"/[lang]/astrologers/[id]">) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <Profile params={params} />
    </Suspense>
  );
}
