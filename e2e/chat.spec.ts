import { expect, test } from "@playwright/test";
import { ASTRO_ID, BOOKING_ID, signIn } from "./support/backend";

for (const lang of ["hi", "en"]) {
  test(`the chat room fits the screen and opens on the newest message (${lang})`, async ({ page }) => {
    await signIn(page);
    await page.goto(`/${lang}/chat/${ASTRO_ID}?booking=${BOOKING_ID}`);

    const composer = page.locator("main textarea");
    await expect(composer).toBeVisible();
    // 45 messages: the list scrolls inside the room and starts at the newest one.
    await expect(page.getByText("Your Jupiter is well placed.")).toBeInViewport();

    const layout = await page.evaluate(() => ({
      pageHeight: document.scrollingElement!.scrollHeight,
      viewport: window.innerHeight,
      footer: getComputedStyle(document.querySelector("#page > footer")!).display,
    }));
    expect(layout.pageHeight, "the page itself must not scroll").toBeLessThanOrEqual(layout.viewport);
    expect(layout.footer, "no site footer under the chat").toBe("none");

    const box = await composer.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(layout.viewport);
  });
}
