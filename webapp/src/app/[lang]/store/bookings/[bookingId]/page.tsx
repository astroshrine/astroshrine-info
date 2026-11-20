import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import BookingDetail from "./BookingDetail";
import { Skeleton } from "../../ui";

const text = defineMessages({
  hi: { title: "पूजा बुकिंग · AstroShrine स्टोर" },
  en: { title: "Puja booking · AstroShrine store" },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title, robots: { index: false, follow: false } };
}

export default function BookingPage({ params }: { params: Promise<{ bookingId: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-8 h-96 w-full max-w-3xl" />}>
      {params.then(({ bookingId }) => (
        <BookingDetail bookingId={bookingId} />
      ))}
    </Suspense>
  );
}
