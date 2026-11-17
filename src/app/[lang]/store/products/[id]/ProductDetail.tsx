"use client";

import { useEffect, useMemo, useState } from "react";
import { PiArrowLeft, PiCheck, PiSealCheck, PiShoppingCartSimple } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useLocale, useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { contentLang } from "@/lib/services/astrologerModel";
import {
  LOOSE,
  addToCart,
  formsOf,
  getProduct,
  getRelatedProducts,
  inStock,
  metalsFor,
  pick,
  productName,
  rupee,
  unitPrice,
  type Product,
  type Selection,
} from "@/lib/services/store";
import { BTN_PRIMARY, BTN_SECONDARY, CARD, FIELD, LoadError, Notice, PAGE, Price, Skeleton, StoreImage, notifyCartChanged, useLoad } from "../../ui";

const text = defineMessages({
  hi: {
    back: "स्टोर पर वापस",
    notFound: "यह उत्पाद नहीं मिला",
    notFoundBody: "हो सकता है यह अब उपलब्ध न हो।",
    certified: "लैब सर्टिफाइड",
    soldOut: "स्टॉक में नहीं है",
    few: (n: number) => `सिर्फ ${n} बचे हैं`,
    chooseForm: "कैसे चाहिए",
    forms: { loose: "खुला रत्न", ring: "अंगूठी", pendant: "पेंडेंट" },
    metal: "धातु",
    ringSize: "अंगूठी का साइज़",
    pickSize: "साइज़ चुनें",
    addons: "अतिरिक्त सेवाएं",
    days: (n: number) => `${n} दिन`,
    total: "कुल कीमत",
    notOffered: "यह सेटिंग अभी उपलब्ध नहीं है।",
    addToCart: "कार्ट में डालें",
    adding: "डाल रहे हैं",
    buyNow: "अभी खरीदें",
    added: "कार्ट में डाल दिया",
    viewCart: "कार्ट देखें",
    sizeNeeded: "अंगूठी के लिए साइज़ चुनें।",
    addFailed: "कार्ट में नहीं डाल सके। फिर कोशिश करें।",
    highlights: "खास बातें",
    details: "विवरण",
    specsTitle: "विशेषताएं",
    benefits: "फायदे",
    whoShouldWear: "किसे पहनना चाहिए",
    howToWear: "कैसे पहनें",
    care: "देखभाल",
    faqs: "अक्सर पूछे जाने वाले सवाल",
    certificate: "सर्टिफिकेट देखें",
    specs: {
      weight_carat: "वज़न (कैरेट)",
      weight_ratti: "वज़न (रत्ती)",
      shape: "आकार",
      color: "रंग",
      origin: "उत्पत्ति",
      treatment: "ट्रीटमेंट",
      clarity: "क्लैरिटी",
      cut: "कट",
      lab: "लैब",
      certificate_no: "सर्टिफिकेट नंबर",
      planet: "ग्रह",
    },
    related: "ये भी देखें",
    gallery: (i: number, n: number) => `फोटो ${i} / ${n}`,
    loading: "उत्पाद लोड हो रहा है",
  },
  en: {
    back: "Back to the store",
    notFound: "This product was not found",
    notFoundBody: "It may no longer be available.",
    certified: "Lab certified",
    soldOut: "Out of stock",
    few: (n) => `Only ${n} left`,
    chooseForm: "How would you like it",
    forms: { loose: "Loose stone", ring: "Ring", pendant: "Pendant" },
    metal: "Metal",
    ringSize: "Ring size",
    pickSize: "Choose a size",
    addons: "Extras",
    days: (n) => `${n} days`,
    total: "Total price",
    notOffered: "This setting is not available right now.",
    addToCart: "Add to cart",
    adding: "Adding",
    buyNow: "Buy now",
    added: "Added to your cart",
    viewCart: "View cart",
    sizeNeeded: "Choose a ring size.",
    addFailed: "Could not add it to your cart. Try again.",
    highlights: "Highlights",
    details: "Description",
    specsTitle: "Specifications",
    benefits: "Benefits",
    whoShouldWear: "Who should wear it",
    howToWear: "How to wear it",
    care: "Care",
    faqs: "Frequently asked questions",
    certificate: "View the certificate",
    specs: {
      weight_carat: "Weight (carat)",
      weight_ratti: "Weight (ratti)",
      shape: "Shape",
      color: "Colour",
      origin: "Origin",
      treatment: "Treatment",
      clarity: "Clarity",
      cut: "Cut",
      lab: "Lab",
      certificate_no: "Certificate no.",
      planet: "Planet",
    },
    related: "You may also like",
    gallery: (i, n) => `Photo ${i} of ${n}`,
    loading: "Loading the product",
  },
});

