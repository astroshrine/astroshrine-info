import type { Metadata } from "next";
import { PiChatCircleDots } from "react-icons/pi";
import Link from "@/i18n/Link";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";

const text = defineMessages({
  hi: {
    title: "Chat · AstroShrine",
    description: "ज्योतिषियों से आपकी बातचीत: वही account और वही wallet जो AstroShrine ऐप में है।",
    noneSelected: "कोई चैट नहीं चुनी गई",
    heading: "कोई बातचीत चुनें",
    body: "बाईं ओर से कोई चैट खोलें, या किसी ज्योतिषी से नई चैट शुरू करें।",
    choose: "ज्योतिषी चुनें",
  },
  en: {
    title: "Chat · AstroShrine",
    description: "Your conversations with astrologers, with the same account and wallet as the AstroShrine app.",
    noneSelected: "No chat selected",
    heading: "Choose a conversation",
    body: "Open a chat from the list on the left, or start a new chat with an astrologer.",
    choose: "Choose an astrologer",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title, description: t.description, robots: { index: false } };
}

/** Wide screens: the empty right side until a conversation is chosen. Phones show the list instead. */
export default async function ChatIndexPage() {
  const t = await getT(text);
  return (
    <section aria-label={t.noneSelected} className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-line bg-surface-card p-8 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-surface-sunken text-brand-strong">
        <PiChatCircleDots className="h-8 w-8" aria-hidden />
      </span>
      <h2 className="heading-6 text-ink">{t.heading}</h2>
      <p className="body-6 max-w-sm text-ink-soft">{t.body}</p>
      <Link
        href="/astrologers"
        className="button-md rounded-xl bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover active:scale-98"
      >
        {t.choose}
      </Link>
    </section>
  );
}
