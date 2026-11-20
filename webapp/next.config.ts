import type { NextConfig } from "next";

// Astrologer photos are served from the shared Supabase project's public storage.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Hides the floating Next.js "N" badge in development; compile and runtime errors still show.
  devIndicators: false,
  images: {
    remotePatterns: [
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : []),
      // Featured images of the Future For You articles shown in the blog section.
      { protocol: "https" as const, hostname: "futureforyou.co", pathname: "/wp-content/uploads/**" },
      // The puja photo from Shri Mahakal Dham shown in the puja booking card.
      { protocol: "https" as const, hostname: "shrimahakaldham.com", pathname: "/website-assets/**" },
      // Product photos from the AstroGems store shown in its section.
      { protocol: "https" as const, hostname: "astrogems.astroshrine.in", pathname: "/products/**" },
    ],
  },
  turbopack: {
    // This app lives in webapp/ of a repo with its own root lockfile; keep the build rooted here.
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
