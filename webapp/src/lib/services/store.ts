import { api } from "@/lib/api";
import type { Locale } from "@/i18n/config";

// The store (pujas, gemstones and products) on the shared backend, the same calls the mobile app makes
// (React-native-app: components/gemstones/*, cart/*, home/PujaCheckout.tsx, home/PujaPaymentButton.tsx,
// services/couponService.ts). The catalog is public; the cart, coupons, orders and bookings need a sign-in.
// Prices are rupees. Coupon amounts from the server are paise. The client never sends a price the server trusts.

// ─── Types ──────────────────────────────────────────────────────────────────

export type ProductVariant = { form: "ring" | "pendant" | "bracelet"; metal: string; price_delta: number; crafting_days?: number };
export type ProductAddon = { id: string; name: string; price: number; days?: number; description?: string };

/** A products row (GET /v1/products). Hindi copy is in the *_hi fields when the admin filled them. */
export type Product = {
  id: string;
  name: string;
  name_hi?: string | null;
  slug?: string;
  category?: string;
  description?: string | null;
  description_hi?: string | null;
  short_description?: string | null;
  short_description_hi?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  price: number;
  mrp?: number | null;
  stock?: number | null;
  is_featured?: boolean;
  planet?: string | null;
  benefits?: string[] | null;
  benefits_hi?: string[] | null;
  rashis?: string[] | null;
  purposes?: string[] | null;
  weight_carat?: number | null;
  weight_ratti?: number | null;
  shape?: string | null;
  color?: string | null;
  origin?: string | null;
  treatment?: string | null;
  clarity?: string | null;
  cut?: string | null;
  lab?: string | null;
  certificate_no?: string | null;
  certificate_url?: string | null;
  is_certified?: boolean;
  who_should_wear?: string | null;
  who_should_wear_hi?: string | null;
  how_to_wear?: Record<string, string> | null;
  how_to_wear_hi?: Record<string, string> | null;
  care?: string | null;
  care_hi?: string | null;
  faqs?: { q: string; a: string }[] | null;
  faqs_hi?: { q: string; a: string }[] | null;
  highlights?: string[] | null;
  highlights_hi?: string[] | null;
  variants?: ProductVariant[] | null;
  ring_sizes?: string[] | null;
  addons?: ProductAddon[] | null;
  gemstone_group?: string | null;
  stone?: string | null;
  stone_hi?: string | null;
};

/** A pujas row (GET /v1/pujas). */
export type Puja = {
  id: string;
  title: string;
  slug: string;
  price: number;
  mrp?: number | null;
  image_url?: string | null;
  short_description?: string | null;
  about?: string | null;
  symptoms?: string | null;
  benefits?: string | null;
  is_featured?: boolean;
};

/** How a piece is to be made. The server prices it from the product. */
export type Selection = { form: "loose" | "ring" | "pendant"; metal: string | null; size: string | null; addons: string[] };

export const LOOSE: Selection = { form: "loose", metal: null, size: null, addons: [] };

export type CartLine = {
  id?: string;
  product_id: string;
  quantity: number;
  form?: string | null;
  metal?: string | null;
  ring_size?: string | null;
  addons?: string[];
  unit_price?: number;
  selection_label?: string;
  crafting_days?: number;
  line_total?: number;
  product?: Product | null;
};

/** Coupon amounts are paise. */
export type AppliedCoupon = {
  kind: "coupon";
  code: string;
  couponKind: "platform" | "astrologer";
  title: string | null;
  description: string;
  astrologer: { id: string; name: string } | null;
  discount: number;
  eligibleSubtotal: number;
  lineDiscounts?: Record<string, number>;
};
export type ReferralFallthrough = { kind: "referral"; code: string; astrologer: { id: string; name: string }; discount: 0 };
export type NearMiss = { code: string; title: string | null; description: string; shortfall: number; message: string };

export type CouponRemoved = { code: string; reason: string; message: string };

export type Cart = {
  items: CartLine[];
  subtotal: number;
  itemCount: number;
  shipping: number;
  free_shipping_above: number;
  total: number;
  coupon?: AppliedCoupon | null;
  coupon_removed?: CouponRemoved | null;
};

export type ShippingAddress = { name: string; phone: string; email: string; address: string; city: string; state: string; pincode: string };

export type OrderItem = {
  id?: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: { id?: string; name?: string; image_url?: string | null } | null;
};

/** A product_orders row. Status words are lowercase: pending, confirmed, shipped, delivered, cancelled. */
export type ProductOrder = {
  id: string;
  total_amount: number;
  payment_status?: string | null;
  order_status?: string | null;
  shipping_address?: Partial<ShippingAddress> | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  tracking_number?: string | null;
  courier_name?: string | null;
  tracking_url?: string | null;
  estimated_delivery_date?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string | null;
  coupon_code?: string | null;
  /** Rupees. */
  discount_amount?: number | null;
  subtotal_before_discount?: number | null;
  shipping_charge?: number | null;
  product_order_items?: OrderItem[];
  product_order_returns?: { id: string; return_type?: string; return_status?: string; refund_status?: string }[];
};

