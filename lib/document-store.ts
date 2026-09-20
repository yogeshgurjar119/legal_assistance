import { getGlobalMap } from "@/lib/global-store";
import { ensureSchema, getTursoClient } from "@/lib/turso";
import type { AnalysisMode, FlaggedClause, PersistedAnalysis } from "@/lib/types";

const MAX_HISTORY = 20;

const inMemoryHistory = getGlobalMap<string, PersistedAnalysis[]>("document_analyses");

export async function listAnalyses(sid: string): Promise<PersistedAnalysis[]> {
  const client = getTursoClient();

  if (!client) {
    return inMemoryHistory.get(sid) ?? [];
  }

  await ensureSchema();
  const result = await client.execute({
    sql: "SELECT id, source_name, summary, clauses, mode, created_at FROM document_analyses WHERE sid = ? ORDER BY created_at DESC LIMIT ?",
    args: [sid, MAX_HISTORY],
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    sourceName: row.source_name as string,
    summary: row.summary as string,
    clauses: JSON.parse(row.clauses as string) as FlaggedClause[],
    mode: row.mode as AnalysisMode,
    createdAt: row.created_at as string,
  }));
}

export async function appendAnalysis(
  sid: string,
  analysis: Omit<PersistedAnalysis, "id" | "createdAt">,
): Promise<PersistedAnalysis> {
  const client = getTursoClient();
  const record: PersistedAnalysis = {
    ...analysis,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  if (!client) {
    const existing = inMemoryHistory.get(sid) ?? [];
    const updated = [record, ...existing].slice(0, MAX_HISTORY);
    inMemoryHistory.set(sid, updated);
    return record;
  }

  await ensureSchema();
  await client.execute({
    sql: "INSERT INTO document_analyses (id, sid, source_name, summary, clauses, mode, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [
      record.id,
      sid,
      record.sourceName,
      record.summary,
      JSON.stringify(record.clauses),
      record.mode,
      record.createdAt,
    ],
  });

  return record;
}
