# LexPlain AI

A GenAI-powered assistant that makes legal information and basic document
understanding accessible to everyone.

---

## About the project

### The problem

> Legal information can often be complex and difficult to navigate. Build a
> GenAI-powered solution that makes legal information and basic assistance accessible
> by helping users understand, compare, and navigate legal documents.

### The solution

LexPlain AI is a single, public web app with two focused tools backed by one GenAI
gateway. Anyone can ask a plain-language legal question — in five languages — and get
an answer grounded in a seeded legal-information corpus. Anyone can also upload a
contract or lease (or just paste a clause) and get a plain-language summary alongside
flagged clauses worth extra attention — auto-renewal terms, sole-discretion
termination, indemnification, mandatory arbitration, liquidated damages, and broad
liability waivers. No database-backed accounts, no roles — an optional env-based
login gate (`APP_USERS`) can require a username/password before anything is
reachable, but the app runs fully open by default (zero-config).

### How it covers the problem statement

| Pillar                       | Feature                                                     | Where                                                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Understand legal information | Multilingual Q&A grounded in a seeded legal-info corpus     | [`/chat`](app/chat/page.tsx), [`components/ChatWidget.tsx`](components/ChatWidget.tsx), [`app/api/chat/route.ts`](app/api/chat/route.ts)                 |
| Navigate legal documents     | Upload/paste a document → plain-language summary           | [`/analyze`](app/analyze/page.tsx), [`components/DocumentUpload.tsx`](components/DocumentUpload.tsx), [`lib/document-parser.ts`](lib/document-parser.ts) |
| Compare / flag risk          | Deterministic clause risk-flagging (works with zero AI key) | [`seed/legal-corpus.ts`](seed/legal-corpus.ts) `RISK_CLAUSE_PATTERNS`, [`components/DocumentSummary.tsx`](components/DocumentSummary.tsx)               |
| Multilingual assistance      | English, Spanish, French, Arabic, Portuguese                | [`components/ChatWidget.tsx`](components/ChatWidget.tsx)                                                                                                   |
| Accessibility of legal info  | Open by default (no login required to try it); an optional env-based login gate for real deployments | [`app/layout.tsx`](app/layout.tsx), [`components/Sidebar.tsx`](components/Sidebar.tsx), [`app/login/page.tsx`](app/login/page.tsx) |

### Design principles this project follows

- **Works with zero configured secrets.** No AI key, no database needed to try it —
  every feature has a sensible fallback (seeded Q&A answers, regex-based clause risk
  flagging, in-memory storage) so `npm install && npm run dev` is enough to see the
  whole thing working.
- **Upgrades in place.** Add a real AI key or database later and the same code paths
  switch over automatically — nothing to rewrite.
- **Fails safe, not silent.** Every external call (AI provider, database) is guarded
  so a hiccup degrades gracefully instead of crashing a page or a request.
- **Not legal advice, always disclosed.** A single [`LEGAL_DISCLAIMER`](seed/legal-corpus.ts)
  constant is reused in the UI banner, every seeded answer, and every AI system prompt,
  so the "this is general information, not legal advice" caveat can never drift or go
  missing.
- **Sessions live server-side.** The browser only ever holds a signed, `httpOnly`
  session ID — never locale preference or conversation content.

---

## Quick start

```bash
git clone <this-repo>
cd legal_assistance
npm install
npm run dev
```

Open `http://localhost:3000`. That's it — no environment variables required. The
assistant runs in fallback mode using seeded legal-info snippets, document analysis
runs on regex-based risk-clause flagging only, and chat/analysis history lives in
memory.

### Turning on the real features (all optional)

Copy `.env.example` to `.env.local` and fill in whichever of these you want:

| Variable                                      | Unlocks                                                                                                   | Cost                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `GROQ_API_KEY`                              | Real AI-generated chat replies and document summaries                                                     | Free (sign up at console.groq.com, no card) |
| `NVIDIA_API_KEY`                            | Same, using NVIDIA NIM instead — only used if`GROQ_API_KEY` isn't set                                  | Free (build.nvidia.com)                     |
| `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` | Sessions, chat history, and analysis history persist in a real (SQLite/libSQL) database instead of memory | Free tier at turso.tech                     |
| `SESSION_SECRET`                            | Sessions verify consistently across multiple serverless instances — **required** if `APP_USERS` is set | —                                          |
| `APP_USERS`                                 | Requires login (username/password from this env var) before any page or API route is reachable — see below | —                                          |

Nothing here needs a code change — every variable is detected at runtime and the
relevant `lib/*` module switches behavior automatically.

<details>
<summary>Full setup details for each variable</summary>

**AI — two interchangeable providers, tried in order:**

1. **Groq (free):** sign up at console.groq.com, set `GROQ_API_KEY=gsk_...`. Uses
   `openai/gpt-oss-120b` — fast enough for a responsive chat UI. Groq's model catalog
   changes over time (models get retired without notice); spot-check
   `GET https://api.groq.com/openai/v1/models` with your key if this ever starts
   failing, and update `GROQ_MODEL_ID` in `lib/ai-gateway.ts`.
2. **NVIDIA NIM (free):** sign up at build.nvidia.com, set `NVIDIA_API_KEY=nvapi-...`
   if you'd rather use NVIDIA's hosted models. Only used when `GROQ_API_KEY` isn't set.

Only the first configured one is used — set none, one, or both; without either,
`/api/chat` returns seeded legal-info answers and `/api/analyze` returns
regex-only risk-clause flags instead of erroring. Every AI call also has a 12s
timeout that falls back to the same non-AI answer if a provider is slow, so the app
always stays responsive.

**Database (Turso, optional):**

1. Sign up free at turso.tech, create a database, and grab its URL and an auth token
   (via their dashboard or the `turso` CLI).
2. Set `TURSO_DATABASE_URL=libsql://...` and `TURSO_AUTH_TOKEN=...` in `.env.local`.

That's it — no manual schema step. `lib/turso.ts` creates the `sessions`,
`chat_messages`, and `document_analyses` tables automatically (`CREATE TABLE IF NOT EXISTS`) the first time any of them is queried.

**Login gate (optional, env-based, no database):**

1. Set `APP_USERS=username:password` (or a comma-separated list of pairs, e.g.
   `admin:demo1234,reviewer:letmein`) in `.env.local`.
2. **Also set `SESSION_SECRET`** to any random string. This is required, not optional,
   for login specifically — see the comment above `APP_USERS` in `.env.example` for
   why (a cross-runtime signing-secret mismatch otherwise). If `APP_USERS` is set
   without `SESSION_SECRET`, the app deliberately stays open and logs a warning,
   rather than shipping a login screen that doesn't actually work.
3. Restart the dev server. Every page and API route now redirects to `/login` (or
   returns `401` for API calls) until a valid `username`/`password` pair from
   `APP_USERS` is submitted there. Log out via the sidebar's **Log out** button.

</details>

---

## Tech stack

- **Next.js 16** (App Router, TypeScript, Turbopack) — one deployment, no separate
  backend
- **Vercel AI SDK** (`ai`) with **Groq** (`@ai-sdk/groq`) as the primary free-tier LLM
  provider, **NVIDIA NIM** (`@ai-sdk/openai-compatible`, pointed at NVIDIA's
  OpenAI-compatible endpoint) as an optional free fallback, using `generateText` for
  chat and `generateObject` (schema-validated structured output) for document analysis