export type PujaBookingDetails = {
  name?: string;
  fatherName?: string;
  gotra?: string;
  mobile?: string;
  whatsapp?: string;
  gender?: string;
  maritalStatus?: string;
  poojaDate?: string;
  poojaDateDb?: string;
  poojaTime?: string;
  address?: string;
  birthCountry?: string;
  birthState?: string;
  birthPlace?: string;
  birthDate?: string;
  birthTime?: string;
  specificRequirement?: string;
  checkoutBookingId?: string;
};

/** A puja_bookings row: payment PENDING, PAID, FAILED, REFUNDED; booking PENDING, CONFIRMED, COMPLETED, CANCELLED. */
export type PujaBooking = {
  id: string;
  puja_id?: string;
  puja_title?: string;
  amount?: number;
  payment_status?: string | null;
  booking_status?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  booking_date?: string | null;
  refund_status?: string | null;
  refund_amount?: number | null;
  created_at?: string | null;
  booking_details?: PujaBookingDetails | null;
};

// ─── Catalog (public) ───────────────────────────────────────────────────────

type Wrapped<T> = { success?: boolean; data: T };

/** GET /v1/products: every active product, newest first. */
export async function listProducts(signal?: AbortSignal): Promise<Product[]> {
  const res = await api<Wrapped<Product[]>>("/v1/products", { auth: false, signal });
  return Array.isArray(res?.data) ? res.data : [];
}

/** GET /v1/products/:id */
export async function getProduct(id: string, signal?: AbortSignal): Promise<Product> {
  const res = await api<Wrapped<Product>>(`/v1/products/${encodeURIComponent(id)}`, { auth: false, signal });
  return res.data;
}

/** GET /v1/products/:id/related: same group / planet. */
export async function getRelatedProducts(id: string, signal?: AbortSignal): Promise<Product[]> {
  const res = await api<Wrapped<Product[]>>(`/v1/products/${encodeURIComponent(id)}/related`, { auth: false, signal });
  return Array.isArray(res?.data) ? res.data : [];
}

/** GET /v1/pujas: active pujas. */
export async function listPujas(signal?: AbortSignal): Promise<Puja[]> {
  const res = await api<Wrapped<Puja[]>>("/v1/pujas", { auth: false, signal });
  return Array.isArray(res?.data) ? res.data : [];
}

/** GET /v1/pujas/slug/:slug */
export async function getPujaBySlug(slug: string, signal?: AbortSignal): Promise<Puja> {
  const res = await api<Wrapped<Puja>>(`/v1/pujas/slug/${encodeURIComponent(slug)}`, { auth: false, signal });
  return res.data;
}

// ─── Cart (signed in; shared with the app) ──────────────────────────────────

/** GET /v1/cart: lines priced live by the server, shipping, total and the coupon reserved for this cart. */
export async function getCart(signal?: AbortSignal): Promise<Cart> {
  const res = await api<Wrapped<Cart>>("/v1/cart", { signal });
  const d = res.data;
  return { ...d, items: Array.isArray(d?.items) ? d.items : [] };
}

/** GET /v1/cart/count */
export async function getCartCount(signal?: AbortSignal): Promise<number> {
  const res = await api<Wrapped<{ count: number }>>("/v1/cart/count", { signal });
  return Number(res.data?.count) || 0;
}

/** POST /v1/cart: adds one piece in the chosen setting (same body as the app's GemstoneDetail). */
export function addToCart(productId: string, sel: Selection = LOOSE) {
  return api<unknown>("/v1/cart", {
    method: "POST",
    body: {
      productId,
      quantity: 1,
      variant: { form: sel.form, metal: sel.metal, size: sel.size },
      addons: sel.addons,
    },
  });
}

/** PUT /v1/cart/:productId. 0 removes the line. */
export function setCartQuantity(productId: string, quantity: number) {
  return api<unknown>(`/v1/cart/${encodeURIComponent(productId)}`, { method: "PUT", body: { quantity } });
}

/** DELETE /v1/cart/:productId */
export function removeFromCart(productId: string) {
  return api<unknown>(`/v1/cart/${encodeURIComponent(productId)}`, { method: "DELETE" });
}

/** DELETE /v1/cart: after a paid order. */
export function clearCart() {
  return api<unknown>("/v1/cart", { method: "DELETE" });
}

// ─── Coupons ────────────────────────────────────────────────────────────────

