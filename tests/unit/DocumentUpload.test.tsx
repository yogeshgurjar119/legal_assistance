import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { DocumentUpload } from "@/components/DocumentUpload";

describe("DocumentUpload", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submit button is disabled with no file and no pasted text", () => {
    render(<DocumentUpload />);
    expect(screen.getByRole("button", { name: /analyze document/i })).toBeDisabled();
  });

  it("enables submit once text is pasted, and shows the result on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          summary: "This is a plain-language summary.",
          clauses: [],
          mode: "fallback",
        }),
      }),
    );

    render(<DocumentUpload />);
    const textarea = screen.getByLabelText(/paste document text/i);
    fireEvent.change(textarea, { target: { value: "This agreement shall automatically renew each year." } });

    const button = screen.getByRole("button", { name: /analyze document/i });
    expect(button).toBeEnabled();

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText(/plain-language summary/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Heuristic fallback/i)).toBeInTheDocument();
  });

  it("shows an error message when the analyze request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "The text is too short to analyze meaningfully.", code: "text_too_short" }),
      }),
    );

    render(<DocumentUpload />);
    const textarea = screen.getByLabelText(/paste document text/i);
    fireEvent.change(textarea, { target: { value: "short text but not empty" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /analyze document/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/too short/i);
    });
  });

  it("rejects an unsupported file type on the client before submitting", () => {
    render(<DocumentUpload />);
    const fileInput = screen.getByLabelText(/upload a document/i) as HTMLInputElement;
    const badFile = new File(["fake"], "photo.jpg", { type: "image/jpeg" });

    fireEvent.change(fileInput, { target: { files: [badFile] } });

    expect(screen.getByRole("alert")).toHaveTextContent(/unsupported file type/i);
  });
});
