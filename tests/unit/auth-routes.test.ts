/**
 * Unit tests for POST /api/auth/login and POST /api/auth/logout, exercised
 * directly (no running server). Also covers the email-vs-invalid-email
 * distinction: a malformed email is a 400 (never reaches credential
 * checking), while a well-formed-but-wrong email/password is a 401 —
 * distinct outcomes worth demonstrating live in the demo video.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 19 }),
}));

function loginRequest(body: unknown, extraHeaders: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-session-id": "test-sid", ...extraHeaders },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  const originalUsers = process.env.APP_USERS;
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    vi.resetModules();
    process.env.SESSION_SECRET = "test-secret-for-unit-tests";
    process.env.APP_USERS = "demo@example.com:correct-password";
  });

  afterEach(() => {
    if (originalUsers !== undefined) process.env.APP_USERS = originalUsers;
    else delete process.env.APP_USERS;
    if (originalSecret !== undefined) process.env.SESSION_SECRET = originalSecret;
    else delete process.env.SESSION_SECRET;
  });

  it("returns 503 when no APP_USERS is configured", async () => {
    delete process.env.APP_USERS;
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(loginRequest({ username: "demo@example.com", password: "correct-password" }));
    expect(res.status).toBe(503);
  });

  it("returns 400 with a clear message for a malformed email — never reaches credential checking", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(loginRequest({ username: "not-an-email", password: "correct-password" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/valid email/i);
  });

  it("returns 401 for a well-formed but unknown email", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(loginRequest({ username: "nobody@example.com", password: "correct-password" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 for a known email with the wrong password", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(loginRequest({ username: "demo@example.com", password: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 200 and sets a signed session cookie for correct credentials", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(loginRequest({ username: "demo@example.com", password: "correct-password" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.username).toBe("demo@example.com");
    expect(res.cookies.get("la_session")?.value).toBeTruthy();
  });

  it("matches the configured email case-insensitively", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(loginRequest({ username: "DEMO@Example.com", password: "correct-password" }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const { POST } = await import("@/app/api/auth/logout/route");
    const res = await POST();
    expect(res.status).toBe(200);
    // A cleared cookie is set with an empty value / immediate expiry.
    const cookie = res.cookies.get("la_session");
    expect(cookie === undefined || cookie.value === "").toBe(true);
  });
});
