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

  // Regression coverage: seed keywords were English-only, so a non-English
  // question about a real, seeded topic scored zero matches and silently
  // fell through to an unrelated default snippet — in the chat route this
  // made the AI wrongly tell a Spanish-speaking user their legitimate legal
  // question "isn't related to legal topics." Fixed by adding translated
  // keyword phrases per seed/legal-corpus.ts. One assertion per supported
  // non-English locale so a future edit can't silently drop one language's
  // coverage without a test failing.
  it("matches a Spanish-language question to the correct topic (not just English)", () => {
    const results = retrieveSnippets("¿Qué es un período de reflexión en un contrato?");
    expect(results.some((s) => s.id === "contract-cooling-off-period")).toBe(true);
  });

  it("matches a French-language question to the correct topic", () => {
    const results = retrieveSnippets("Qu'est-ce qu'un délai de rétractation ?");
    expect(results.some((s) => s.id === "contract-cooling-off-period")).toBe(true);
  });

  it("matches an Arabic-language question to the correct topic", () => {
    const results = retrieveSnippets("ما هي فترة التروي في العقد؟");
    expect(results.some((s) => s.id === "contract-cooling-off-period")).toBe(true);
  });

  it("matches a Portuguese-language question to the correct topic", () => {
    const results = retrieveSnippets("O que é um período de reflexão?");
    expect(results.some((s) => s.id === "contract-cooling-off-period")).toBe(true);
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
