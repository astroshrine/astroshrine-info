import { expect, type Page } from "@playwright/test";

/**
 * Hindi (Devanagari) text on the page, outside elements marked lang="hi": the page title and description,
 * visible and screen-reader text, and aria-label, alt, title and placeholder attributes. Hindi content that
 * belongs on an English page (blog articles, the switch to हिंदी) carries lang="hi" and is skipped.
 */
export function hindiText(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const devanagari = /[ऀ-ॿ]/;
    const found = new Set<string>();
    if (devanagari.test(document.title)) found.add(`<title> ${document.title}`);
    const description = document.querySelector('meta[name="description"]')?.getAttribute("content");
    if (description && devanagari.test(description)) found.add(`<meta description> ${description.slice(0, 100)}`);

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim() ?? "";
      const parent = node.parentElement;
      if (!text || !devanagari.test(text) || !parent || parent.closest('[lang="hi"], script, style, noscript, template')) continue;
      found.add(text.slice(0, 100));
    }
    for (const element of document.querySelectorAll("[aria-label], [alt], [title], [placeholder]")) {
      if (element.closest('[lang="hi"]')) continue;
      for (const name of ["aria-label", "alt", "title", "placeholder"]) {
        const value = element.getAttribute(name);
        if (value && devanagari.test(value)) found.add(`${name}="${value.slice(0, 100)}"`);
      }
    }
    return [...found];
  });
}

/**
 * Waits until the page shows its real content: no loading regions (aria-busy) or pulsing skeleton blocks left in
 * main (some skeletons are aria-hidden, so both are checked), and then the text stops changing for half a
 * second (client data arriving, reveal animations).
 */
export async function settle(page: Page) {
  await page.waitForLoadState("load");
  await expect(page.locator('main [aria-busy="true"], main .animate-pulse')).toHaveCount(0, { timeout: 30_000 });
  let previous = "";
  for (let i = 0; i < 20; i++) {
    const current = await page.evaluate(() => `${document.body.innerText.length}:${document.body.getElementsByTagName("*").length}`);
    if (current === previous) return;
    previous = current;
    await page.waitForTimeout(500);
  }
}
