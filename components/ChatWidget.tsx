"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { SupportedLocale } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** Debug/demo only: the exact prompt sent to the AI provider for this reply. */
  promptDebug?: string;
}

const LOCALES: { value: SupportedLocale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "ar", label: "العربية" },
  { value: "pt", label: "Português" },
];

export function ChatWidget() {
  const inputId = useId();
  const localeId = useId();
  const [locale, setLocale] = useState<SupportedLocale>("en");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Restore locale + prior conversation from the server (keyed by the signed
  // session cookie) instead of localStorage — survives reloads, and can't be
  // read or edited by client JS.
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const sessionRes = await fetch("/api/session");
        if (cancelled) return;

        if (sessionRes.ok) {
          const session = await sessionRes.json();
          if (session.locale) setLocale(session.locale);
        }

        const historyRes = await fetch("/api/chat");
        if (cancelled) return;

        if (historyRes.ok) {
          const history = await historyRes.json();
          const restored: ChatMessage[] = (history.messages ?? []).map(
            (m: { role: "user" | "assistant"; content: string }) => ({
              role: m.role,
              content: m.content,
            }),
          );
          setMessages((prev) => (prev.length > 0 ? prev : restored));
        }
      } catch {
        // Non-fatal — chat still works without restored history/locale.
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  async function handleLocaleChange(next: SupportedLocale) {
    setLocale(next);
    try {
      await fetch("/api/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
    } catch {
      // Non-fatal — the in-request locale still applies even if persisting it fails.
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, locale }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply, promptDebug: data.promptDebug }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor={localeId} className="text-sm text-[var(--muted)]">
          Language
        </label>
        <select
          id={localeId}
          value={locale}
          onChange={(e) => handleLocaleChange(e.target.value as SupportedLocale)}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)]"
        >
          {LOCALES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex h-[420px] flex-col gap-3 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        {isHydrated && messages.length === 0 && (
          <p className="text-sm text-[var(--muted)]">
            Ask about tenant rights, contracts, consumer protection, employment, small claims, or data privacy.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}-${m.content.slice(0, 20)}`} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={
                "inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm " +
                (m.role === "user"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]")
              }
            >
              {m.content}
            </span>
            {m.role === "assistant" && m.promptDebug && (
              <details className="mt-1 text-left">
                <summary className="cursor-pointer text-xs text-[var(--muted)] hover:text-[var(--accent-strong)]">
                  View AI prompt
                </summary>
                <pre className="mt-1 max-w-[85%] whitespace-pre-wrap rounded-md border border-[var(--border)] bg-black/5 p-2 text-xs text-[var(--foreground)]">
                  {m.promptDebug}
                </pre>
              </details>
            )}
          </div>
        ))}
        {isLoading && <p className="text-sm text-[var(--muted)]">Thinking…</p>}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          Message
        </label>
        <input
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Can my landlord keep my security deposit?"
          className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)]"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-md bg-[var(--accent)] px-4 py-2 font-medium text-white transition-colors hover:bg-[var(--accent-strong)] disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
