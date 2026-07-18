import { NextResponse } from "next/server";
import { getMockPracticeResponse } from "@/data/demo";
import { jsonApiError } from "@/lib/api-errors";
import { guardAiRequest } from "@/lib/api-guard";
import {
  getOpenAIClient,
  isLocalDemoMockModeEnabled,
  isOpenAIConfigured,
} from "@/lib/openai";
import {
  TRANSFORMATION_SYSTEM_PROMPT,
  buildTransformationUserPrompt,
  transformationResponseFormat,
} from "@/lib/prompts";
import {
  VALIDATION_LIMITS,
  normalizePracticeResponse,
  validateTranscript,
} from "@/lib/validators";

export const runtime = "nodejs";

const TRANSFORM_MODEL = process.env.OPENAI_TRANSFORM_MODEL ?? "gpt-4o-mini";
const TRANSFORM_MAX_TOKENS = 1_400;

type TransformRequestBody = {
  transcript?: unknown;
};

export async function POST(request: Request) {
  const guardResponse = guardAiRequest(request, "transform");

  if (guardResponse) {
    return guardResponse;
  }

  let body: TransformRequestBody;

  try {
    body = (await request.json()) as TransformRequestBody;
  } catch {
    return jsonApiError(
      "Send a JSON body with a transcript.",
      "EMPTY_TRANSCRIPT",
      400,
    );
  }

  const transcriptResult = validateTranscript(
    body.transcript,
    VALIDATION_LIMITS.transcriptChars,
  );

  if (!transcriptResult.ok) {
    return jsonApiError(
      transcriptResult.message,
      "EMPTY_TRANSCRIPT",
      transcriptResult.message.includes("under") ? 413 : 400,
    );
  }

  const transcript = transcriptResult.value;

  if (!isOpenAIConfigured()) {
    if (isLocalDemoMockModeEnabled()) {
      const mockResponse = normalizePracticeResponse(
        {
          ...getMockPracticeResponse(transcript),
          feedback:
            "Demo mode: OpenAI is not configured, so this uses deterministic sample coaching. " +
            getMockPracticeResponse(transcript).feedback,
        },
        transcript,
      );

      if (mockResponse) {
        return NextResponse.json(mockResponse, {
          headers: { "X-Satya-Vachan-Demo-Mode": "true" },
        });
      }
    }

    return jsonApiError(
      "AI service is unavailable. Static screens, saved words, and local progress still work.",
      "MISSING_API_KEY",
      503,
    );
  }

  try {
    const completion = await getOpenAIClient({
      traceName: "transform-expression",
      generationName: "generate-transformation",
      tags: ["satya-vachan", "practice"],
      generationMetadata: {
        feature: "practice",
        responseFormat: "structured-json",
        language: "hi",
      },
    }).chat.completions.create({
      model: TRANSFORM_MODEL,
      messages: [
        { role: "system", content: TRANSFORMATION_SYSTEM_PROMPT },
        { role: "user", content: buildTransformationUserPrompt(transcript) },
      ],
      response_format: transformationResponseFormat,
      temperature: 0.45,
      max_completion_tokens: TRANSFORM_MAX_TOKENS,
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
    const normalized = normalizePracticeResponse(parsed, transcript);

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

    console.error("Satya-Vachan transformation failed", error);

    return jsonApiError(
      "Transformation failed. Please retry with the same transcript.",
      "TRANSFORM_FAILED",
      502,
    );
  }
}
