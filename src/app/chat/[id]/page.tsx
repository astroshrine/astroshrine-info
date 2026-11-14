import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import ChatRoom, { ChatRoomSkeleton } from "./ChatRoom";

export const metadata: Metadata = {
  title: "Chat · AstroShrine",
  robots: { index: false },
};

const ID = /^[\w-]{1,64}$/;

async function Room({ params, searchParams }: Pick<PageProps<"/chat/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  if (!ID.test(id)) notFound();
  const sp = await searchParams;
  const booking = typeof sp.booking === "string" && ID.test(sp.booking) ? sp.booking : null;
  // Keyed: switching conversations starts a fresh room instead of carrying the last one's state.
  return <ChatRoom key={`${id}:${booking ?? ""}`} astrologerId={id} bookingId={booking} />;
}

/** /chat/<astrologer id>[?booking=<pack id>]: the conversation with one astrologer. */
export default function ChatRoomPage({ params, searchParams }: PageProps<"/chat/[id]">) {
  return (
    <Suspense fallback={<ChatRoomSkeleton />}>
      <Room params={params} searchParams={searchParams} />
    </Suspense>
  );
}
