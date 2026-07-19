# Codex Instructions

## Project overview

Satya-Vachan is a Next.js application that helps fluent Hindi speakers make
everyday Hindi more articulate and graceful. It uses the App Router, React,
TypeScript, Tailwind CSS, OpenAI server-side integrations, and Langfuse
observability.

## Repository layout

- `app/` - routes, layouts, and API route handlers.
- `components/` - reusable UI and feature components.
- `hooks/` - client-side React hooks.
- `lib/` - shared business logic and server-side integrations. Keep OpenAI
  access centralized here or in API routes; never expose secrets to clients.
- `data/` - application data and generated word-corpus inputs/outputs.
- `scripts/` - project automation, including word-corpus generation.
- `types/` - shared TypeScript types.

## Development workflow

Use pnpm (the repository includes `pnpm-lock.yaml`). Run commands from the
repository root:

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The word corpus is generated automatically before development, tests,
type-checking, and production builds. To generate it directly, run:

```bash
pnpm generate:word-corpus
```

Before handing off code changes, run the most relevant checks. For broad
TypeScript or application changes, run `pnpm lint`, `pnpm typecheck`, and
`pnpm test`; use `pnpm build` when practical.

## Implementation conventions

- Prefer small, typed components and functions; avoid `any`.
- Keep client-only behavior in explicitly marked client components and keep
  server-only code out of the browser bundle.
- Preserve the app's graceful fallback behavior when AI credentials are not
  configured.
- Keep Hindi copy in Devanagari where that matches the existing product voice;
  do not alter user-facing wording unnecessarily.
- Follow existing Tailwind and component patterns before adding new styling
  systems or dependencies.
- Avoid manually editing generated corpus output. Update its source or generator
  and regenerate it instead.

## Environment and security

- Never commit, print, or expose values from `.env`, `.env.local`, API keys, or
  Langfuse credentials.
- OpenAI and Langfuse keys must remain server-side and must not use a
  `NEXT_PUBLIC_` prefix.
- Update `.env.example` and `README.md` when adding a required environment
  variable or changing local setup.

## Scope discipline

- Keep changes focused on the requested task and preserve unrelated work in a
  dirty working tree.
- Do not introduce dependencies or perform deployment, external API mutations,
  or repository history rewrites unless explicitly requested.
