import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import AiChat from "./AiChat";

const text = defineMessages({
  hi: { title: "AI ज्योतिषी चैट · AstroShrine" },
  en: { title: "AI astrologer chat · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getT(text);
  return { title, robots: { index: false, follow: false } };
}

const ID = /^[\w-]{1,64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Room({ params, searchParams }: Pick<PageProps<"/[lang]/ai-astrologers/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  if (!ID.test(id)) notFound();
  const sp = await searchParams;
  const session = typeof sp.session === "string" && UUID.test(sp.session) ? sp.session : null;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 2000) : "";
  return <AiChat key={`${id}:${session ?? ""}`} personaId={id} sessionId={session} draft={q} />;
}

/** /ai-astrologers/<persona id>[?session=<id>][&q=<question>]: a conversation with one AI astrologer. */
export default function AiChatPage({ params, searchParams }: PageProps<"/[lang]/ai-astrologers/[id]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="mx-auto h-[70dvh] w-full max-w-3xl animate-pulse rounded-3xl bg-surface-sunken" />}>
      <Room params={params} searchParams={searchParams} />
    </Suspense>
  );
}
