export interface AppUser {
  username: string;
  password: string;
}

/**
 * Parses APP_USERS from env: "user1:pass1,user2:pass2" — colon-separated
 * username:password pairs, comma-separated. No database — credentials live
 * in .env only. Pure string parsing, so this module is safe to import from
 * both the edge middleware (proxy.ts) and Node API routes.
 */
export function parseAppUsers(): AppUser[] {
  const raw = process.env.APP_USERS ?? "";
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const idx = entry.indexOf(":");
      if (idx === -1) return [];
      const username = entry.slice(0, idx).trim();
      const password = entry.slice(idx + 1).trim();
      return username && password ? [{ username, password }] : [];
    });
}

let warnedMissingSecret = false;

/**
 * Whether the login gate is actually usable. If not, the app stays fully
 * open — matching this project's zero-config principle (nothing requires
 * setup to try). Set APP_USERS to turn the login gate on.
 *
 * Requires SESSION_SECRET too: proxy.ts (Edge runtime) and the API routes
 * (Node runtime) are separate JS runtimes that do NOT share in-memory state.
 * Without a shared SESSION_SECRET, each one falls back to its own random
 * per-instance signing secret (see lib/session-crypto.ts), so a login token
 * signed by the Node-runtime login route could never verify against the
 * Edge-runtime middleware's secret — login would silently "succeed" via the
 * API response and then bounce the user right back to /login. Rather than
 * ship that broken state, auth is treated as unconfigured until both are set.
 */
export function isAuthConfigured(): boolean {
  const hasUsers = parseAppUsers().length > 0;
  if (hasUsers && !process.env.SESSION_SECRET) {
    if (!warnedMissingSecret) {
      console.warn(
        "APP_USERS is set but SESSION_SECRET is not — the login gate can't work reliably " +
          "(Edge middleware and Node API routes would each sign with their own random secret). " +
          "Leaving the app OPEN until SESSION_SECRET is also set.",
      );
      warnedMissingSecret = true;
    }
    return false;
  }
  return hasUsers;
}

/**
 * Constant-time-ish string compare (no Node-only crypto import, so this
 * module stays edge-compatible) — avoids leaking password length/prefix via
 * response-time differences between a match and a near-miss.
 */
function constantTimeEqual(a: string, b: string): boolean {
  const lengthsMatch = a.length === b.length;
  const maxLen = Math.max(a.length, b.length, 1);
  let diff = lengthsMatch ? 0 : 1;
  for (let i = 0; i < maxLen; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * Returns the matched user on success, or null. Always runs a comparison
 * (against an empty string when the username isn't found) so an unknown
 * username and a wrong password take about the same amount of time.
 */
export function verifyCredentials(username: string, password: string): AppUser | null {
  const users = parseAppUsers();
  const match = users.find((u) => u.username === username);
  const ok = constantTimeEqual(password, match?.password ?? "");
  return ok && match ? match : null;
}
