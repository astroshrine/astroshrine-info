import type { Metadata } from "next";
import { Suspense } from "react";
import AstroGemsSection from "@/components/AstroGemsSection";
import BlogSection, { BlogSectionSkeleton } from "@/components/BlogSection";
import PujaBookingSection from "@/components/PujaBookingSection";
import HomeView from "./HomeView";

export const metadata: Metadata = {
  title: "Home · AstroShrine",
  robots: { index: false },
};

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
