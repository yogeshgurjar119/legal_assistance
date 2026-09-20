import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/chat", "/analyze"];

async function auditPage(page: import("@playwright/test").Page, path: string) {
  await page.goto(path);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
}

for (const path of PAGES) {
  test(`no critical a11y violations on ${path}`, async ({ page }) => {
    await auditPage(page, path);
  });
}
