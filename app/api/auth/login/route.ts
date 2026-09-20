import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isAuthConfigured, verifyCredentials } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session-cookie";
import { signSessionToken } from "@/lib/session-crypto";

export const runtime = "nodejs";

// Username must be a well-formed email address — this is a UI/demo choice
// (not a real account system), but validating it as an email gives a clean,
// concrete "valid vs invalid input" pair to demonstrate: a malformed address
// like "not-an-email" fails validation here (400) before ever touching
// verifyCredentials, distinctly from a well-formed-but-wrong email (401).
const loginSchema = z.object({
  username: z.string().trim().toLowerCase().email({ message: "Enter a valid email address." }).max(100),
  password: z.string().min(1).max(200),
});

/** Separated from POST() so the outer try/catch is the only place worrying about an unhandled-exception safety net. */
async function handlePost(req: NextRequest): Promise<NextResponse> {
  if (!isAuthConfigured()) {
    return NextResponse.json({ error: "Login is not configured on this server." }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anonymous";
  const { allowed } = checkRateLimit(`login:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Too many login attempts. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const user = verifyCredentials(parsed.data.username, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  // proxy.ts guarantees x-session-id is set on every request (it owns sid
  // minting) — reuse it so this route is never the one deciding a sid, and
  // any in-memory/Turso chat history already keyed by it isn't orphaned by
  // logging in. This route is listed in proxy.ts's ROUTES_OWNING_THEIR_OWN_COOKIE
  // so the middleware won't also try to mint a competing anonymous cookie here.
  const sid = req.headers.get("x-session-id") ?? crypto.randomUUID();

  const token = await signSessionToken({ sid, iat: Date.now(), authenticated: true, username: user.username });

  const res = NextResponse.json({ ok: true, username: user.username });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}

/** Outer safety net: guarantees a JSON error response instead of a raw framework 500 if handlePost throws something unexpected. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    return await handlePost(req);
  } catch (err) {
    console.error("login route: unhandled error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