type SpecKey = keyof (typeof text)["hi"]["specs"];
const SPEC_KEYS: SpecKey[] = ["planet", "weight_carat", "weight_ratti", "shape", "color", "origin", "treatment", "clarity", "cut", "lab", "certificate_no"];

export default function ProductDetail({ id }: { id: string }) {
  const t = useT(text);
  const { state, retry } = useLoad((signal) => getProduct(id, signal), true, [id]);

  return (
    <div className={PAGE}>
      <Link href="/store?tab=gems" className="button-sm inline-flex items-center gap-2 text-ink-soft hover:text-ink">
        <PiArrowLeft className="h-4 w-4" aria-hidden />
        {t.back}
      </Link>
      <div className="mt-4">
        {state.status === "loading" && <ProductBodySkeleton />}
        {state.status === "error" &&
          (state.error instanceof ApiError && state.error.status === 404 ? (
            <Notice title={t.notFound} body={t.notFoundBody} />
          ) : (
            <LoadError error={state.error} onRetry={retry} />
          ))}
        {state.status === "ready" && (state.data ? <Body product={state.data} /> : <Notice title={t.notFound} body={t.notFoundBody} />)}
      </div>
    </div>
  );
}

function Body({ product: p }: { product: Product }) {
  const t = useT(text);
  const locale = useLocale();
  const router = useRouter();
  const { status } = useAuth();
  const forms = formsOf(p);
  const [sel, setSel] = useState<Selection>(LOOSE);
  const [photo, setPhoto] = useState(0);
  const [flow, setFlow] = useState<"idle" | "adding" | "added" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const photos = useMemo(() => Array.from(new Set([p.image_url, ...(p.images ?? [])].filter((x): x is string => Boolean(x)))), [p]);
  const name = productName(locale, p);
  const price = unitPrice(p, sel);
  const metals = sel.form === "loose" ? [] : metalsFor(p, sel.form);
  const sizes = p.ring_sizes ?? [];
  const available = inStock(p);
  const lowStock = available && p.stock != null && Number(p.stock) > 0 && Number(p.stock) <= 5;

  function chooseForm(form: Selection["form"]) {
    if (form === "loose") return setSel({ ...sel, form, metal: null, size: null });
    setSel({ ...sel, form, metal: metalsFor(p, form)[0] ?? null, size: form === "ring" ? sel.size : null });
  }
  const toggleAddon = (id: string) =>
    setSel({ ...sel, addons: sel.addons.includes(id) ? sel.addons.filter((a) => a !== id) : [...sel.addons, id] });

  const incomplete = sel.form === "ring" && !sel.size;
  const blocked = !available || price === null;

  function loginFirst() {
    router.push(`/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
  }

  async function add() {
    if (blocked || flow === "adding") return;
    if (incomplete) {
      setError(t.sizeNeeded);
      setFlow("error");
      return;
    }
    if (status !== "signedIn") return loginFirst();
    setFlow("adding");
    setError(null);
    try {
      await addToCart(p.id, sel);
      notifyCartChanged();
      setFlow("added");
    } catch (e) {
      setError(e instanceof ApiError && e.message ? e.message : t.addFailed);
      setFlow("error");
    }
  }

  function buyNow() {
    if (blocked) return;
    if (incomplete) {
      setError(t.sizeNeeded);
      setFlow("error");
      return;
    }
    const q = new URLSearchParams({ buy: p.id, form: sel.form });
    if (sel.metal) q.set("metal", sel.metal);
    if (sel.size) q.set("size", sel.size);
    if (sel.addons.length) q.set("addons", sel.addons.join(","));
    router.push(`/store/checkout?${q}`);
  }

  const description = pick(locale, p.description, p.description_hi);
  const short = pick(locale, p.short_description, p.short_description_hi);
  const highlights = pick(locale, p.highlights, p.highlights_hi) ?? [];
  const benefits = pick(locale, p.benefits, p.benefits_hi) ?? [];
  const who = pick(locale, p.who_should_wear, p.who_should_wear_hi);
  const how = pick(locale, p.how_to_wear, p.how_to_wear_hi);
  const care = pick(locale, p.care, p.care_hi);
  const faqs = pick(locale, p.faqs, p.faqs_hi) ?? [];
  const specs = SPEC_KEYS.map((k) => [k, (p as Record<string, unknown>)[k]] as const).filter(([, v]) => v !== null && v !== undefined && v !== "");

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="lg:col-span-6">
        <StoreImage src={photos[photo]} alt={photos.length > 1 ? `${name}: ${t.gallery(photo + 1, photos.length)}` : name} className={`${CARD} aspect-square w-full`} sizes="(min-width: 1024px) 50vw, 100vw" />
        {photos.length > 1 && (
          <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {photos.map((src, i) => (
              <li key={src}>
                <button type="button" aria-label={t.gallery(i + 1, photos.length)} aria-current={i === photo} onClick={() => setPhoto(i)} className={`block rounded-xl border-2 ${i === photo ? "border-brand" : "border-transparent"}`}>
                  <StoreImage src={src} alt="" className="h-16 w-16 rounded-lg" sizes="64px" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="lg:col-span-6">
        {p.is_certified && (
          <p className="caption-3 inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-success">
            <PiSealCheck className="h-4 w-4" aria-hidden />
            {t.certified}
          </p>
        )}
        <h1 lang={contentLang(name)} className="heading-4 mt-2 text-ink md:heading-3">
          {name}
        </h1>
        {short && (
          <p lang={contentLang(short)} className="body-6 mt-2 text-ink-soft">
            {short}
          </p>
        )}
        <div className="mt-4">
          {price !== null ? (
            <Price price={price} mrp={sel.form === "loose" && sel.addons.length === 0 ? p.mrp : null} large />
          ) : (
            <p className="caption-2 text-danger">{t.notOffered}</p>
          )}
          {!available && <p className="caption-2 mt-1 text-danger">{t.soldOut}</p>}
          {lowStock && <p className="caption-2 mt-1 text-warning">{t.few(Number(p.stock))}</p>}
        </div>

        {forms.length > 1 && (
          <fieldset className="mt-6">
            <legend className="title-4 text-ink">{t.chooseForm}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {forms.map((f) => (
                <label key={f} className={`button-sm cursor-pointer rounded-full border px-4 py-2 transition has-[:focus-visible]:outline-2 ${sel.form === f ? "border-brand bg-surface-sunken text-ink" : "border-line bg-surface-card text-ink-soft hover:border-line-strong"}`}>
                  <input type="radio" name="form" checked={sel.form === f} onChange={() => chooseForm(f)} className="sr-only" />
                  {t.forms[f]}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {metals.length > 0 && (
          <label className="mt-4 block">
            <span className="title-4 text-ink">{t.metal}</span>
            <select value={sel.metal ?? ""} onChange={(e) => setSel({ ...sel, metal: e.target.value })} className={`${FIELD} mt-2`}>
              {metals.map((m) => (
                <option key={m} value={m}>
                  {`${m} · +${rupee(Number(p.variants?.find((v) => v.form === sel.form && v.metal === m)?.price_delta) || 0)}`}
                </option>
              ))}
            </select>
          </label>
        )}

        {sel.form === "ring" && (
          <label className="mt-4 block">
            <span className="title-4 text-ink">{t.ringSize}</span>
            <select value={sel.size ?? ""} onChange={(e) => setSel({ ...sel, size: e.target.value || null })} className={`${FIELD} mt-2`}>
              <option value="">{t.pickSize}</option>
              {sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}

        {(p.addons?.length ?? 0) > 0 && (
          <fieldset className="mt-6">
            <legend className="title-4 text-ink">{t.addons}</legend>
            <div className="mt-2 flex flex-col gap-2">
              {p.addons!.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface-card p-3">
                  <input type="checkbox" checked={sel.addons.includes(a.id)} onChange={() => toggleAddon(a.id)} className="mt-1 h-4 w-4 accent-[var(--color-brand-strong)]" />
                  <span className="flex-1">
                    <span className="title-5 block text-ink">{a.name}</span>
                    {a.description && <span className="caption-4 block text-ink-soft">{a.description}</span>}
                    {a.days ? <span className="caption-5 block text-ink-muted">{t.days(a.days)}</span> : null}
                  </span>
                  <span className="title-5 text-ink">+{rupee(Number(a.price))}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {price !== null && (sel.form !== "loose" || sel.addons.length > 0) && (
          <p className="title-3 mt-4 flex items-center justify-between rounded-2xl bg-surface-sunken px-4 py-3 text-ink">
            <span>{t.total}</span>
            <span>{rupee(price)}</span>
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={add} disabled={blocked || flow === "adding"} className={`${BTN_SECONDARY} sm:flex-1`}>
            <PiShoppingCartSimple className="h-5 w-5" aria-hidden />
            {flow === "adding" ? t.adding : t.addToCart}
          </button>
          <button type="button" onClick={buyNow} disabled={blocked} className={`${BTN_PRIMARY} sm:flex-1`}>
            {t.buyNow}
          </button>
        </div>

        <div aria-live="polite" className="mt-3">
          {flow === "added" && (
            <Notice tone="success" title={t.added}>
              <Link href="/store/cart" className={`${BTN_SECONDARY} !px-3 !py-2`}>
                <PiCheck className="h-4 w-4" aria-hidden />
                {t.viewCart}
              </Link>
            </Notice>
          )}
          {flow === "error" && error && <Notice tone="danger" title={error} />}
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:col-span-12">
        {highlights.length > 0 && (
          <Section title={t.highlights}>
            <ul className="grid gap-2 sm:grid-cols-2">
              {highlights.map((h) => (
                <li key={h} lang={contentLang(h)} className="body-6 flex gap-2 text-ink-soft">
                  <PiCheck className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden />
                  {h}
                </li>
              ))}
            </ul>
          </Section>
        )}
        {description && (
          <Section title={t.details}>
            <p lang={contentLang(description)} className="body-6 max-w-3xl whitespace-pre-line text-ink-soft">
              {description}
            </p>
          </Section>
        )}
        {specs.length > 0 && (
          <Section title={t.specsTitle}>
            <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line py-2">
                  <dt className="caption-2 text-ink-muted">{t.specs[k]}</dt>
                  <dd className="title-5 text-right text-ink">{String(v)}</dd>
                </div>
              ))}
            </dl>
            {p.certificate_url && (
              <a href={p.certificate_url} target="_blank" rel="noopener noreferrer" className="button-sm mt-3 inline-flex text-brand-strong underline">
                {t.certificate}
              </a>
            )}
          </Section>
        )}
        {benefits.length > 0 && (
          <Section title={t.benefits}>
            <ul className="grid gap-2 sm:grid-cols-2">
              {benefits.map((b) => (
                <li key={b} lang={contentLang(b)} className="body-6 text-ink-soft">
                  {b}
                </li>
              ))}
            </ul>
          </Section>
        )}
        {who && (
          <Section title={t.whoShouldWear}>
            <p lang={contentLang(who)} className="body-6 max-w-3xl text-ink-soft">
              {who}
            </p>
          </Section>
        )}
        {how && Object.keys(how).length > 0 && (
          <Section title={t.howToWear}>
            <dl className="grid gap-3 sm:grid-cols-2">
              {Object.entries(how).map(([k, v]) => (
                <div key={k} className={`${CARD} p-4`}>
                  <dt className="title-5 capitalize text-ink">{k.replace(/_/g, " ")}</dt>
                  <dd lang={contentLang(v)} className="caption-2 mt-1 text-ink-soft">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        )}
        {care && (
          <Section title={t.care}>
            <p lang={contentLang(care)} className="body-6 max-w-3xl text-ink-soft">
              {care}
            </p>
          </Section>
        )}
        {faqs.length > 0 && (
          <Section title={t.faqs}>
            <div className="flex max-w-3xl flex-col gap-2">
              {faqs.map((f) => (
                <details key={f.q} className={`${CARD} group p-4`}>
                  <summary lang={contentLang(f.q)} className="title-5 cursor-pointer text-ink">
                    {f.q}
                  </summary>
                  <p lang={contentLang(f.a)} className="caption-2 mt-2 text-ink-soft">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </Section>
        )}
        <Related id={p.id} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="heading-6 mb-3 text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Related({ id }: { id: string }) {
  const t = useT(text);
  const locale = useLocale();
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    getRelatedProducts(id, controller.signal).then(setItems, () => undefined);
    return () => controller.abort();
  }, [id]);
  if (!items.length) return null;
  return (
    <section>
      <h2 className="heading-6 mb-3 text-ink">{t.related}</h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.slice(0, 4).map((r) => (
          <li key={r.id} className={`${CARD} overflow-hidden`}>
            <Link href={`/store/products/${encodeURIComponent(r.id)}`} className="block">
              <StoreImage src={r.image_url || r.images?.[0]} alt="" className="aspect-square w-full" />
              <span className="block p-3">
                <span lang={contentLang(productName(locale, r))} className="title-5 line-clamp-2 block text-ink">
                  {productName(locale, r)}
                </span>
                <span className="mt-1 block">
                  <Price price={Number(r.price)} mrp={r.mrp} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductBodySkeleton() {
  const t = useT(text);
  return (
    <div role="status" aria-label={t.loading} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <Skeleton className="aspect-square w-full lg:col-span-6" />
      <div className="flex flex-col gap-3 lg:col-span-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className={PAGE} aria-busy="true">
      <ProductBodySkeleton />
    </div>
  );
}
