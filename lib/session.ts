import { headers } from "next/headers";
import { getOrCreateSessionRecord } from "@/lib/session-store";
import type { SessionRecord } from "@/lib/types";

/** Server Component helper: the sid is set by middleware, never client-controlled. */
export async function getSessionId(): Promise<string> {
  const h = await headers();
  return h.get("x-session-id") ?? "";
}

export async function getSession(): Promise<SessionRecord & { sid: string }> {
  const sid = await getSessionId();

  // Fail closed: if the session store can't be reached, treat this as a
  // default-locale session rather than crashing the page.
  const record = await getOrCreateSessionRecord(sid).catch((err) => {
    console.error("getSession: session lookup failed, defaulting to en", err);
    return { locale: "en" as const };
  });

  return { sid, ...record };
}
