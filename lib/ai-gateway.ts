import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { groq } from "@ai-sdk/groq";
import { generateObject, generateText, type LanguageModel, type ModelMessage } from "ai";
import { z } from "zod";
import type { FlaggedClause } from "@/lib/types";

// Provider priority: Groq (free, no card, fastest to set up) first,
// NVIDIA NIM (free-tier cloud) only used if Groq isn't configured.
// Model catalogs on both providers drift over time (models get retired without
// notice) — these were verified live against the configured keys. If either
// starts failing, re-check GET /v1/models on the relevant provider before
// assuming it's a code bug.
const GROQ_MODEL_ID = "openai/gpt-oss-120b";
const NVIDIA_MODEL_ID = "meta/llama-3.1-nemotron-70b-instruct";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("No AI provider is configured (set GROQ_API_KEY or NVIDIA_API_KEY)");
    this.name = "AiNotConfiguredError";
  }
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY) || Boolean(process.env.NVIDIA_API_KEY);
}

function resolveModel(): LanguageModel {
  if (process.env.GROQ_API_KEY) return groq(GROQ_MODEL_ID);
  if (process.env.NVIDIA_API_KEY) {
    const nvidia = createOpenAICompatible({
      name: "nvidia",
      baseURL: NVIDIA_BASE_URL,
      apiKey: process.env.NVIDIA_API_KEY,
    });
    return nvidia(NVIDIA_MODEL_ID);
  }
  throw new AiNotConfiguredError();
}

// Free-tier providers can be slow on a cold start. Cap the wait well under
// typical serverless function limits so a slow provider fails fast into a
// fallback reply instead of hanging until the host kills the request with
// its own opaque error.
const REQUEST_TIMEOUT_MS = 12_000;

/**
 * Single point of contact for all LLM calls in the app. Keeping every
 * provider call behind this module makes it a one-line swap to another
 * model/provider and a single place to enforce token limits.
 */
export async function generateAssistantReply(params: {
  systemPrompt: string;
  messages: ModelMessage[];
}): Promise<string> {
  const model = resolveModel();

  const { text } = await generateText({
    model,
    system: params.systemPrompt,
    messages: params.messages,
    maxOutputTokens: 500,
    temperature: 0.3,
    abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  return text;
}

const clauseSchema = z.object({
  id: z.string(),
  label: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  explanation: z.string(),
  excerpt: z.string(),
});

const structuredAnalysisSchema = z.object({
  summary: z
    .string()
    .describe("A plain-language, 3-6 sentence summary of what this document means for the reader."),
  clauses: z.array(clauseSchema).describe("Notable or risky clauses found in the document, if any."),
});

export interface StructuredAnalysis {
  summary: string;
  clauses: FlaggedClause[];
}

/**
 * Builds the user-turn prompt for document analysis. Exported (not just
 * inlined below) so callers — namely app/api/analyze/route.ts — can render
 * the exact text sent to the model for on-screen "View AI prompt" transparency,
 * without duplicating the prompt-construction logic.
 */
export function buildAnalysisPrompt(documentText: string, heuristicClauses: FlaggedClause[]): string {
  return [
    "Analyze the following document. Use the heuristic risk flags below as a starting point,",
    "but you may add, refine, or drop clauses based on your own reading of the text.",
    "",
    "HEURISTIC RISK FLAGS (regex-based, may be incomplete or imprecise):",
    JSON.stringify(heuristicClauses),
    "",
    "DOCUMENT TEXT:",
    documentText.slice(0, 12000),
  ].join("\n");
}

/**
 * Uses the Vercel AI SDK's object-generation mode (generateObject) so the
 * model's output is validated against a Zod schema instead of freeform text
 * that would need brittle manual parsing.
 */
export async function generateStructuredAnalysis(params: {
  systemPrompt: string;
  documentText: string;
  heuristicClauses: FlaggedClause[];
}): Promise<StructuredAnalysis> {
  const model = resolveModel();

  const { object } = await generateObject({
    model,
    schema: structuredAnalysisSchema,
    system: params.systemPrompt,
    prompt: buildAnalysisPrompt(params.documentText, params.heuristicClauses),
    maxOutputTokens: 900,
    temperature: 0.2,
    abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  return object;
}
