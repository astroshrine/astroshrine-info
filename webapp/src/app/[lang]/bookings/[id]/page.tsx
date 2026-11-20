import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import BookingDetail from "./BookingDetail";

const text = defineMessages({
  hi: { title: "बुकिंग · AstroShrine" },
  en: { title: "Booking · AstroShrine" },
});

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getT(text);
  return { title, robots: { index: false, follow: false } };
}

const ID = /^[\w-]{1,64}$/;

async function Detail({ params }: Pick<PageProps<"/[lang]/bookings/[id]">, "params">) {
  const { id } = await params;
  if (!ID.test(id)) notFound();
  return <BookingDetail id={id} />;
}

export default function BookingPage({ params }: PageProps<"/[lang]/bookings/[id]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="mx-auto h-64 w-full max-w-3xl animate-pulse rounded-2xl bg-surface-sunken" />}>
      <Detail params={params} />
    </Suspense>
  );
}
