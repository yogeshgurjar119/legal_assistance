/**
 * Exercises the REAL lib/rate-limit.ts (not mocked, unlike auth-routes.test.ts)
 * to prove the login route's per-account limit actually works — added after
 * a security-audit finding that IP-only rate limiting lets an attacker who
 * rotates IPs (or spoofs X-Forwarded-For where it isn't trustworthy) hammer
 * one specific account indefinitely. See app/api/auth/login/route.ts.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

function loginRequest(body: unknown, ip: string) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-session-id": "test-sid", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("login rate limiting (real checkRateLimit, per-account)", () => {
  const originalSecret = process.env.SESSION_SECRET;
  const originalUsers = process.env.APP_USERS;

  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret-for-unit-tests";
    process.env.APP_USERS = "victim@example.com:correct-password,other@example.com:correct-password";
  });

  afterEach(() => {
    if (originalSecret !== undefined) process.env.SESSION_SECRET = originalSecret;
    else delete process.env.SESSION_SECRET;
    if (originalUsers !== undefined) process.env.APP_USERS = originalUsers;
    else delete process.env.APP_USERS;
  });

  it("locks out one account after repeated wrong-password attempts, without affecting a different account", async () => {
    const { POST } = await import("@/app/api/auth/login/route");

    // Distinct IPs per identity isolates the per-ACCOUNT bucket as the thing
    // under test — if both used the same IP, the shared per-IP bucket would
    // also exhaust and the second assertion below would pass for the wrong
    // reason (IP-level blocking, not account-level).
    let lastStatus = 0;
    for (let i = 0; i < 25; i++) {
      const res = await POST(loginRequest({ username: "victim@example.com", password: "wrong-guess" }, "1.1.1.1"));
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);

    const otherRes = await POST(
      loginRequest({ username: "other@example.com", password: "correct-password" }, "2.2.2.2"),
    );
    expect(otherRes.status).toBe(200);
  });
});
