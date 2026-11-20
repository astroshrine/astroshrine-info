import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import ChatRoom, { ChatRoomSkeleton } from "./ChatRoom";

const text = defineMessages({
  hi: { title: "Chat · AstroShrine" },
  en: { title: "Chat · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title, robots: { index: false } };
}

const ID = /^[\w-]{1,64}$/;

async function Room({ params, searchParams }: Pick<PageProps<"/[lang]/chat/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  if (!ID.test(id)) notFound();
  const sp = await searchParams;
  const booking = typeof sp.booking === "string" && ID.test(sp.booking) ? sp.booking : null;
  // Keyed: switching conversations starts a fresh room instead of carrying the last one's state.
  return <ChatRoom key={`${id}:${booking ?? ""}`} astrologerId={id} bookingId={booking} />;
}

/** /chat/<astrologer id>[?booking=<pack id>]: the conversation with one astrologer. */
export default function ChatRoomPage({ params, searchParams }: PageProps<"/[lang]/chat/[id]">) {
  return (
    <Suspense fallback={<ChatRoomSkeleton />}>
      <Room params={params} searchParams={searchParams} />
    </Suspense>
  );
}
