"use client";

import { useState } from "react";
import { LEGAL_DISCLAIMER } from "@/seed/legal-corpus";

/** Dismissible banner reusing the single-source-of-truth LEGAL_DISCLAIMER constant. */
export function LegalDisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="note"
      aria-label="Legal disclaimer"
      className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden className="mt-0.5 shrink-0">
        <path
          d="M10 2l8 15H2l8-15zM10 8v3.5M10 14v.01"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="flex-1">{LEGAL_DISCLAIMER.en}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss disclaimer"
        className="shrink-0 rounded-md px-1.5 py-0.5 text-amber-700 transition-colors hover:bg-amber-100"
      >
        ✕
      </button>
    </div>
  );
}
