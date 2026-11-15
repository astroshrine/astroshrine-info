import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";

/**
 * A fake signed-in visitor and a fake backend for end-to-end tests.
 *
 * signIn(page) stores a Supabase session in localStorage (so the site believes someone is signed in), blocks
 * Supabase auth calls and the realtime socket, swaps Razorpay Checkout for a stub, and answers every /api/v1 call
 * from the MockBackend below. Nothing reaches the real backend, Supabase or Razorpay, and no money moves.
 */

export const USER_ID = "11111111-2222-3333-4444-555555555555";
export const ASTRO_ID = "astro-test-1";
export const BOOKING_ID = "bk-1";

type Reply = [status: number, body: unknown] | "fail";

/** Supabase keeps the session under `sb-<project ref>-auth-token`; the ref comes from the project URL. */
function sessionKey(): string {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    try {
      url = /^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m.exec(readFileSync(".env.local", "utf8"))?.[1]?.trim();
    } catch {
      // No .env.local: fall through to the error below.
    }
  }
  if (!url) throw new Error("Signed-in tests need NEXT_PUBLIC_SUPABASE_URL (from the environment or .env.local).");
  return `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
}

function fakeSession() {
  const now = Math.floor(Date.now() / 1000);
  const part = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const jwt = `${part({ alg: "HS256", typ: "JWT" })}.${part({ sub: USER_ID, exp: now + 3600, role: "authenticated" })}.c2ln`;
  return {
    access_token: jwt,
    refresh_token: "fake-refresh",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    user: { id: USER_ID, aud: "authenticated", role: "authenticated", phone: "919800000000", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
  };
}

const astrologer = (id: string, name: string, extra: object = {}) => ({
  id,
  name,
  status: "online",
  isLive: false,
  lastOnlineTs: Date.now(),
  ranking: 1,
  pricingData: { chat: { rate: 15, offer: 0 } },
  currentChannel: { chat: { enabled: true } },
  hostProfile: {
    expertise: ["Vedic Astrology", "Kundli"],
    languages: ["Hindi", "English"],
    experience: 12,
    rating: 4.8,
    totalReviews: 31,
    orders: 420,
    aboutMe: "Twelve years of Vedic astrology practice.",
    media: [],
  },
  stats: { orders: 433, counts: { chats: 120, calls: 40, followers: 87 } },
  ...extra,
});

/** A conversation of `count` messages, newest first (as the backend sends them), alternating sides. */
function conversation(count: number) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    messageId: `m${count - i}`,
    sentBy: i % 2 ? USER_ID : ASTRO_ID,
    sentTs: now - (i + 1) * 60_000,
    type: "text",
    message: i === 0 ? "Your Jupiter is well placed. Anything else you would like to ask?" : `Earlier message ${count - i} about career and marriage.`,
    status: "seen",
  }));
}

const walletConfig = {
  id: "cfg",
  points_per_rupee: 1,
  points_per_question: 1,
  min_recharge_inr: 100,
  recharge_step_inr: 50,
  max_recharge_inr: 25000,
  recharge_tiers: [100, 150, 200, 250, 300, 350, 400, 450, 500].map((inr) => ({ inr })),
  bonus_percentage: 0,
  gst_percentage: 18,
  is_active: true,
};

const transaction = (i: number, extra: object) => ({
  id: `tx_${i}`,
  user_id: USER_ID,
  balance_after: 1234,
  status: "COMPLETED",
  created_at: new Date(Date.now() - i * 36e5).toISOString(),
  bonus_amount: 0,
  metadata: null,
  ...extra,
});

/** Razorpay Checkout stand-in. Before paying, set window.__rzpMode to "success", "failed" or "cancel". */
const RAZORPAY_STUB = `
window.Razorpay = function (options) {
  var handlers = {};
  return {
    on: function (event, fn) { handlers[event] = fn; },
    open: function () {
      var mode = window.__rzpMode || "success";
      setTimeout(function () {
        if (mode === "success") {
          options.handler({ razorpay_payment_id: "pay_TEST" + options.order_id.slice(-4), razorpay_order_id: options.order_id, razorpay_signature: "stub_signature" });
        } else if (mode === "failed") {
          handlers["payment.failed"] && handlers["payment.failed"]({ error: { code: "BAD_REQUEST_ERROR", description: "Your payment didn't go through as it was declined by the bank.", reason: "payment_failed" } });
          setTimeout(function () { options.modal && options.modal.ondismiss && options.modal.ondismiss(); }, 300);
        } else {
          options.modal && options.modal.ondismiss && options.modal.ondismiss();
        }
      }, 300);
    },
  };
};`;

/** The fake backend. Tests change its fields to steer a scenario. */
export class MockBackend {
  balance = 1234;
  /** Order id that the next recharge gets. */
  nextOrderId = "order_TEST";
  /** Answer to POST /v1/wallet/recharge/confirm. */
  confirm: Reply = [200, { success: true, pointsCredited: 100, newBalance: 1334, transactionId: "tx_new" }];
  /** Answers to GET /v1/wallet/recharge/:orderId/status, in order; the last one repeats. */
  orderStatus: Record<string, Reply[]> = {};
  messages = conversation(45);
  /** Requests that had no fixture: a test can assert this stays empty. */
  unmocked: string[] = [];
  private chatExpiresAt = Date.now() + 70_000;

  private chatPack() {
    return {
      bookingId: BOOKING_ID,
      status: "IN_PROGRESS",
      timeBased: true,
      secondsAllowed: 300,
      timerStarted: true,
      startedAt: this.chatExpiresAt - 300_000,
      expiresAt: this.chatExpiresAt,
      secondsRemaining: Math.max(Math.ceil((this.chatExpiresAt - Date.now()) / 1000), 0),
      expired: false,
      blockMinutes: 5,
      blockPoints: 75,
      ratePerMin: 15,
      free: false,
    };
  }

  answer(method: string, url: string, body: string | null): Reply {
    const u = new URL(url);
    const p = u.pathname.replace(/^\/api/, "");
    const q = u.searchParams;

    if (p === `/v1/user-supabase/${USER_ID}`)
      return [200, { id: USER_ID, name: "Test User", role: "USER", points_balance: this.balance, profile: { phoneNumber: "+919800000000" } }];
    if (p === "/v1/wallet/balance") return [200, { points_balance: this.balance, inr_balance: 0 }];
    if (p === "/v1/wallet/config") return [200, walletConfig];
    if (p === "/v1/wallet/transactions") {
      const transactions = [
        transaction(1, { type: "CREDIT", reference_type: "RECHARGE", reference_id: "order_TXLIST", description: "Wallet recharge ₹177", amount: 150, metadata: { razorpayPaymentId: "pay_TXLIST01", originalAmount: 150, bonusPoints: 0, promoCode: null } }),
        transaction(2, { type: "DEBIT", reference_type: "BOOKING", reference_id: "bk_1", description: "Chat with an astrologer", amount: 45 }),
      ];
      return [200, { transactions, total: transactions.length, limit: 20, offset: 0 }];
    }
    if (p === "/v1/wallet/recharge/initiate") {
      const inr = Number(JSON.parse(body || "{}").amount) || 100;
      return [200, { orderId: this.nextOrderId, amount: Math.round(inr * 118) / 100, originalAmount: inr, gstAmount: Math.round(inr * 18) / 100, gstPct: 18, currency: "INR", pointsToCredit: inr, bonusPoints: 0, discount: 0, razorpayKey: "rzp_test_stub" }];
    }
    if (p === "/v1/wallet/recharge/confirm") {
      if (Array.isArray(this.confirm) && this.confirm[0] === 200) this.balance = Number((this.confirm[1] as { newBalance?: number }).newBalance ?? this.balance + 100);
      return this.confirm;
    }
    const status = /^\/v1\/wallet\/recharge\/([^/]+)\/status$/.exec(p);
    if (status) {
      const queue = this.orderStatus[decodeURIComponent(status[1])];
      if (!queue?.length) return [404, { error: "Order not found" }];
      return queue.length > 1 ? queue.shift()! : queue[0];
    }
    if (p === "/v1/notifications/email/trigger") return [200, { ok: true }];

    if (p === "/v1/booking/consult-config") return [200, { free: false, freeChat: { available: false, minutes: 0 } }];
    if (p === "/v1/favourites/ids") return [200, { ids: [] }];
    if (p === "/v1/astrologer-view/search/channelType/chat")
      return [200, [astrologer(ASTRO_ID, "Pandit Test Sharma"), astrologer("astro-test-2", "Acharya Demo Rao"), astrologer("astro-test-3", "Jyotishi Sample Devi", { status: "busy" })]];
    if (p === "/v1/astrologer-view/status") return [200, (q.get("ids") ?? "").split(",").map((id) => ({ id, status: "online", isLive: false, chatEnabled: true }))];
    if (p === `/v1/astrologer-view/${ASTRO_ID}`) return [200, astrologer(ASTRO_ID, "Pandit Test Sharma")];
    if (/^\/v1\/astrologer-view\/[^/]+\/profile\/review\/?$/.test(p)) return [200, []];

    if (p === "/v1/chat" && q.get("users")) {
      const users = [
        { id: ASTRO_ID, role: "ASTROLOGER", lastRead: Date.now() - 20_000, lastReceived: Date.now() - 20_000, name: "Pandit Test Sharma" },
        { id: USER_ID, role: "USER", lastRead: Date.now() - 90_000, lastReceived: Date.now() - 60_000, name: "Test User" },
      ];
      return [200, [{ id: "chat-1", status: "ACTIVE", userList: `${ASTRO_ID}#${USER_ID}`, users }]];
    }
    if (p === "/v1/chat/chat-1/messages" && method === "GET") return [200, q.get("timestamp") ? [] : this.messages];
    if (p === "/v1/chat/chat-1/messages" && method === "POST") {
      const sent = JSON.parse(body || "{}");
      return [201, [{ messageId: `m-${sent.sentTs}`, sentBy: USER_ID, sentTs: sent.sentTs, type: "text", message: sent.message, status: "sent" }]];
    }
    if (/^\/v1\/chat\/chat-1\/(seen|typing|delivered)$/.test(p)) return [200, {}];
    if (p === `/v1/booking/chat-status/${BOOKING_ID}` || p === `/v1/booking/chat-pack/with-user/${ASTRO_ID}`) return [200, this.chatPack()];
    if (p === "/v1/booking/chat/active")
      return [200, [{ id: BOOKING_ID, astrologer_id: ASTRO_ID, user_id: USER_ID, channel_type: "chat", status: "IN_PROGRESS", chat_started_at: new Date().toISOString() }]];
    if (/^\/v1\/booking\/chat-pricing\//.test(p)) return [200, { blockMinutes: 5, blockPoints: 75, chatRatePerMin: 15, free: false }];
    if (/^\/v1\/booking\/removal-cooldown\//.test(p)) return [200, { until: null }];
    if (/^\/v1\/booking\/chat\/precheck\//.test(p)) return [200, { busyUntil: null }];
    if (/^\/v1\/booking\/chat\/queue\/astrologer\//.test(p)) return [200, { length: 0, estimatedWaitMs: 0 }];

    this.unmocked.push(`${method} ${p}`);
    return [404, { error: "not mocked" }];
  }
}

/** Signs a fake visitor in for this page and routes all backend traffic to `backend`. */
export async function signIn(page: Page, backend = new MockBackend()): Promise<MockBackend> {
  await page.addInitScript(
    ([key, value]) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Storage unavailable: the page will simply be signed out.
      }
    },
    [sessionKey(), JSON.stringify(fakeSession())] as const,
  );
  await page.route("**/auth/v1/**", (route) => route.abort("blockedbyclient"));
  await page.routeWebSocket(/\/ws\/realtime/, (ws) => ws.close());
  await page.route("https://checkout.razorpay.com/**", (route) => route.fulfill({ contentType: "application/javascript", body: RAZORPAY_STUB }));
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const reply = backend.answer(request.method(), request.url(), request.postData());
    if (reply === "fail") return route.abort("connectionrefused");
    await route.fulfill({ status: reply[0], contentType: "application/json", body: JSON.stringify(reply[1]) });
  });
  return backend;
}
