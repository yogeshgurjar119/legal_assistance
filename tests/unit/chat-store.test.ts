import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/turso", () => ({
  getTursoClient: () => null,
  ensureSchema: vi.fn().mockResolvedValue(undefined),
}));

describe("chat-store (in-memory fallback)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns an empty list for a session with no history", async () => {
    const { listMessages } = await import("@/lib/chat-store");
    const messages = await listMessages(`sid-${Math.random()}`);
    expect(messages).toEqual([]);
  });

  it("appends and lists messages in order", async () => {
    const { appendMessage, listMessages } = await import("@/lib/chat-store");
    const sid = `sid-${Math.random()}`;
    await appendMessage(sid, { role: "user", content: "hello", locale: "en" });
    await appendMessage(sid, { role: "assistant", content: "hi there", locale: "en" });
    const messages = await listMessages(sid);
    expect(messages).toHaveLength(2);
    expect(messages[0]?.content).toBe("hello");
    expect(messages[1]?.content).toBe("hi there");
  });
});
