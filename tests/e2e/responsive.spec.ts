import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "small mobile", width: 320, height: 700 },
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
  { name: "ultrawide", width: 1920, height: 1000 },
];

const PAGES = ["/", "/chat", "/analyze"];

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, `page is ${scrollWidth}px wide but viewport is ${innerWidth}px`).toBeLessThanOrEqual(
    innerWidth,
  );
}

for (const viewport of VIEWPORTS) {
  test.describe(`responsive layout at ${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const path of PAGES) {
      test(`no horizontal overflow on ${path}`, async ({ page }) => {
        await page.goto(path);
        await assertNoHorizontalOverflow(page);
      });
    }
  });
}

test.describe("mobile nav collapses correctly", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("desktop nav is hidden and hamburger toggle is visible below the sm breakpoint", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
    await expect(page.getByRole("button", { name: /toggle navigation/i })).toBeVisible();
  });
});

test.describe("desktop nav shows full links without collapsing", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("all primary nav links are visible without a hamburger toggle", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /toggle navigation/i })).toBeHidden();
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const label of ["Legal Q&A", "Analyze Document"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
  });
});
