import { describe, expect, it, vi } from "vitest";

const FAKE_ERROR = new Error("connection refused");

vi.mock("@/lib/turso", () => ({
  getTursoClient: () => ({
    execute: vi.fn().mockRejectedValue(FAKE_ERROR),
  }),
  ensureSchema: vi.fn().mockResolvedValue(undefined),
}));

describe("session-store (Turso configured but failing)", () => {
  it("getOrCreateSessionRecord rejects instead of silently returning a default", async () => {
    const { getOrCreateSessionRecord } = await import("@/lib/session-store");
    await expect(getOrCreateSessionRecord("some-session")).rejects.toThrow("connection refused");
  });

  it("setSessionLocale rejects instead of silently no-op'ing", async () => {
    const { setSessionLocale } = await import("@/lib/session-store");
    await expect(setSessionLocale("some-session", "es")).rejects.toThrow("connection refused");
  });
});
