/**
 * Next.js can instantiate the same module more than once across different
 * route bundles (Route Handlers vs. Server Component pages), even within a
 * single long-running Node process — so a plain `new Map()` at module scope
 * is NOT guaranteed to be the same object everywhere. Anchoring it on
 * `globalThis` (the standard Next.js workaround, also used for Prisma client
 * singletons) guarantees one shared instance per process regardless of which
 * bundle imports it. This only matters for the in-memory fallback path —
 * once Turso is configured, the database is the actual single source of
 * truth and this is unused.
 */
export function getGlobalMap<K, V>(key: string): Map<K, V> {
  const globalKey = `__lexplain_${key}__`;
  const globalAny = globalThis as unknown as Record<string, Map<K, V> | undefined>;
  if (!globalAny[globalKey]) {
    globalAny[globalKey] = new Map<K, V>();
  }
  return globalAny[globalKey];
}
