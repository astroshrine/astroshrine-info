import type { Metadata } from "next";
import Link from "next/link";
import { PiChatCircleDots } from "react-icons/pi";

export const metadata: Metadata = {
  title: "Chat · AstroShrine",
  description: "ज्योतिषियों से आपकी बातचीत: वही account और वही wallet जो AstroShrine ऐप में है।",
  robots: { index: false },
};

/** Wide screens: the empty right side until a conversation is chosen. Phones show the list instead. */
export default function ChatIndexPage() {
  return (
    <section aria-label="कोई चैट नहीं चुनी गई" className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-line bg-surface-card p-8 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-surface-sunken text-brand-strong">
        <PiChatCircleDots className="h-8 w-8" aria-hidden />
      </span>
      <h2 className="heading-6 text-ink">कोई बातचीत चुनें</h2>
      <p className="body-6 max-w-sm text-ink-soft">बाईं ओर से कोई चैट खोलें, या किसी ज्योतिषी से नई चैट शुरू करें।</p>
      <Link
        href="/astrologers"
        className="button-md rounded-full bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover active:scale-98"
      >
        ज्योतिषी चुनें
      </Link>
    </section>
  );
}
