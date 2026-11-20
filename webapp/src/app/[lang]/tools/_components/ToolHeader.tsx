import { PiArrowLeft } from "react-icons/pi";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { defineMessages } from "@/i18n/messages";

const text = defineMessages({
  hi: { back: "सभी टूल", eyebrow: "टूल" },
  en: { back: "All tools", eyebrow: "Tool" },
});

/** Every tool page's heading: a way back to the index, the tool's name and one line about it. */
export default async function ToolHeader({ title, intro }: { title: string; intro: string }) {
  const t = await getT(text);
  return (
    <header className="mb-6 max-w-2xl">
      <Link href="/tools" className="caption-3 inline-flex items-center gap-1 text-ink-soft transition hover:text-ink">
        <PiArrowLeft className="h-4 w-4" aria-hidden /> {t.back}
      </Link>
      <p className="caption-4 mt-3 text-brand-strong">{t.eyebrow}</p>
      <h1 className="heading-4 hero-gradient-text mt-1 lg:heading-3">{title}</h1>
      <p className="body-3 mt-3 text-ink-soft">{intro}</p>
    </header>
  );
}
