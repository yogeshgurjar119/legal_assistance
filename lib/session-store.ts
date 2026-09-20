import { getGlobalMap } from "@/lib/global-store";
import { ensureSchema, getTursoClient } from "@/lib/turso";
import type { SessionRecord, SupportedLocale } from "@/lib/types";

const DEFAULT_RECORD: SessionRecord = { locale: "en" };

const inMemorySessions = getGlobalMap<string, SessionRecord>("sessions");

/** Reads a session's locale, creating a default ("en") record on first use. */
export async function getOrCreateSessionRecord(sid: string): Promise<SessionRecord> {
  const client = getTursoClient();

  if (!client) {
    const existing = inMemorySessions.get(sid);
    if (existing) return existing;
    inMemorySessions.set(sid, { ...DEFAULT_RECORD });
    return { ...DEFAULT_RECORD };
  }

  await ensureSchema();
  const result = await client.execute({
    sql: "SELECT locale FROM sessions WHERE sid = ?",
    args: [sid],
  });

  const row = result.rows[0];
  if (row) return { locale: row.locale as SupportedLocale };

  // Two concurrent requests for the same brand-new sid can both miss the
  // SELECT above and race to insert — ON CONFLICT DO NOTHING makes the
  // insert idempotent instead of throwing a UNIQUE constraint error, and the
  // follow-up SELECT returns whichever row actually won the race.
  await client.execute({
    sql: "INSERT INTO sessions (sid, locale) VALUES (?, ?) ON CONFLICT (sid) DO NOTHING",
    args: [sid, DEFAULT_RECORD.locale],
  });

  const confirmed = await client.execute({
    sql: "SELECT locale FROM sessions WHERE sid = ?",
    args: [sid],
  });
  const confirmedRow = confirmed.rows[0];

  return confirmedRow ? { locale: confirmedRow.locale as SupportedLocale } : { ...DEFAULT_RECORD };
}

export async function setSessionLocale(sid: string, locale: SupportedLocale): Promise<void> {
  const client = getTursoClient();

  if (!client) {
    inMemorySessions.set(sid, { locale });
    return;
  }

  await getOrCreateSessionRecord(sid);
  await client.execute({
    sql: "UPDATE sessions SET locale = ? WHERE sid = ?",
    args: [locale, sid],
  });
}
