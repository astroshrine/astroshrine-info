import type { Metadata } from "next";
import { Suspense } from "react";
import AstroGemsSection from "@/components/AstroGemsSection";
import BlogSection, { BlogSectionSkeleton } from "@/components/BlogSection";
import PujaBookingSection from "@/components/PujaBookingSection";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import HomeView from "./HomeView";

const text = defineMessages({
  hi: { title: "Home · AstroShrine" },
  en: { title: "Home · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getT(text);
  return { title, robots: { index: false } };
}

export default function HomePage() {
  return (
    <>
      <HomeView />
      {/* From the sister sites: puja booking (Shri Mahakal Dham), the AstroGems store and the newest Future For You articles. */}
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <PujaBookingSection />
        <AstroGemsSection />
        <Suspense fallback={<BlogSectionSkeleton />}>
          <BlogSection />
        </Suspense>
      </div>
    </>
  );
}
