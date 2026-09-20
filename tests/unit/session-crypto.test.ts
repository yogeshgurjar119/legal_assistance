import { beforeEach, describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "@/lib/session-crypto";

describe("session-crypto", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret-for-unit-tests";
  });

  it("signs and verifies a round trip", async () => {
    const token = await signSessionToken({ sid: "abc-123", iat: 1000, authenticated: false });
    const verified = await verifySessionToken(token);
    expect(verified).toEqual({ sid: "abc-123", iat: 1000, authenticated: false });
  });

  it("round-trips an authenticated token with a username", async () => {
    const token = await signSessionToken({ sid: "abc-123", iat: 1000, authenticated: true, username: "yogesh" });
    const verified = await verifySessionToken(token);
    expect(verified).toEqual({ sid: "abc-123", iat: 1000, authenticated: true, username: "yogesh" });
  });

  it("rejects a tampered payload", async () => {
    const token = await signSessionToken({ sid: "abc-123", iat: 1000, authenticated: false });
    const [payload, sig] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sid: "someone-elses-id", iat: 1000, authenticated: true }),
    ).toString("base64url");
    const tampered = `${tamperedPayload}.${sig}`;
    expect(tampered).not.toBe(token);
    expect(payload).toBeDefined();

    const verified = await verifySessionToken(tampered);
    expect(verified).toBeNull();
  });

  it("rejects a payload missing the authenticated field (e.g. a pre-auth-feature token)", async () => {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("test-secret-for-unit-tests"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const payloadB64 = Buffer.from(JSON.stringify({ sid: "abc-123", iat: 1000 })).toString("base64url");
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
    const sigB64 = Buffer.from(new Uint8Array(sig)).toString("base64url");
    const legacyToken = `${payloadB64}.${sigB64}`;

    expect(await verifySessionToken(legacyToken)).toBeNull();
  });

  it("rejects a malformed token", async () => {
    expect(await verifySessionToken("not-a-valid-token")).toBeNull();
    expect(await verifySessionToken("")).toBeNull();
    expect(await verifySessionToken("a.b.c")).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSessionToken({ sid: "abc-123", iat: 1000, authenticated: false });
    process.env.SESSION_SECRET = "a-completely-different-secret";
    const verified = await verifySessionToken(token);
    expect(verified).toBeNull();
  });
});