export type CouponChannel = "stone" | "puja";
export type CouponLine = { productId: string; quantity: number; form?: string; metal?: string | null; ring_size?: string | null; addons?: string[] } | { pujaId: string; quantity: number };

/**
 * POST /v1/cart/coupon: applies a code (and reserves it for this user). The gemstone cart is read on the server
 * unless `items` is sent ("buy now"); the puja channel always needs its lines. A referral code typed here is
 * claimed and comes back with kind "referral" and no discount.
 */
export async function applyCoupon(code: string, channel: CouponChannel, items?: CouponLine[]) {
  const res = await api<Wrapped<AppliedCoupon | ReferralFallthrough>>("/v1/cart/coupon", {
    method: "POST",
    body: { code, channel, items },
  });
  return res.data;
}

/** DELETE /v1/cart/coupon?channel= */
export function removeCoupon(channel: CouponChannel) {
  return api<unknown>(`/v1/cart/coupon?channel=${channel}`, { method: "DELETE" });
}

/** GET /v1/coupons/available: the codes that fit now, and those a little more spending would unlock. */
export async function getAvailableCoupons(channel: CouponChannel, pujaItems?: { pujaId: string; quantity: number }[], signal?: AbortSignal) {
  const items = channel === "puja" && pujaItems?.length ? `&items=${pujaItems.map((i) => `${i.pujaId}:${i.quantity}`).join(",")}` : "";
  const res = await api<Wrapped<{ qualifying?: AppliedCoupon[]; nearMiss?: NearMiss[] }>>(`/v1/coupons/available?channel=${channel}${items}`, { signal });
  return { qualifying: res.data?.qualifying ?? [], nearMiss: res.data?.nearMiss ?? [] };
}

export const paiseToRupees = (paise: number) => Math.round(Number(paise) || 0) / 100;

// ─── Product orders and payment ─────────────────────────────────────────────

export type OrderLineInput = { productId: string; quantity: number; form: string; metal: string | null; ring_size: string | null; addons: string[] };

export type CreatedProductOrder = {
  order: ProductOrder;
  /** `keyId` is the public Razorpay key; the backend's product-order response does not send it today. */
  razorpay: { orderId: string; amount: number; currency?: string; keyId?: string };
};

/** POST /v1/product-orders: creates the order and its Razorpay order. The server prices every line. */
export function createProductOrder(shippingAddress: ShippingAddress, items: OrderLineInput[], couponCode?: string) {
  return api<CreatedProductOrder>("/v1/product-orders", {
    method: "POST",
    body: { shippingAddress, items, ...(couponCode ? { couponCode } : {}) },
  });
}

/** POST /v1/product-orders/:id/verify-payment: the backend checks Razorpay's signature and settles the order. */
export function verifyProductPayment(orderId: string, p: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  return api<{ success?: boolean }>(`/v1/product-orders/${encodeURIComponent(orderId)}/verify-payment`, { method: "POST", body: p });
}

/** POST /v1/product-orders/:id/payment-failed: releases the order after a failed or closed payment window. */
export function markProductPaymentFailed(orderId: string) {
  return api<unknown>(`/v1/product-orders/${encodeURIComponent(orderId)}/payment-failed`, { method: "POST" }).catch(() => undefined);
}

/** GET /v1/product-orders: my orders, newest first. */
export async function listMyProductOrders(signal?: AbortSignal): Promise<ProductOrder[]> {
  const res = await api<{ orders?: ProductOrder[] }>("/v1/product-orders", { signal });
  return Array.isArray(res?.orders) ? res.orders : [];
}

/** GET /v1/product-orders/:id/delivery: one of my orders with its courier details (403 for someone else's). */
export async function getProductOrder(orderId: string, signal?: AbortSignal): Promise<ProductOrder> {
  const res = await api<{ order: ProductOrder }>(`/v1/product-orders/${encodeURIComponent(orderId)}/delivery`, { signal });
  return res.order;
}

// ─── Puja booking and payment ───────────────────────────────────────────────

export type PujaOrderInput = {
  /** Rupees the user will pay (after the coupon); the server recomputes and must agree. */
  amount: number;
  bookingId: string;
  poojaName: string;
  items: { pujaId: string; pujaTitle: string; quantity: number; price: number }[];
  details: PujaBookingDetails;
  couponCode?: string;
};

export type CreatedPujaOrder = { success?: boolean; orderId: string; amount: number; currency?: string; keyId?: string; bookingId: string };

/** POST /v1/puja/create-order: PENDING bookings plus the Razorpay order (with the public key id). */
export function createPujaOrder(input: PujaOrderInput) {
  return api<CreatedPujaOrder>("/v1/puja/create-order", { method: "POST", body: input });
}

/** POST /v1/puja/verify-payment: signature check, then the bookings become PAID. */
export function verifyPujaPayment(p: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  return api<unknown>("/v1/puja/verify-payment", { method: "POST", body: p });
}

