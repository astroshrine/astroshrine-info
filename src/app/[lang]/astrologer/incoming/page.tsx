import { redirect } from "next/navigation"; // eslint-disable-line no-restricted-imports -- server redirect, language added with localizeHref
import type { Locale } from "@/i18n/config";
import { localizeHref } from "@/i18n/paths";

// There is no separate incoming-call screen: a new waiting customer shows on the home page.
export default async function AstrologerIncomingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(localizeHref(lang as Locale, "/astrologer"));
}
