import type { Metadata } from "next";
import { languageAlternates } from "@/i18n/server";

/** Metadata for a tool page: private tools stay out of search results. */
export async function toolMetadata(path: string, title: string, description: string): Promise<Metadata> {
  return { title, description, alternates: await languageAlternates(path), robots: { index: false, follow: false } };
}
