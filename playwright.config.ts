import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      SESSION_SECRET: "e2e-test-session-secret-do-not-use-in-prod",
      // Force the in-memory fallback for deterministic, isolated test runs —
      // without this, a developer's real TURSO_DATABASE_URL/TURSO_AUTH_TOKEN
      // in .env.local would leak into the test server (Next.js loads .env.local
      // automatically), making tests hit a real shared database instead of a
      // clean in-memory store.
      TURSO_DATABASE_URL: "",
      TURSO_AUTH_TOKEN: "",
      GROQ_API_KEY: "",
      NVIDIA_API_KEY: "",
      // Force the login gate OFF for e2e runs — without this, a developer's
      // real APP_USERS in .env.local would gate every page behind /login,
      // and none of these specs perform a login first (they test the public,
      // zero-config experience). The gate's own logic (redirects, 401s,
      // cookie signing, the SESSION_SECRET fail-safe) is covered by
      // tests/unit/proxy.test.ts and tests/unit/auth.test.ts instead.
      APP_USERS: "",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
