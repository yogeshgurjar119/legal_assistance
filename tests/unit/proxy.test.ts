import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { signSessionToken } from "@/lib/session-crypto";
import { SESSION_COOKIE } from "@/lib/session-cookie";

describe("proxy (auth gating middleware)", () => {
  const originalAppUsers = process.env.APP_USERS;
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret-for-unit-tests";
  });

  afterEach(() => {
    if (originalAppUsers !== undefined) process.env.APP_USERS = originalAppUsers;
    else delete process.env.APP_USERS;
    if (originalSecret !== undefined) process.env.SESSION_SECRET = originalSecret;
    else delete process.env.SESSION_SECRET;
  });

  it("passes an unauthenticated request through when APP_USERS is unset (zero-config: app stays open)", async () => {
    delete process.env.APP_USERS;
    const req = new NextRequest("http://localhost/chat");
    const res = await proxy(req);
    expect(res.status).toBe(200);
  });

  it("redirects an unauthenticated page request to /login when APP_USERS is set", async () => {
    process.env.APP_USERS = "admin:secret123";
    const req = new NextRequest("http://localhost/chat");
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
    expect(res.headers.get("location")).toContain("from=%2Fchat");
  });

  it("returns 401 JSON for an unauthenticated API request when APP_USERS is set", async () => {
    process.env.APP_USERS = "admin:secret123";
    const req = new NextRequest("http://localhost/api/chat");
    const res = await proxy(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("allows /login through unauthenticated when APP_USERS is set", async () => {
    process.env.APP_USERS = "admin:secret123";
    const req = new NextRequest("http://localhost/login");
    const res = await proxy(req);
    expect(res.status).toBe(200);
  });

  it("allows /api/auth/login through unauthenticated when APP_USERS is set", async () => {
    process.env.APP_USERS = "admin:secret123";
    const req = new NextRequest("http://localhost/api/auth/login", { method: "POST" });
    const res = await proxy(req);
    expect(res.status).toBe(200);
  });

  it("lets an authenticated request through and sets x-username", async () => {
    process.env.APP_USERS = "admin:secret123";
    const token = await signSessionToken({ sid: "sid-1", iat: Date.now(), authenticated: true, username: "admin" });
    const req = new NextRequest("http://localhost/chat", {
      headers: { Cookie: `${SESSION_COOKIE}=${token}` },
    });
    const res = await proxy(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-request-x-username")).toBe("admin");
  });

  it("redirects an already-authenticated visit to /login back to /", async () => {
    process.env.APP_USERS = "admin:secret123";
    const token = await signSessionToken({ sid: "sid-1", iat: Date.now(), authenticated: true, username: "admin" });
    const req = new NextRequest("http://localhost/login", {
      headers: { Cookie: `${SESSION_COOKIE}=${token}` },
    });
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/");
  });

  it("treats a forged/tampered cookie as unauthenticated rather than trusting it", async () => {
    process.env.APP_USERS = "admin:secret123";
    const req = new NextRequest("http://localhost/chat", {
      headers: { Cookie: `${SESSION_COOKIE}=forged.payload` },
    });
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });
});
