import { describe, expect, it } from "vitest";
import { LEGAL_DISCLAIMER, RISK_CLAUSE_PATTERNS, legalSnippets } from "@/seed/legal-corpus";

const LOCALES = ["en", "es", "fr", "ar", "pt"] as const;

describe("legal-corpus seed data", () => {
  it("has between 15 and 20 snippets", () => {
    expect(legalSnippets.length).toBeGreaterThanOrEqual(15);
    expect(legalSnippets.length).toBeLessThanOrEqual(20);
  });

  it("covers all 6 categories", () => {
    const categories = new Set(legalSnippets.map((s) => s.category));
    expect(categories).toEqual(
      new Set([
        "tenant-rights",
        "contract-basics",
        "consumer-protection",
        "employment-basics",
        "small-claims",
        "data-privacy",
      ]),
    );
  });

  it("every snippet has keywords and an answer for all 5 locales", () => {
    for (const snippet of legalSnippets) {
      expect(snippet.keywords.length).toBeGreaterThan(0);
      for (const locale of LOCALES) {
        expect(snippet.answer[locale]).toBeTruthy();
        expect(snippet.answer[locale].length).toBeGreaterThan(20);
      }
    }
  });

  it("every snippet answer ends with the caveat text for its locale", () => {
    for (const snippet of legalSnippets) {
      for (const locale of LOCALES) {
        expect(snippet.answer[locale]).toContain(LEGAL_DISCLAIMER[locale]);
      }
    }
  });

  it("has ids that are unique", () => {
    const ids = legalSnippets.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("LEGAL_DISCLAIMER", () => {
  it("has text for all 5 locales", () => {
    for (const locale of LOCALES) {
      expect(LEGAL_DISCLAIMER[locale].length).toBeGreaterThan(10);
    }
  });
});

describe("RISK_CLAUSE_PATTERNS", () => {
  it("covers the required clause categories", () => {
    const ids = RISK_CLAUSE_PATTERNS.map((p) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "auto-renewal",
        "sole-discretion-termination",
        "indemnification",
        "arbitration",
        "liquidated-damages",
        "broad-liability-waiver",
      ]),
    );
  });
});
