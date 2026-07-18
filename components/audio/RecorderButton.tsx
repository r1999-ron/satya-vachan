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
  const isMountedRef = useRef(true);
  const onStateChangeRef = useRef(onStateChange);

  const maxDurationLabel = useMemo(
    () => formatRecordingDuration(maxDurationMs),
    [maxDurationMs],
  );

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
        const updateWaveform = () => {
          if (
            !isMountedRef.current ||
            audioContextRef.current !== audioContext
          ) {
            return;
          }

          analyser.getByteFrequencyData(frequencyData);
          setWaveformLevels(getRecordingWaveformLevels(frequencyData));
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
      setRecording(null);
      setDurationMs(0);
      chunksRef.current = [];

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

        setRecording(nextRecording);
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
            "relative grid size-12 shrink-0 place-items-center rounded-full bg-amber-400/18 text-amber-700 shadow-glow dark:text-amber-200",
            state === "recording" &&
              "bg-rose-600 text-white before:absolute before:inset-0 before:rounded-full before:bg-rose-400/35 before:motion-safe:animate-ping",
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
            <div
              className="mt-4 overflow-hidden rounded-2xl border border-rose-200/70 bg-gradient-to-r from-rose-50/90 via-amber-50/90 to-rose-50/90 px-3 py-2.5 shadow-inner dark:border-rose-300/20 dark:from-rose-950/35 dark:via-amber-950/25 dark:to-rose-950/35"
              data-recording-visualizer="active"
            >
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
              <div
                className="mt-2.5 flex h-12 items-center gap-1"
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
