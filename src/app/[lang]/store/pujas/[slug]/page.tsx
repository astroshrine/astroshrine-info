import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import PujaDetail, { PujaSkeleton } from "./PujaDetail";

const text = defineMessages({
  hi: { title: "पूजा · AstroShrine स्टोर" },
  en: { title: "Puja · AstroShrine store" },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title };
}

// The slug is only known at request time, so it is read inside the Suspense boundary.
export default function PujaPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<PujaSkeleton />}>
      {params.then(({ slug }) => (
        <PujaDetail slug={slug} />
      ))}
    </Suspense>
  );
}
