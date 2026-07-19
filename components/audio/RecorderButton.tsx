"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertCircle, Mic, Square } from "lucide-react";
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
  hideDuration?: boolean;
  maxDurationMs?: number;
  variant?: "default" | "continuation";
  onRecordingComplete?: (recording: RecordingResult) => void;
  onStateChange?: (state: RecorderState) => void;
};

export function RecorderButton({
  className,
  disabled = false,
  hideDuration = false,
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
  const [audioLevel, setAudioLevel] = useState(0);
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
      setAudioLevel(0);
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
            setAudioLevel(Math.min(1, Math.max(0, (rms - 0.008) * 8.5)));

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
        <RecorderHero
          audioLevel={audioLevel}
          disabled={disabled || state === "stopping"}
          isContinuationVariant={isContinuationVariant}
          onClick={
            state === "recording" || state === "stopping"
              ? stopRecording
              : startRecording
          }
          state={state}
          waveformLevels={waveformLevels}
        />

        <div className="mt-3 w-full min-w-0 text-center">
          <div>
            {!(isContinuationVariant && state === "recorded") ? (
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
            {!hideDuration && !isContinuationVariant ? (
              <span className="mt-2 inline-flex rounded-full bg-zinc-900/[0.045] px-3 py-1 text-xs font-bold text-zinc-700 dark:bg-white/8 dark:text-zinc-200">
                {formatRecordingDuration(durationMs)}
              </span>
            ) : null}
          </div>

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

type RecorderHeroProps = {
  audioLevel: number;
  disabled: boolean;
  isContinuationVariant: boolean;
  onClick: () => void;
  state: RecorderState;
  waveformLevels: number[];
};

function RecorderHero({
  audioLevel,
  disabled,
  isContinuationVariant,
  onClick,
  state,
  waveformLevels,
}: RecorderHeroProps) {
  const reduceMotion = useReducedMotion();
  const isIdle = state === "idle" || state === "permission-needed" || state === "error";
  const isRecording = state === "recording";
  const isStopping = state === "stopping";
  const isRecorded = state === "recorded";
  const buttonLabel = isRecording
    ? "Stop recording"
    : isRecorded
      ? isContinuationVariant
        ? "Continue recording"
        : "Record again"
      : "Start recording";
  const buttonColor = isRecording || isStopping
    ? "#e11d48"
    : isRecorded && !isContinuationVariant
      ? "#059669"
      : "#18181b";
  const reactiveScale = 1 + audioLevel * 0.12;
  const reactiveBlur = 24 + Math.round(audioLevel * 38);
  const reactiveSpread = 3 + Math.round(audioLevel * 13);

  return (
    <div
      className="relative grid size-40 shrink-0 place-items-center sm:size-44"
      data-recorder-state={state}
    >
      <AnimatePresence initial={false}>
        {!isRecorded ? (
          <motion.svg
            key="radial-waveform"
            viewBox="0 0 200 200"
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
            aria-label={isRecording ? "Live microphone level" : undefined}
            aria-hidden={!isRecording}
            role={isRecording ? "img" : undefined}
            data-recording-visualizer={isRecording ? "active" : undefined}
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{
              opacity: isStopping ? 0.22 : isRecording ? 1 : 0.48,
              scale: isStopping ? 0.68 : 1,
            }}
            exit={{ opacity: 0, scale: 0.68 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
          >
            {waveformLevels.map((level, index) => {
              const barLength = isRecording ? 7 + level * 21 : 5;
              const angle = (360 / waveformLevels.length) * index;

              return (
                <motion.line
                  key={index}
                  x1="100"
                  y1="29"
                  x2="100"
                  animate={{ y2: 29 - barLength }}
                  transform={`rotate(${angle} 100 100)`}
                  stroke={isRecording ? "#fb7185" : "#f59e0b"}
                  strokeWidth={isRecording ? 3.2 : 2.4}
                  strokeLinecap="round"
                  transition={{ duration: reduceMotion ? 0 : 0.08, ease: "easeOut" }}
                />
              );
            })}
          </motion.svg>
        ) : null}
      </AnimatePresence>

      {isIdle ? (
        <motion.span
          className="pointer-events-none absolute size-28 rounded-full bg-amber-400/22 blur-md sm:size-32 dark:bg-amber-300/18"
          animate={reduceMotion ? { opacity: 0.35 } : {
            opacity: [0.25, 0.5, 0.25],
            scale: [0.92, 1.12, 0.92],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

      {isRecording ? (
        <motion.span
          className="pointer-events-none absolute size-24 rounded-full border border-rose-300/80 sm:size-28 dark:border-rose-300/60"
          animate={{ opacity: 0.35 + audioLevel * 0.45, scale: reactiveScale }}
          transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.35 }}
          style={{
            boxShadow: `0 0 ${reactiveBlur}px ${reactiveSpread}px rgba(244, 63, 94, ${0.18 + audioLevel * 0.24})`,
          }}
        />
      ) : null}

      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={buttonLabel}
        className={cn(
          "relative z-10 grid size-24 shrink-0 place-items-center rounded-full p-1 text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/45 focus-visible:ring-offset-4 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-60 sm:size-28 dark:focus-visible:ring-offset-zinc-950",
          isRecording || isStopping
            ? "bg-gradient-to-br from-rose-300 via-rose-500 to-red-700"
            : isRecorded && !isContinuationVariant
              ? "bg-gradient-to-br from-emerald-200 via-emerald-500 to-emerald-700"
              : "bg-gradient-to-br from-amber-200 via-amber-500 to-orange-600",
        )}
        animate={{
          scale: isStopping ? 0.9 : isRecorded ? 1.03 : 1,
          boxShadow: isRecording
            ? `0 18px ${reactiveBlur}px rgba(190, 18, 60, ${0.26 + audioLevel * 0.22})`
            : isRecorded
              ? "0 18px 42px rgba(5, 150, 105, 0.26)"
              : "0 18px 42px rgba(180, 83, 9, 0.24)",
        }}
        whileHover={disabled || reduceMotion ? undefined : { scale: 1.045, y: -2 }}
        whileTap={disabled || reduceMotion ? undefined : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 360, damping: 24 }}
      >
        <motion.span
          className="grid size-full place-items-center rounded-full border border-white/18"
          animate={{ backgroundColor: buttonColor }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isRecording || isStopping ? (
              <motion.span
                key="stop"
                initial={{ opacity: 0, rotate: -20, scale: 0.45 }}
                animate={{ opacity: 1, rotate: 0, scale: isStopping ? 0.72 : 1 }}
                exit={{ opacity: 0, rotate: 20, scale: 0.45 }}
                transition={{ type: "spring", stiffness: 420, damping: 25 }}
              >
                <Square size={30} fill="currentColor" strokeWidth={1.6} aria-hidden="true" />
              </motion.span>
            ) : isRecorded && !isContinuationVariant ? (
              <motion.svg
                key="check"
                viewBox="0 0 48 48"
                className="size-12"
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.72 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 360, damping: 22 }}
              >
                <motion.circle
                  cx="24"
                  cy="24"
                  r="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
                />
                <motion.path
                  d="m15.5 24.5 5.5 5.5 12-13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.32, delay: reduceMotion ? 0 : 0.3 }}
                />
              </motion.svg>
            ) : (
              <motion.span
                key="mic"
                className="flex flex-col items-center gap-0.5 leading-none"
                initial={{ opacity: 0, scale: 0.65 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.65 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
              >
                <Mic size={isContinuationVariant && isRecorded ? 29 : 38} strokeWidth={2.1} aria-hidden="true" />
                {isContinuationVariant && isRecorded ? (
                  <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.12em]">
                    Continue
                  </span>
                ) : null}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.span>
      </motion.button>
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
      return "";
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
