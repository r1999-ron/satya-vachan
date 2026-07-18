"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  isApiRequestErrorCode,
  requestJson,
} from "@/lib/api-client";
import { recordingToFile } from "@/lib/audio";
import { isRecord } from "@/lib/validators";
import type { RecordingResult } from "@/types";

type UseTranscriptionOptions = {
  onError: (error: string) => void;
  onStart: (recording: RecordingResult) => void;
  onSuccess: (transcript: string) => void;
};

const TRANSCRIPTION_ERROR = "Transcription failed. Please type your sentence.";

export function useTranscription({
  onError,
  onStart,
  onSuccess,
}: UseTranscriptionOptions) {
  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  return useCallback(
    async (recording: RecordingResult) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      onStart(recording);

      try {
        const formData = new FormData();
        formData.append("file", recordingToFile(recording));
        formData.append("durationMs", String(recording.durationMs));

        const payload = await requestJson<{ transcript: string }>("/api/transcribe", {
          method: "POST",
          body: formData,
          signal: controller.signal,
          fallbackMessage: TRANSCRIPTION_ERROR,
          timeoutMs: 30_000,
          validate: (value) => {
            const transcript =
              isRecord(value) && typeof value.transcript === "string"
                ? value.transcript.trim()
                : "";

            return transcript ? { transcript } : null;
          },
        });

        if (isMountedRef.current && abortRef.current === controller) {
          onSuccess(payload.transcript);
        }
      } catch (error) {
        if (
          !isApiRequestErrorCode(error, "ABORTED") &&
          isMountedRef.current &&
          abortRef.current === controller
        ) {
          onError(error instanceof Error ? error.message : TRANSCRIPTION_ERROR);
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [onError, onStart, onSuccess],
  );
}
