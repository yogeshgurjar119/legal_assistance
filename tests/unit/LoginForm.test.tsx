import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { LoginForm } from "@/components/LoginForm";
import { ToastProvider } from "@/components/ToastProvider";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

function renderLoginForm() {
  return render(
    <ToastProvider>
      <LoginForm />
    </ToastProvider>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    pushMock.mockClear();
    refreshMock.mockClear();
  });

  it("submit button is disabled until both fields are filled", () => {
    renderLoginForm();
    const button = screen.getByRole("button", { name: /sign in/i });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "user@example.com" } });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret123" } });
    expect(button).toBeEnabled();
  });

  it("shows a toast and highlights the email field red for a malformed email — no network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    renderLoginForm();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret123" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/valid email/i);
    });
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("aria-invalid", "false");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("highlights both fields and shows a toast for a rejected login (wrong credentials)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "Invalid username or password." }) }),
    );
    renderLoginForm();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrongpass" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid username or password/i);
    });
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a success toast and navigates home on a successful login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, username: "user@example.com" }) }),
    );
    renderLoginForm();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "correct-password" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/signed in successfully/i);
    });
    expect(pushMock).toHaveBeenCalledWith("/");
    expect(refreshMock).toHaveBeenCalled();
  });
});
