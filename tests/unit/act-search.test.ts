import { describe, expect, it } from "vitest";
import { searchActSections } from "@/lib/act-search";

describe("searchActSections", () => {
  it("returns an empty array for an empty query", () => {
    expect(searchActSections("")).toEqual([]);
    expect(searchActSections("   ")).toEqual([]);
  });

  it("finds an exact old-section-number match", () => {
    const results = searchActSections("420");
    expect(results.some((r) => r.id === "ipc-420")).toBe(true);
  });

  it("finds an exact new-section-number match (BNS numbering)", () => {
    const results = searchActSections("103");
    expect(results.some((r) => r.id === "ipc-302")).toBe(true);
  });

  it("supports multi-token free text like the user's own example ('397 248')", () => {
    const results = searchActSections("397 248");
    expect(results.some((r) => r.id === "ipc-397")).toBe(true);
    expect(results.some((r) => r.id === "crpc-248")).toBe(true);
  });

  it("matches by act name (case-insensitive)", () => {
    const results = searchActSections("ipc");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.oldAct === "IPC")).toBe(true);
  });

  it("matches by keyword", () => {
    const results = searchActSections("anticipatory bail");
    expect(results.some((r) => r.id === "crpc-438")).toBe(true);
  });

  it("matches by a word from the title", () => {
    const results = searchActSections("murder");
    expect(results.some((r) => r.id === "ipc-302")).toBe(true);
  });

  it("returns nothing for a query that matches no section", () => {
    expect(searchActSections("zzz-nonexistent-zzz")).toEqual([]);
  });

  it("ranks exact section-number matches ahead of keyword-only matches", () => {
    // "379" is an exact section number (theft); make sure it's not buried
    // beneath partial/keyword matches if any exist.
    const results = searchActSections("379");
    expect(results[0]?.id).toBe("ipc-379");
  });
});
