import { NextResponse } from "next/server";
import { jsonApiError } from "@/lib/api-errors";
import { guardAiRequest } from "@/lib/api-guard";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";
import { OPENAI_MODELS } from "@/lib/openai-models";
import { PROMPTS } from "@/lib/prompts";
import { validateTtsText } from "@/lib/validators";
import type { TtsResponse } from "@/types";

export const runtime = "nodejs";

const TTS_INSTRUCTIONS = PROMPTS.tts.instruction;
const TTS_SPEED = PROMPTS.tts.speed;

type TtsVariant = "natural" | "elevated";

type TtsRequestBody = {
  text?: unknown;
  variant?: unknown;
};

const TTS_VARIANTS = new Set<TtsVariant>(["natural", "elevated"]);

export async function POST(request: Request) {
  const guardResponse = guardAiRequest(request, "tts");

  if (guardResponse) {
    return guardResponse;
  }

  let body: TtsRequestBody;

  try {
    body = (await request.json()) as TtsRequestBody;
  } catch {
    return jsonApiError("Send a JSON body with text to speak.", "EMPTY_TEXT", 400);
  }

  const textResult = validateTtsText(body.text);

  if (!textResult.ok) {
    return jsonApiError(
      textResult.message,
      textResult.message.includes("under") ? "TEXT_TOO_LONG" : "EMPTY_TEXT",
      textResult.message.includes("under") ? 413 : 400,
    );
  }

  const text = textResult.value;
  const variant = getVariant(body.variant);

  if (!variant) {
    return jsonApiError("Choose a recognized audio variant.", "INVALID_REQUEST", 400);
  }

  if (!isOpenAIConfigured()) {
    return jsonApiError(
      "AI audio is unavailable. Your polished text is still available.",
      "MISSING_API_KEY",
      503,
    );
  }

  try {
    const speech = await getOpenAIClient({
      traceName: "synthesize-practice-audio",
      generationName: "synthesize-hindi-speech",
      tags: ["satya-vachan", "text-to-speech"],
      generationMetadata: {
        feature: "text-to-speech",
        language: "hi",
        variant,
        voice: "male",
      },
    }).audio.speech.create({
      model: OPENAI_MODELS.textToSpeech,
      voice: "onyx",
      input: text,
      instructions: getInstructions(variant),
      response_format: "mp3",
      speed: TTS_SPEED,
    });
    const audioBuffer = Buffer.from(await speech.arrayBuffer());
    const response: TtsResponse = {
      audioBase64: audioBuffer.toString("base64"),
      mimeType: "audio/mpeg",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Satya-Vachan TTS failed", error);

    return jsonApiError(
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
