import { NextResponse } from "next/server";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";
import {
  TRANSFORMATION_SYSTEM_PROMPT,
  buildTransformationUserPrompt,
  transformationResponseFormat,
} from "@/lib/prompts";
import type {
  LearnedWordInput,
  PracticeResponse,
  RegisterLevel,
  WordReplacement,
} from "@/types";

export const runtime = "nodejs";

const MAX_TRANSCRIPT_CHARS = 1000;
const TRANSFORM_MODEL = process.env.OPENAI_TRANSFORM_MODEL ?? "gpt-4o-mini";
const REGISTER_LEVELS = new Set<RegisterLevel>([
  "common",
  "formal",
  "literary",
]);

type TransformErrorCode =
  | "EMPTY_TRANSCRIPT"
  | "MISSING_API_KEY"
  | "TRANSFORM_FAILED"
  | "INVALID_MODEL_RESPONSE";

type TransformRequestBody = {
  transcript?: unknown;
};

function errorResponse(
  error: string,
  code: TransformErrorCode,
  status: number,
) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(request: Request) {
  if (!isOpenAIConfigured()) {
    return errorResponse(
      "Transformation is unavailable because OPENAI_API_KEY is not configured.",
      "MISSING_API_KEY",
      503,
    );
  }

  let body: TransformRequestBody;

  try {
    body = (await request.json()) as TransformRequestBody;
  } catch {
    return errorResponse(
      "Send a JSON body with a transcript.",
      "EMPTY_TRANSCRIPT",
      400,
    );
  }

  const transcript =
    typeof body.transcript === "string" ? body.transcript.trim() : "";

  if (!transcript) {
    return errorResponse(
      "Please add a sentence before polishing it.",
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

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: TRANSFORM_MODEL,
      messages: [
        { role: "system", content: TRANSFORMATION_SYSTEM_PROMPT },
        { role: "user", content: buildTransformationUserPrompt(transcript) },
      ],
      response_format: transformationResponseFormat,
      temperature: 0.45,
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
    const normalized = normalizePracticeResponse(parsed, transcript);

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

    console.error("Satya-Vachan transformation failed", error);

    return errorResponse(
      "Transformation failed. Please retry with the same transcript.",
      "TRANSFORM_FAILED",
      502,
    );
  }
}

function normalizePracticeResponse(
  rawValue: unknown,
  originalTranscript: string,
): PracticeResponse | null {
  if (!isRecord(rawValue)) {
    return null;
  }

  const naturalPolishedVersion = getTrimmedString(
    rawValue.naturalPolishedVersion,
  );
  const elevatedVersion = getTrimmedString(rawValue.elevatedVersion);
  const feedback = getTrimmedString(rawValue.feedback);

  if (!naturalPolishedVersion || !elevatedVersion || !feedback) {
    return null;
  }

  const originalEleganceScore = clampScore(rawValue.originalEleganceScore);
  let improvedEleganceScore = clampScore(rawValue.improvedEleganceScore);

  if (improvedEleganceScore < originalEleganceScore) {
    improvedEleganceScore = originalEleganceScore;
  }

  if (
    improvedEleganceScore === originalEleganceScore &&
    naturalPolishedVersion !== originalTranscript
  ) {
    improvedEleganceScore = Math.min(100, originalEleganceScore + 5);
  }

  const replacements = Array.isArray(rawValue.replacements)
    ? rawValue.replacements
        .map(normalizeReplacement)
        .filter((replacement): replacement is WordReplacement =>
          Boolean(replacement),
        )
        .slice(0, 6)
    : [];

  const saveableWords = Array.isArray(rawValue.saveableWords)
    ? rawValue.saveableWords
        .map(normalizeSaveableWord)
        .filter((word): word is LearnedWordInput => Boolean(word))
        .slice(0, 6)
    : [];

  return {
    transcript: originalTranscript,
    naturalPolishedVersion,
    elevatedVersion,
    originalEleganceScore,
    improvedEleganceScore,
    feedback,
    replacements,
    saveableWords,
  };
}

function normalizeReplacement(rawValue: unknown): WordReplacement | null {
  if (!isRecord(rawValue)) {
    return null;
  }

  const original = getTrimmedString(rawValue.original);
  const replacement = getTrimmedString(rawValue.replacement);
  const meaning = getTrimmedString(rawValue.meaning);

  if (!original || !replacement || !meaning) {
    return null;
  }

  const naturalness = getRegisterLevel(rawValue.naturalness);

  return {
    original,
    replacement,
    meaning,
    whyBetter:
      getTrimmedString(rawValue.whyBetter) ??
      `${replacement} is a more polished option in this sentence.`,
    naturalness,
  };
}

function normalizeSaveableWord(rawValue: unknown): LearnedWordInput | null {
  if (!isRecord(rawValue)) {
    return null;
  }

  const word = getTrimmedString(rawValue.word);
  const meaning = getTrimmedString(rawValue.meaning);
  const exampleSentence = getTrimmedString(rawValue.exampleSentence);

  if (!word || !meaning || !exampleSentence) {
    return null;
  }

  const simpleAlternative = getTrimmedString(rawValue.simpleAlternative);

  return {
    word,
    meaning,
    ...(simpleAlternative ? { simpleAlternative } : {}),
    exampleSentence,
  };
}

function clampScore(value: unknown) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 50;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function getRegisterLevel(value: unknown): RegisterLevel {
  if (typeof value === "string" && REGISTER_LEVELS.has(value as RegisterLevel)) {
    return value as RegisterLevel;
  }

  return "formal";
}

function getTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
