"use client";

import { PiArrowLeft, PiCheckCircle } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { ApiError } from "@/lib/api";
import { contentLang } from "@/lib/services/astrologerModel";
import { getPujaBySlug, type Puja } from "@/lib/services/store";
import { BTN_PRIMARY, CARD, LoadError, Notice, PAGE, Price, Skeleton, StoreImage, useLoad } from "../../ui";

const text = defineMessages({
  hi: {
    back: "स्टोर पर वापस",
    notFound: "यह पूजा नहीं मिली",
    notFoundBody: "हो सकता है यह अब उपलब्ध न हो।",
    book: "यह पूजा बुक करें",
    about: "पूजा के बारे में",
    symptoms: "किन स्थितियों में",
    benefits: "लाभ",
    included: "बुकिंग में",
    inclusions: ["आपके नाम और गोत्र से संकल्प", "वैदिक विधि से पूजा", "श्री महाकाल धाम में पूजा"],
    note: "बुकिंग के समय आपसे नाम, गोत्र, पूजा की तारीख और जन्म विवरण लिया जाएगा।",
    loading: "पूजा लोड हो रही है",
  },
  en: {
    back: "Back to the store",
    notFound: "This puja was not found",
    notFoundBody: "It may no longer be available.",
    book: "Book this puja",
    about: "About this puja",
    symptoms: "When it helps",
    benefits: "Benefits",
    included: "Your booking includes",
    inclusions: ["A sankalp in your name and gotra", "Puja in the Vedic way", "Performed at Shri Mahakal Dham"],
    note: "At booking we ask for your name, gotra, the puja date and your birth details.",
    loading: "Loading the puja",
  },
});

export default function PujaDetail({ slug }: { slug: string }) {
  const t = useT(text);
  const { state, retry } = useLoad((signal) => getPujaBySlug(slug, signal), true, [slug]);
  return (
    <div className={PAGE}>
      <Link href="/store" className="button-sm inline-flex items-center gap-2 text-ink-soft hover:text-ink">
        <PiArrowLeft className="h-4 w-4" aria-hidden />
        {t.back}
      </Link>
      <div className="mt-4">
        {state.status === "loading" && <PujaBodySkeleton />}
        {state.status === "error" &&
          (state.error instanceof ApiError && state.error.status === 404 ? (
            <Notice title={t.notFound} body={t.notFoundBody} />
          ) : (
            <LoadError error={state.error} onRetry={retry} />
          ))}
        {state.status === "ready" && (state.data ? <Body puja={state.data} /> : <Notice title={t.notFound} body={t.notFoundBody} />)}
      </div>
    </div>
  );
}

function Body({ puja: p }: { puja: Puja }) {
  const t = useT(text);
  const bookHref = `/store/pujas/${encodeURIComponent(p.slug)}/book`;
  const sections: [string, string | null | undefined][] = [
    [t.about, p.about],
    [t.symptoms, p.symptoms],
    [t.benefits, p.benefits],
  ];
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <StoreImage src={p.image_url} alt={p.title} className={`${CARD} aspect-[4/3] w-full lg:col-span-6`} sizes="(min-width: 1024px) 50vw, 100vw" />
      <div className="lg:col-span-6">
        <h1 lang={contentLang(p.title)} className="heading-4 text-ink md:heading-3">
          {p.title}
        </h1>
        {p.short_description && (
          <p lang={contentLang(p.short_description)} className="body-6 mt-2 text-ink-soft">
            {p.short_description}
          </p>
        )}
        <div className="mt-4">
          <Price price={Number(p.price)} mrp={p.mrp} large />
        </div>
        <ul className="mt-5 flex flex-col gap-2">
          <li className="title-5 text-ink">{t.included}</li>
          {t.inclusions.map((x) => (
            <li key={x} className="body-6 flex gap-2 text-ink-soft">
              <PiCheckCircle className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden />
              {x}
            </li>
          ))}
        </ul>
        <Link href={bookHref} className={`${BTN_PRIMARY} mt-6 w-full sm:w-auto`}>
          {t.book}
        </Link>
        <p className="caption-3 mt-3 text-ink-muted">{t.note}</p>
      </div>
      <div className="flex flex-col gap-6 lg:col-span-12">
        {sections.map(
          ([title, body]) =>
            body && (
              <section key={title}>
                <h2 className="heading-6 mb-2 text-ink">{title}</h2>
                <p lang={contentLang(body)} className="body-6 max-w-3xl whitespace-pre-line text-ink-soft">
                  {body}
                </p>
              </section>
            ),
        )}
      </div>
    </div>
  );
}

function PujaBodySkeleton() {
  const t = useT(text);
  return (
    <div role="status" aria-label={t.loading} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <Skeleton className="aspect-[4/3] w-full lg:col-span-6" />
      <div className="flex flex-col gap-3 lg:col-span-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-12 w-48" />
      </div>
    </div>
  );
}

export function PujaSkeleton() {
  return (
    <div className={PAGE} aria-busy="true">
      <PujaBodySkeleton />
    </div>
  );
}
