"use client";

import { useSearchParams } from "next/navigation";
import { PiPackage } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { contentLang } from "@/lib/services/astrologerModel";
import { formatDate, listMyProductOrders, listMyPujaBookings, rupee } from "@/lib/services/store";
import { setQueryParam } from "../../wallet/url";
import StatusBadge from "../StatusBadge";
import { bookingStatus, orderStatus } from "../status";
import { CARD, LoadError, PAGE, Skeleton, StoreImage, useLoad, useSignedIn } from "../ui";

const text = defineMessages({
  hi: {
    title: "मेरे ऑर्डर",
    intro: "रत्न व उत्पादों के ऑर्डर और पूजा बुकिंग, ऐप वाले account के साथ एक ही जगह।",
    tabs: "ऑर्डर का प्रकार",
    products: "उत्पाद",
    pujas: "पूजा बुकिंग",
    emptyOrders: "अभी कोई ऑर्डर नहीं",
    emptyOrdersBody: "आपके ऑर्डर यहाँ दिखेंगे।",
    emptyPujas: "अभी कोई पूजा बुकिंग नहीं",
    emptyPujasBody: "बुक की गई पूजाएं यहाँ दिखेंगी।",
    browse: "स्टोर देखें",
    placedOn: (d: string) => `${d} को`,
    items: (n: number) => `${n} आइटम`,
    orderNo: (id: string) => `ऑर्डर ${id}`,
    pujaOn: (d: string) => `पूजा की तारीख: ${d}`,
    loading: "लोड हो रहा है",
  },
  en: {
    title: "My orders",
    intro: "Your gemstone and product orders and your puja bookings, in one place and shared with the app.",
    tabs: "Type of order",
    products: "Products",
    pujas: "Puja bookings",
    emptyOrders: "No orders yet",
    emptyOrdersBody: "Your orders will show up here.",
    emptyPujas: "No puja bookings yet",
    emptyPujasBody: "Pujas you book will show up here.",
    browse: "Browse the store",
    placedOn: (d) => `Placed ${d}`,
    items: (n) => (n === 1 ? "1 item" : `${n} items`),
    orderNo: (id) => `Order ${id}`,
    pujaOn: (d) => `Puja date: ${d}`,
    loading: "Loading",
  },
});

export default function OrdersView() {
  const t = useT(text);
  const ready = useSignedIn();
  const tab = useSearchParams().get("tab") === "pujas" ? "pujas" : "products";

  return (
    <div className={PAGE}>
      <h1 className="heading-4 text-ink md:heading-3">{t.title}</h1>
      <p className="body-6 mt-2 max-w-2xl text-ink-soft">{t.intro}</p>
      <div role="group" aria-label={t.tabs} className="mt-6 inline-flex rounded-full border border-line bg-surface-card p-1">
        {(["products", "pujas"] as const).map((k) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={() => setQueryParam("tab", k === "products" ? null : k, "replace")} className={`button-sm rounded-full px-4 py-2 transition ${tab === k ? "bg-surface-inverse text-ink-inverse" : "text-ink-soft hover:bg-surface-sunken"}`}>
            {t[k]}
          </button>
        ))}
      </div>
      <div className="mt-6" aria-live="polite">
        {!ready ? <ListSkeleton /> : tab === "pujas" ? <Bookings /> : <Orders />}
      </div>
    </div>
  );
}

function Orders() {
  const t = useT(text);
  const { state, retry } = useLoad(listMyProductOrders);
  if (state.status === "loading") return <ListSkeleton />;
  if (state.status === "error") return <LoadError error={state.error} onRetry={retry} />;
  if (!state.data.length) return <Empty title={t.emptyOrders} body={t.emptyOrdersBody} />;
  return (
    <ul className="flex flex-col gap-3">
      {state.data.map((o) => {
        const items = o.product_order_items ?? [];
        return (
          <li key={o.id}>
            <Link href={`/store/orders/${encodeURIComponent(o.id)}`} className={`${CARD} flex flex-col gap-3 p-4 transition hover:border-line-strong md:flex-row md:items-center md:gap-6`}>
              <div className="flex gap-2">
                {items.slice(0, 3).map((i) => (
                  <StoreImage key={i.id ?? i.product_id} src={i.products?.image_url} alt="" className="h-14 w-14 rounded-lg" sizes="56px" />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="title-5 text-ink">{t.orderNo(o.id.slice(0, 8).toUpperCase())}</p>
                <p lang={contentLang(items[0]?.products?.name)} className="caption-2 truncate text-ink-soft">
                  {items.map((i) => i.products?.name).filter(Boolean).join(", ")}
                </p>
                <p className="caption-4 text-ink-muted">{[t.placedOn(formatDate(o.created_at)), t.items(items.reduce((n, i) => n + (Number(i.quantity) || 0), 0))].join(" · ")}</p>
              </div>
              <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:gap-1">
                <StatusBadge status={orderStatus(o)} />
                <p className="title-4 text-ink">{rupee(Number(o.total_amount))}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Bookings() {
  const t = useT(text);
  const { user } = useAuth();
  const { state, retry } = useLoad((signal) => listMyPujaBookings(user!.id, signal), Boolean(user), [user?.id]);
  if (!user || state.status === "loading") return <ListSkeleton />;
  if (state.status === "error") return <LoadError error={state.error} onRetry={retry} />;
  // Unpaid attempts are PENDING rows the backend keeps; only bookings that reached payment are listed.
  const rows = [...state.data].filter((b) => (b.payment_status || "").toUpperCase() !== "PENDING").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  if (!rows.length) return <Empty title={t.emptyPujas} body={t.emptyPujasBody} />;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((b) => (
        <li key={b.id}>
          <Link href={`/store/bookings/${encodeURIComponent(b.id)}`} className={`${CARD} flex flex-col gap-2 p-4 transition hover:border-line-strong md:flex-row md:items-center md:gap-6`}>
            <div className="min-w-0 flex-1">
              <p lang={contentLang(b.puja_title)} className="title-4 text-ink">
                {b.puja_title}
              </p>
              <p className="caption-4 text-ink-muted">{[b.booking_date ? t.pujaOn(formatDate(b.booking_date)) : "", t.placedOn(formatDate(b.created_at))].filter(Boolean).join(" · ")}</p>
            </div>
            <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:gap-1">
              <StatusBadge status={bookingStatus(b)} />
              <p className="title-4 text-ink">{rupee(Number(b.amount))}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  const t = useT(text);
  return (
    <div className={`${CARD} flex flex-col items-center gap-3 p-10 text-center`}>
      <PiPackage className="h-10 w-10 text-ink-muted" aria-hidden />
      <p className="title-3 text-ink">{title}</p>
      <p className="body-6 text-ink-soft">{body}</p>
      <Link href="/store" className="button-md rounded-xl bg-brand px-5 py-3 text-brand-ink hover:bg-brand-hover">
        {t.browse}
      </Link>
    </div>
  );
}

function ListSkeleton() {
  const t = useT(text);
  return (
    <div role="status" aria-label={t.loading} className="flex flex-col gap-3">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
