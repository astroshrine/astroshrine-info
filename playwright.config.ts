import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests (e2e/). By default they run against the dev server on :3000, starting it when it isn't
 * running. PLAYWRIGHT_BASE_URL points them at another deployment (a production build, Railway) instead.
 * Signed-in tests never reach the real backend: e2e/support/backend.ts answers every /api/v1 call.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/**
 * Every test browses as a visitor who chose "Continue without login" (src/lib/frontDoor.ts), so opening /hi or /en
 * shows the home page; e2e/front.spec.ts clears it to test the login front door itself.
 */
const LOOKED_AROUND = {
  cookies: [{ name: "AS_FRONT", value: "guest", domain: new URL(baseURL).hostname, path: "/", expires: -1, httpOnly: false, secure: false, sameSite: "Lax" as const }],
  origins: [],
};

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: true,
  // The dev server compiles each route on first visit and has corrupted its manifest under heavy parallel load,
  // so stay at two workers against it. A deployed site (PLAYWRIGHT_BASE_URL) takes more.
  workers: process.env.PLAYWRIGHT_BASE_URL ? 4 : 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    storageState: LOOKED_AROUND,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    // A 393px wide Android phone (Chromium), close to the 390px the site is designed for.
    { name: "phone", use: { ...devices["Pixel 5"] } },
  ],
  // Waits for the port, not an HTTP status: a running dev server that answers 500 for a moment must be reused,
  // not mistaken for a missing one (that would start a second `next dev`, which fails on the busy port).
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : { command: "npm run dev", port: 3000, reuseExistingServer: true, timeout: 180_000 },
});
