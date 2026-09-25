interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TOKENS = 20;
const REFILL_INTERVAL_MS = 60_000;

// Without this, `buckets` would grow for the entire lifetime of the process —
// one entry per distinct identifier (IP/account) ever seen, never removed.
// An identifier idle this long would have fully refilled anyway, so evicting
// it is free: the next request just gets a fresh full bucket, identical to
// what it would compute from the stale one.
const STALE_ENTRY_MS = 60 * 60 * 1000;
const SWEEP_EVERY_N_CALLS = 500;
let callsSinceSweep = 0;

function sweepStaleBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now - bucket.updatedAt > STALE_ENTRY_MS) buckets.delete(key);
  }
}

/**
 * In-memory token bucket, scoped per Vercel function instance.
 * Sufficient to blunt casual abuse of the AI endpoints for a demo deployment;
 * swap for a shared store (Upstash Redis) if traffic needs cross-instance limits.
 */
export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  if (++callsSinceSweep >= SWEEP_EVERY_N_CALLS) {
    callsSinceSweep = 0;
    sweepStaleBuckets(now);
  }
  const bucket = buckets.get(identifier) ?? { tokens: MAX_TOKENS, updatedAt: now };

  const elapsed = now - bucket.updatedAt;
  const refill = Math.floor(elapsed / REFILL_INTERVAL_MS) * MAX_TOKENS;
  bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + Math.max(refill, 0));
  bucket.updatedAt = refill > 0 ? now : bucket.updatedAt;

  if (bucket.tokens <= 0) {
    buckets.set(identifier, bucket);
    return { allowed: false, remaining: 0 };
  }

  bucket.tokens -= 1;
  buckets.set(identifier, bucket);
  return { allowed: true, remaining: bucket.tokens };
}
