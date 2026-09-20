export type SupportedLocale = "en" | "es" | "fr" | "ar" | "pt";

export type LegalCategory =
  | "tenant-rights"
  | "contract-basics"
  | "consumer-protection"
  | "employment-basics"
  | "small-claims"
  | "data-privacy";

export interface LegalSnippet {
  id: string;
  category: LegalCategory;
  keywords: string[];
  answer: Record<SupportedLocale, string>;
}

export interface RiskClausePattern {
  id: string;
  label: string;
  pattern: RegExp;
  severity: "low" | "medium" | "high";
  explanation: string;
}

export interface FlaggedClause {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  explanation: string;
  excerpt: string;
}

export interface ChatRequestBody {
  message: string;
  locale: SupportedLocale;
}

export interface PersistedChatMessage {
  role: "user" | "assistant";
  content: string;
  locale: SupportedLocale;
  createdAt: string;
}

/**
 * Signed, httpOnly-cookie contents: an opaque session identifier, an
 * issued-at timestamp, and login state. Never readable or writable by client
 * JS — a client-edited cookie fails signature verification and is replaced.
 * Locale still lives server-side in SessionRecord, looked up by sid;
 * `authenticated`/`username` live in the signed token itself (not the DB) so
 * proxy.ts can gate every request at the edge with zero database calls.
 */
export interface SessionToken {
  sid: string;
  iat: number;
  authenticated: boolean;
  username?: string;
}

/** Server-side (DB or in-memory fallback) session state, keyed by sid. No roles — single public app. */
export interface SessionRecord {
  locale: SupportedLocale;
}

export type AnalysisMode = "ai" | "fallback";

export interface DocumentAnalysisResult {
  summary: string;
  clauses: FlaggedClause[];
  mode: AnalysisMode;
  /**
   * Debug/demo field: the exact prompt sent to the AI provider for this
   * request (or a note explaining why none was sent). Not persisted to
   * history — purely for on-screen transparency (e.g. demo recordings).
   */
  promptDebug?: string;
}

export interface PersistedAnalysis {
  id: string;
  sourceName: string;
  summary: string;
  clauses: FlaggedClause[];
  mode: AnalysisMode;
  createdAt: string;
}

/**
 * A curated, static reference entry for a well-known Indian statute section
 * (see seed/act-sections.ts). Deliberately NOT a live/external data source —
 * India has no genuinely free, sustainable case-law/statute API (confirmed
 * by research), and a small always-correct static index is more honest and
 * more useful than an unreliable "live" integration. Many sections were
 * renumbered when the IPC/CrPC were replaced by the BNS/BNSS on 2024-07-01 —
 * `newAct`/`newSection` are null when no renumbering applies (or isn't yet
 * confirmed against an official source).
 */
export interface ActSection {
  id: string;
  oldAct: "IPC" | "CrPC";
  oldSection: string;
  newAct: "BNS" | "BNSS" | null;
  newSection: string | null;
  title: string;
  keywords: string[];
  summary: string;
  sourceUrl: string;
}
