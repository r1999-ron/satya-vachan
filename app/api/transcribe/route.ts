import { NextResponse } from "next/server";
import { jsonApiError } from "@/lib/api-errors";
import { guardAiRequest } from "@/lib/api-guard";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";
import { validateAudioFile } from "@/lib/validators";

export const runtime = "nodejs";

const TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
const HINDI_TRANSCRIPTION_PROMPT =
  "Yeh audio Hindi ya Hinglish mein ho sakta hai. Transcript ko natural Hindi, romanized Hindi, ya Devanagari mein wahi rakhein jo speaker ne kaha hai.";

function getDurationMs(formData: FormData) {
  const rawDuration = formData.get("durationMs");
  const numericDuration =
    typeof rawDuration === "string" ? Number(rawDuration) : Number.NaN;

  return Number.isFinite(numericDuration) && numericDuration > 0
    ? Math.round(numericDuration)
    : undefined;
}

export async function POST(request: Request) {
  const guardResponse = guardAiRequest(request, "transcribe");

  if (guardResponse) {
    return guardResponse;
  }

  if (!isOpenAIConfigured()) {
    return jsonApiError(
      "AI service is unavailable. Type your sentence to keep practicing.",
      "MISSING_API_KEY",
      503,
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonApiError(
      "Upload audio as multipart form data.",
      "MISSING_FILE",
      400,
    );
  }

  const file = formData.get("file");
  const fileResult = validateAudioFile(file);

  if (!fileResult.ok) {
    return jsonApiError(
      fileResult.message,
      fileResult.message.includes("10 MB")
        ? "FILE_TOO_LARGE"
        : fileResult.message.includes("supported")
          ? "TRANSCRIPTION_FAILED"
          : "MISSING_FILE",
      fileResult.message.includes("10 MB")
        ? 413
        : fileResult.message.includes("supported")
          ? 415
          : 400,
    );
  }

  try {
    const transcription = await getOpenAIClient().audio.transcriptions.create({
      file: fileResult.value,
      model: TRANSCRIBE_MODEL,
      language: "hi",
      response_format: "json",
      prompt: HINDI_TRANSCRIPTION_PROMPT,
    });
    const transcript = transcription.text.trim();

    if (!transcript) {
      return jsonApiError(
        "No speech was detected. Please try again or type your sentence.",
        "TRANSCRIPTION_FAILED",
        422,
      );
    }

    return NextResponse.json({
      transcript,
      durationMs: getDurationMs(formData),
    });
  } catch (error) {
    console.error("Satya-Vachan transcription failed", error);

    return jsonApiError(
      "Transcription failed. Please try again or type your sentence.",
      "TRANSCRIPTION_FAILED",
      502,
    );
  }
}
