import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("turso", () => {
  const originalUrl = process.env.TURSO_DATABASE_URL;
  const originalToken = process.env.TURSO_AUTH_TOKEN;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
  });

  afterEach(() => {
    if (originalUrl) process.env.TURSO_DATABASE_URL = originalUrl;
    if (originalToken) process.env.TURSO_AUTH_TOKEN = originalToken;
  });

  it("returns null when TURSO_DATABASE_URL is not configured", async () => {
    const { getTursoClient, isTursoConfigured } = await import("@/lib/turso");
    expect(getTursoClient()).toBeNull();
    expect(isTursoConfigured()).toBe(false);
  });

  it("ensureSchema is a no-op when not configured", async () => {
    const { ensureSchema } = await import("@/lib/turso");
    await expect(ensureSchema()).resolves.toBeUndefined();
  });
});
