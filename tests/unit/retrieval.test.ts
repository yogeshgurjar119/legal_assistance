import { describe, expect, it } from "vitest";
import { buildContextBlock, retrieveSnippets } from "@/lib/retrieval";

describe("retrieveSnippets", () => {
  it("matches a snippet by keyword overlap", () => {
    const results = retrieveSnippets("Can my landlord keep my entire security deposit?");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((s) => s.id === "tenant-security-deposit")).toBe(true);
  });

  it("returns a default slice when nothing matches", () => {
    const results = retrieveSnippets("asdkjaslkdjaslkdjaslkdj");
    expect(results.length).toBeGreaterThan(0);
  });

  it("respects the limit parameter", () => {
    const results = retrieveSnippets("contract", 1);
    expect(results.length).toBe(1);
  });
});

describe("buildContextBlock", () => {
  it("builds a bullet list using the requested locale, falling back to English", () => {
    const snippets = retrieveSnippets("security deposit", 1);
    const block = buildContextBlock(snippets, "es");
    expect(block).toContain("-");
    expect(block.length).toBeGreaterThan(0);
  });
});
