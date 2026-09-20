import { RISK_CLAUSE_PATTERNS } from "@/seed/legal-corpus";
import type { FlaggedClause } from "@/lib/types";

export const ALLOWED_MIME_TYPES = ["application/pdf", "text/plain"] as const;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
export const MIN_TEXT_LENGTH = 40;

export class UnsupportedFileError extends Error {
  constructor(mimeType: string) {
    super(`Unsupported file type: ${mimeType}`);
    this.name = "UnsupportedFileError";
  }
}

export class FileTooLargeError extends Error {
  constructor(size: number) {
    super(`File is too large: ${size} bytes (max ${MAX_UPLOAD_BYTES})`);
    this.name = "FileTooLargeError";
  }
}

export class DocumentParseError extends Error {
  reason: "corrupt_pdf" | "no_extractable_text" | "text_too_short";
  constructor(reason: DocumentParseError["reason"], message: string) {
    super(message);
    this.name = "DocumentParseError";
    this.reason = reason;
  }
}

/** Validates MIME type + size before any parsing is attempted. */
export function validateUpload(mimeType: string, size: number): void {
  if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new UnsupportedFileError(mimeType);
  }
  if (size > MAX_UPLOAD_BYTES) {
    throw new FileTooLargeError(size);
  }
}

/** Parses a plain-text buffer, trimming and validating a minimum length. */
export function parsePlainText(buffer: Buffer): string {
  const text = buffer.toString("utf-8").trim();
  if (text.length === 0) {
    throw new DocumentParseError("no_extractable_text", "The pasted/uploaded text has no content.");
  }
  if (text.length < MIN_TEXT_LENGTH) {
    throw new DocumentParseError(
      "text_too_short",
      `Text is too short to analyze meaningfully (minimum ${MIN_TEXT_LENGTH} characters).`,
    );
  }
  return text;
}

/**
 * Extracts text from a PDF buffer using `unpdf` (a maintained wrapper around
 * Mozilla's pdfjs-dist, pure JS text extraction — no native dependencies, so
 * it's safe to run in a serverless function). Previously used `pdf-parse`,
 * but that package bundles a years-old, unmaintained copy of pdf.js that
 * fails with "bad XRef entry" on PDFs from common writers (confirmed against
 * pdfkit-generated output) — i.e. the real PDF-upload path was silently
 * broken. unpdf verified working against the same fixtures.
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  let text: string;
  try {
    const { extractText } = await import("unpdf");
    const result = await extractText(new Uint8Array(buffer), { mergePages: true });
    text = (Array.isArray(result.text) ? result.text.join("\n") : result.text).trim();
  } catch (err) {
    throw new DocumentParseError(
      "corrupt_pdf",
      `Could not read this PDF — it may be corrupted or password-protected. (${
        err instanceof Error ? err.message : "unknown error"
      })`,
    );
  }

  if (text.length === 0) {
    throw new DocumentParseError(
      "no_extractable_text",
      "No extractable text was found in this PDF (it may be a scanned image without a text layer).",
    );
  }
  if (text.length < MIN_TEXT_LENGTH) {
    throw new DocumentParseError(
      "text_too_short",
      `Extracted text is too short to analyze meaningfully (minimum ${MIN_TEXT_LENGTH} characters).`,
    );
  }
  return text;
}

/**
 * Deterministic, regex-based clause risk flagging. Works with zero AI key —
 * mirrors the app-wide principle that every feature has a working non-AI
 * path. Returns one flagged clause per matching pattern, with a short
 * excerpt of the surrounding text for context.
 */
export function applyRiskPatterns(text: string): FlaggedClause[] {
  const flagged: FlaggedClause[] = [];

  for (const risk of RISK_CLAUSE_PATTERNS) {
    const match = text.match(risk.pattern);
    if (!match || match.index === undefined) continue;

    const start = Math.max(0, match.index - 60);
    const end = Math.min(text.length, match.index + match[0].length + 60);
    const excerpt = `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;

    flagged.push({
      id: risk.id,
      label: risk.label,
      severity: risk.severity,
      explanation: risk.explanation,
      excerpt,
    });
  }

  return flagged;
}
