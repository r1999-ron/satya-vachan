import { NextResponse } from "next/server";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
const HINDI_TRANSCRIPTION_PROMPT =
  "Yeh audio Hindi ya Hinglish mein ho sakta hai. Transcript ko natural Hindi, romanized Hindi, ya Devanagari mein wahi rakhein jo speaker ne kaha hai.";

type TranscriptionErrorCode =
  | "MISSING_FILE"
  | "FILE_TOO_LARGE"
  | "MISSING_API_KEY"
  | "TRANSCRIPTION_FAILED";

function errorResponse(
  error: string,
  code: TranscriptionErrorCode,
  status: number,
) {
  return NextResponse.json({ error, code }, { status });
}

function isSupportedAudioFile(file: File) {
  if (file.type.startsWith("audio/")) {
    return true;
  }

  const lowerName = file.name.toLocaleLowerCase();
  const supportedExtensions = [
    ".flac",
    ".m4a",
    ".mp3",
    ".mp4",
    ".mpeg",
    ".mpga",
    ".ogg",
    ".wav",
    ".webm",
  ];

  return supportedExtensions.some((extension) => lowerName.endsWith(extension));
}

function getDurationMs(formData: FormData) {
  const rawDuration = formData.get("durationMs");
  const numericDuration =
    typeof rawDuration === "string" ? Number(rawDuration) : Number.NaN;

  return Number.isFinite(numericDuration) && numericDuration > 0
    ? Math.round(numericDuration)
    : undefined;
}

export async function POST(request: Request) {
  if (!isOpenAIConfigured()) {
    return errorResponse(
      "Transcription is unavailable because OPENAI_API_KEY is not configured.",
      "MISSING_API_KEY",
      503,
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse(
      "Upload audio as multipart form data.",
      "MISSING_FILE",
      400,
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return errorResponse(
      "Please include a recorded audio file.",
      "MISSING_FILE",
      400,
    );
  }

  if (file.size > MAX_AUDIO_BYTES) {
    return errorResponse(
      "Please keep recordings under 10 MB.",
      "FILE_TOO_LARGE",
      413,
    );
  }

  if (!isSupportedAudioFile(file)) {
    return errorResponse(
      "Please upload a supported audio recording.",
      "TRANSCRIPTION_FAILED",
      415,
    );
  }

  try {
    const transcription = await getOpenAIClient().audio.transcriptions.create({
      file,
      model: TRANSCRIBE_MODEL,
      language: "hi",
      response_format: "json",
      prompt: HINDI_TRANSCRIPTION_PROMPT,
    });
    const transcript = transcription.text.trim();

    if (!transcript) {
      return errorResponse(
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

    return errorResponse(
      "Transcription failed. Please try again or type your sentence.",
      "TRANSCRIPTION_FAILED",
      502,
    );
  }
}
