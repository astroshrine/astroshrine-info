import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDirectoryCard, getProfilePageData } from "@/lib/services/astrologers.server";
import AstrologerProfileView, { ProfileSkeleton } from "./AstrologerProfileView";

export async function generateMetadata({ params }: PageProps<"/astrologers/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const data = await getProfilePageData(id);
    // Unknown id: the 404 view streams in after the status line was sent (200), so keep it out of search results.
    if (!data) return { title: "Astrologer नहीं मिले · AstroShrine", robots: { index: false } };
    const p = data.profile;
    const title = `${p.name} · Astrologer · AstroShrine`;
    const facts = [
      p.expertise.slice(0, 3).join(", "),
      p.experience ? `${p.experience} साल अनुभव` : null,
      p.languages.slice(0, 3).join(", "),
    ].filter(Boolean);
    const description = `${facts.join(" · ")}. AstroShrine पर ${p.name} से chat करें: समय तभी शुरू होता है जब वे जवाब देते हैं।`;
    return {
      title,
      description,
      alternates: { canonical: `/astrologers/${p.id}` },
      openGraph: { title, description, type: "profile", ...(p.photo ? { images: [{ url: p.photo, alt: p.name }] } : {}) },
    };
  } catch {
    /* fall through to the generic title */
  }
  return { title: "Astrologer · AstroShrine" };
}

/**
 * Two speeds. The astrologer's directory entry (name, photo, rating, price, status) comes from the shared list
 * cache at once, so the header and the chat button render immediately. The full profile (about, stats, photos,
 * first reviews) is requested at the same time and streams into its own placeholders when it arrives
 * (~1.8 s from the backend the first time, instant once cached).
 */
async function Profile({ params }: { params: PageProps<"/astrologers/[id]">["params"] }) {
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

export default function AstrologerPage({ params }: PageProps<"/astrologers/[id]">) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <Profile params={params} />
    </Suspense>
  );
}
