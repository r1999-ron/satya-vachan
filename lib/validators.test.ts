import { describe, expect, it } from "vitest";
import {
  VALIDATION_LIMITS,
  getTrimmedString,
  normalizeChallengeResponse,
  normalizePracticeResponse,
  normalizeTtsResponse,
  normalizeWordEntry,
  validateAudioFile,
  validateTranscript,
  validateTtsText,
} from "@/lib/validators";

describe("validators", () => {
  it("trims and collapses strings before applying a length limit", () => {
    expect(getTrimmedString("  kahi   hui\nbaat  ", 20)).toBe("kahi hui baat");
    expect(getTrimmedString("abcdef", 3)).toBe("abc");
    expect(getTrimmedString("   ")).toBeUndefined();
    expect(getTrimmedString(42)).toBeUndefined();
  });

  it("validates transcripts with helpful empty and length errors", () => {
    expect(validateTranscript("  main  seekh raha hoon  ")).toEqual({
      ok: true,
      value: "main seekh raha hoon",
    });

    expect(validateTranscript("")).toEqual({
      ok: false,
      message: "Please add a sentence before continuing.",
    });

    expect(validateTranscript("abcd", 3)).toEqual({
      ok: false,
      message: "Please keep the transcript under 3 characters.",
    });
  });

  it("validates TTS text with the app-specific character limit", () => {
    expect(validateTtsText("  bol kar sunao  ")).toEqual({
      ok: true,
      value: "bol kar sunao",
    });

    expect(validateTtsText("x".repeat(VALIDATION_LIMITS.ttsChars + 1))).toEqual({
      ok: false,
      message: `Please keep TTS text under ${VALIDATION_LIMITS.ttsChars} characters.`,
    });
  });

  it("accepts supported audio files by MIME type or extension", () => {
    const typedFile = new File(["audio"], "recording.bin", { type: "audio/webm" });
    const extensionFile = new File(["audio"], "recording.MP3", {
      type: "application/octet-stream",
    });

    expect(validateAudioFile(typedFile)).toEqual({ ok: true, value: typedFile });
    expect(validateAudioFile(extensionFile)).toEqual({
      ok: true,
      value: extensionFile,
    });
  });

  it("rejects missing, empty, oversized, and unsupported audio files", () => {
    expect(validateAudioFile(null)).toEqual({
      ok: false,
      message: "Please include a recorded audio file.",
    });
    expect(validateAudioFile(new File([], "empty.webm", { type: "audio/webm" }))).toEqual({
      ok: false,
      message: "Please include a recorded audio file.",
    });
    expect(
      validateAudioFile(
        new File([new Uint8Array(VALIDATION_LIMITS.audioBytes + 1)], "large.webm", {
          type: "audio/webm",
        }),
      ),
    ).toEqual({ ok: false, message: "Please keep recordings under 10 MB." });
    expect(validateAudioFile(new File(["text"], "notes.txt", { type: "text/plain" }))).toEqual({
      ok: false,
      message: "Please upload a supported audio recording.",
    });
  });

  it("normalizes practice responses defensively", () => {
    const normalized = normalizePracticeResponse(
      {
        transcript: "  original transcript  ",
        naturalPolishedVersion: "polished transcript",
        elevatedVersion: "elevated transcript",
        replacements: [
          {
            original: "good",
            replacement: "excellent",
            meaning: "very good",
            naturalness: "literary",
          },
          { original: "bad" },
        ],
        saveableWords: [
          {
            word: "excellent",
            meaning: "very good",
            simpleAlternative: "good",
            exampleSentence: "That was excellent work.",
          },
          { word: "skip me" },
        ],
      },
      "fallback transcript",
    );

    expect(normalized).toMatchObject({
      transcript: "original transcript",
      naturalPolishedVersion: { dev: "polished transcript", roman: "polished transcript" },
      elevatedVersion: { dev: "elevated transcript", roman: "elevated transcript" },
    });
    expect(normalized?.replacements).toEqual([
      {
        original: { dev: "good", roman: "good" },
        replacement: { dev: "excellent", roman: "excellent" },
        meaning: "very good",
        whyBetter: "excellent is a more polished option in this sentence.",
        naturalness: "literary",
      },
    ]);
    expect(normalized?.saveableWords).toEqual([
      {
        word: "excellent",
        wordDev: "excellent",
        meaning: "very good",
        simpleAlternative: "good",
        exampleSentence: "That was excellent work.",
      },
    ]);
  });

  it("does not include removed scoring and feedback metadata", () => {
    const normalized = normalizePracticeResponse({
      transcript: "rough words",
      naturalPolishedVersion: "polished words",
      elevatedVersion: "elevated words",
      feedback: "better",
      originalEleganceScore: 98,
      improvedEleganceScore: 98,
    });

    expect(normalized).not.toHaveProperty("feedback");
    expect(normalized).not.toHaveProperty("originalEleganceScore");
    expect(normalized).not.toHaveProperty("improvedEleganceScore");
  });

  it("returns null for unsafe practice responses", () => {
    expect(normalizePracticeResponse(null)).toBeNull();
    expect(
      normalizePracticeResponse({
        transcript: "hello",
        naturalPolishedVersion: "hello",
        elevatedVersion: "",
      }),
    ).toBeNull();
  });

  it("normalizes challenge responses and derives completion from acceptable usage", () => {
    expect(
      normalizeChallengeResponse({
        transcript: "  a complete sentence  ",
        usedTargetWord: true,
        acceptableUsage: true,
        feedback: "  works  ",
        suggestedImprovement: "  ",
      }),
    ).toEqual({
      transcript: "a complete sentence",
      usedTargetWord: true,
      acceptableUsage: true,
      feedback: "works",
      completed: true,
    });

    expect(
      normalizeChallengeResponse({
        transcript: "sentence",
        usedTargetWord: false,
        acceptableUsage: true,
        feedback: "not yet",
      }),
    ).toMatchObject({ acceptableUsage: false, completed: false });
  });

  it("normalizes word entries with defaults and filtered arrays", () => {
    expect(
      normalizeWordEntry(
        {
          id: "  word-1  ",
          common: "  simple  ",
          elevated: "  elevated  ",
          englishMeaning: "  meaning  ",
          synonyms: [" one ", "", 2],
          tags: [" tag ", null],
          difficulty: "expert",
        },
        "fallback",
      ),
    ).toMatchObject({
      id: "word-1",
      common: { dev: "simple", roman: "simple" },
      elevated: { dev: "elevated", roman: "elevated" },
      englishMeaning: "meaning",
      synonyms: [{ dev: "one", roman: "one" }],
      tags: ["tag"],
      difficulty: "easy",
    });

    expect(normalizeWordEntry(null, "fallback")).toMatchObject({
      id: "fallback",
      elevated: { dev: "fallback", roman: "fallback" },
      difficulty: "easy",
    });
  });

  it("normalizes TTS responses", () => {
    expect(normalizeTtsResponse({ audioBase64: "  abc  ", mimeType: "audio/mpeg" })).toEqual({
      audioBase64: "abc",
      mimeType: "audio/mpeg",
    });
    expect(normalizeTtsResponse({ audioBase64: "abc", mimeType: "audio/wav" })).toBeNull();
  });
});
