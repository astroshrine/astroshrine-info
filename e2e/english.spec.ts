import { expect, test } from "@playwright/test";
import { ASTRO_ID, BOOKING_ID, signIn } from "./support/backend";
import { hindiText, settle } from "./support/text";

/** Pages anyone can open. Each must be fully English at /en (Hindi content marked lang="hi" excepted). */
const PUBLIC_PAGES = [
  "/en",
  "/en/kundli",
  "/en/kundli/chart",
  "/en/kundli/sheet",
  "/en/kundli/kp",
  "/en/kundli/gochar",
  "/en/kundli/panchang",
  "/en/kundli/milan",
  "/en/astrologers",
  "/en/login",
  "/en/no-such-page",
];

/** Pages behind sign-in, opened with the fake visitor and backend. */
const SIGNED_IN_PAGES = ["/en/home", "/en/wallet", "/en/profile", "/en/chat", `/en/chat/${ASTRO_ID}?booking=${BOOKING_ID}`];

for (const path of PUBLIC_PAGES) {
  test(`no Hindi left on ${path}`, async ({ page }) => {
    await page.goto(path);
    await settle(page);
    expect(await hindiText(page)).toEqual([]);
  });
}

for (const path of SIGNED_IN_PAGES) {
  test(`no Hindi left on ${path} (signed in)`, async ({ page }) => {
    await signIn(page);
    await page.goto(path);
    await settle(page);
    expect(await hindiText(page)).toEqual([]);
  });
}