- **unpdf** (Mozilla's pdfjs-dist, maintained) for pure-JS PDF text extraction (no native dependencies)
- **Turso** (libSQL/SQLite, hosted via `@libsql/client`) for persistence — optional,
  in-memory fallback otherwise
- **Tailwind CSS v4** for styling
- **Zod** for API input validation
- **Vitest** + **Testing Library** for unit tests
- **Playwright** + **axe-core** for end-to-end and automated accessibility testing
- **GitHub Actions** for CI

## Architecture

```
Browser
    │
    ▼
proxy.ts  ── issues a signed, httpOnly session cookie on every request, and,
              when APP_USERS is configured, gates every page/API route behind
              /login — env-based credentials, no DB lookups (stays edge-fast)
    │
    ▼
Next.js App Router  ── pages: /, /chat, /analyze, /login
    │
    ▼
Route Handlers (app/api/*)  ── zod validation + in-memory rate limiting
    │              │                    │
    ▼              ▼                    ▼
lib/ai-gateway  lib/chat-store   lib/document-store
(Groq first,    (conversation    (analysis history,
 NVIDIA NIM      history,         keyed by sid)
 fallback, via   keyed by sid)    Turso or in-memory
 Vercel AI SDK)  Turso or
    │            in-memory
    ▼
lib/retrieval.ts — keyword-overlap retrieval over seed/legal-corpus.ts
(a drop-in seam for embedding-based search once Turso is wired up)

lib/document-parser.ts — unpdf text extraction + applyRiskPatterns
(deterministic regex-based clause risk flagging, works with zero AI key)
```

**Sessions live in the database, not in client-editable storage.** The only thing the
browser holds is an opaque, HMAC-signed, `httpOnly` session ID
([`lib/session-crypto.ts`](lib/session-crypto.ts)) — it carries no locale or
conversation content, can't be read by client JS, and can't be tampered with (an
edited cookie fails signature verification and is replaced with a fresh anonymous
session). The actual state — locale preference, conversation history, analysis
history — lives server-side, looked up by that ID. See
[`tests/e2e/session.spec.ts`](tests/e2e/session.spec.ts) for the cookie-tampering test
that verifies this.

### Repository layout

```
proxy.ts                              — issues the signed session-id cookie on every request
app/
  page.tsx, chat/page.tsx,
  analyze/page.tsx                    — home, Legal Q&A, and Analyze Document pages
  error.tsx, not-found.tsx            — styled app-wide error/404 boundaries
  api/{chat,analyze,session}          — Route Handlers
components/                            — ChatWidget, DocumentUpload, DocumentSummary,
                                          Sidebar, FloatingIcons, LegalDisclaimerBanner
lib/                                    — ai-gateway, document-parser, document-store,
                                          retrieval, rate-limit, session, session-crypto,
                                          session-store, chat-store, global-store, turso, types
seed/                                   — legal-corpus.ts (legalSnippets, LEGAL_DISCLAIMER,
                                          RISK_CLAUSE_PATTERNS)
public/                                 — logo.svg
tests/unit/                             — Vitest specs
tests/e2e/                              — Playwright + axe-core specs
```

---

## Testing

```bash
npm run lint        # ESLint (flat config, eslint-config-next)
npm run typecheck   # tsc --noEmit, strict mode
npm test            # Vitest unit tests
npm run test:e2e    # Playwright end-to-end + accessibility + responsive suite
```

`npm test` covers: retrieval, rate limiting, session/chat/document stores (including
simulated Turso failures via `*-turso-errors.test.ts`), session-crypto
sign/verify/tamper-detection, the AI gateway's provider configuration logic, the
document parser's validation/parsing/risk-flagging, the seeded legal corpus's
structure (locale coverage, disclaimer presence), the `ChatWidget`/`DocumentUpload`
/`DocumentSummary`/`Sidebar` components, the env-based login gate (`lib/auth.ts`,
credential parsing/verification), the auth-gating middleware itself (`proxy.ts`,
exercised directly with fake requests), and real (non-mocked) PDF parsing against
an embedded PDF fixture — 22 test files, 104 tests, all passing.

`npm run test:e2e` covers: navigation flows, session-cookie tampering, chat/locale
persistence across reload, a styled-404 check, axe-core WCAG 2.1 AA audits on every
page, and zero-horizontal-overflow checks across 5 breakpoints (320px–1920px).

CI (`.github/workflows/ci.yml`) runs all of the above on every push/PR.

## Security

- All API inputs are validated with Zod; invalid payloads return `400` before
  touching any downstream service.
- Per-IP in-memory rate limiting on every AI/data-mutating endpoint.
- Secrets are never committed — `.env.local`/`.env` are gitignored, `.env.example`
  documents every key as an empty placeholder. Database and AI credentials are only
  ever read server-side, never exposed to the client bundle.
- Security headers on every response (`next.config.ts`): `Content-Security-Policy`,
  `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`,
  `Cross-Origin-Resource-Policy`.
- CSP restricts `default-src`/`connect-src`/`font-src` to `'self'`, blocks
  `object-src` and framing entirely. `script-src` includes `'unsafe-inline'` as a
  deliberate, scoped trade-off (App Router's hydration payload needs it in this Next
  version); `'self'` is still required, so no cross-origin script can load.
- Session cookie is `httpOnly`, `SameSite=lax`, `Secure` in production, and
  HMAC-SHA256 signed — tampering is detected and rejected rather than trusted.
- Uploaded files are validated server-side (MIME allowlist: `application/pdf`,
  `text/plain`; 5MB size ceiling) before any parsing is attempted.
- Every external/database call fails safe: AI and DB failures degrade to a fallback
  response instead of crashing a request or page — see `app/api/chat/route.ts`,
  `app/api/analyze/route.ts`, and `app/error.tsx`/`app/not-found.tsx`.
- In-memory fallbacks are anchored on `globalThis` (`lib/global-store.ts`), not plain
  module-level variables — Next.js can otherwise instantiate the same module
  separately for Route Handlers vs. Server Component pages, silently splitting state.
- Optional login gate (`APP_USERS`, `lib/auth.ts`) compares passwords with a
  constant-time comparison, not `===`, to avoid timing side-channels, and always
  performs a comparison even for an unknown username so "wrong password" and
  "unknown user" take the same amount of time. Login attempts are rate-limited
  per-IP like every other mutating endpoint. If `APP_USERS` is set without
  `SESSION_SECRET`, the gate deliberately stays open (with a logged warning)
  instead of shipping a login screen that can't actually verify sessions — see
  `lib/auth.ts`'s `isAuthConfigured()`.

## Accessibility

- Semantic landmarks, skip-to-content link, and labeled form controls throughout.
- Single fixed light theme tuned so the accent color meets WCAG AA contrast (validated
  by the axe-core suite).
- Chat log uses `aria-live="polite"` so screen readers announce new assistant replies.
- Fully responsive from 320px mobile through ultrawide desktop, with an automated
  regression test guarding it.

## AI transparency

Every chat reply and document analysis has a **"View AI prompt"** toggle right below
it, showing the exact system prompt and user/document content that was sent to the
model (or a note explaining why no AI call was made, in fallback mode). This isn't
just a debugging aid — it's meant to make the GenAI integration verifiable rather
than a black box, and it's the recommended thing to click on-camera when
demonstrating the AI features (see `DEMO_VIDEO_GUIDE.md`).

## Rubric alignment

| Parameter | Where it's addressed |
| --- | --- |
| Code Quality | TypeScript strict mode + `noUncheckedIndexedAccess`, ESLint flat config, zero lint/typecheck errors, dual-mode `lib/*` modules with a single clear responsibility each |
| Security | See [Security](#security) above — Zod validation, rate limiting, signed httpOnly cookies, CSP/security headers, gitignored secrets |
| Efficiency | Every AI call has a 12s timeout that degrades to a working fallback answer instead of hanging; in-memory fallback avoids a hard DB dependency on the request path |
| Testing | 104 Vitest unit tests across every `lib/` module and component (incl. simulated DB-failure tests, the auth-gating middleware, and real non-mocked PDF parsing) + Playwright e2e specs for navigation, responsive layout, and accessibility — see [Testing](#testing) |
| Accessibility | See [Accessibility](#accessibility) above |
| Problem Statement Alignment | See the pillar/feature table at the top of this README — every clause of "understand, compare, and navigate legal documents" maps to a shipped feature |

---

## Deploying to Vercel

```bash
vercel
```

No build configuration needed — Next.js is auto-detected. Add `GROQ_API_KEY` (free)
and, optionally, `NVIDIA_API_KEY` and the `TURSO_*` variables in the Vercel project's
Environment Variables settings for production behavior beyond fallback mode.
