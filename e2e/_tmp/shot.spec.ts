import { test } from "@playwright/test";
import { MockBackend, signIn, USER_ID, ASTRO_ID } from "../support/backend";
const OUT = "/private/tmp/claude-502/-Users-apple1-webapp/ee140f01-f8dc-4320-a4a1-b82cd9cf8850/scratchpad/ns/";
const day = 86400000;
test("shots", async ({ page }, info) => {
  const b = new MockBackend();
  const orig = b.answer.bind(b);
  const ch = (c: number, o: number) => ({ chat: c, call: o, livestream: 0 });
  b.answer = (m, url, body) => {
    const p = new URL(url).pathname.replace(/^\/api/, "");
    if (p === `/v1/user-supabase/${USER_ID}`) return [200, { id: USER_ID, name: "Pt. Priya Sharan", role: "ASTROLOGER", profile: {} }];
    if (/\/status$/.test(p) && p.startsWith("/v1/users/")) return [200, { isOnline: true }];
    if (p.endsWith("/earnings")) {
      const mk = (n: number, step: number) => Array.from({ length: n }, (_, i) => ({ createTs: Date.now() - (n - i) * step, channelTimeSpent: ch(i * 120000, i * 60000), numberOfOrders: ch(i % 4, i % 2), earnings: ch(i * 90, i * 70) }));
      return [200, { daily: mk(7, day), weekly: mk(5, 7 * day), monthly: mk(12, 30 * day) }];
    }
    if (p.endsWith("/order")) return [200, Array.from({ length: 5 }, (_, i) => ({ orderTs: Date.now() - i * 3600000 * 5, orderType: i % 2 ? "call" : "chat", amount: 120 + i * 20, timeSpent: 600000 + i * 60000, customerName: i == 2 ? "सुनीता" : "Neha", customerId: "c" + i }))];
    if (p === "/v1/chat" && new URL(url).searchParams.get("users")) {
      const users = [{ id: USER_ID, role: "ASTROLOGER", lastRead: Date.now(), lastReceived: Date.now(), name: "x" }, { id: "cust-1", role: "USER", lastRead: 0, lastReceived: Date.now() - 60000, name: "Neha Rao" }];
      return [200, [{ id: "chat-1", status: "ACTIVE", userList: `${USER_ID}#cust-1`, users }]];
    }
    if (p.startsWith("/v1/booking/client-kundli/")) return [200, { name: "Neha Rao", dateTimeOfBirth: null, placeOfBirth: null, gender: "Female" }];
    if (p.startsWith("/v1/jyotish/sheet/")) return [404, { error: "birth_details_missing" }];
    return orig(m, url, body);
  };
  await signIn(page, b);
  for (const lang of ["en", "hi"]) for (const pg of ["earnings", "session?chat=chat-1"]) {
    await page.goto(`/${lang}/astrologer/${pg}`);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}m-${lang}-${pg.split("?")[0]}-${info.project.name}.png`, fullPage: true });
  }
});
