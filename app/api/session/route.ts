import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isAuthConfigured } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getOrCreateSessionRecord, setSessionLocale } from "@/lib/session-store";

export const runtime = "nodejs";

const patchSchema = z.object({
  locale: z.enum(["en", "es", "fr", "ar", "pt"]),
});

/** Exposes auth state read from proxy.ts's request headers here, alongside locale, so client components (Sidebar, ChatWidget) only need one fetch. */
export async function GET(req: NextRequest) {
  const sid = req.headers.get("x-session-id");
  if (!sid) return NextResponse.json({ error: "No session." }, { status: 400 });

  try {
    const record = await getOrCreateSessionRecord(sid);
    return NextResponse.json({
      ...record,
      authRequired: isAuthConfigured(),
      authenticated: req.headers.get("x-authenticated") === "1",
      username: req.headers.get("x-username"),
    });
  } catch (err) {
    console.error("session GET error", err);
    return NextResponse.json({ error: "Failed to load session." }, { status: 500 });
  }
}

/** Lets the language dropdown persist a locale choice server-side so it survives a reload without relying on client storage. */
export async function PATCH(req: NextRequest) {
  const sid = req.headers.get("x-session-id");
  if (!sid) return NextResponse.json({ error: "No session." }, { status: 400 });

  const { allowed } = checkRateLimit(`session-patch:${sid}`);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await setSessionLocale(sid, parsed.data.locale);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("session PATCH error", err);
    return NextResponse.json({ error: "Failed to update session." }, { status: 500 });
  }
}
