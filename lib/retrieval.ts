import { legalSnippets } from "@/seed/legal-corpus";
import type { LegalSnippet, SupportedLocale } from "@/lib/types";

/**
 * Lightweight keyword-overlap retrieval so the assistant works with zero
 * external dependencies. When TURSO_DATABASE_URL is configured, swap this
 * for a proper embedding similarity search without changing the call site.
 */
export function retrieveSnippets(query: string, limit = 3): LegalSnippet[] {
  const normalizedQuery = query.toLowerCase();
  const scored = legalSnippets.map((snippet) => {
    const score = snippet.keywords.reduce(
      (acc, kw) => (normalizedQuery.includes(kw.toLowerCase()) ? acc + 1 : acc),
      0,
    );
    return { snippet, score };
  });

  const matches = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  if (matches.length > 0) {
    return matches.slice(0, limit).map((m) => m.snippet);
  }
  return legalSnippets.slice(0, limit);
}

/** Formats snippets as a CONTEXT block for the chat system prompt, falling back to English when a snippet lacks the requested locale. */
export function buildContextBlock(snippets: LegalSnippet[], locale: SupportedLocale): string {
  return snippets
    .map((snippet) => `- [${snippet.category}] ${snippet.answer[locale] ?? snippet.answer.en}`)
    .join("\n");
}
