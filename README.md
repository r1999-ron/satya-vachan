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

The app's static screens, localStorage progress, learned words, and typed fallback flows still render without `OPENAI_API_KEY`. AI transcription, transformation, challenge validation, and text-to-speech return a graceful unavailable state until the key is configured.

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
- OpenAI usage is centralized in server-only code under `lib/openai.ts` and API routes.
- API routes are configured for the Node.js runtime.
- Audio uploads are capped at 10 MB and TTS text is capped at 800 characters.
- Missing AI configuration does not break static pages or localStorage-backed features.
