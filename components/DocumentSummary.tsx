import type { DocumentAnalysisResult } from "@/lib/types";

const SEVERITY_STYLES: Record<string, string> = {
  low: "border-slate-300 bg-slate-50 text-slate-800",
  medium: "border-amber-300 bg-amber-50 text-amber-900",
  high: "border-red-300 bg-red-50 text-red-900",
};

export function DocumentSummary({ result }: { result: DocumentAnalysisResult }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Summary</h2>
        <span
          className={
            "rounded-full px-2.5 py-0.5 text-xs font-medium " +
            (result.mode === "ai"
              ? "bg-[var(--accent)]/10 text-[var(--accent-strong)]"
              : "bg-slate-200 text-slate-700")
          }
        >
          {result.mode === "ai" ? "AI-generated" : "Heuristic fallback"}
        </span>
      </div>
      <p className="whitespace-pre-line text-sm text-[var(--foreground)]">{result.summary}</p>

      {result.promptDebug && (
        <details>
          <summary className="cursor-pointer text-xs text-[var(--muted)] hover:text-[var(--accent-strong)]">
            View AI prompt
          </summary>
          <pre className="mt-1 whitespace-pre-wrap rounded-md border border-[var(--border)] bg-black/5 p-2 text-xs text-[var(--foreground)]">
            {result.promptDebug}
          </pre>
        </details>
      )}

      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Flagged clauses {result.clauses.length > 0 ? `(${result.clauses.length})` : ""}
        </h3>
        {result.clauses.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">No notable risk patterns were detected.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {result.clauses.map((clause) => (
              <li
                key={clause.id}
                className={`rounded-lg border p-3 text-sm ${SEVERITY_STYLES[clause.severity] ?? SEVERITY_STYLES.low}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{clause.label}</span>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs uppercase tracking-wide">
                    {clause.severity}
                  </span>
                </div>
                <p className="mt-1">{clause.explanation}</p>
                {clause.excerpt && (
                  <p className="mt-2 rounded-md bg-black/5 p-2 font-mono text-xs italic">{clause.excerpt}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
