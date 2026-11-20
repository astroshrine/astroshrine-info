"use client";

import { useEffect, useState } from "react";
import { PiPackage, PiShoppingCartSimple, PiStorefront } from "react-icons/pi";
import { useAuth } from "@/components/AuthProvider";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/LocaleProvider";
import { defineMessages } from "@/i18n/messages";
import { usePathname } from "@/i18n/navigation";
import { getCartCount } from "@/lib/services/store";
import { CART_EVENT } from "./ui";

const text = defineMessages({
  hi: { label: "स्टोर", shop: "स्टोर", cart: "कार्ट", orders: "मेरे ऑर्डर", cartCount: (n: number) => `कार्ट, ${n} आइटम` },
  en: { label: "Store", shop: "Store", cart: "Cart", orders: "My orders", cartCount: (n) => `Cart, ${n} items` },
});

/** A sticky bar under the site header. The cart count is the account's own cart, shared with the app. */
export default function StoreNav() {
  const t = useT(text);
  const pathname = usePathname();
  const { status } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (status !== "signedIn") return;
    let live = true;
    const read = () => {
      getCartCount().then(
        (n) => live && setCount(n),
        () => undefined,
      );
    };
    read();
    window.addEventListener(CART_EVENT, read);
    return () => {
      live = false;
      window.removeEventListener(CART_EVENT, read);
    };
  }, [status]);

  const shown = status === "signedIn" ? count : 0;
  const items = [
    { href: "/store", label: t.shop, icon: PiStorefront, active: pathname === "/store" || /^\/store\/(products|pujas)/.test(pathname) },
    { href: "/store/cart", label: t.cart, icon: PiShoppingCartSimple, active: /^\/store\/(cart|checkout)/.test(pathname), badge: shown },
    { href: "/store/orders", label: t.orders, icon: PiPackage, active: /^\/store\/(orders|bookings)/.test(pathname) },
  ];

  return (
    <nav aria-label={t.label} className="border-b border-line bg-surface-page">
      <ul className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 py-2 md:px-8">
        {items.map(({ href, label, icon: Icon, active, badge }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={badge ? `${label}: ${t.cartCount(badge)}` : undefined}
              className={`button-sm inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 transition ${
                active ? "bg-surface-inverse text-ink-inverse" : "text-ink-soft hover:bg-surface-sunken"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
              {badge ? <span className="caption-5 rounded-full bg-brand px-1.5 text-brand-ink">{badge}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function StoreNavFallback() {
  return <div aria-hidden className="h-[53px] border-b border-line bg-surface-page" />;
}
