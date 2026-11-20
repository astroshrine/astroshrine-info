import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import BookFlow from "./BookFlow";

const text = defineMessages({
  hi: { title: "समय बुक करें · AstroShrine" },
  en: { title: "Book a slot · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getT(text);
  return { title, robots: { index: false, follow: false } };
}

const ID = /^[\w-]{1,64}$/;

async function Flow({ params }: Pick<PageProps<"/[lang]/bookings/new/[astrologerId]">, "params">) {
  const { astrologerId } = await params;
  if (!ID.test(astrologerId)) notFound();
  return <BookFlow astrologerId={astrologerId} />;
}

export default function NewBookingPage({ params }: PageProps<"/[lang]/bookings/new/[astrologerId]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="mx-auto h-96 w-full max-w-3xl animate-pulse rounded-2xl bg-surface-sunken" />}>
      <Flow params={params} />
    </Suspense>
  );
}
