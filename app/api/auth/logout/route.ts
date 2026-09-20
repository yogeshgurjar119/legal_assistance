import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

export const runtime = "nodejs";

/** Deletes the session cookie — proxy.ts mints a fresh, unauthenticated one on the next request. */
export async function POST(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
