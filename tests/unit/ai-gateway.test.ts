import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AiNotConfiguredError, isAiConfigured } from "@/lib/ai-gateway";

describe("ai-gateway", () => {
  const originalGroq = process.env.GROQ_API_KEY;
  const originalNvidia = process.env.NVIDIA_API_KEY;

  beforeEach(() => {
    delete process.env.GROQ_API_KEY;
    delete process.env.NVIDIA_API_KEY;
  });

  afterEach(() => {
    if (originalGroq) process.env.GROQ_API_KEY = originalGroq;
    if (originalNvidia) process.env.NVIDIA_API_KEY = originalNvidia;
  });

  it("reports not configured when neither key is set", () => {
    expect(isAiConfigured()).toBe(false);
  });

  it("reports configured when GROQ_API_KEY is set", () => {
    process.env.GROQ_API_KEY = "gsk_test";
    expect(isAiConfigured()).toBe(true);
  });

  it("reports configured when NVIDIA_API_KEY is set", () => {
    process.env.NVIDIA_API_KEY = "nvapi-test";
    expect(isAiConfigured()).toBe(true);
  });

  it("AiNotConfiguredError carries a descriptive message", () => {
    const err = new AiNotConfiguredError();
    expect(err.message).toMatch(/GROQ_API_KEY|NVIDIA_API_KEY/);
    expect(err.name).toBe("AiNotConfiguredError");
  });
});
