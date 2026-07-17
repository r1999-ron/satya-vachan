# Satya-Vachan

Satya-Vachan is an AI-powered Hindi expression coach for fluent Hindi speakers who want to make everyday Hindi sound more polished, articulate, and graceful.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Add your server-side OpenAI key to `.env.local`:

   ```text
   OPENAI_API_KEY=sk-...
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

The app's static screens, localStorage progress, learned words, and typed fallback flows still render without `OPENAI_API_KEY`. AI transcription, transformation, challenge validation, and text-to-speech return a graceful unavailable state until the key is configured.

## Vercel Deployment

1. Import this repository into Vercel as a Next.js project.
2. In Vercel, add the required environment variable:

   ```text
   OPENAI_API_KEY
   ```

3. Deploy with the default framework settings. The API route handlers use the default Node.js serverless runtime for OpenAI SDK compatibility.

No OpenAI key should be exposed with a `NEXT_PUBLIC_` prefix or committed to the repository. Local `.env` files are ignored by git; keep production secrets in Vercel Environment Variables.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
```

## Deployment Readiness Checklist

- `OPENAI_API_KEY` is documented in `.env.example`.
- OpenAI usage is centralized in server-only code under `lib/openai.ts` and API routes.
- API routes are configured for the Node.js runtime.
- Audio uploads are capped at 10 MB and TTS text is capped at 800 characters.
- Missing AI configuration does not break static pages or localStorage-backed features.
