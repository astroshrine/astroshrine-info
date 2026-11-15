import { expect, test } from "@playwright/test";
import { signIn } from "./support/backend";

test.describe("language in the URL", () => {
  test("a link without a language opens in Hindi and keeps its query", async ({ request }) => {
    const response = await request.get("/kundli?k=abc", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toMatch(/\/hi\/kundli\?k=abc$/);
  });

  test("a visitor who chose English is sent to English", async ({ request }) => {
    const response = await request.get("/", { maxRedirects: 0, headers: { cookie: "NEXT_LOCALE=en" } });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toMatch(/\/en$/);
  });

  for (const lang of ["hi", "en"]) {
    test(`/${lang} pages declare lang="${lang}"`, async ({ page }) => {
      await page.goto(`/${lang}/kundli`);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
    });
  }

  test("an unknown page shows the 404 in the page's language", async ({ page }) => {
    const english = await page.goto("/en/no-such-page");
    expect(english?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page was not found");

    await page.goto("/hi/no-such-page");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("यह पेज नहीं मिला");
  });

  test("internal links on an English page stay in English", async ({ page }) => {
    await page.goto("/en/kundli");
    await expect(page.getByRole("banner").getByRole("link", { name: "हिंदी" })).toBeVisible();
    // Every internal link except the switch to Hindi (which carries hreflang).
    const hrefs = await page.locator('a[href^="/"]:not([hreflang])').evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.filter((href) => !/^\/en(?=$|[/?#])/.test(href))).toEqual([]);
  });
});

test("the language switch opens the same page in the other language and remembers it", async ({ page, context }) => {
  await page.goto("/hi/kundli");
  await page.getByRole("banner").getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/kundli$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect((await context.cookies()).find((cookie) => cookie.name === "NEXT_LOCALE")?.value).toBe("en");

  // A link without a language now opens in English.
  await page.goto("/astrologers");
  await expect(page).toHaveURL(/\/en\/astrologers$/);

  await page.getByRole("banner").getByRole("link", { name: "हिंदी" }).click();
  await expect(page).toHaveURL(/\/hi\/astrologers$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
});

test.describe("the language switch", () => {
  test("links to the same page in the other language, in the header and the footer", async ({ page }) => {
    await page.goto("/hi/kundli");
    await expect(page.getByRole("banner").getByRole("link", { name: "English" })).toHaveAttribute("href", "/en/kundli");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "English" })).toHaveAttribute("href", "/en/kundli");
  });

  test("leaves a Cmd or Ctrl click to the browser and saves no choice", async ({ page, context }) => {
    await page.goto("/hi/kundli");
    const [tab] = await Promise.all([
      context.waitForEvent("page"),
      page.getByRole("banner").getByRole("link", { name: "English" }).click({ modifiers: ["ControlOrMeta"] }),
    ]);
    await tab.waitForLoadState();
    expect(tab.url()).toMatch(/\/en\/kundli$/);
    await expect(page).toHaveURL(/\/hi\/kundli$/);
    expect((await context.cookies()).some((cookie) => cookie.name === "NEXT_LOCALE")).toBe(false);
  });

  test("saves no choice when the visitor stays on a page that asks before leaving", async ({ page, context }) => {
    await page.goto("/hi/kundli");
    await page.evaluate(() =>
      window.addEventListener("beforeunload", (event) => {
        event.preventDefault();
        event.returnValue = "";
      }),
    );
    page.on("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("banner").getByRole("link", { name: "English" }).click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/hi\/kundli$/);
    expect((await context.cookies()).some((cookie) => cookie.name === "NEXT_LOCALE")).toBe(false);
  });
});

test("signing in returns to the page in the login page's language", async ({ page }) => {
  await signIn(page);
  await page.goto(`/en/login?next=${encodeURIComponent("/hi/wallet")}`);
  await expect(page).toHaveURL(/\/en\/wallet$/);
});

test("the phone header fits a 320px screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/hi");
  const nav = page.getByRole("navigation", { name: "मुख्य नेविगेशन" });
  await expect(nav.getByRole("button", { name: "मेनू खोलें" })).toBeVisible();
  expect(await nav.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0);
});
