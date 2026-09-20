import { test, expect } from "@playwright/test";

test.describe("server-persisted chat + preference state", () => {
  test("chat history survives a full page reload", async ({ page }) => {
    await page.goto("/chat");
    await page.getByPlaceholder(/security deposit/i).fill("Can my landlord keep my security deposit?");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByRole("log")).toContainText("Can my landlord keep my security deposit?");

    await page.reload();
    await expect(page.getByRole("log")).toContainText("Can my landlord keep my security deposit?", {
      timeout: 10_000,
    });
  });

  test("language preference survives a full page reload", async ({ page }) => {
    await page.goto("/chat");
    const patchResponse = page.waitForResponse(
      (res) => res.url().includes("/api/session") && res.request().method() === "PATCH",
    );
    await page.getByLabel("Language").selectOption("es");
    await expect(page.getByLabel("Language")).toHaveValue("es");
    await patchResponse;

    await page.reload();
    await expect(page.getByLabel("Language")).toHaveValue("es", { timeout: 10_000 });
  });
});

test.describe("session cookie tampering", () => {
  test("a forged session cookie is rejected and replaced with a fresh, working session", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await context.addCookies([
      {
        name: "la_session",
        value: "forged.payload",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);

    // A forged cookie must not break the app — the middleware detects the
    // invalid signature and issues a fresh anonymous session instead.
    await page.goto("/chat");
    await expect(page.getByRole("heading", { name: "Legal Q&A" })).toBeVisible();

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === "la_session");
    expect(sessionCookie?.value).not.toBe("forged.payload");
  });
});
