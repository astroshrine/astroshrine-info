import type { MetadataRoute } from "next";

/** Crawlers may read every page; signed-in pages carry their own noindex. The backend proxy is not for them. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: "/api/" } };
}
