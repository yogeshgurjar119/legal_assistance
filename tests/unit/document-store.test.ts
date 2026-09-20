import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/turso", () => ({
  getTursoClient: () => null,
  ensureSchema: vi.fn().mockResolvedValue(undefined),
}));

describe("document-store (in-memory fallback)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns an empty list for a session with no history", async () => {
    const { listAnalyses } = await import("@/lib/document-store");
    const analyses = await listAnalyses(`sid-${Math.random()}`);
    expect(analyses).toEqual([]);
  });

  it("appends and lists analyses, most recent first", async () => {
    const { appendAnalysis, listAnalyses } = await import("@/lib/document-store");
    const sid = `sid-${Math.random()}`;
    await appendAnalysis(sid, { sourceName: "lease1.pdf", summary: "first", clauses: [], mode: "fallback" });
    await appendAnalysis(sid, { sourceName: "lease2.pdf", summary: "second", clauses: [], mode: "ai" });
    const analyses = await listAnalyses(sid);
    expect(analyses).toHaveLength(2);
    expect(analyses[0]?.sourceName).toBe("lease2.pdf");
    expect(analyses[1]?.sourceName).toBe("lease1.pdf");
  });
});
