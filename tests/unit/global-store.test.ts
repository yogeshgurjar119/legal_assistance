import { describe, expect, it } from "vitest";
import { getGlobalMap } from "@/lib/global-store";

describe("getGlobalMap", () => {
  it("returns the same map instance across calls with the same key", () => {
    const a = getGlobalMap<string, number>("test-key-a");
    a.set("x", 1);
    const b = getGlobalMap<string, number>("test-key-a");
    expect(b.get("x")).toBe(1);
  });

  it("returns independent maps for different keys", () => {
    const a = getGlobalMap<string, number>("test-key-b1");
    const b = getGlobalMap<string, number>("test-key-b2");
    a.set("x", 1);
    expect(b.get("x")).toBeUndefined();
  });
});
