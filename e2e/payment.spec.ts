import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./support/backend";

/** Opens the wallet with a pack chosen and pays through the Razorpay stub. */
async function pay(page: Page, lang: string, amount: number, mode: "success" | "failed") {
  await page.goto(`/${lang}/wallet?amount=${amount}`);
  const button = page.locator("#recharge button[aria-busy]");
  await expect(button).toBeEnabled();
  await page.evaluate((m) => {
    (window as unknown as { __rzpMode: string }).__rzpMode = m;
  }, mode);
  await button.click();
}

for (const lang of ["hi", "en"]) {
  test(`a successful recharge shows the paid receipt (${lang})`, async ({ page }) => {
    const backend = await signIn(page);
    backend.nextOrderId = "order_PWOK";
    backend.orderStatus.order_PWOK = [[200, { status: "PAID", newBalance: 1334 }]];

    await pay(page, lang, 100, "success");

    await expect(page).toHaveURL(new RegExp(`/${lang}/wallet/orders/order_PWOK`));
    const receipt = page.locator("main section[aria-live]").first();
    await expect(receipt.locator("h2")).toHaveClass(/text-success/);
    await expect(receipt).toContainText("₹118.00");
    expect(backend.unmocked).toEqual([]);
  });

  test(`a failed payment shows the failed page and retries the same pack (${lang})`, async ({ page }) => {
    const backend = await signIn(page);
    backend.nextOrderId = "order_PWFAIL";
    backend.orderStatus.order_PWFAIL = [[200, { status: "PENDING" }]];

    await pay(page, lang, 150, "failed");

    await expect(page).toHaveURL(new RegExp(`/${lang}/wallet/orders/order_PWFAIL`));
    const receipt = page.locator("main section[aria-live]").first();
    await expect(receipt.locator("h2")).toHaveClass(/text-danger/);
    // Razorpay's own reason is shown as it came.
    await expect(receipt).toContainText("declined by the bank");

    await receipt.locator('a[href*="/wallet?amount=150"]').click();
    await expect(page).toHaveURL(new RegExp(`/${lang}/wallet\\?amount=150`));
  });
}
