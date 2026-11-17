"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PiMagnifyingGlass, PiSealCheck } from "react-icons/pi";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { contentLang } from "@/lib/services/astrologerModel";
import { inStock, listProducts, listPujas, pick, productName, type Product, type Puja } from "@/lib/services/store";
import { setQueryParam } from "../wallet/url";
import { PAGE, CARD, FIELD, LoadError, Notice, Price, Skeleton, StoreImage, useLoad } from "./ui";

type Tab = "pujas" | "gems";

const text = defineMessages({
  hi: {
    title: "AstroShrine स्टोर",
    intro: "आपके नाम और गोत्र से पूजा, और असली सर्टिफिकेट के साथ रत्न, रुद्राक्ष व माला। कीमतें सीधे हमारे कैटलॉग से।",
    tabs: "स्टोर का हिस्सा",
    pujas: "पूजा",
    gems: "रत्न और उत्पाद",
    search: "खोजें",
    searchPlaceholder: "नाम, ग्रह या उद्देश्य से खोजें",
    categoryLabel: "श्रेणी",
    all: "सभी",
    certified: "सर्टिफाइड",
    soldOut: "स्टॉक में नहीं",
    emptyPujas: "अभी कोई पूजा उपलब्ध नहीं है",
    emptyPujasBody: "थोड़ी देर बाद फिर देखें।",
    emptyProducts: "कोई उत्पाद नहीं मिला",
    emptyProductsBody: "खोज या श्रेणी बदलकर देखें।",
    count: (n: number) => `${n} उत्पाद`,
    pujaCount: (n: number) => `${n} पूजा`,
    bookPuja: "बुक करें",
    viewProduct: "देखें",
    loading: "स्टोर लोड हो रहा है",
  },
  en: {
    title: "AstroShrine store",
    intro: "Pujas in your name and gotra, and gemstones, rudraksha and malas with their real certificates. Prices come straight from our catalog.",
    tabs: "Store section",
    pujas: "Pujas",
    gems: "Gems and products",
    search: "Search",
    searchPlaceholder: "Search by name, planet or purpose",
    categoryLabel: "Category",
    all: "All",
    certified: "Certified",
    soldOut: "Out of stock",
    emptyPujas: "No pujas are available right now",
    emptyPujasBody: "Please check back in a little while.",
    emptyProducts: "No products found",
    emptyProductsBody: "Try another search or category.",
    count: (n) => (n === 1 ? "1 product" : `${n} products`),
    pujaCount: (n) => (n === 1 ? "1 puja" : `${n} pujas`),
    bookPuja: "Book",
    viewProduct: "View",
    loading: "Loading the store",
  },
});

export default function StoreHome() {
  const t = useT(text);
  const params = useSearchParams();
  const tab: Tab = params.get("tab") === "gems" ? "gems" : "pujas";
  const select = (next: Tab) => setQueryParam("tab", next === "pujas" ? null : next, "push");

  return (
    <div className={PAGE}>
      <header>
        <h1 className="heading-4 text-ink md:heading-3">{t.title}</h1>
        <p className="body-6 mt-2 max-w-2xl text-ink-soft">{t.intro}</p>
      </header>

      <div role="tablist" aria-label={t.tabs} className="mt-6 inline-flex rounded-full border border-line bg-surface-card p-1">
        {(["pujas", "gems"] as const).map((key) => (
          <button
            key={key}
            role="tab"
            type="button"
            id={`tab-${key}`}
            aria-selected={tab === key}
            aria-controls="store-panel"
            onClick={() => select(key)}
            className={`button-sm rounded-full px-4 py-2 transition ${tab === key ? "bg-surface-inverse text-ink-inverse" : "text-ink-soft hover:bg-surface-sunken"}`}
          >
            {t[key]}
          </button>
        ))}
      </div>

      <div id="store-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-6">
        {tab === "pujas" ? <Pujas /> : <Gems query={params.get("q") ?? ""} category={params.get("category") ?? ""} />}
      </div>
    </div>
  );
}

function Pujas() {
  const t = useT(text);
  const { state, retry } = useLoad(listPujas);
  if (state.status === "loading") return <GridSkeleton />;
  if (state.status === "error") return <LoadError error={state.error} onRetry={retry} />;
  const pujas = state.data;
  if (!pujas.length) return <Notice title={t.emptyPujas} body={t.emptyPujasBody} />;
  return (
    <>
      <p className="caption-3 mb-3 text-ink-muted">{t.pujaCount(pujas.length)}</p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pujas.map((p) => (
          <PujaCard key={p.id} puja={p} />
        ))}
      </ul>
    </>
  );
}

