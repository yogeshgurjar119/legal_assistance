import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isAuthConfigured, parseAppUsers, verifyCredentials } from "@/lib/auth";

describe("auth", () => {
  const originalUsers = process.env.APP_USERS;
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    delete process.env.APP_USERS;
  });

  afterEach(() => {
    if (originalUsers !== undefined) process.env.APP_USERS = originalUsers;
    else delete process.env.APP_USERS;
    if (originalSecret !== undefined) process.env.SESSION_SECRET = originalSecret;
    else delete process.env.SESSION_SECRET;
  });

  describe("parseAppUsers", () => {
    it("returns an empty list when unset", () => {
      expect(parseAppUsers()).toEqual([]);
    });

    it("parses a single username:password pair", () => {
      process.env.APP_USERS = "admin:secret123";
      expect(parseAppUsers()).toEqual([{ username: "admin", password: "secret123" }]);
    });

    it("parses multiple comma-separated pairs, trimming whitespace", () => {
      process.env.APP_USERS = " admin:secret123 , yogesh:hunter2 ";
      expect(parseAppUsers()).toEqual([
        { username: "admin", password: "secret123" },
        { username: "yogesh", password: "hunter2" },
      ]);
    });

    it("skips malformed entries (no colon, empty username, or empty password)", () => {
      process.env.APP_USERS = "no-colon-here,:emptyuser,onlyuser:,admin:ok";
      expect(parseAppUsers()).toEqual([{ username: "admin", password: "ok" }]);
    });
  });

  describe("isAuthConfigured", () => {
    it("is false when APP_USERS is unset", () => {
      expect(isAuthConfigured()).toBe(false);
    });

    it("is true when at least one valid pair is configured AND SESSION_SECRET is set", () => {
      process.env.APP_USERS = "admin:secret123";
      process.env.SESSION_SECRET = "test-secret";
      expect(isAuthConfigured()).toBe(true);
    });

    it("stays false (fails safe/open) when APP_USERS is set but SESSION_SECRET is not", () => {
      process.env.APP_USERS = "admin:secret123";
      delete process.env.SESSION_SECRET;
      expect(isAuthConfigured()).toBe(false);
    });
  });

  describe("verifyCredentials", () => {
    beforeEach(() => {
      process.env.APP_USERS = "admin:secret123,yogesh:hunter2";
    });

    it("returns the matched user for correct credentials", () => {
      expect(verifyCredentials("admin", "secret123")).toEqual({ username: "admin", password: "secret123" });
    });

    it("returns null for a wrong password", () => {
      expect(verifyCredentials("admin", "wrong")).toBeNull();
    });

    it("returns null for an unknown username", () => {
      expect(verifyCredentials("nobody", "secret123")).toBeNull();
    });

    it("returns null when no users are configured", () => {
      delete process.env.APP_USERS;
      expect(verifyCredentials("admin", "secret123")).toBeNull();
    });

    it("matches the username case-insensitively (usernames are meant to be emails)", () => {
      expect(verifyCredentials("ADMIN", "secret123")).toEqual({ username: "admin", password: "secret123" });
      expect(verifyCredentials("  Admin  ", "secret123")).toEqual({ username: "admin", password: "secret123" });
    });
  });
});
