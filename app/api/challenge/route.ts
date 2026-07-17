import { NextResponse } from "next/server";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";
import {
  CHALLENGE_SYSTEM_PROMPT,
  buildChallengeUserPrompt,
  challengeResponseFormat,
} from "@/lib/prompts";
import type { ChallengeResponse, WordEntry } from "@/types";

export const runtime = "nodejs";

const MAX_TRANSCRIPT_CHARS = 800;
const CHALLENGE_MODEL = process.env.OPENAI_CHALLENGE_MODEL ?? "gpt-4o-mini";

type ChallengeErrorCode =
  | "EMPTY_TRANSCRIPT"
  | "MISSING_TARGET_WORD"
  | "MISSING_API_KEY"
  | "CHALLENGE_FAILED"
  | "INVALID_MODEL_RESPONSE";

type ChallengeRequestBody = {
  transcript?: unknown;
  targetWord?: unknown;
  wordEntry?: unknown;
};

function errorResponse(
  error: string,
  code: ChallengeErrorCode,
  status: number,
) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(request: Request) {
  let body: ChallengeRequestBody;

  try {
    body = (await request.json()) as ChallengeRequestBody;
  } catch {
    return errorResponse(
      "Send a JSON body with a transcript and target word.",
      "EMPTY_TRANSCRIPT",
      400,
    );
  }

  const transcript =
    typeof body.transcript === "string" ? body.transcript.trim() : "";
  const targetWord =
    typeof body.targetWord === "string" ? body.targetWord.trim() : "";
  const wordEntry = normalizeWordEntry(body.wordEntry, targetWord);

  if (!transcript) {
    return errorResponse(
      "Please add a sentence before checking the challenge.",
      "EMPTY_TRANSCRIPT",
      400,
    );
  }

  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    return errorResponse(
      `Please keep the transcript under ${MAX_TRANSCRIPT_CHARS} characters.`,
      "EMPTY_TRANSCRIPT",
      413,
    );
  }

  if (!targetWord) {
    return errorResponse(
      "A target word is required for the daily challenge.",
      "MISSING_TARGET_WORD",
      400,
    );
  }

  if (!isOpenAIConfigured()) {
    return errorResponse(
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
      return errorResponse(
        "The coach returned an empty response. Please try again.",
        "INVALID_MODEL_RESPONSE",
        502,
      );
    }

    const parsed = JSON.parse(content) as unknown;
    const normalized = normalizeChallengeResponse(parsed, transcript);

    if (!normalized) {
      return errorResponse(
        "The coach response could not be read safely. Please try again.",
        "INVALID_MODEL_RESPONSE",
        502,
      );
    }

    return NextResponse.json(normalized);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse(
        "The coach response was not valid JSON. Please try again.",
        "INVALID_MODEL_RESPONSE",
        502,
      );
    }

    console.error("Satya-Vachan challenge validation failed", error);

    return errorResponse(
      "Challenge validation failed. Please retry with the same sentence.",
      "CHALLENGE_FAILED",
      502,
    );
  }
}

function normalizeWordEntry(rawValue: unknown, targetWord: string): WordEntry {
  if (!isRecord(rawValue)) {
    return createFallbackWordEntry(targetWord);
  }

  return {
    id: getTrimmedString(rawValue.id) ?? targetWord,
    common: getTrimmedString(rawValue.common) ?? "",
    elevated: getTrimmedString(rawValue.elevated) ?? targetWord,
    englishMeaning: getTrimmedString(rawValue.englishMeaning) ?? "",
    simpleExample: getTrimmedString(rawValue.simpleExample) ?? "",
    elevatedExample: getTrimmedString(rawValue.elevatedExample) ?? "",
    synonyms: Array.isArray(rawValue.synonyms)
      ? rawValue.synonyms.filter((synonym): synonym is string => typeof synonym === "string")
      : [],
    usageNote: getTrimmedString(rawValue.usageNote) ?? "",
    challengePrompt: getTrimmedString(rawValue.challengePrompt) ?? "",
    tags: Array.isArray(rawValue.tags)
      ? rawValue.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    difficulty:
      rawValue.difficulty === "medium" || rawValue.difficulty === "advanced"
        ? rawValue.difficulty
        : "easy",
  };
}

function createFallbackWordEntry(targetWord: string): WordEntry {
  return {
    id: targetWord,
    common: "",
    elevated: targetWord,
    englishMeaning: "",
    simpleExample: "",
    elevatedExample: "",
    synonyms: [],
    usageNote: "",
    challengePrompt: "",
    tags: [],
    difficulty: "easy",
  };
}

function normalizeChallengeResponse(
  rawValue: unknown,
  originalTranscript: string,
): ChallengeResponse | null {
  if (!isRecord(rawValue)) {
    return null;
  }

  const feedback = getTrimmedString(rawValue.feedback);

  if (!feedback) {
    return null;
  }

  const usedTargetWord = Boolean(rawValue.usedTargetWord);
  const acceptableUsage = usedTargetWord && Boolean(rawValue.acceptableUsage);
  const suggestedImprovement = getTrimmedString(rawValue.suggestedImprovement);

  return {
    transcript: originalTranscript,
    usedTargetWord,
    acceptableUsage,
    feedback,
    ...(suggestedImprovement ? { suggestedImprovement } : {}),
    completed: acceptableUsage,
  };
}

function getTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
