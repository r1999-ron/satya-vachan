import "server-only";

/**
 * Central model registry for every OpenAI request made by the app.
 * Each default can be overridden independently at deployment time.
 */
export const OPENAI_MODELS = {
  transcription:
    process.env.OPENAI_TRANSCRIBE_MODEL?.trim() || "gpt-4o-mini-transcribe",
  transcriptFormatting:
    process.env.OPENAI_TRANSCRIPT_FORMAT_MODEL?.trim() || "gpt-5.4-mini",
  transformation:
    process.env.OPENAI_TRANSFORM_MODEL?.trim() || "gpt-4o-mini",
  challenge:
    process.env.OPENAI_CHALLENGE_MODEL?.trim() || "gpt-4o-mini",
  textToSpeech:
    process.env.OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts",
} as const;