function PujaCard({ puja }: { puja: Puja }) {
  const t = useT(text);
  return (
    <li className={`${CARD} group flex flex-col overflow-hidden transition hover:border-line-strong`}>
      <Link href={`/store/pujas/${encodeURIComponent(puja.slug)}`} className="block">
        <StoreImage src={puja.image_url} alt="" className="aspect-[4/3] w-full" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 lang={contentLang(puja.title)} className="title-3 text-ink">
          <Link href={`/store/pujas/${encodeURIComponent(puja.slug)}`} className="hover:underline">
            {puja.title}
          </Link>
        </h2>
        {puja.short_description && (
          <p lang={contentLang(puja.short_description)} className="caption-2 line-clamp-2 text-ink-soft">
            {puja.short_description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <Price price={Number(puja.price)} mrp={puja.mrp} />
          <Link href={`/store/pujas/${encodeURIComponent(puja.slug)}`} className="button-sm rounded-xl bg-brand px-3 py-2 text-brand-ink transition hover:bg-brand-hover">
            {t.bookPuja}
          </Link>
        </div>
      </div>
    </li>
  );
}

/** Category labels are the admin's own words ("gemstones", "rudraksha"); shown capitalised, as typed. */
const label = (c: string) => c.charAt(0).toUpperCase() + c.slice(1);

function Gems({ query, category }: { query: string; category: string }) {
  const t = useT(text);
  const locale = useLocale();
  const { state, retry } = useLoad(listProducts);

  const products = useMemo(() => (state.status === "ready" ? state.data : []), [state]);
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c)))).sort(), [products]);
  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      products.filter((p) => {
        if (category && p.category !== category) return false;
        if (!q) return true;
        const hay = [p.name, p.name_hi, p.stone, p.stone_hi, p.planet, p.gemstone_group, p.category, ...(p.purposes ?? []), ...(p.rashis ?? [])].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      }),
    [products, category, q],
  );

  if (state.status === "loading") return <GridSkeleton />;
  if (state.status === "error") return <LoadError error={state.error} onRetry={retry} />;

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative block md:max-w-sm md:flex-1">
          <span className="sr-only">{t.search}</span>
          <PiMagnifyingGlass aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            defaultValue={query}
            onChange={(e) => setQueryParam("q", e.target.value.trim() || null, "replace")}
            placeholder={t.searchPlaceholder}
            className={`${FIELD} pl-10`}
          />
        </label>
        {categories.length > 1 && (
          <div role="group" aria-label={t.categoryLabel} className="no-scrollbar flex gap-2 overflow-x-auto">
            {["", ...categories].map((c) => (
              <button
                key={c || "all"}
                type="button"
                aria-pressed={category === c}
                onClick={() => setQueryParam("category", c || null, "replace")}
                className={`button-sm whitespace-nowrap rounded-full border px-3 py-1.5 transition ${
                  category === c ? "border-brand bg-surface-sunken text-ink" : "border-line bg-surface-card text-ink-soft hover:border-line-strong"
                }`}
              >
                {c ? label(c) : t.all}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="caption-3 mb-3 mt-4 text-ink-muted" aria-live="polite">
        {t.count(shown.length)}
      </p>
      {shown.length === 0 ? (
        <Notice title={t.emptyProducts} body={t.emptyProductsBody} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} lang={locale} />
          ))}
        </ul>
      )}
    </>
  );
}

function ProductCard({ product: p, lang }: { product: Product; lang: "hi" | "en" }) {
  const t = useT(text);
  const name = productName(lang, p);
  const sub = pick(lang, p.short_description, p.short_description_hi);
  const href = `/store/products/${encodeURIComponent(p.id)}`;
  return (
    <li className={`${CARD} flex flex-col overflow-hidden transition hover:border-line-strong`}>
      <Link href={href} className="relative block">
        <StoreImage src={p.image_url || p.images?.[0]} alt="" className="aspect-square w-full" />
        {p.is_certified && (
          <span className="caption-5 absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-surface-card/95 px-2 py-0.5 text-success">
            <PiSealCheck className="h-3.5 w-3.5" aria-hidden />
            {t.certified}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 lang={contentLang(name)} className="title-4 line-clamp-2 text-ink">
          <Link href={href} className="hover:underline">
            {name}
          </Link>
        </h3>
        {sub && (
          <p lang={contentLang(sub)} className="caption-4 line-clamp-2 text-ink-soft">
            {sub}
          </p>
        )}
        <div className="mt-auto pt-2">
          <Price price={Number(p.price)} mrp={p.mrp} />
          {!inStock(p) && <p className="caption-4 mt-1 text-danger">{t.soldOut}</p>}
        </div>
      </div>
    </li>
  );
}

function GridSkeleton() {
  const t = useT(text);
  return (
    <div role="status" aria-label={t.loading} className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="aspect-[3/4] w-full" />
      ))}
    </div>
  );
}

export function StoreSkeleton() {
  return (
    <div className={PAGE} aria-busy="true">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="mt-2 h-5 w-96 max-w-full" />
      <div className="mt-6">
        <GridSkeleton />
      </div>
    </div>
  );
}
