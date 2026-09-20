import { getGlobalMap } from "@/lib/global-store";
import { ensureSchema, getTursoClient } from "@/lib/turso";
import type { PersistedChatMessage, SupportedLocale } from "@/lib/types";

const MAX_HISTORY = 50;

const inMemoryHistory = getGlobalMap<string, PersistedChatMessage[]>("chat_history");

/** Dual-mode read (Turso row set vs. in-memory array) so callers never need to know which store is active. */
export async function listMessages(sid: string): Promise<PersistedChatMessage[]> {
  const client = getTursoClient();

  if (!client) {
    return inMemoryHistory.get(sid) ?? [];
  }

  await ensureSchema();
  const result = await client.execute({
    sql: "SELECT role, content, locale, created_at FROM chat_messages WHERE sid = ? ORDER BY created_at ASC LIMIT ?",
    args: [sid, MAX_HISTORY],
  });

  return result.rows.map((row) => ({
    role: row.role as PersistedChatMessage["role"],
    content: row.content as string,
    locale: row.locale as SupportedLocale,
    createdAt: row.created_at as string,
  }));
}

/** Stamps createdAt server-side (never trusts a client-supplied timestamp) before writing to whichever store is active. */
export async function appendMessage(
  sid: string,
  message: Omit<PersistedChatMessage, "createdAt">,
): Promise<void> {
  const client = getTursoClient();
  const record: PersistedChatMessage = { ...message, createdAt: new Date().toISOString() };

  if (!client) {
    const existing = inMemoryHistory.get(sid) ?? [];
    const updated = [...existing, record].slice(-MAX_HISTORY);
    inMemoryHistory.set(sid, updated);
    return;
  }

  await ensureSchema();
  await client.execute({
    sql: "INSERT INTO chat_messages (sid, role, content, locale, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [sid, message.role, message.content, message.locale, record.createdAt],
  });
}
