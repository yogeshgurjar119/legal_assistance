"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

// Deliberately simple — just enough to catch obviously malformed input client-side
// before a network round trip. The server's zod `.email()` check is authoritative.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldError = "email" | "password" | "both" | null;

const inputBase =
  "mt-1 block w-full rounded-md border px-3 py-2 text-sm text-[var(--foreground)] disabled:opacity-50 transition-colors";
const inputValid = "border-[var(--border)] bg-[var(--background)]";
const inputInvalid = "border-red-400 bg-red-50 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-400";

export function LoginForm() {
  const usernameId = useId();
  const passwordId = useId();
  const router = useRouter();
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldError, setFieldError] = useState<FieldError>(null);

  /** Checks the email format client-side first (instant, no network call) before ever hitting the API — the server's zod check stays authoritative either way. */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    setFieldError(null);

    const trimmedUsername = username.trim();
    if (!EMAIL_PATTERN.test(trimmedUsername)) {
      setFieldError("email");
      showToast("Enter a valid email address.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // A 400 here means the server-side email check rejected it (rare,
        // since the client-side regex above already catches most cases);
        // anything else (401/429/503) is a credential/availability problem —
        // highlight both fields since we deliberately don't reveal which one
        // was wrong (see lib/auth.ts's constant-time comparison rationale).
        setFieldError(res.status === 400 ? "email" : "both");
        showToast(data.error ?? "Login failed.", "error");
        return;
      }

      showToast("Signed in successfully.", "success");
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from");
      router.push(from && from.startsWith("/") ? from : "/");
      router.refresh();
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  const emailInvalid = fieldError === "email" || fieldError === "both";
  const passwordInvalid = fieldError === "both";

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor={usernameId} className="text-sm font-medium text-[var(--foreground)]">
          Email
        </label>
        <input
          id={usernameId}
          type="email"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setFieldError(null);
          }}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isLoading}
          aria-invalid={emailInvalid}
          className={`${inputBase} ${emailInvalid ? inputInvalid : inputValid}`}
        />
      </div>
      <div>
        <label htmlFor={passwordId} className="text-sm font-medium text-[var(--foreground)]">
          Password
        </label>
        <input
          id={passwordId}
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldError(null);
          }}
          autoComplete="current-password"
          disabled={isLoading}
          aria-invalid={passwordInvalid}
          className={`${inputBase} ${passwordInvalid ? inputInvalid : inputValid}`}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !username.trim() || !password}
        className="mt-1 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-strong)] disabled:opacity-50"
      >
        {isLoading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
