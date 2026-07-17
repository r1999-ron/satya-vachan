import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "EMPTY_TRANSCRIPT"
  | "EMPTY_TEXT"
  | "TEXT_TOO_LONG"
  | "MISSING_FILE"
  | "FILE_TOO_LARGE"
  | "MISSING_TARGET_WORD"
  | "MISSING_API_KEY"
  | "TRANSCRIPTION_FAILED"
  | "TRANSFORM_FAILED"
  | "CHALLENGE_FAILED"
  | "TTS_FAILED"
  | "INVALID_MODEL_RESPONSE"
  | "INVALID_REQUEST";

export type ApiErrorPayload = {
  error: string;
  code: ApiErrorCode;
};

export function jsonApiError(
  error: string,
  code: ApiErrorCode,
  status: number,
) {
  const payload: ApiErrorPayload = { error, code };
  return NextResponse.json(payload, { status });
}
