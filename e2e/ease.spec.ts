import { expect, test } from "@playwright/test";
import { MockBackend, signIn } from "./support/backend";

// The website reaching the app's ease of use: details asked at sign-up, an editable profile, every section reachable
// from the menu, the Offers screen, the live rashifal and a stat box with real figures only.

test("a new account fills in its details after login, then goes where it was heading", async ({ page }) => {
  const backend = new MockBackend();
  backend.user = { name: null, profile: { phoneNumber: "+919800000000" } };
  await signIn(page, backend);
  await page.goto(`/en/login?next=${encodeURIComponent("/wallet")}`);
  await expect(page).toHaveURL(/\/en\/profile\/edit\?welcome=1&next=%2Fwallet$/);
  await expect(page.getByRole("heading", { name: "Tell us about yourself" })).toBeVisible();

  // Nothing filled in: the first problem is named, nothing is saved.
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("Enter your first name.");

  await page.getByLabel("First name").fill("Neha");
  await page.getByLabel("Last name").fill("Rao");
  await page.getByText("Female", { exact: true }).click();
  await page.getByLabel("Date of birth").fill("1996-08-14");
  await page.getByLabel("Time of birth").fill("06:40");
  await page.getByLabel("Place of birth").fill("Ujjain");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText("Ujjain, Madhya Pradesh, India ·")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/en\/wallet$/);
  expect(backend.savedProfiles).toEqual([
    {
      name: "Neha Rao",
      profile: {
        gender: "F",
        // 06:40 IST on 14 Aug 1996.
        dateTimeOfBirth: Date.UTC(1996, 7, 14, 1, 10),
        placeOfBirth: { displayValue: "Ujjain, Madhya Pradesh, India", geolocation: { lat: 23.18, lng: 75.78 }, timezone: "Asia/Kolkata" },
      },
    },
  ]);
});

test("an under-18 birth date is refused, as in the app", async ({ page }) => {
  await signIn(page);
  await page.goto("/en/profile/edit");
  const year = new Date().getFullYear() - 10;
  await page.getByLabel("Date of birth").fill(`${year}-01-01`);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("You must be 18 or older to use AstroShrine.");
});

test("the profile can be edited, starting from the saved details", async ({ page }) => {
  const backend = await signIn(page);
  await page.goto("/en/profile");
  await page.getByRole("link", { name: "Edit profile" }).click();
  await expect(page).toHaveURL(/\/en\/profile\/edit$/);
  await expect(page.getByLabel("First name")).toHaveValue("Test");
  await expect(page.getByLabel("Last name")).toHaveValue("User");
  await expect(page.getByLabel("Date of birth")).toHaveValue("1995-03-12");
  await expect(page.getByLabel("Time of birth")).toHaveValue("06:40");

  await page.getByLabel("First name").fill("Tester");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/en\/profile$/);
  expect((backend.savedProfiles[0] as { name: string }).name).toBe("Tester User");
});

test("the profile lists the other sections", async ({ page }) => {
  await signIn(page);
  await page.goto("/en/profile");
  const more = page.getByRole("navigation", { name: "More" });
  for (const name of ["My appointments", "Past sessions", "AI astrologers", "Store", "Offers"]) {
    await expect(more.getByRole("link", { name })).toBeVisible();
  }
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the menu reaches tools, store, appointments, AI astrologers and offers", async ({ page }) => {
    await signIn(page);
    await page.goto("/en/home");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.locator("#mobile-menu");
    await expect(menu.getByRole("link", { name: "Tools" })).toBeVisible();
    for (const name of ["My appointments", "Past sessions", "AI astrologers", "Store", "Offers"]) {
      await expect(menu.getByRole("link", { name })).toBeVisible();
    }
    await menu.getByRole("link", { name: "Store" }).click();
    await expect(page).toHaveURL(/\/en\/store$/);
  });
});

test("the offers page lists running promo codes and fills one in on the wallet", async ({ page }) => {
  const backend = new MockBackend();
  backend.promos = [
    { code: "DIWALI20", description: "Festive offer", discountPercentage: 20, maxDiscountInr: 200, minRechargeInr: 500, expiresAt: null, applicableTo: ["RECHARGE"] },
  ];
  await signIn(page, backend);
  await page.goto("/en/offers");
  await expect(page.getByText("20% off")).toBeVisible();
  await expect(page.getByText("up to ₹200 · on recharges of ₹500 or more")).toBeVisible();
  await page.getByRole("link", { name: "Use in wallet" }).click();
  await expect(page).toHaveURL(/\/en\/wallet\?promo=DIWALI20&amount=500#recharge$/);
  await expect(page.locator("#promo")).toHaveValue("DIWALI20");
});

test("the landing page shows today's rashifal from the backend", async ({ page }) => {
  const backend = new MockBackend();
  backend.horoscope = [
    200,
    {
      date: "2026-11-19",
      language: "en",
      horoscopes: [
        {
          rashiKey: "mesha",
          englishName: "Aries",
          prediction: "A steady day for Mesh, with the Moon backing your plans.",
          love: "Warm words land well.",
          career: "Finish what you started.",
          health: "Sleep early tonight.",
          luckyColor: "Red",
          luckyNumber: 9,
          luckyTime: "10 AM - 12 PM",
          mood: "Confident",
        },
      ],
    },
  ];
  await signIn(page, backend);
  await page.goto("/en");
  const band = page.locator("#rashifal");
  await band.scrollIntoViewIfNeeded();
  await expect(band.getByText("A steady day for Mesh, with the Moon backing your plans.")).toBeVisible();
  await expect(band.getByText("Finish what you started.")).toBeVisible();
  await expect(band.getByText("Mood: Confident")).toBeVisible();
});

test("the landing page's stat box is left out when the astrologer list can't load", async ({ page }) => {
  await page.route("**/api/astrologers", (route) => route.fulfill({ status: 500, body: "" }));
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('main [aria-busy="true"], main .animate-pulse')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByLabel("AstroShrine in numbers")).toHaveCount(0);
  await expect(page.getByText("1Cr+")).toHaveCount(0);
});
