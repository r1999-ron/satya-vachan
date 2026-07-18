"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Mic,
  Square,
} from "lucide-react";
import {
  DEFAULT_MAX_RECORDING_MS,
  RECORDING_WAVEFORM_BAR_COUNT,
  createRecordingBlob,
  createRecordingResult,
  formatRecordingDuration,
  getRecordingWaveformLevels,
  getSupportedRecordingMimeType,
  isMediaRecorderSupported,
  requestMicrophoneStream,
  stopMediaStreamTracks,
} from "@/lib/audio";
import { cn } from "@/lib/utils";
import type { RecordingResult } from "@/types";

const INACTIVE_WAVEFORM_LEVELS = Array.from(
  { length: RECORDING_WAVEFORM_BAR_COUNT },
  () => 0.08,
);

const SILENCE_STOP_DELAY_MS = 5_000;
const SILENCE_RMS_THRESHOLD = 0.015;

type WindowWithLegacyAudioContext = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

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
  variant?: "default" | "continuation";
  onRecordingComplete?: (recording: RecordingResult) => void;
  onStateChange?: (state: RecorderState) => void;
};

export function RecorderButton({
  className,
  disabled = false,
  maxDurationMs = DEFAULT_MAX_RECORDING_MS,
  variant = "default",
  onRecordingComplete,
  onStateChange,
}: RecorderButtonProps) {
  const [state, setState] = useState<RecorderState>("permission-needed");
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState("");
  const [waveformLevels, setWaveformLevels] = useState(
    INACTIVE_WAVEFORM_LEVELS,
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<RecorderState>("permission-needed");
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceStartedAtRef = useRef<number | null>(null);
  const stopRecordingRef = useRef<() => void>(() => undefined);
  const isMountedRef = useRef(true);
  const onStateChangeRef = useRef(onStateChange);

  const maxDurationLabel = useMemo(
    () => formatRecordingDuration(maxDurationMs),
    [maxDurationMs],
  );
  const isContinuationVariant = variant === "continuation";

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  const setRecorderState = useCallback(
    (nextState: RecorderState) => {
      stateRef.current = nextState;
      setState(nextState);
      onStateChangeRef.current?.(nextState);
    },
    [],
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

  const stopAudioVisualization = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    audioSourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    audioSourceRef.current = null;
    analyserRef.current = null;

    const audioContext = audioContextRef.current;
    audioContextRef.current = null;

    if (audioContext && audioContext.state !== "closed") {
      void audioContext.close().catch(() => undefined);
    }

    if (isMountedRef.current) {
      setWaveformLevels(INACTIVE_WAVEFORM_LEVELS);
    }
    silenceStartedAtRef.current = null;
  }, []);

  const startAudioVisualization = useCallback(
    (stream: MediaStream) => {
      stopAudioVisualization();

      const AudioContextConstructor =
        window.AudioContext ||
        (window as WindowWithLegacyAudioContext).webkitAudioContext;

      if (!AudioContextConstructor) {
        return;
      }

      try {
        const audioContext = new AudioContextConstructor();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 128;
        analyser.minDecibels = -82;
        analyser.maxDecibels = -18;
        analyser.smoothingTimeConstant = 0.78;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        audioSourceRef.current = source;
        analyserRef.current = analyser;

        if (audioContext.state === "suspended") {
          void audioContext.resume().catch(() => undefined);
        }

        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        const timeDomainData = new Uint8Array(analyser.fftSize);
        const updateWaveform = () => {
          if (
            !isMountedRef.current ||
            audioContextRef.current !== audioContext
          ) {
            return;
          }

          analyser.getByteFrequencyData(frequencyData);
          setWaveformLevels(getRecordingWaveformLevels(frequencyData));

          if (stateRef.current === "recording") {
            analyser.getByteTimeDomainData(timeDomainData);
            const rms = Math.sqrt(
              timeDomainData.reduce((total, sample) => {
                const amplitude = (sample - 128) / 128;
                return total + amplitude * amplitude;
              }, 0) / timeDomainData.length,
            );

            if (rms < SILENCE_RMS_THRESHOLD) {
              const now = performance.now();
              silenceStartedAtRef.current ??= now;

              if (now - silenceStartedAtRef.current >= SILENCE_STOP_DELAY_MS) {
                stopRecordingRef.current();
              }
            } else {
              silenceStartedAtRef.current = null;
            }
          }

          animationFrameRef.current = window.requestAnimationFrame(updateWaveform);
        };

        updateWaveform();
      } catch {
        // Recording must still work if Web Audio visualization is unavailable.
        stopAudioVisualization();
      }
    },
    [stopAudioVisualization],
  );

  const cleanupRecorder = useCallback(() => {
    clearTimers();
    stopAudioVisualization();
    stopMediaStreamTracks(streamRef.current);
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, [clearTimers, stopAudioVisualization]);

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
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  useEffect(() => {
    isMountedRef.current = true;
    let unsupportedTimer: ReturnType<typeof setTimeout> | null = null;

    if (!isMediaRecorderSupported()) {
      unsupportedTimer = setTimeout(() => {
        setRecorderState("unsupported");
      }, 0);
    }

    return () => {
      isMountedRef.current = false;

      if (unsupportedTimer) {
        clearTimeout(unsupportedTimer);
      }

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null;
        recorder.onerror = null;
        recorder.onstop = null;

        try {
          recorder.stop();
        } catch {
          // The recorder may already be stopping while the component unmounts.
        }
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
      setDurationMs(0);
      chunksRef.current = [];
      silenceStartedAtRef.current = null;

      const stream = await requestMicrophoneStream();
      const mimeType = getSupportedRecordingMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      const recorderMimeType = recorder.mimeType || mimeType;

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
        const blob = createRecordingBlob(chunksRef.current, recorderMimeType);

        cleanupRecorder();

        if (!isMountedRef.current) {
          return;
        }

        if (blob.size === 0) {
          setRecorderState("error");
          setError("No audio was captured. Please record again.");
          return;
        }

        const nextRecording = createRecordingResult(
          blob,
          recorderMimeType,
          Math.min(measuredDurationMs, maxDurationMs),
        );

        setDurationMs(nextRecording.durationMs);
        setRecorderState("recorded");
        onRecordingComplete?.(nextRecording);
      };

      // Periodic chunks make finalization reliable across Chromium/WebKit and
      // avoid producing a header-only blob if recording is interrupted.
      recorder.start(250);
      startAudioVisualization(stream);
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
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={
            state === "recording" || state === "stopping"
              ? stopRecording
              : startRecording
          }
          disabled={disabled || state === "stopping"}
          aria-label={
            state === "recording"
              ? "Stop recording"
              : state === "recorded"
                ? isContinuationVariant
                  ? "Continue recording"
                  : "Record again"
                : "Start recording"
          }
          className={cn(
            "relative grid size-20 shrink-0 place-items-center rounded-full bg-zinc-950 text-white shadow-[0_14px_34px_rgba(24,20,16,0.22)] transition hover:-translate-y-0.5 hover:bg-zinc-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40 focus-visible:ring-offset-4 focus-visible:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:size-24 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 dark:focus-visible:ring-offset-zinc-950",
            state === "recording" &&
              "bg-rose-600 text-white before:absolute before:inset-0 before:rounded-full before:bg-rose-400/35 before:motion-safe:animate-ping hover:bg-rose-600 dark:bg-rose-500 dark:text-white",
            state === "recorded" && !isContinuationVariant &&
              "bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-300 dark:text-emerald-950",
          )}
        >
          {state === "recording" || state === "stopping" ? (
            <Square size={28} aria-hidden="true" />
          ) : state === "recorded" ? (
            isContinuationVariant ? (
              <span className="flex flex-col items-center gap-0.5 leading-none">
                <Mic size={27} aria-hidden="true" />
                <span className="text-[0.65rem] font-bold">Continue</span>
              </span>
            ) : (
              <CheckCircle2 size={32} aria-hidden="true" />
            )
          ) : (
            <Mic size={32} aria-hidden="true" />
          )}
        </button>

        <div className="mt-3 w-full min-w-0 text-center">
          <div>
            {state !== "idle" &&
            state !== "permission-needed" &&
            !(isContinuationVariant && state === "recorded") ? (
              <div className="mx-auto">
                <p className="text-sm font-bold text-ink dark:text-white">
                  {getTitle(state)}
                </p>
                {!(isContinuationVariant && state === "recording") ? (
                  <p className="mx-auto mt-1 max-w-md text-xs font-normal leading-5 text-zinc-600 dark:text-zinc-400">
                    {getDescription(state, maxDurationLabel)}
                  </p>
                ) : null}
              </div>
            ) : null}
            {!isContinuationVariant ? (
              <span className="mt-2 inline-flex rounded-full bg-zinc-900/[0.045] px-3 py-1 text-xs font-bold text-zinc-700 dark:bg-white/8 dark:text-zinc-200">
                {formatRecordingDuration(durationMs)}
              </span>
            ) : null}
          </div>

          {state === "recording" ? (
            <div
              className="mx-auto mt-4 max-w-xl overflow-hidden rounded-xl border border-rose-200/70 bg-gradient-to-r from-rose-50/90 via-amber-50/90 to-rose-50/90 px-3 py-2.5 shadow-inner dark:border-rose-300/20 dark:from-rose-950/35 dark:via-amber-950/25 dark:to-rose-950/35"
              data-recording-visualizer="active"
            >
              {!isContinuationVariant ? (
                <div className="flex items-center justify-between gap-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-rose-700 dark:text-rose-200">
                  <span className="inline-flex items-center gap-2">
                    <span className="relative flex size-2" aria-hidden="true">
                      <span className="absolute inline-flex size-full rounded-full bg-rose-500 opacity-70 motion-safe:animate-ping" />
                      <span className="relative inline-flex size-2 rounded-full bg-rose-600" />
                    </span>
                    Live voice
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400">Listening</span>
                </div>
              ) : null}
              <div
                className={cn(
                  "flex h-12 items-center gap-1",
                  !isContinuationVariant && "mt-2.5",
                )}
                aria-label="Live microphone level"
                role="img"
              >
                {waveformLevels.map((level, index) => (
                  <span
                    key={index}
                    className="w-full rounded-full bg-gradient-to-t from-rose-600 via-rose-400 to-amber-300 opacity-90 transition-[height,opacity] duration-75 ease-out dark:from-rose-400 dark:via-rose-300 dark:to-amber-200"
                    style={{
                      height: `${Math.round(level * 100)}%`,
                      opacity: 0.55 + level * 0.45,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mx-auto mt-3 max-w-md text-sm font-normal leading-6 text-rose-800 dark:text-rose-100">
              {error}
            </p>
          ) : null}

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
      return `Stops after 5 seconds of silence or at ${maxDurationLabel}.`;
    case "stopping":
      return "Preparing the audio for transcription.";
    case "recorded":
      return "Starting transcription.";
    case "error":
      return "Try again, or continue with the typed transcript fallback.";
    case "permission-needed":
      return "Allow microphone access when prompted, or type below.";
    case "idle":
    default:
      return `Record up to ${maxDurationLabel}.`;
  }
}
