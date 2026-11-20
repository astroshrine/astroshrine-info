import type { Metadata } from "next";
import { Suspense } from "react";
import { defineMessages } from "@/i18n/messages";
import { getT } from "@/i18n/server";
import ProductDetail, { ProductSkeleton } from "./ProductDetail";

const text = defineMessages({
  hi: { title: "रत्न और उत्पाद · AstroShrine स्टोर" },
  en: { title: "Gemstone or product · AstroShrine store" },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(text);
  return { title: t.title };
}

// The product id is only known at request time, so it is read inside the Suspense boundary.
export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      {params.then(({ id }) => (
        <ProductDetail id={id} />
      ))}
    </Suspense>
  );
}
