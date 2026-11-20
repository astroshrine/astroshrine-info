import { expect, test } from "@playwright/test";

test("the deploy health check and robots.txt answer without a redirect", async ({ request }) => {
  expect((await request.get("/api/health", { maxRedirects: 0 })).status()).toBe(200);
  const robots = await request.get("/robots.txt", { maxRedirects: 0 });
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("User-Agent: *");
});

for (const path of ["/hi", "/en", "/en/kundli", "/hi/kundli/chart", "/en/astrologers", "/en/login"]) {
  test(`${path} carries the share image`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", /opengraph-image/);
  });
}
