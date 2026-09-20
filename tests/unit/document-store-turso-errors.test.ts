import { describe, expect, it, vi } from "vitest";

const FAKE_ERROR = new Error("connection refused");

vi.mock("@/lib/turso", () => ({
  getTursoClient: () => ({
    execute: vi.fn().mockRejectedValue(FAKE_ERROR),
  }),
  ensureSchema: vi.fn().mockResolvedValue(undefined),
}));

describe("document-store (Turso configured but failing)", () => {
  it("listAnalyses rejects instead of silently returning an empty list", async () => {
    const { listAnalyses } = await import("@/lib/document-store");
    await expect(listAnalyses("some-session")).rejects.toThrow("connection refused");
  });

  it("appendAnalysis rejects instead of silently dropping the analysis", async () => {
    const { appendAnalysis } = await import("@/lib/document-store");
    await expect(
      appendAnalysis("some-session", { sourceName: "lease.pdf", summary: "x", clauses: [], mode: "fallback" }),
    ).rejects.toThrow("connection refused");
  });
});
