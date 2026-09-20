import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ChatWidget } from "@/components/ChatWidget";

function buildMockFetch() {
  return vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (url === "/api/session" && (!init || init.method === undefined)) {
      return Promise.resolve({ ok: true, json: async () => ({ locale: "en" }) });
    }
    if (url === "/api/chat" && (!init || init.method === undefined)) {
      return Promise.resolve({ ok: true, json: async () => ({ messages: [] }) });
    }
    if (url === "/api/chat" && init?.method === "POST") {
      return Promise.resolve({
        ok: true,
        json: async () => ({ reply: "A landlord generally cannot keep the entire deposit.", mode: "fallback" }),
      });
    }
    if (url === "/api/session" && init?.method === "PATCH") {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

describe("ChatWidget", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", buildMockFetch());
  });

  it("renders the language selector and input after hydration", async () => {
    await act(async () => {
      render(<ChatWidget />);
    });
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/security deposit/i)).toBeInTheDocument();
  });

  it("send button is disabled when input is empty", async () => {
    await act(async () => {
      render(<ChatWidget />);
    });
    const button = screen.getByRole("button", { name: /send/i });
    expect(button).toBeDisabled();
  });

  it("restores prior history and locale from the server on mount", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url === "/api/session" && !init?.method) {
          return Promise.resolve({ ok: true, json: async () => ({ locale: "es" }) });
        }
        if (url === "/api/chat" && !init?.method) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              messages: [
                { role: "user", content: "Hola" },
                { role: "assistant", content: "Hola de vuelta" },
              ],
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }),
    );

    await act(async () => {
      render(<ChatWidget />);
    });

    await waitFor(() => {
      expect(screen.getByText("Hola de vuelta")).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/language/i)).toHaveValue("es");
  });

  it("sends a message and displays the assistant reply", async () => {
    await act(async () => {
      render(<ChatWidget />);
    });

    const input = screen.getByPlaceholderText(/security deposit/i);
    fireEvent.change(input, { target: { value: "Can my landlord keep my deposit?" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/cannot keep the entire deposit/i)).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith("/api/chat", expect.objectContaining({ method: "POST" }));
  });

  it("shows an error message when the chat POST fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url === "/api/session" && !init?.method) {
          return Promise.resolve({ ok: true, json: async () => ({ locale: "en" }) });
        }
        if (url === "/api/chat" && !init?.method) {
          return Promise.resolve({ ok: true, json: async () => ({ messages: [] }) });
        }
        if (url === "/api/chat" && init?.method === "POST") {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: "Rate limit exceeded. Try again in a minute." }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }),
    );

    await act(async () => {
      render(<ChatWidget />);
    });

    const input = screen.getByPlaceholderText(/security deposit/i);
    fireEvent.change(input, { target: { value: "hello" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/rate limit/i);
  });
});
