import { NextResponse } from "next/server";
import { jsonApiError } from "@/lib/api-errors";
import { guardAiRequest } from "@/lib/api-guard";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";
import { OPENAI_MODELS } from "@/lib/openai-models";
import {
  PROMPTS,
  TRANSCRIPT_FORMATTING_SYSTEM_PROMPT,
  buildTranscriptFormattingUserPrompt,
  transcriptFormattingResponseFormat,
} from "@/lib/prompts";
import { getTrimmedString, isRecord, validateAudioFile } from "@/lib/validators";

export const runtime = "nodejs";

const TRANSCRIPT_FORMAT_MAX_TOKENS = 500;

function isPromptEcho(transcript: string) {
  const normalize = (value: string) =>
    value
      .normalize("NFKC")
      .toLocaleLowerCase("en-US")
      .replace(/[\p{P}\p{S}\s]+/gu, "");

  return normalize(transcript) === normalize(PROMPTS.transcription.instruction);
}

function getDurationMs(formData: FormData) {
  const rawDuration = formData.get("durationMs");
  const numericDuration =
    typeof rawDuration === "string" ? Number(rawDuration) : Number.NaN;

  return Number.isFinite(numericDuration) && numericDuration > 0
    ? Math.round(numericDuration)
    : undefined;
}

function parseFormattedTranscript(content: string | null | undefined) {
  if (!content) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(content) as unknown;
    return isRecord(parsed) ? getTrimmedString(parsed.transcript) : undefined;
  } catch {
    return undefined;
  }
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
    const transcription = await getOpenAIClient({
      traceName: "transcribe-practice-audio",
      generationName: "transcribe-hindi-audio",
      tags: ["satya-vachan", "transcription"],
      generationMetadata: {
        feature: "transcription",
        language: "hi",
      },
    }).audio.transcriptions.create({
      file: fileResult.value,
      model: OPENAI_MODELS.transcription,
      language: "hi",
      response_format: "json",
      prompt: PROMPTS.transcription.instruction,
    });
    const rawTranscript = transcription.text.trim();

    // The transcription model can return the supplied prompt verbatim for silent
    // recordings. Treat that as no speech so it never appears in the transcript box.
    if (!rawTranscript || isPromptEcho(rawTranscript)) {
      return jsonApiError(
        "No speech was detected. Please try again or type your sentence.",
        "TRANSCRIPTION_FAILED",
        422,
      );
    }

    const formattingCompletion = await getOpenAIClient({
      traceName: "format-microphone-transcript",
      generationName: "format-mixed-script-hinglish",
      tags: ["satya-vachan", "transcription", "hinglish-formatting"],
      generationMetadata: {
        feature: "transcript-formatting",
        source: "microphone",
        script: "devanagari-latin",
      },
    }).chat.completions.create({
      model: OPENAI_MODELS.transcriptFormatting,
      messages: [
        { role: "system", content: TRANSCRIPT_FORMATTING_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildTranscriptFormattingUserPrompt(rawTranscript),
        },
      ],
      response_format: transcriptFormattingResponseFormat,
      temperature: 0,
      max_completion_tokens: TRANSCRIPT_FORMAT_MAX_TOKENS,
    });
    const formattingContent = formattingCompletion.choices[0]?.message.content;
    const transcript = parseFormattedTranscript(formattingContent);

    if (!transcript) {
      return jsonApiError(
        "The transcript could not be formatted. Please try again or type your sentence.",
        "INVALID_MODEL_RESPONSE",
        502,
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
