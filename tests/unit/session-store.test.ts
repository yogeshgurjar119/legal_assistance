import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/turso", () => ({
  getTursoClient: () => null,
  ensureSchema: vi.fn().mockResolvedValue(undefined),
}));

describe("session-store (in-memory fallback)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates a default en-locale record for a new sid", async () => {
    const { getOrCreateSessionRecord } = await import("@/lib/session-store");
    const record = await getOrCreateSessionRecord(`sid-${Math.random()}`);
    expect(record).toEqual({ locale: "en" });
  });

  it("persists a locale change and returns it on subsequent reads", async () => {
    const { getOrCreateSessionRecord, setSessionLocale } = await import("@/lib/session-store");
    const sid = `sid-${Math.random()}`;
    await getOrCreateSessionRecord(sid);
    await setSessionLocale(sid, "fr");
    const record = await getOrCreateSessionRecord(sid);
    expect(record.locale).toBe("fr");
  });
});
