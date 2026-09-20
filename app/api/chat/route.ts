import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { AiNotConfiguredError, generateAssistantReply, isAiConfigured } from "@/lib/ai-gateway";
import { appendMessage, listMessages } from "@/lib/chat-store";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildContextBlock, retrieveSnippets } from "@/lib/retrieval";
import { LEGAL_DISCLAIMER } from "@/seed/legal-corpus";
import type { ModelMessage } from "ai";

export const runtime = "nodejs";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  locale: z.enum(["en", "es", "fr", "ar", "pt"]).default("en"),
});

/** Swallows persistence errors so a flaky store never breaks the actual chat reply — history is a nice-to-have, not a hard dependency. */
async function safeAppendMessage(
  sid: string,
  message: Parameters<typeof appendMessage>[1],
): Promise<void> {
  try {
    await appendMessage(sid, message);
  } catch (err) {
    console.error("chat history append failed (non-fatal)", err);
  }
}

/** Bakes the locale + retrieved CONTEXT + disclaimer into one system prompt so every code path (AI success, fallback, error) can render the same text for the "View AI prompt" debug field. */
function systemPromptFor(locale: string, context: string): string {
  return [
    "You are LexPlain AI, a public legal-information assistant. You are NOT a lawyer and must never give personalized legal advice.",
    "Answer only using the CONTEXT below plus general, jurisdiction-agnostic legal knowledge. Be concise (2-5 sentences).",
    `Always reply in locale: ${locale}.`,
    `Always end your reply with this exact caveat: "${LEGAL_DISCLAIMER.en}"`,
    "If the question is unrelated to legal topics, politely redirect to tenant rights, contracts, consumer protection, employment, small claims, or data privacy.",
    "",
    "CONTEXT:",
    context,
  ].join("\n");
}

/** Restores prior turns on page load/reload so the chat log survives a refresh without needing client-side storage. */
export async function GET(req: NextRequest) {
  const sid = req.headers.get("x-session-id");
  if (!sid) return NextResponse.json({ error: "No session." }, { status: 400 });

  try {
    const messages = await listMessages(sid);
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("chat history GET error", err);
    return NextResponse.json({ error: "Failed to load chat history." }, { status: 500 });
  }
}

/** Separated from POST() so the outer try/catch below is the only place that has to think about an unhandled-exception safety net. */
async function handlePost(req: NextRequest): Promise<NextResponse> {
  const sid = req.headers.get("x-session-id");
  if (!sid) return NextResponse.json({ error: "No session." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anonymous";
  const { allowed, remaining } = checkRateLimit(`chat:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { message, locale } = parsed.data;
  const snippets = retrieveSnippets(message);
  const context = buildContextBlock(snippets, locale);

  await safeAppendMessage(sid, { role: "user", content: message, locale });

  if (!isAiConfigured()) {
    const fallback =
      snippets[0]?.answer[locale] ??
      `The assistant is running in demo mode without an AI key configured yet - here is the closest matching legal info. ${LEGAL_DISCLAIMER[locale]}`;
    await safeAppendMessage(sid, { role: "assistant", content: fallback, locale });
    const promptDebug =
      "No AI provider configured (GROQ_API_KEY / NVIDIA_API_KEY) — no prompt was sent. " +
      "This reply is pulled directly from the seeded legal-info corpus (seed/legal-corpus.ts).";
    return NextResponse.json({ reply: fallback, mode: "fallback", remaining, promptDebug });
  }

  const priorMessages = await listMessages(sid).catch((err) => {
    console.error("chat history lookup failed (continuing without it)", err);
    return [];
  });

  const systemPrompt = systemPromptFor(locale, context);

  try {
    const messages: ModelMessage[] = [
      ...priorMessages.slice(-6, -1).map((m) => ({ role: m.role, content: m.content }) as ModelMessage),
      { role: "user", content: message },
    ];

    const reply = await generateAssistantReply({ systemPrompt, messages });
    await safeAppendMessage(sid, { role: "assistant", content: reply, locale });
    const promptDebug = `SYSTEM PROMPT:\n${systemPrompt}\n\nUSER MESSAGE:\n${message}`;
    return NextResponse.json({ reply, mode: "ai", remaining, promptDebug });
  } catch (err) {
    if (!(err instanceof AiNotConfiguredError)) {
      console.error("chat route: AI provider call failed, falling back", err);
    }
    const fallback =
      snippets[0]?.answer[locale] ??
      `The assistant is temporarily unavailable - here is the closest matching legal info. ${LEGAL_DISCLAIMER[locale]}`;
    await safeAppendMessage(sid, { role: "assistant", content: fallback, locale });
    const promptDebug = `AI call failed or timed out — falling back to the seeded corpus answer. Attempted prompt was:\nSYSTEM PROMPT:\n${systemPrompt}\n\nUSER MESSAGE:\n${message}`;
    return NextResponse.json({ reply: fallback, mode: "fallback", remaining, promptDebug });
  }
}

/** Outer safety net: guarantees a JSON error response instead of a raw framework 500 if handlePost throws something unexpected. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    return await handlePost(req);
  } catch (err) {
    console.error("chat route: unhandled error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
