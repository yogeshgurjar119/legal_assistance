import type { Page } from "@playwright/test";

/** Visits a page to obtain the session cookie before other requests need it. */
export async function ensureSession(page: Page) {
  await page.goto("/");
}
