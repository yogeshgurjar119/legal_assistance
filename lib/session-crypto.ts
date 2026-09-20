import type { SessionToken } from "@/lib/types";

/**
 * Signs/verifies the session cookie with HMAC-SHA256 via the Web Crypto API
 * (available in both the Edge middleware runtime and Node 20+), so a client
 * can read the cookie's existence but can never forge or tamper with its
 * contents — unlike a plain localStorage/cookie value.
 */

let warnedNoSecret = false;
let ephemeralSecret: string | null = null;

function getSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv) return fromEnv;

  if (!warnedNoSecret) {
    console.warn(
      "SESSION_SECRET is not set — using a per-instance random secret. " +
        "Sessions will not verify consistently across multiple serverless instances. " +
        "Set SESSION_SECRET in production.",
    );
    warnedNoSecret = true;
  }
  if (!ephemeralSecret) {
    ephemeralSecret = crypto.randomUUID() + crypto.randomUUID();
  }
  return ephemeralSecret;
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padLength = (4 - (value.length % 4)) % 4;
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLength);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function signSessionToken(payload: SessionToken): Promise<string> {
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await getKey(getSecret());
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string): Promise<SessionToken | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts as [string, string];

  try {
    const key = await getKey(getSecret());
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(sigB64) as BufferSource,
      new TextEncoder().encode(payloadB64),
    );
    if (!valid) return null;

    const json = new TextDecoder().decode(fromBase64Url(payloadB64));
    const parsed = JSON.parse(json);
    if (
      typeof parsed?.sid !== "string" ||
      typeof parsed?.iat !== "number" ||
      typeof parsed?.authenticated !== "boolean"
    ) {
      return null;
    }
    return parsed as SessionToken;
  } catch {
    return null;
  }
}
