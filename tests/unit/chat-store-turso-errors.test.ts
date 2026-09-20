import { describe, expect, it, vi } from "vitest";

const FAKE_ERROR = new Error("connection refused");

vi.mock("@/lib/turso", () => ({
  getTursoClient: () => ({
    execute: vi.fn().mockRejectedValue(FAKE_ERROR),
  }),
  ensureSchema: vi.fn().mockResolvedValue(undefined),
}));

describe("chat-store (Turso configured but failing)", () => {
  it("listMessages rejects instead of silently returning an empty list", async () => {
    const { listMessages } = await import("@/lib/chat-store");
    await expect(listMessages("some-session")).rejects.toThrow("connection refused");
  });

  it("appendMessage rejects instead of silently dropping the message", async () => {
    const { appendMessage } = await import("@/lib/chat-store");
    await expect(
      appendMessage("some-session", { role: "user", content: "hi", locale: "en" }),
    ).rejects.toThrow("connection refused");
  });
});
