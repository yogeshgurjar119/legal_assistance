import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocumentSummary } from "@/components/DocumentSummary";
import type { DocumentAnalysisResult } from "@/lib/types";

describe("DocumentSummary", () => {
  it("renders the AI-generated badge and summary text", () => {
    const result: DocumentAnalysisResult = {
      summary: "This lease renews automatically each year.",
      clauses: [],
      mode: "ai",
    };
    render(<DocumentSummary result={result} />);
    expect(screen.getByText(/ai-generated/i)).toBeInTheDocument();
    expect(screen.getByText(/renews automatically/i)).toBeInTheDocument();
    expect(screen.getByText(/no notable risk patterns/i)).toBeInTheDocument();
  });

  it("renders flagged clauses with severity and excerpt", () => {
    const result: DocumentAnalysisResult = {
      summary: "Summary text.",
      clauses: [
        {
          id: "auto-renewal",
          label: "Automatic renewal",
          severity: "medium",
          explanation: "Renews unless cancelled.",
          excerpt: "…shall automatically renew…",
        },
      ],
      mode: "fallback",
    };
    render(<DocumentSummary result={result} />);
    expect(screen.getByText(/heuristic fallback/i)).toBeInTheDocument();
    expect(screen.getByText("Automatic renewal")).toBeInTheDocument();
    expect(screen.getByText(/renews unless cancelled/i)).toBeInTheDocument();
    expect(screen.getByText(/shall automatically renew/i)).toBeInTheDocument();
  });
});
