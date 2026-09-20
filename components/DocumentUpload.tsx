"use client";

import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { DocumentSummary } from "@/components/DocumentSummary";
import type { DocumentAnalysisResult } from "@/lib/types";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "text/plain"];

export function DocumentUpload() {
  const textareaId = useId();
  const fileId = useId();
  const [pastedText, setPastedText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentAnalysisResult | null>(null);

  /** Validates type/size client-side before the file ever leaves the browser — mirrors the server's own check so the error shows instantly, with no network round trip. */
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setError(null);
    setResult(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Unsupported file type. Upload a PDF or plain text (.txt) file.");
      setFile(null);
      e.target.value = "";
      return;
    }
    if (selected.size > MAX_UPLOAD_BYTES) {
      setError("File is too large. The maximum size is 5MB.");
      setFile(null);
      e.target.value = "";
      return;
    }

    setFile(selected);
  }

  /** Sends a file as multipart form data or pasted text as JSON — the API route branches on Content-Type to accept either input method through one endpoint. */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    if (!file && pastedText.trim().length === 0) {
      setError("Upload a file or paste some text to analyze.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let res: Response;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        res = await fetch("/api/analyze", { method: "POST", body: formData });
      } else {
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: pastedText.trim() }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");

      setResult(data as DocumentAnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  const canSubmit = !isLoading && (Boolean(file) || pastedText.trim().length > 0);

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor={fileId} className="text-sm font-medium text-[var(--foreground)]">
            Upload a document (PDF or .txt, max 5MB)
          </label>
          <input
            id={fileId}
            type="file"
            accept="application/pdf,text/plain"
            onChange={handleFileChange}
            disabled={isLoading}
            className="mt-1 block w-full text-sm text-[var(--foreground)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-[var(--accent-strong)]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" />
          or
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <div>
          <label htmlFor={textareaId} className="text-sm font-medium text-[var(--foreground)]">
            Paste document text
          </label>
          <textarea
            id={textareaId}
            value={pastedText}
            onChange={(e) => {
              setPastedText(e.target.value);
              setError(null);
            }}
            disabled={isLoading || Boolean(file)}
            rows={8}
            placeholder="Paste a lease, contract, or terms-of-service clause here…"
            className="mt-1 block w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] disabled:opacity-50"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="self-start rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-strong)] disabled:opacity-50"
        >
          {isLoading ? "Analyzing…" : "Analyze document"}
        </button>
      </form>

      {result && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
          <DocumentSummary result={result} />
        </div>
      )}
    </div>
  );
}
