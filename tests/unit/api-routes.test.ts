/**
 * Unit tests for API route handlers, exercised directly (no running server):
 * - GET/PATCH /api/session
 * - GET/POST /api/chat
 * - GET/POST /api/analyze
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/turso", () => ({
  getTursoClient: () => null,
  ensureSchema: async () => {},
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 19 }),
}));

describe("GET /api/session", () => {
  beforeEach(() => vi.resetModules());

  it("returns 400 with no session header", async () => {
    const { GET } = await import("@/app/api/session/route");
    const req = new NextRequest("http://localhost/api/session");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns a default en-locale record for a new session", async () => {
    const { GET } = await import("@/app/api/session/route");
    const req = new NextRequest("http://localhost/api/session", {
      headers: { "x-session-id": "test-sid-1" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.locale).toBe("en");
  });
});

describe("PATCH /api/session", () => {
  beforeEach(() => vi.resetModules());

  it("returns 400 for an invalid locale", async () => {
    const { PATCH } = await import("@/app/api/session/route");
    const req = new NextRequest("http://localhost/api/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-session-id": "test-sid-2" },
      body: JSON.stringify({ locale: "zz" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it("accepts a valid locale change", async () => {
    const { PATCH } = await import("@/app/api/session/route");
    const req = new NextRequest("http://localhost/api/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-session-id": "test-sid-3" },
      body: JSON.stringify({ locale: "fr" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.GROQ_API_KEY;
    delete process.env.NVIDIA_API_KEY;
  });

  it("returns 400 with no session header", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "hi", locale: "en" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for an empty message", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-id": "test-sid" },
      body: JSON.stringify({ message: "", locale: "en" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns a fallback reply when no AI key is configured", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-id": "test-sid" },
      body: JSON.stringify({ message: "Can my landlord keep my deposit?", locale: "en" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("fallback");
    expect(typeof body.reply).toBe("string");
    expect(body.reply.length).toBeGreaterThan(0);
  });
});

describe("GET /api/chat", () => {
  beforeEach(() => vi.resetModules());

  it("returns 400 with no session header", async () => {
    const { GET } = await import("@/app/api/chat/route");
    const req = new NextRequest("http://localhost/api/chat");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns an empty message list for a fresh session", async () => {
    const { GET } = await import("@/app/api/chat/route");
    const req = new NextRequest("http://localhost/api/chat", {
      headers: { "x-session-id": `fresh-${Math.random()}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.messages).toEqual([]);
  });
});

describe("POST /api/analyze", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.GROQ_API_KEY;
    delete process.env.NVIDIA_API_KEY;
  });

  it("returns 400 with no session header", async () => {
    const { POST } = await import("@/app/api/analyze/route");
    const req = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Some contract text here that is long enough." }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 with code text_too_short for very short pasted text", async () => {
    const { POST } = await import("@/app/api/analyze/route");
    const req = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-id": "test-sid" },
      body: JSON.stringify({ text: "too short" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("text_too_short");
  });

  it("returns a heuristic-only fallback analysis with risk flags when no AI key is configured", async () => {
    const { POST } = await import("@/app/api/analyze/route");
    const text =
      "This agreement shall automatically renew for successive terms. The Company may, at its sole discretion, terminate this agreement at any time.";
    const req = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-id": "test-sid" },
      body: JSON.stringify({ text }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("fallback");
    expect(body.clauses.length).toBeGreaterThan(0);
  });
});

describe("GET /api/analyze", () => {
  beforeEach(() => vi.resetModules());

  it("returns 400 with no session header", async () => {
    const { GET } = await import("@/app/api/analyze/route");
    const req = new NextRequest("http://localhost/api/analyze");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns an empty analysis history for a fresh session", async () => {
    const { GET } = await import("@/app/api/analyze/route");
    const req = new NextRequest("http://localhost/api/analyze", {
      headers: { "x-session-id": `fresh-${Math.random()}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analyses).toEqual([]);
  });
});