/** POST /v1/puja/payment-failed: releases the PENDING bookings of a closed or failed payment. */
export function markPujaPaymentFailed(p: { razorpay_order_id: string; bookingId?: string; amount?: number; poojaName?: string; reason?: string }) {
  return api<unknown>("/v1/puja/payment-failed", { method: "POST", body: p }).catch(() => undefined);
}

/** GET /v1/puja/pooja-booking/user/:userId: my bookings. The backend answers 404 when there are none. */
export async function listMyPujaBookings(userId: string, signal?: AbortSignal): Promise<PujaBooking[]> {
  try {
    const rows = await api<PujaBooking[]>(`/v1/puja/pooja-booking/user/${encodeURIComponent(userId)}`, { signal });
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) return [];
    throw error;
  }
}

/** GET /v1/puja/pooja-booking/:id: one of my bookings (the backend returns a list; empty when it is not mine). */
export async function getPujaBooking(id: string, signal?: AbortSignal): Promise<PujaBooking | null> {
  const rows = await api<PujaBooking[]>(`/v1/puja/pooja-booking/${encodeURIComponent(id)}`, { signal });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

/** POST /v1/puja/pooja-booking/:id/cancel: a paid puja, up to 48 hours before the puja day; refunded in full. */
export function cancelPujaBooking(id: string) {
  return api<{ success: boolean; refundStarted?: boolean }>(`/v1/puja/pooja-booking/${encodeURIComponent(id)}/cancel`, { method: "POST" });
}

/**
 * The Razorpay key id for a product order. The backend's puja order returns it; the product order does not, so
 * it falls back to NEXT_PUBLIC_RAZORPAY_KEY_ID (the same public key the app ships as RAZORPAY_KEY_ID).
 */
export function productCheckoutKey(created: CreatedProductOrder): string | null {
  return created.razorpay.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || null;
}

// ─── Pricing (mirrors the backend's ProductPricing.ts) ──────────────────────

/** The price of a piece in a setting, in rupees; null when the ring / pendant in that metal is not offered. */
export function unitPrice(product: Product, sel: Selection): number | null {
  let delta = 0;
  if (sel.form !== "loose") {
    const v = (product.variants ?? []).find((x) => x.form === sel.form && (x.metal || "") === (sel.metal || ""));
    if (!v) return null;
    delta = Number(v.price_delta) || 0;
  }
  const addons = (product.addons ?? []).filter((a) => sel.addons.includes(String(a.id))).reduce((s, a) => s + (Number(a.price) || 0), 0);
  return (Number(product.price) || 0) + delta + addons;
}

export const inStock = (p: { stock?: number | null }) => p.stock === null || p.stock === undefined || Number(p.stock) > 0;

/** Percent off from the MRP, 0 when there is none worth showing. */
export function percentOff(price: number, mrp?: number | null) {
  const m = Number(mrp) || 0;
  return m > price && price > 0 ? Math.round(((m - price) / m) * 100) : 0;
}

// ─── Language and formatting ────────────────────────────────────────────────

/** The Hindi field when the page is Hindi and the admin filled it in, else the English one. */
export function pick<T>(locale: Locale, en: T | null | undefined, hi: T | null | undefined): T | null {
  const hasHi = Array.isArray(hi) ? hi.length > 0 : typeof hi === "object" && hi !== null ? Object.keys(hi).length > 0 : Boolean(hi);
  if (locale === "hi" && hasHi) return hi as T;
  return (en ?? null) as T | null;
}

export const productName = (locale: Locale, p: Product) => pick(locale, p.name, p.name_hi) ?? p.name;

/** Whole rupees, Indian grouping: ₹12,500. */
export const rupee = (n: number) => `₹${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const DATE = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
export const formatDate = (value: string | number | null | undefined) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : DATE.format(d);
};

/** "Gold 18K" style metals of a form, in the order the admin listed them. */
export const metalsFor = (p: Product, form: string) => (p.variants ?? []).filter((v) => v.form === form).map((v) => v.metal);

/** The forms a product can be bought in, loose first. Only loose / ring / pendant are orderable (as in the app). */
export function formsOf(p: Product): ("loose" | "ring" | "pendant")[] {
  const forms = new Set((p.variants ?? []).map((v) => v.form));
  return ["loose", ...(["ring", "pendant"] as const).filter((f) => forms.has(f))];
}

export const lineSelectionOf = (l: CartLine): OrderLineInput => ({
  productId: l.product_id,
  quantity: Number(l.quantity) || 1,
  form: l.form || "loose",
  metal: l.metal || null,
  ring_size: l.ring_size || null,
  addons: Array.isArray(l.addons) ? l.addons : [],
});
