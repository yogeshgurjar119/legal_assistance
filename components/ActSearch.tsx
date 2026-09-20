"use client";

import { useEffect, useId, useState } from "react";
import type { ActSection } from "@/lib/types";

const EXAMPLE_QUERIES = ["420", "397", "murder", "FIR", "anticipatory bail"];

export function ActSearch() {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ActSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    // Nothing to derive here from an empty query — that's handled directly
    // in the input's onChange handler instead of here, so this effect only
    // ever does one thing: synchronize with the external search endpoint.
    if (!trimmed) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      setIsLoading(true);
      fetch(`/api/act-search?q=${encodeURIComponent(trimmed)}`)
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .then((data) => {
          if (cancelled) return;
          setResults(data.results ?? []);
          setHasSearched(true);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <section aria-labelledby="act-search-heading" className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6">
      <div className="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="text-[var(--accent)]">
          <path
            d="M10 2v16M10 2l-5.5 2.75M10 2l5.5 2.75M3.2 6.5l1.75 4.5a2.15 2.15 0 004 0L10.7 6.5M18.05 6.5l-1.75 4.5a2.15 2.15 0 01-4 0L10.7 6.5M4.5 18h11"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <h2 id="act-search-heading" className="text-lg font-semibold text-[var(--foreground)]">
          Act &amp; Section Reference
        </h2>
        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">Curated index</span>
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Look up well-known Indian Penal Code / CrPC sections by number, act, or keyword — includes the
        renumbered Bharatiya Nyaya Sanhita (BNS) / Bharatiya Nagarik Suraksha Sanhita (BNSS) section where
        applicable. This is a curated reference, not a live database or legal advice — always verify exact
        statutory text via the linked source.
      </p>

      <div className="mt-4">
        <label htmlFor={inputId} className="sr-only">
          Search by section number, act, or keyword
        </label>
        <div className="relative">
          <input
            id={inputId}
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              if (!value.trim()) {
                setResults([]);
                setHasSearched(false);
              }
            }}
            placeholder="Try “420”, “397”, “murder”, or “anticipatory bail”…"
            className="block w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2.5 pl-4 pr-10 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
          />
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          >
            <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M14 14l4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
        {!hasSearched && (
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setQuery(ex)}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent-strong)]"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && <p className="mt-4 text-sm text-[var(--muted)]">Searching…</p>}

      {!isLoading && hasSearched && results.length === 0 && (
        <p className="mt-4 text-sm text-[var(--muted)]">
          No matching section found in this reference index — try a different number or keyword.
        </p>
      )}

      {!isLoading && results.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {results.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-[var(--border)] p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--accent-strong)]">
                  {entry.oldAct} § {entry.oldSection}
                </span>
                {entry.newAct && entry.newSection && (
                  <>
                    <span className="text-[var(--muted)]" aria-hidden>
                      →
                    </span>
                    <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {entry.newAct} § {entry.newSection}
                    </span>
                    <span className="text-xs text-[var(--muted)]">(renumbered 2024)</span>
                  </>
                )}
              </div>
              <p className="mt-2 font-medium text-[var(--foreground)]">{entry.title}</p>
              <p className="mt-1 text-[var(--muted)]">{entry.summary}</p>
              <a
                href={entry.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                Look up full text →
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
