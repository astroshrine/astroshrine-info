import { expect, test } from "@playwright/test";
import { signIn } from "./support/backend";

// The front door, as in the app: the website opens on the login, where a visitor picks User or Astrologer, or looks
// around first. Deep links stay open, and search engines and link previews still get the home page.

test.describe("the front door", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("the home page opens on the login with a User / Astrologer choice", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveURL(/\/en\/login$/);
    const who = page.getByRole("navigation", { name: "Who are you?" });
    await expect(who.getByText("User")).toHaveAttribute("aria-current", "page");
    await who.getByRole("link", { name: "Astrologer" }).click();
    await expect(page).toHaveURL(/\/en\/astrologer\/login$/);
    await page.getByRole("link", { name: "User login" }).click();
    await expect(page).toHaveURL(/\/en\/login$/);
  });

  test("a bare / goes to the login in the saved language", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/hi\/login$/);
    await expect(page.getByRole("link", { name: "ज्योतिषी" })).toBeVisible();
  });

  test("continue without login opens the home page, and it stays open", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Continue without login" }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/en");
    await expect(page).toHaveURL(/\/en$/);
  });

  test("a signed-in browser opens on the home page", async ({ page }) => {
    await signIn(page);
    await page.goto("/en/kundli"); // any page: the session marks this browser as signed in
    await page.waitForFunction(() => document.cookie.includes("AS_FRONT=member"));
    await page.goto("/en");
    await expect(page).toHaveURL(/\/en$/);
  });

  test("deep links are not sent to the login", async ({ page }) => {
    await page.goto("/en/kundli");
    await expect(page).toHaveURL(/\/en\/kundli$/);
  });

  test("search engines get the home page", async ({ request }) => {
    const res = await request.get("/en", { maxRedirects: 0, headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } });
    expect(res.status()).toBe(200);
  });
});

test("the birth place field suggests places as you type", async ({ page }) => {
  await page.route("**/api/places?*", (route) =>
    route.fulfill({
      json: [
        { label: "Ujjain, Madhya Pradesh, India", name: "Ujjain", lat: 23.18, lon: 75.78, countryCode: "IN" },
        { label: "Ujjayanta, Tripura, India", name: "Ujjayanta", lat: 23.83, lon: 91.28, countryCode: "IN" },
      ],
    }),
  );
  await signIn(page);
  await page.goto("/en/profile/edit");
  const place = page.getByRole("combobox", { name: "Place of birth" });
  await place.fill("");
  await place.pressSequentially("Ujj");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option")).toHaveCount(2);
  // Keyboard: the first is active; down picks the second.
  await place.press("ArrowDown");
  await place.press("Enter");
  await expect(place).toHaveValue("Ujjayanta, Tripura, India");
  await expect(page.getByText("Ujjayanta, Tripura, India ·")).toContainText("Asia/Kolkata");
  await expect(page.getByRole("listbox")).toBeHidden();
});
