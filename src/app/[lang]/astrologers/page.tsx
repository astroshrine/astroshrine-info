import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT, languageAlternates } from "@/i18n/server";
import { getDirectory, warmProfiles } from "@/lib/services/astrologers.server";
import { shareImages } from "@/lib/share";
import { isFilter, isSort, type AstrologerCard } from "@/lib/services/astrologerModel";
import AstrologerDirectory, { DirectorySkeleton, type DirectoryQuery } from "./AstrologerDirectory";

const text = defineMessages({
  hi: {
    title: "Astrologers · AstroShrine",
    description:
      "AstroShrine के ज्योतिषियों से chat करें: वैदिक, टैरो, अंक ज्योतिष और वास्तु। रेटिंग, अनुभव और प्रति मिनट कीमत देखकर चुनें; समय तभी शुरू होता है जब ज्योतिषी जवाब देते हैं।",
  },
  en: {
    title: "Astrologers · AstroShrine",
    description:
      "Chat with AstroShrine astrologers in Vedic astrology, Tarot, Numerology and Vastu. Choose by rating, experience and price per minute. The clock starts only when the astrologer replies.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return {
    title: t.title,
    description: t.description,
    alternates: await languageAlternates("/astrologers"),
    openGraph: { title: t.title, description: t.description, type: "website", images: await shareImages() },
  };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function Directory({ searchParams }: { searchParams: PageProps<"/[lang]/astrologers">["searchParams"] }) {
  const sp = await searchParams;
  const filter = one(sp.filter);
  const sort = one(sp.sort);
  const lang = one(sp.language);
  const query: DirectoryQuery = {
    q: (one(sp.q) ?? "").slice(0, 60),
    // Hindi and English are the language select now; links that carried them as the filter still work.
    filter: isFilter(filter) && filter !== "Hindi" && filter !== "English" ? filter : "all",
    language: lang === "Hindi" || lang === "English" ? lang : filter === "Hindi" || filter === "English" ? filter : "all",
    mode: one(sp.mode) === "call" ? "call" : "chat",
    sort: isSort(sort) ? sort : "popularity",
    favourites: one(sp.fav) === "1",
  };

  // Rendered on the server for search engines and a fast first paint; on a backend outage the browser loads it.
  let initial: AstrologerCard[] | null = null;
  try {
    initial = await getDirectory();
  } catch (error) {
    console.error("[astrologers] directory prerender failed:", error);
  }
  if (initial) {
    // Online first: the profiles at the top of the list are the ones people open, so have them ready.
    // Request-time work only: `after()` reads the clock, which is not allowed while prerendering, so
    // connection() comes first (it resolves at once for a real request).
    await connection();
    warmProfiles(initial.map((a) => a.id));
  }

  return <AstrologerDirectory initial={initial} initialQuery={query} />;
}

export default function AstrologersPage({ searchParams }: PageProps<"/[lang]/astrologers">) {
  return (
    <Suspense fallback={<DirectorySkeleton />}>
      <Directory searchParams={searchParams} />
    </Suspense>
  );
}
