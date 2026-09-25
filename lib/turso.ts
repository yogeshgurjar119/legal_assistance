import { createClient, type Client } from "@libsql/client";

let cachedClient: Client | null | undefined;
let schemaReady: Promise<void> | null = null;

/**
 * Returns a Turso (libSQL) client, or null when env vars aren't configured
 * yet. Callers must handle the null case with an in-memory fallback so the
 * app runs fully before a database is added.
 */
export function getTursoClient(): Client | null {
  if (cachedClient !== undefined) return cachedClient;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient({ url, authToken });
  return cachedClient;
}

async function createSchema(client: Client): Promise<void> {
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        locale TEXT NOT NULL DEFAULT 'en'
      )`,
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sid TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        locale TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS document_analyses (
        id TEXT PRIMARY KEY,
        sid TEXT NOT NULL,
        source_name TEXT NOT NULL,
        summary TEXT NOT NULL,
        clauses TEXT NOT NULL,
        mode TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
    ],
    "write",
  );

  // Both tables are always queried by sid — without these, every chat/analyze
  // request does a full table scan that gets slower as history grows across
  // all users, not just the requesting session.
  await client.batch(
    [
      "CREATE INDEX IF NOT EXISTS idx_chat_messages_sid ON chat_messages(sid)",
      "CREATE INDEX IF NOT EXISTS idx_document_analyses_sid ON document_analyses(sid)",
    ],
    "write",
  );
}

/**
 * Ensures the tables exist. Safe to call on every request — the actual
 * CREATE TABLE batch only ever runs once per process (cached promise), and
 * CREATE TABLE IF NOT EXISTS is a no-op after that even across processes.
 * This means, unlike a typical hosted-Postgres setup, there's no manual
 * schema step — just point TURSO_DATABASE_URL at an empty database.
 */
export async function ensureSchema(): Promise<void> {
  const client = getTursoClient();
  if (!client) return;
  if (!schemaReady) {
    schemaReady = createSchema(client);
  }
  await schemaReady;
}
