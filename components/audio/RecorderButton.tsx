"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Mic,
  RotateCcw,
  Square,
  Upload,
} from "lucide-react";
import {
  DEFAULT_MAX_RECORDING_MS,
  createRecordingBlob,
  createRecordingResult,
  formatRecordingDuration,
  getSupportedRecordingMimeType,
  isMediaRecorderSupported,
  requestMicrophoneStream,
  stopMediaStreamTracks,
} from "@/lib/audio";
import { cn } from "@/lib/utils";
import type { RecordingResult } from "@/types";

export type RecorderState =
  | "unsupported"
  | "permission-needed"
  | "idle"
  | "recording"
  | "stopping"
  | "recorded"
  | "error";

type RecorderButtonProps = {
  className?: string;
  disabled?: boolean;
  maxDurationMs?: number;
  onDiscard?: () => void;
  onProcess?: (recording: RecordingResult) => void;
  onRecordingComplete?: (recording: RecordingResult) => void;
  onStateChange?: (state: RecorderState) => void;
};

export function RecorderButton({
  className,
  disabled = false,
  maxDurationMs = DEFAULT_MAX_RECORDING_MS,
  onDiscard,
  onProcess,
  onRecordingComplete,
  onStateChange,
}: RecorderButtonProps) {
  const [state, setState] = useState<RecorderState>("permission-needed");
  const [durationMs, setDurationMs] = useState(0);
  const [recording, setRecording] = useState<RecordingResult | null>(null);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<RecorderState>("permission-needed");

  const maxDurationLabel = useMemo(
    () => formatRecordingDuration(maxDurationMs),
    [maxDurationMs],
  );

  const setRecorderState = useCallback(
    (nextState: RecorderState) => {
      stateRef.current = nextState;
      setState(nextState);
      onStateChange?.(nextState);
    },
    [onStateChange],
  );

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  const cleanupRecorder = useCallback(() => {
    clearTimers();
    stopMediaStreamTracks(streamRef.current);
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, [clearTimers]);

  const stopRecording = useCallback(() => {
    if (stateRef.current !== "recording") {
      return;
    }

    setRecorderState("stopping");
    clearTimers();

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    cleanupRecorder();
    setRecorderState("error");
    setError("Recording stopped before audio was captured. Please try again.");
  }, [cleanupRecorder, clearTimers, setRecorderState]);

  useEffect(() => {
    let unsupportedTimer: ReturnType<typeof setTimeout> | null = null;

    if (!isMediaRecorderSupported()) {
      unsupportedTimer = setTimeout(() => {
        setRecorderState("unsupported");
      }, 0);
    }

    return () => {
      if (unsupportedTimer) {
        clearTimeout(unsupportedTimer);
      }

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }

      cleanupRecorder();
    };
  }, [cleanupRecorder, setRecorderState]);

  const startRecording = async () => {
    if (disabled || state === "recording" || state === "stopping") {
      return;
    }

    if (!isMediaRecorderSupported()) {
      setRecorderState("unsupported");
      return;
    }

    try {
      setError("");
      setRecording(null);
      setDurationMs(0);
      chunksRef.current = [];

      const stream = await requestMicrophoneStream();
      const mimeType = getSupportedRecordingMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        cleanupRecorder();
        setRecorderState("error");
        setError("The browser could not finish the recording. Please try again.");
      };

      recorder.onstop = () => {
        const measuredDurationMs = Date.now() - startedAtRef.current;
        const blob = createRecordingBlob(chunksRef.current, mimeType);

        cleanupRecorder();

        if (blob.size === 0) {
          setRecorderState("error");
          setError("No audio was captured. Please record again.");
          return;
        }

        const nextRecording = createRecordingResult(
          blob,
          mimeType,
          Math.min(measuredDurationMs, maxDurationMs),
        );

        setRecording(nextRecording);
        setDurationMs(nextRecording.durationMs);
        setRecorderState("recorded");
        onRecordingComplete?.(nextRecording);
      };

      recorder.start();
      setRecorderState("recording");

      intervalRef.current = setInterval(() => {
        setDurationMs(Math.min(Date.now() - startedAtRef.current, maxDurationMs));
      }, 250);

      maxTimerRef.current = setTimeout(stopRecording, maxDurationMs);
    } catch (caughtError) {
      cleanupRecorder();
      setRecorderState("error");

      if (
        caughtError instanceof DOMException &&
        (caughtError.name === "NotAllowedError" ||
          caughtError.name === "PermissionDeniedError")
      ) {
        setError(
          "Microphone permission was denied. You can still type your sentence below.",
        );
        return;
      }

      setError("Microphone access failed. You can still use typed practice.");
    }
  };

  const discardRecording = () => {
    if (state === "recording" || state === "stopping") {
      return;
    }

    setRecording(null);
    setDurationMs(0);
    setError("");
    setRecorderState(isMediaRecorderSupported() ? "idle" : "unsupported");
    onDiscard?.();
  };

  const processRecording = () => {
    if (!recording) {
      setError("Record a sentence first, or type it in the transcript box.");
      setRecorderState("error");
      return;
    }

    onProcess?.(recording);
  };

  if (state === "unsupported") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-amber-200/70 bg-amber-100/40 p-4 text-sm leading-6 text-amber-950 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
          <div>
            <p className="font-bold">Recording is not supported here.</p>
            <p className="mt-1">
              Type your Hindi sentence in the transcript box to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/60 bg-white/35 p-4 dark:border-white/12 dark:bg-white/5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "relative grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400/18 text-amber-700 shadow-glow dark:text-amber-200",
            state === "recording" &&
              "before:absolute before:inset-0 before:rounded-2xl before:bg-rose-400/30 before:motion-safe:animate-ping",
          )}
        >
          {state === "recorded" ? (
            <CheckCircle2 size={21} aria-hidden="true" />
          ) : (
            <Mic size={21} aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-ink dark:text-white">
                {getTitle(state)}
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                {getDescription(state, maxDurationLabel)}
              </p>
            </div>
            <span className="rounded-full border border-white/55 bg-white/55 px-3 py-1 text-xs font-bold text-zinc-700 dark:border-white/12 dark:bg-white/8 dark:text-zinc-200">
              {formatRecordingDuration(durationMs)}
            </span>
          </div>

          {state === "recording" ? (
            <div className="mt-4 flex h-8 items-end gap-1" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, index) => (
                <span
                  key={index}
                  className="w-full origin-bottom rounded-full bg-rose-400/70 motion-safe:animate-wave dark:bg-rose-300/80"
                  style={{
                    height: `${28 + ((index * 17) % 48)}%`,
                    animationDelay: `${index * 60}ms`,
                  }}
                />
              ))}
            </div>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm leading-6 text-rose-800 dark:text-rose-100">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {state === "recording" || state === "stopping" ? (
              <button
                type="button"
                onClick={stopRecording}
                disabled={disabled || state === "stopping"}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-rose-900/15 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-rose-400/45 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:bg-zinc-500 dark:focus:ring-offset-zinc-950"
              >
                <Square size={16} aria-hidden="true" />
                {state === "stopping" ? "Stopping..." : "Stop recording"}
              </button>
            ) : null}

            {state !== "recording" && state !== "stopping" ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={disabled}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-2 text-sm font-bold text-white shadow-lg shadow-zinc-900/15 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ink/40 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:shadow-none dark:bg-white dark:text-zinc-950 dark:focus:ring-white/40 dark:focus:ring-offset-zinc-950"
              >
                <Mic size={16} aria-hidden="true" />
                {state === "recorded" ? "Record again" : "Start recording"}
              </button>
            ) : null}

            {state === "recorded" ? (
              <>
                <button
                  type="button"
                  onClick={processRecording}
                  disabled={disabled || !recording}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-400/45 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:bg-zinc-500 dark:focus:ring-offset-zinc-950"
                >
                  <Upload size={16} aria-hidden="true" />
                  Use recording
                </button>
                <button
                  type="button"
                  onClick={discardRecording}
                  disabled={disabled}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-4 py-2 text-sm font-bold text-ink shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/12 dark:bg-white/10 dark:text-white dark:focus:ring-offset-zinc-950"
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  Discard
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTitle(state: RecorderState) {
  switch (state) {
    case "recording":
      return "Recording your sentence";
    case "stopping":
      return "Saving recording";
    case "recorded":
      return "Recording ready";
    case "error":
      return "Recording needs attention";
    case "permission-needed":
    case "idle":
    default:
      return "Speak instead of typing";
  }
}

function getDescription(state: RecorderState, maxDurationLabel: string) {
  switch (state) {
    case "recording":
      return `Speak naturally. Recording stops automatically at ${maxDurationLabel}.`;
    case "stopping":
      return "Preparing the audio for transcription.";
    case "recorded":
      return "This recording is ready to transcribe.";
    case "error":
      return "Try again, or continue with the typed transcript fallback.";
    case "permission-needed":
      return "Allow microphone access when prompted, or type below.";
    case "idle":
    default:
      return `Record up to ${maxDurationLabel}, then use or discard it.`;
  }
}
