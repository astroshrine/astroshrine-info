import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";

type OpenGraphImages = NonNullable<NonNullable<Metadata["openGraph"]>["images"]>;

/**
 * The site's share image (src/app/[lang]/opengraph-image.png). Next attaches it by itself only to pages that
 * leave openGraph alone; a page that sets its own openGraph (a title or description for previews) replaces the
 * whole object, so it passes these images along or its link preview loses the picture.
 */
export async function shareImages(): Promise<OpenGraphImages> {
  const locale = await getLocale();
  return [{ url: `/${locale}/opengraph-image.png`, width: 1200, height: 630, alt: "AstroShrine" }];
}
