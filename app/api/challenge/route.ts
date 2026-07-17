import { NextResponse } from "next/server";
import { jsonApiError } from "@/lib/api-errors";
import {
  getOpenAIClient,
  isLocalDemoMockModeEnabled,
  isOpenAIConfigured,
} from "@/lib/openai";
import {
  CHALLENGE_SYSTEM_PROMPT,
  buildChallengeUserPrompt,
  challengeResponseFormat,
} from "@/lib/prompts";
import {
  VALIDATION_LIMITS,
  normalizeChallengeResponse,
  normalizeWordEntry,
  validateTranscript,
} from "@/lib/validators";

export const runtime = "nodejs";

const CHALLENGE_MODEL = process.env.OPENAI_CHALLENGE_MODEL ?? "gpt-4o-mini";

type ChallengeRequestBody = {
  transcript?: unknown;
  targetWord?: unknown;
  wordEntry?: unknown;
};

export async function POST(request: Request) {
  let body: ChallengeRequestBody;

  try {
    body = (await request.json()) as ChallengeRequestBody;
  } catch {
    return jsonApiError(
      "Send a JSON body with a transcript and target word.",
      "EMPTY_TRANSCRIPT",
      400,
    );
  }

  const transcriptResult = validateTranscript(
    body.transcript,
    VALIDATION_LIMITS.challengeTranscriptChars,
  );
  const targetWord =
    typeof body.targetWord === "string" ? body.targetWord.trim() : "";
  const wordEntry = normalizeWordEntry(body.wordEntry, targetWord);

  if (!transcriptResult.ok) {
    return jsonApiError(
      transcriptResult.message,
      "EMPTY_TRANSCRIPT",
      transcriptResult.message.includes("under") ? 413 : 400,
    );
  }

  if (!targetWord) {
    return jsonApiError(
      "A target word is required for the daily challenge.",
      "MISSING_TARGET_WORD",
      400,
    );
  }

  const transcript = transcriptResult.value;

  if (!isOpenAIConfigured()) {
    if (isLocalDemoMockModeEnabled()) {
      return NextResponse.json(evaluateChallengeLocally(transcript, targetWord), {
        headers: { "X-Satya-Vachan-Demo-Mode": "true" },
      });
    }

    return jsonApiError(
      "Challenge validation is unavailable because OPENAI_API_KEY is not configured.",
      "MISSING_API_KEY",
      503,
    );
  }

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: CHALLENGE_MODEL,
      messages: [
        { role: "system", content: CHALLENGE_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildChallengeUserPrompt({
            transcript,
            targetWord,
            commonWord: wordEntry.common,
            meaning: wordEntry.englishMeaning,
            usageNote: wordEntry.usageNote,
            challengePrompt: wordEntry.challengePrompt,
            elevatedExample: wordEntry.elevatedExample,
          }),
        },
      ],
      response_format: challengeResponseFormat,
      temperature: 0.25,
    });

    const content = completion.choices[0]?.message.content;

    if (!content) {
      return jsonApiError(
        "The coach returned an empty response. Please try again.",
        "INVALID_MODEL_RESPONSE",
        502,
      );
    }

    const parsed = JSON.parse(content) as unknown;
    const normalized = normalizeChallengeResponse(parsed, transcript);

    if (!normalized) {
      return jsonApiError(
        "The coach response could not be read safely. Please try again.",
        "INVALID_MODEL_RESPONSE",
        502,
      );
    }

    return NextResponse.json(normalized);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonApiError(
        "The coach response was not valid JSON. Please try again.",
        "INVALID_MODEL_RESPONSE",
        502,
      );
    }

    console.error("Satya-Vachan challenge validation failed", error);

    return jsonApiError(
      "Challenge validation failed. Please retry with the same sentence.",
      "CHALLENGE_FAILED",
      502,
    );
  }
}

function evaluateChallengeLocally(transcript: string, targetWord: string) {
  const usedTargetWord = containsTargetWord(transcript, targetWord);
  const reasonableLength =
    transcript.trim().length >= 18 && transcript.trim().split(/\s+/).length >= 4;

  if (!usedTargetWord) {
    return {
      transcript,
      usedTargetWord: false,
      acceptableUsage: false,
      feedback: `Demo mode: OpenAI is not configured, so this used a local check. Add "${targetWord}" directly to your sentence and try again.`,
      suggestedImprovement: `${targetWord} shabd ka prayog karte hue ek poora vaakya kahiye.`,
      completed: false,
    };
  }

  if (!reasonableLength) {
    return {
      transcript,
      usedTargetWord: true,
      acceptableUsage: false,
      feedback:
        "Demo mode: OpenAI is not configured, so this used a local check. The word appears; now use it in a fuller natural sentence.",
      completed: false,
    };
  }

  return {
    transcript,
    usedTargetWord: true,
    acceptableUsage: true,
    feedback:
      "Demo mode: OpenAI is not configured, so this used a local check. The target word appears in a complete sentence.",
    completed: true,
  };
}

function containsTargetWord(transcript: string, targetWord: string) {
  const normalizedTranscript = normalizeForMatch(transcript);
  const normalizedTarget = normalizeForMatch(targetWord);
  const compactTranscript = compactLongVowels(normalizedTranscript);
  const compactTarget = compactLongVowels(normalizedTarget);

  return (
    hasTokenMatch(normalizedTranscript, normalizedTarget) ||
    hasTokenMatch(compactTranscript, compactTarget)
  );
}

function hasTokenMatch(transcript: string, targetWord: string) {
  if (!targetWord) {
    return false;
  }

  const escapedTarget = targetWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escapedTarget}(?=$|\\s)`, "i").test(transcript);
}

function normalizeForMatch(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function compactLongVowels(value: string) {
  return value
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/ii/g, "i")
    .replace(/oo/g, "u")
    .replace(/uu/g, "u");
}
