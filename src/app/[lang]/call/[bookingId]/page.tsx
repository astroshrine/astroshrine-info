import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import CallRoom from "./CallRoom";

const text = defineMessages({
  hi: { title: "वॉइस कॉल · AstroShrine" },
  en: { title: "Voice call · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getT(text);
  return { title, robots: { index: false, follow: false } };
}

const ID = /^[\w-]{1,64}$/;

async function Room({ params }: Pick<PageProps<"/[lang]/call/[bookingId]">, "params">) {
  const { bookingId } = await params;
  if (!ID.test(bookingId)) notFound();
  return <CallRoom bookingId={bookingId} />;
}

/** /call/<booking id>: the customer's side of a booked voice call, in the browser. */
export default function CallPage({ params }: PageProps<"/[lang]/call/[bookingId]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="mx-auto h-96 w-full max-w-xl animate-pulse rounded-2xl bg-surface-sunken" />}>
      <Room params={params} />
    </Suspense>
  );
}
