import { ACT_SECTIONS } from "@/seed/act-sections";
import type { ActSection } from "@/lib/types";

/**
 * Searches the static Act/Section reference index (seed/act-sections.ts) by
 * section number (old or new), act name, title words, or keyword. Free-text
 * queries are tokenized on whitespace/commas so "397 248" or "IPC 420" both
 * work — a token matches if it equals a section number exactly, or appears
 * as a substring of the act name, title, or a keyword.
 */
export function searchActSections(query: string): ActSection[] {
  const tokens = query
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length === 0) return [];

  const matched = ACT_SECTIONS.filter((entry) => {
    const oldSectionNorm = entry.oldSection.toLowerCase();
    const newSectionNorm = entry.newSection?.toLowerCase() ?? "";
    const actsNorm = [entry.oldAct.toLowerCase(), entry.newAct?.toLowerCase() ?? ""];
    const titleNorm = entry.title.toLowerCase();
    const keywordsNorm = entry.keywords.map((k) => k.toLowerCase());

    return tokens.some((token) => {
      if (oldSectionNorm.includes(token) || newSectionNorm.includes(token)) return true;
      if (actsNorm.some((a) => a === token)) return true;
      if (titleNorm.includes(token)) return true;
      if (keywordsNorm.some((k) => k.includes(token))) return true;
      return false;
    });
  });

  // Rank exact section-number matches above partial/keyword matches, since
  // that's almost always what a user searching "397" actually wants first.
  return matched.sort((a, b) => {
    const aExact = tokens.some((t) => a.oldSection.toLowerCase() === t || a.newSection?.toLowerCase() === t);
    const bExact = tokens.some((t) => b.oldSection.toLowerCase() === t || b.newSection?.toLowerCase() === t);
    if (aExact === bExact) return 0;
    return aExact ? -1 : 1;
  });
}
