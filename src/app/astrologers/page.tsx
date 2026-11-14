import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getDirectory, warmProfiles } from "@/lib/services/astrologers.server";
import { isFilter, isSort, type AstrologerCard } from "@/lib/services/astrologerModel";
import AstrologerDirectory, { DirectorySkeleton, type DirectoryQuery } from "./AstrologerDirectory";

const description =
  "AstroShrine के ज्योतिषियों से chat करें: वैदिक, टैरो, अंक ज्योतिष और वास्तु। रेटिंग, अनुभव और प्रति मिनट कीमत देखकर चुनें; समय तभी शुरू होता है जब ज्योतिषी जवाब देते हैं।";

export const metadata: Metadata = {
  title: "Astrologers · AstroShrine",
  description,
  alternates: { canonical: "/astrologers" },
  openGraph: { title: "Astrologers · AstroShrine", description, type: "website" },
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function Directory({ searchParams }: { searchParams: PageProps<"/astrologers">["searchParams"] }) {
  const sp = await searchParams;
  const filter = one(sp.filter);
  const sort = one(sp.sort);
  const query: DirectoryQuery = {
    q: (one(sp.q) ?? "").slice(0, 60),
    filter: isFilter(filter) ? filter : "all",
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

export default function AstrologersPage({ searchParams }: PageProps<"/astrologers">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 lg:py-16">
      <header className="flex flex-col gap-3">
        <p className="caption-3 uppercase tracking-wide text-brand-strong">Astrologers</p>
        <h1 className="heading-4 lg:heading-3 max-w-[680px] text-ink">अपने सवाल के लिए सही ज्योतिषी चुनें</h1>
        <p className="body-3 max-w-[680px] text-ink-soft">
          रेटिंग, अनुभव और प्रति मिनट कीमत देखकर चैट शुरू करें। समय तभी शुरू होता है जब ज्योतिषी पहला जवाब देते हैं, और
          5 मिनट में जवाब न मिले तो पूरे पॉइंट्स वापस आते हैं।
        </p>
      </header>

      <Suspense fallback={<DirectorySkeleton />}>
        <Directory searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
