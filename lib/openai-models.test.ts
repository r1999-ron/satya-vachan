import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("OPENAI_MODELS", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses gpt-4.1-nano for transcript formatting by default", async () => {
    vi.stubEnv("OPENAI_TRANSCRIPT_FORMAT_MODEL", "");

    const { OPENAI_MODELS } = await import("@/lib/openai-models");

    expect(OPENAI_MODELS.transcriptFormatting).toBe("gpt-4.1-nano");
  });

  it("allows every OpenAI model to be configured independently", async () => {
    vi.stubEnv("OPENAI_TRANSCRIBE_MODEL", "custom-transcribe");
    vi.stubEnv("OPENAI_TRANSCRIPT_FORMAT_MODEL", "custom-format");
    vi.stubEnv("OPENAI_TRANSFORM_MODEL", "custom-transform");
    vi.stubEnv("OPENAI_CHALLENGE_MODEL", "custom-challenge");
    vi.stubEnv("OPENAI_TTS_MODEL", "custom-tts");

    const { OPENAI_MODELS } = await import("@/lib/openai-models");

    expect(OPENAI_MODELS).toEqual({
      transcription: "custom-transcribe",
      transcriptFormatting: "custom-format",
      transformation: "custom-transform",
      challenge: "custom-challenge",
      textToSpeech: "custom-tts",
    });
  });
});
