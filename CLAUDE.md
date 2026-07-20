# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Satya-Vachan is a Next.js (App Router) application that helps fluent Hindi
speakers make everyday Hindi more articulate and graceful. A user speaks a
Hindi sentence; the app transcribes it, generates a naturally polished
version and a more elevated/literary version, explains the vocabulary
improvements, and lets the user save useful words and complete daily
speaking challenges. Full product vision and design principles are in
`docs/PRODUCT_IDEA.md` — read it before making product-facing changes, and
keep changes aligned with it (elegant/minimal/calm, never a grammar-correction
tool or classroom).

Stack: Next.js, React, TypeScript, Tailwind CSS, OpenAI (server-side only),
Langfuse observability.

## Commands

Use pnpm, run from the repo root.

```bash
pnpm dev              # start dev server (auto-generates word corpus first)
pnpm lint             # eslint .
pnpm typecheck        # tsc --noEmit (auto-generates word corpus first)
pnpm test             # vitest run (auto-generates word corpus first)
pnpm build            # next build (auto-generates word corpus first)
pnpm generate:word-corpus   # regenerate data/word-corpus.generated.json from CSV sources
```

Run a single test file: `pnpm vitest run lib/storage.test.ts`
Run tests matching a name: `pnpm vitest run -t "some test name"`

Tests are colocated with source as `*.test.ts` (e.g. `lib/storage.ts` /
`lib/storage.test.ts`), run under `vitest` with `environment: "node"` and the
`@/` alias mapped to the repo root (see `vitest.config.ts`).

Before handing off broad TypeScript/application changes, run `pnpm lint`,
`pnpm typecheck`, and `pnpm test`; use `pnpm build` when practical.

For any UI change, test with the Playwright MCP server (and Chrome DevTools
MCP if needed) — take screenshots and verify affected pages actually render
correctly, don't rely on type/test checks alone.

## Architecture

### Word corpus generation (build-time data pipeline)

`data/word-corpus.csv` and `data/word-corpus.bilingual.csv` are hand-curated
source data. `scripts/generate-word-corpus.mjs` compiles them into
`data/word-corpus.generated.json`, which the app reads at runtime. This
generation step runs automatically before `dev`, `build`, `test`, and
`typecheck` (see `package.json` `pre*` scripts). Never hand-edit the
generated JSON — edit the CSV sources or the generator script and regenerate.

### Server/client boundary around OpenAI

All OpenAI access is centralized in `lib/openai.ts` (marked `import
"server-only"`) and the API route handlers under `app/api/*/route.ts`
(`challenge`, `transcribe`, `transform`, `tts`). Client components never call
OpenAI directly — they call these routes via `lib/api-client.ts`
(`requestJson`), which handles timeouts, abort signals, and mapping API error
payloads (`lib/api-errors.ts`) to user-safe messages.

- `isOpenAIConfigured()` / `isLangfuseConfigured()` gate optional AI/tracing
  behavior. The app must keep working — with a graceful "unavailable" state —
  when `OPENAI_API_KEY` is not set: static screens, typed-fallback practice,
  saved words, and localStorage progress all still function without it.
- Every AI API route calls `guardAiRequest()` (`lib/api-guard.ts`) first,
  which enforces same-origin requests and a per-IP token-bucket rate limit
  (cost varies per route: transcribe=3, transform=2, tts=2, challenge=1).
- Prompts sent to the LLM live in `lib/prompts.json` (raw text) and are
  wired up with JSON-schema response formats in `lib/prompts.ts`. Treat
  `prompts.json` as the single source of truth for model instructions rather
  than inlining prompt strings elsewhere.
- OPENAI_* model names are independently configurable per task via env vars
  (see `README.md`); `lib/openai-models.ts` resolves them with defaults.

### Observability

`instrumentation.ts` registers an OpenTelemetry Node SDK with a Langfuse span
processor when both `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` are set.
It redacts emails, phone numbers, and card-like numbers from trace payloads
before export — preserve this masking behavior if you touch tracing. OpenAI
calls are wrapped via `observeOpenAI` in `lib/openai.ts` only when Langfuse
is configured.

### Client-side persistence

There is no backend database or user accounts. All user state (learned
words, streaks, practice history, script preference) lives in `localStorage`,
managed through `lib/storage.ts` (see `STORAGE_KEYS`). Reads/writes go
through the hooks/helpers there rather than touching `localStorage` directly
elsewhere, and cross-tab/cross-component sync uses custom events
(`satya-vachan:preferences`, `satya-vachan:streak`).

### Directory layout

- `app/` — routes/layouts (`practice`, `challenge`, `learned`) and API route
  handlers under `app/api/`.
- `components/` — feature-organized: `audio/`, `challenge/`, `hindi/`,
  `home/`, `layout/`, `practice/`, `ui/`.
- `hooks/` — client-side React hooks (e.g. `useTranscription`).
- `lib/` — shared business logic, validators, OpenAI/Langfuse integration,
  storage, prompt registry. Keep server-only integrations here or in API
  routes.
- `data/` — word corpus CSV sources + generated JSON, demo/seed data,
  taglines.
- `types/` — shared TypeScript types (`WordEntry`, `PracticeResponse`,
  `LearnedWord`, `ChallengeResponse`, etc. — see `types/index.ts`).
- `scripts/` — project automation (word corpus generation).
- `docs/PRODUCT_IDEA.md` — product vision/spec; consult for any user-facing
  change.

## Conventions

- Prefer small, typed components/functions; avoid `any`.
- Keep client-only behavior in explicitly marked `"use client"` components;
  keep server-only code (OpenAI, Langfuse keys) out of the browser bundle —
  never use a `NEXT_PUBLIC_` prefix for secrets.
- Keep Hindi copy in Devanagari where that matches existing product voice; do
  not alter user-facing wording unnecessarily.
- Follow existing Tailwind and component patterns before adding new styling
  systems or dependencies.
- Never commit, print, or expose `.env`/`.env.local` values, OpenAI keys, or
  Langfuse credentials. Update `.env.example` and `README.md` together when
  adding a required environment variable.
- Keep changes scoped to the requested task; don't introduce new dependencies
  or perform deployment/external API mutations/history rewrites unless asked.
