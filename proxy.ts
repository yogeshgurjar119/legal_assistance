import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthConfigured } from "@/lib/auth";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session-cookie";
import { signSessionToken, verifySessionToken } from "@/lib/session-crypto";

const PUBLIC_PAGE_PATHS = new Set(["/login"]);
const PUBLIC_API_PATHS = new Set(["/api/auth/login"]);
// These routes always sign and set their own authoritative session cookie
// (see app/api/auth/login|logout/route.ts) — if the middleware also minted a
// fresh anonymous cookie on the same request, the response would carry two
// competing Set-Cookie headers for la_session, which is exactly the kind of
// thing that's fine in spec but inconsistent across HTTP clients in practice.
const ROUTES_OWNING_THEIR_OWN_COOKIE = new Set(["/api/auth/login", "/api/auth/logout"]);

/**
 * Issues a signed, httpOnly session cookie on every request and, when
 * APP_USERS is configured, gates every page and API route behind login —
 * env-based credentials, no database (see lib/auth.ts). If APP_USERS is
 * unset, the app stays fully open, matching the zero-config principle: no
 * setup is required to try any feature. `authenticated`/`username` live in
 * the signed cookie itself (never in a DB row), so this check costs zero
 * database calls and stays edge-fast.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  const verified = cookieValue ? await verifySessionToken(cookieValue) : null;
  const sid = verified?.sid ?? crypto.randomUUID();

  const authRequired = isAuthConfigured();
  const authenticated = !authRequired || verified?.authenticated === true;

  const isPublicPage = PUBLIC_PAGE_PATHS.has(pathname);
  const isPublicApi = PUBLIC_API_PATHS.has(pathname);
  const isApiRoute = pathname.startsWith("/api/");

  if (authRequired && !authenticated && !isPublicPage && !isPublicApi) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (authRequired && authenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  // Always overwritten here, so a client-supplied x-session-id/x-username on
  // the incoming request can never override the server-verified value.
  requestHeaders.set("x-session-id", sid);
  requestHeaders.set("x-authenticated", authenticated ? "1" : "0");
  if (verified?.username) requestHeaders.set("x-username", verified.username);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (!verified && !ROUTES_OWNING_THEIR_OWN_COOKIE.has(pathname)) {
    const token = await signSessionToken({ sid, iat: Date.now(), authenticated: false });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
