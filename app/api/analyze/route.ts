import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { buildAnalysisPrompt, generateStructuredAnalysis, isAiConfigured } from "@/lib/ai-gateway";
import { appendAnalysis, listAnalyses } from "@/lib/document-store";
import {
  DocumentParseError,
  FileTooLargeError,
  UnsupportedFileError,
  applyRiskPatterns,
  parsePdfBuffer,
  parsePlainText,
  validateUpload,
} from "@/lib/document-parser";
import { checkRateLimit } from "@/lib/rate-limit";
import { LEGAL_DISCLAIMER } from "@/seed/legal-corpus";
import type { AnalysisMode, DocumentAnalysisResult, FlaggedClause } from "@/lib/types";

export const runtime = "nodejs";

const pasteSchema = z.object({
  text: z.string().trim().min(1),
});

/** Kept separate from lib/ai-gateway.ts's chat prompt since document analysis needs different instructions (summarize + flag clauses, not answer a question). */
function systemPrompt(): string {
  return [
    "You are LexPlain AI, a public legal-document explainer. You are NOT a lawyer and must never give personalized legal advice.",
    "Summarize the document in plain, non-legal language a layperson can understand.",
    "Identify any clauses that could be risky or worth extra attention for the person signing this document.",
    "End the summary with this exact caveat: \"" + LEGAL_DISCLAIMER.en + "\"",
  ].join(" ");
}

/** Swallows persistence errors — analysis history is a nice-to-have, not something that should block returning the actual result to the user. */
async function safeAppendAnalysis(
  sid: string,
  analysis: { sourceName: string; summary: string; clauses: FlaggedClause[]; mode: AnalysisMode },
): Promise<void> {
  try {
    await appendAnalysis(sid, analysis);
  } catch (err) {
    console.error("analysis history append failed (non-fatal)", err);
  }
}

/** Translates the parser's typed errors into stable `code` values the client (DocumentUpload.tsx) matches on to show a specific message, instead of one generic failure. */
function mapParseErrorToResponse(err: unknown): NextResponse | null {
  if (err instanceof UnsupportedFileError) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload a PDF or plain text (.txt) file.", code: "unsupported_file_type" },
      { status: 400 },
    );
  }
  if (err instanceof FileTooLargeError) {
    return NextResponse.json(
      { error: "File is too large. The maximum size is 5MB.", code: "file_too_large" },
      { status: 400 },
    );
  }
  if (err instanceof DocumentParseError) {
    if (err.reason === "text_too_short") {
      return NextResponse.json(
        { error: "The text is too short to analyze meaningfully. Paste at least a few sentences.", code: "text_too_short" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: err.message, code: "empty_or_unreadable" },
      { status: 400 },
    );
  }
  return null;
}

/** Handles both a file upload (multipart) and pasted text (JSON) through one endpoint, since the client offers both as equivalent input methods. */
async function handlePost(req: NextRequest): Promise<NextResponse> {
  const sid = req.headers.get("x-session-id");
  if (!sid) return NextResponse.json({ error: "No session." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anonymous";
  const { allowed } = checkRateLimit("analyze:" + ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let documentText: string;
  let sourceName: string;

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided.", code: "unsupported_file_type" }, { status: 400 });
      }

      validateUpload(file.type, file.size);
      const buffer = Buffer.from(await file.arrayBuffer());
      documentText = file.type === "application/pdf" ? await parsePdfBuffer(buffer) : parsePlainText(buffer);
      sourceName = file.name || "uploaded-document";
    } else {
      const body = await req.json().catch(() => null);
      const parsed = pasteSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
      }
      documentText = parsePlainText(Buffer.from(parsed.data.text, "utf-8"));
      sourceName = "pasted-text";
    }
  } catch (err) {
    const mapped = mapParseErrorToResponse(err);
    if (mapped) return mapped;
    console.error("analyze route: unexpected parse error", err);
    return NextResponse.json({ error: "Could not read the document.", code: "empty_or_unreadable" }, { status: 400 });
  }

  const heuristicClauses = applyRiskPatterns(documentText);

  if (!isAiConfigured()) {
    const fallbackSummary = "This is a heuristic-only summary (no AI key configured): the document is " + documentText.length + " characters long, and " + heuristicClauses.length + " potentially notable clause pattern(s) were detected below. " + LEGAL_DISCLAIMER.en;
    const result: DocumentAnalysisResult = { summary: fallbackSummary, clauses: heuristicClauses, mode: "fallback" };
    await safeAppendAnalysis(sid, { sourceName, ...result });
    const promptDebug =
      "No AI provider configured (GROQ_API_KEY / NVIDIA_API_KEY) — no prompt was sent. " +
      "This summary is generated entirely by the regex-based risk-clause heuristics below.";
    return NextResponse.json({ ...result, promptDebug });
  }

  const analysisSystemPrompt = systemPrompt();

  try {
    const structured = await generateStructuredAnalysis({
      systemPrompt: analysisSystemPrompt,
      documentText,
      heuristicClauses,
    });
    const result: DocumentAnalysisResult = { summary: structured.summary, clauses: structured.clauses, mode: "ai" };
    await safeAppendAnalysis(sid, { sourceName, ...result });
    const promptDebug = `SYSTEM PROMPT:\n${analysisSystemPrompt}\n\nUSER PROMPT:\n${buildAnalysisPrompt(documentText, heuristicClauses)}`;
    return NextResponse.json({ ...result, promptDebug });
  } catch (err) {
    console.error("analyze route: AI provider call failed, falling back", err);
    const fallbackSummary = "AI analysis is temporarily unavailable, so here is a heuristic-only summary: the document is " + documentText.length + " characters long, and " + heuristicClauses.length + " potentially notable clause pattern(s) were detected below. " + LEGAL_DISCLAIMER.en;
    const result: DocumentAnalysisResult = { summary: fallbackSummary, clauses: heuristicClauses, mode: "fallback" };
    await safeAppendAnalysis(sid, { sourceName, ...result });
    const promptDebug = `AI call failed or timed out — falling back to heuristic-only summary. Attempted prompt was:\nSYSTEM PROMPT:\n${analysisSystemPrompt}\n\nUSER PROMPT:\n${buildAnalysisPrompt(documentText, heuristicClauses)}`;
    return NextResponse.json({ ...result, promptDebug });
  }
}

/** Outer safety net: guarantees a JSON error response instead of a raw framework 500 if handlePost throws something unexpected. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    return await handlePost(req);
  } catch (err) {
    console.error("analyze route: unhandled error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

/** Lets the UI show a "recent analyses" list if that's ever wired up — currently unused by the client but kept symmetric with the chat history GET. */
export async function GET(req: NextRequest) {
  const sid = req.headers.get("x-session-id");
  if (!sid) return NextResponse.json({ error: "No session." }, { status: 400 });

  try {
    const analyses = await listAnalyses(sid);
    return NextResponse.json({ analyses });
  } catch (err) {
    console.error("analyze history GET error", err);
    return NextResponse.json({ error: "Failed to load analysis history." }, { status: 500 });
  }
}
