import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActSearch } from "@/components/ActSearch";

describe("ActSearch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows example query chips before any search", () => {
    render(<ActSearch />);
    expect(screen.getByRole("button", { name: "420" })).toBeInTheDocument();
  });

  it("searches and renders results, including the renumbered BNS section", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              id: "ipc-420",
              oldAct: "IPC",
              oldSection: "420",
              newAct: "BNS",
              newSection: "318(4)",
              title: "Cheating and dishonestly inducing delivery of property",
              keywords: ["cheating"],
              summary: "Covers cheating that dishonestly induces delivery of property.",
              sourceUrl: "https://indiankanoon.org/search/?formInput=test",
            },
          ],
        }),
      }),
    );

    render(<ActSearch />);
    fireEvent.change(screen.getByPlaceholderText(/try/i), { target: { value: "420" } });

    await waitFor(
      () => {
        expect(screen.getByText(/Cheating and dishonestly inducing/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(screen.getByText(/IPC § 420/)).toBeInTheDocument();
    expect(screen.getByText(/BNS § 318\(4\)/)).toBeInTheDocument();
    expect(screen.getByText(/renumbered 2024/i)).toBeInTheDocument();
  });

  it("shows a no-results message for a query that matches nothing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) }));

    render(<ActSearch />);
    fireEvent.change(screen.getByPlaceholderText(/try/i), { target: { value: "zzz-nonexistent" } });

    await waitFor(
      () => {
        expect(screen.getByText(/no matching section/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("clicking an example chip fills the search box", () => {
    render(<ActSearch />);
    fireEvent.click(screen.getByRole("button", { name: "murder" }));
    expect(screen.getByPlaceholderText(/try/i)).toHaveValue("murder");
  });
});
