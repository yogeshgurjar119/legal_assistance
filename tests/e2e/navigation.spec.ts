import { test, expect } from "@playwright/test";

test.describe("primary navigation", () => {
  test("home page renders both pillar links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "LexPlain AI", level: 1 })).toBeVisible();
    const primaryNav = page.getByRole("navigation", { name: "Primary" });
    await expect(primaryNav.getByRole("link", { name: "Legal Q&A" })).toBeVisible();
    await expect(primaryNav.getByRole("link", { name: "Analyze Document" })).toBeVisible();
  });

  test("can navigate to the chat page and see the assistant", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Try the Legal Q&A" }).click();
    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByRole("heading", { name: "Legal Q&A" })).toBeVisible();
  });

  test("chat responds using the fallback demo mode (no API key required)", async ({ page }) => {
    await page.goto("/chat");
    await page.getByPlaceholder(/security deposit/i).fill("Can my landlord keep my security deposit?");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByRole("log")).toContainText(/deposit|landlord|demo/i, { timeout: 15000 });
  });

  test("can navigate to the analyze page and see the uploader", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Analyze a document" }).first().click();
    await expect(page).toHaveURL(/\/analyze$/);
    await expect(page.getByRole("heading", { name: "Analyze a Document" })).toBeVisible();
  });

  test("analyzing pasted text with a risky clause shows flagged clauses", async ({ page }) => {
    await page.goto("/analyze");
    await page
      .getByLabel(/paste document text/i)
      .fill(
        "This agreement shall automatically renew for successive one-year terms unless cancelled in writing 30 days before expiry.",
      );
    await page.getByRole("button", { name: /analyze document/i }).click();
    await expect(page.getByText(/Automatic renewal/i)).toBeVisible({ timeout: 15000 });
  });

  test("an unknown URL shows the styled 404 page with a way back home", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await page.getByRole("link", { name: "Back home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("mobile nav toggle opens and closes the menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Primary mobile" })).toBeHidden();
    await page.getByRole("button", { name: /toggle navigation/i }).click();
    const mobileNav = page.getByRole("navigation", { name: "Primary mobile" });
    await expect(mobileNav).toBeVisible();
    await mobileNav.getByRole("link", { name: "Analyze Document" }).click();
    await expect(page).toHaveURL(/\/analyze$/);
  });

  test("sidebar collapse toggle hides link labels but keeps navigation working", async ({ page }) => {
    await page.goto("/");
    const primaryNav = page.getByRole("navigation", { name: "Primary" });
    await expect(primaryNav.getByText("Analyze Document", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /collapse/i }).click();
    await expect(primaryNav.getByText("Analyze Document", { exact: true })).toBeHidden();

    await primaryNav.locator('a[href="/analyze"]').click();
    await expect(page).toHaveURL(/\/analyze$/);
  });

  for (const path of ["/", "/chat", "/analyze"]) {
    test(`shows a copyright footer on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByText(/© \d{4} LexPlain AI\. All rights reserved\./)).toBeVisible();
    });
  }
});
