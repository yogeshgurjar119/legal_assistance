import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the bucket limit", () => {
    const id = `test-${Math.random()}`;
    const result = checkRateLimit(id);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("blocks requests once the bucket is exhausted", () => {
    const id = `exhaust-${Math.random()}`;
    let lastResult = { allowed: true, remaining: 0 };
    for (let i = 0; i < 25; i++) {
      lastResult = checkRateLimit(id);
    }
    expect(lastResult.allowed).toBe(false);
  });

  it("tracks separate identifiers independently", () => {
    const idA = `a-${Math.random()}`;
    const idB = `b-${Math.random()}`;
    for (let i = 0; i < 20; i++) checkRateLimit(idA);
    const resultA = checkRateLimit(idA);
    const resultB = checkRateLimit(idB);
    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });

  // Regression coverage for the periodic stale-bucket sweep (see rate-limit.ts):
  // hitting many distinct identifiers must trigger the sweep's internal
  // counter/threshold without throwing or corrupting unrelated buckets.
  it("stays correct across many distinct identifiers (exercises the periodic sweep without error)", () => {
    for (let i = 0; i < 600; i++) {
      checkRateLimit(`sweep-${i}`);
    }
    const freshId = `sweep-fresh-${Math.random()}`;
    expect(checkRateLimit(freshId).allowed).toBe(true);
  });
});
