import { NextResponse } from "next/server";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";
import type { TtsResponse } from "@/types";

export const runtime = "nodejs";

const MAX_TTS_CHARS = 800;
const TTS_MODEL = "gpt-4o-mini-tts";
const TTS_VOICE = "sage";
const TTS_INSTRUCTIONS =
  "Speak in clear, polished Hindi with a calm teacher-like tone. Pronounce Sanskritized Hindi words carefully. Keep the delivery natural, not theatrical.";

type TtsVariant = "natural" | "elevated";

type TtsRequestBody = {
  text?: unknown;
  variant?: unknown;
};

type TtsErrorCode =
  | "EMPTY_TEXT"
  | "TEXT_TOO_LONG"
  | "MISSING_API_KEY"
  | "TTS_FAILED";

const TTS_VARIANTS = new Set<TtsVariant>(["natural", "elevated"]);

function errorResponse(error: string, code: TtsErrorCode, status: number) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(request: Request) {
  let body: TtsRequestBody;

  try {
    body = (await request.json()) as TtsRequestBody;
  } catch {
    return errorResponse("Send a JSON body with text to speak.", "EMPTY_TEXT", 400);
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return errorResponse("Please add text before requesting audio.", "EMPTY_TEXT", 400);
  }

  if (text.length > MAX_TTS_CHARS) {
    return errorResponse(
      `Please keep TTS text under ${MAX_TTS_CHARS} characters.`,
      "TEXT_TOO_LONG",
      413,
    );
  }

  const variant = getVariant(body.variant);

  if (!variant) {
    return errorResponse("Choose a recognized audio variant.", "TTS_FAILED", 400);
  }

  if (!isOpenAIConfigured()) {
    return errorResponse(
      "Text-to-speech is unavailable because OPENAI_API_KEY is not configured.",
      "MISSING_API_KEY",
      503,
    );
  }

  try {
    const speech = await getOpenAIClient().audio.speech.create({
      model: TTS_MODEL,
      voice: TTS_VOICE,
      input: text,
      instructions: getInstructions(variant),
      response_format: "mp3",
    });
    const audioBuffer = Buffer.from(await speech.arrayBuffer());
    const response: TtsResponse = {
      audioBase64: audioBuffer.toString("base64"),
      mimeType: "audio/mpeg",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Satya-Vachan TTS failed", error);

    return errorResponse(
      "Audio generation failed. Your polished text is still available.",
      "TTS_FAILED",
      502,
    );
  }
}

function getVariant(value: unknown): TtsVariant | null {
  if (value === undefined || value === null || value === "") {
    return "natural";
  }

  return typeof value === "string" && TTS_VARIANTS.has(value as TtsVariant)
    ? (value as TtsVariant)
    : null;
}

function getInstructions(variant: TtsVariant) {
  if (variant === "elevated") {
    return `${TTS_INSTRUCTIONS} Slightly slow down for elevated vocabulary while keeping the sentence conversational.`;
  }

  return TTS_INSTRUCTIONS;
}
