# Satya-Vachan

![Satya-Vachan application banner](public/application-banner.jpg)

Satya-Vachan is an AI-powered Hindi expression coach for fluent Hindi speakers who want to make everyday Hindi sound more elegant, articulate, and graceful.

## Local Development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Add your server-side OpenAI key to `.env.local`:

   ```text
   OPENAI_API_KEY=sk-...
   ```

   Every OpenAI model can be configured independently. The defaults are:

   ```text
   OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
   OPENAI_TRANSCRIPT_FORMAT_MODEL=gpt-5.4-nano-2026-03-17
   OPENAI_TRANSFORM_MODEL=gpt-4o-mini
   OPENAI_CHALLENGE_MODEL=gpt-4o-mini
   OPENAI_TTS_MODEL=gpt-4o-mini-tts
   ```

   To enable Langfuse tracing, also add the API keys from your Langfuse project:

   ```text
   LANGFUSE_PUBLIC_KEY=pk-lf-...
   LANGFUSE_SECRET_KEY=sk-lf-...
   LANGFUSE_BASE_URL=https://cloud.langfuse.com
   LANGFUSE_TRACING_ENVIRONMENT=development
   ```

   Use `https://us.cloud.langfuse.com` for the US region, or your self-hosted
   Langfuse URL. `LANGFUSE_TRACING_RELEASE` is optional and is useful for
   correlating traces with a deployed application version.

4. Start the app:

   ```bash
   pnpm dev
   ```

   The dev server defaults to port `3345` and binds to all network
   interfaces (`0.0.0.0`), so it's reachable at `http://localhost:3345` as
   well as from other devices on your LAN or Tailscale tailnet at
   `http://<your-machine-name-or-ip>:3345`. To use a different port, pass
   `-p` after `--`, e.g. `pnpm dev -- -p 3000`.

The app's static screens, localStorage progress, learned words, and typed fallback flows still render without `OPENAI_API_KEY`. AI transcription, transformation, challenge validation, and text-to-speech return a graceful unavailable state until the key is configured.

### Accessing over Tailscale

Because the dev/start server listens on all interfaces, any device on the
same Tailscale tailnet can reach it via this machine's Tailscale IP or
MagicDNS name (e.g. `http://100.x.x.x:3345` or
`http://<machine-name>.<tailnet>.ts.net:3345`), once Tailscale is running and
this machine's firewall allows inbound connections on port 3345 for the
Tailscale/Private network profile.

## Google Sign-In and Cloud Sync (optional)

Sign-in is entirely optional. With no Supabase credentials the app runs
guest-only on `localStorage` and no account button appears — exactly how it
behaved before accounts existed. Adding credentials lights up Google sign-in
and cross-device sync without changing the guest experience.

### 1. Create the Supabase project and tables

Create a project at [supabase.com](https://supabase.com), then run
`supabase/migrations/0001_auth_and_user_state.sql` in the SQL Editor. It
creates `profiles` and `user_state`, enables row level security so a user can
only ever read and write their own rows, and adds a trigger that creates a
profile on first sign-in. The script is idempotent.

### 2. Enable Google as an auth provider

In the Supabase dashboard, go to **Authentication → Providers → Google** and
enable it. You need a Google OAuth client from the
[Google Cloud Console](https://console.cloud.google.com/apis/credentials):

- **Authorized JavaScript origins**: your app origin, e.g.
  `http://localhost:3345`
- **Authorized redirect URI**: the callback Supabase shows on that provider
  page, i.e. `https://<project-ref>.supabase.co/auth/v1/callback`

Paste the client ID and secret into Supabase. Then, under **Authentication →
URL Configuration**, add every origin you sign in from to **Redirect URLs**,
including your Tailscale host if you use one:

```text
http://localhost:3345/auth/callback
http://<machine-name>.<tailnet>.ts.net:3345/auth/callback
https://your-production-domain/auth/callback
```

### 3. Add the environment variables

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

Both are browser-facing by design — the anon key is safe to expose because
every table is protected by row level security. Never put the Supabase
**service role** key in this app.

Optionally set `NEXT_PUBLIC_APP_ORIGIN` to pin the OAuth redirect to a fixed
origin; by default the redirect follows whichever origin the request came
from, which is what makes localhost and Tailscale both work.

### How sync works

The app stays **local-first**. `localStorage` remains the synchronous source
of truth every screen reads, so guests are unaffected and a signed-in user
who loses connectivity keeps practising normally. On top of that, signed-in
users get a background cycle:

1. **On sign-in**, the cloud snapshot is pulled and merged with whatever this
   device already has (`lib/sync/merge.ts`).
2. **On any local change**, a debounced push mirrors the snapshot to
   `user_state` via `PUT /api/state`.

The merge is per-key and conservative: saved words union by word keeping the
earliest save date, streak counters take the maximum and completed days take
the union, review schedules keep the most recently reviewed record. Practising
on two devices in the same day cannot lose a word or shorten a streak. A
failed sync is never destructive — local state is intact and the next change
retries.

Signing out leaves local progress on the device, so the user continues as a
guest with the words they already have.

## Vercel Deployment

1. Import this repository into Vercel as a Next.js project.
2. In Vercel, add the required environment variable:

   ```text
   OPENAI_API_KEY
   OPENAI_TRANSCRIBE_MODEL
   OPENAI_TRANSCRIPT_FORMAT_MODEL
   OPENAI_TRANSFORM_MODEL
   OPENAI_CHALLENGE_MODEL
   OPENAI_TTS_MODEL
   LANGFUSE_PUBLIC_KEY
   LANGFUSE_SECRET_KEY
   LANGFUSE_BASE_URL
   LANGFUSE_TRACING_ENVIRONMENT
   ```

   To enable Google sign-in in production, also add
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and add the
   deployed `/auth/callback` URL to the Supabase redirect allowlist.

3. Deploy with the default framework settings. The API route handlers use the default Node.js serverless runtime for OpenAI SDK compatibility.

No OpenAI or Langfuse secret key should be exposed with a `NEXT_PUBLIC_` prefix or committed to the repository. Local `.env` files are ignored by git; keep production secrets in Vercel Environment Variables.

## Langfuse Observability

When both `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` are configured, every
server-side OpenAI call is traced automatically. The trace includes prompts,
model output, model name, token usage, cost, latency, and OpenAI errors. Stable
trace names and feature tags make it easy to compare practice coaching,
challenge validation, transcription, and text-to-speech in Langfuse.

The exporter redacts email addresses, telephone numbers, and card-like numbers
before trace payloads leave the application. Review this policy before enabling
tracing if users may submit other sensitive material in their Hindi practice.

## Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

## Deployment Readiness Checklist

- `OPENAI_API_KEY` is documented in `.env.example`.
- `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, and deployment settings are documented in `.env.example`.
- Supabase auth is optional and gated by `isSupabaseConfigured()`; the app is guest-only without it.
- `user_state` and `profiles` are protected by row level security; only the browser-facing anon key is used.
- OpenAI usage is centralized in server-only code under `lib/openai.ts` and API routes.
- API routes are configured for the Node.js runtime.
- Audio uploads are capped at 10 MB and TTS text is capped at 800 characters.
- Missing AI configuration does not break static pages or localStorage-backed features.
