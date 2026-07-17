"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Keyboard,
  RotateCcw,
  WandSparkles,
} from "lucide-react";
import {
  RecorderButton,
  type RecorderState,
} from "@/components/audio/RecorderButton";
import { HintPromptList } from "@/components/practice/HintPromptList";
import { TransformationResult } from "@/components/practice/TransformationResult";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  defaultTransformationExample,
  getDemoHints,
  getMockPracticeResponse,
} from "@/data/demo";
import { formatRecordingDuration } from "@/lib/audio";
import { useLearnedWords } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type {
  LearnedWordInput,
  PracticeResponse,
  RecordingResult,
} from "@/types";

type PracticeStatus = "idle" | "ready" | "processing" | "completed" | "error";

const PROCESSING_DELAY_MS = 650;

export default function PracticePage() {
  const hints = getDemoHints(6);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { saveWord, words } = useLearnedWords();
  const [status, setStatus] = useState<PracticeStatus>("idle");
  const [selectedHint, setSelectedHint] = useState("");
  const [transcript, setTranscript] = useState("");
  const [recordedAudio, setRecordedAudio] = useState<RecordingResult | null>(
    null,
  );
  const [recordingNotice, setRecordingNotice] = useState("");
  const [recorderResetKey, setRecorderResetKey] = useState(0);
  const [result, setResult] = useState<PracticeResponse | null>(null);
  const [error, setError] = useState("");

  const savedWordKeys = useMemo(
    () =>
      new Set(
        words
          .filter((word) => word.source !== "seed")
          .map((word) => word.word.trim().toLocaleLowerCase()),
      ),
    [words],
  );

  const isProcessing = status === "processing";
  const canSubmit = transcript.trim().length > 0 && !isProcessing;

  const clearPendingMock = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearPendingMock, [clearPendingMock]);

  const runMockTransformation = useCallback(
    (nextTranscript = transcript) => {
      const cleanedTranscript = nextTranscript.trim();

      clearPendingMock();

      if (!cleanedTranscript) {
        setStatus("error");
        setError("Add a sentence first, then polish it.");
        setResult(null);
        return;
      }

      setTranscript(cleanedTranscript);
      setError("");
      setStatus("processing");

      timeoutRef.current = setTimeout(() => {
        setResult(getMockPracticeResponse(cleanedTranscript));
        setStatus("completed");
        timeoutRef.current = null;
      }, PROCESSING_DELAY_MS);
    },
    [clearPendingMock, transcript],
  );

  const handleSelectHint = useCallback(
    (hint: string) => {
      if (isProcessing) {
        return;
      }

      clearPendingMock();
      setSelectedHint(hint);
      setTranscript(hint);
      setResult(null);
      setRecordingNotice("");
      setError("");
      setStatus("ready");
    },
    [clearPendingMock, isProcessing],
  );

  const handleTranscriptChange = (value: string) => {
    if (isProcessing) {
      return;
    }

    setTranscript(value);
    setSelectedHint(hints.includes(value) ? value : "");
    setResult(null);
    setRecordingNotice("");
    setError("");
    setStatus(value.trim() ? "ready" : "idle");
  };

  const handleTryDemo = () => {
    if (isProcessing) {
      return;
    }

    const demoTranscript = defaultTransformationExample.transcript;
    setSelectedHint(demoTranscript);
    setTranscript(demoTranscript);
    setRecordingNotice("");
    runMockTransformation(demoTranscript);
  };

  const handleReset = () => {
    clearPendingMock();
    setStatus("idle");
    setSelectedHint("");
    setTranscript("");
    setRecordedAudio(null);
    setRecordingNotice("");
    setRecorderResetKey((key) => key + 1);
    setResult(null);
    setError("");
  };

  const handleRecordingComplete = (recording: RecordingResult) => {
    setRecordedAudio(recording);
    setRecordingNotice(
      `Recording saved locally (${formatRecordingDuration(
        recording.durationMs,
      )}). Transcription connects in Module 7; type or edit the transcript below for now.`,
    );
    setError("");
  };

  const handleRecorderStateChange = (nextState: RecorderState) => {
    if (nextState === "recording") {
      setRecordedAudio(null);
      setRecordingNotice("");
      setError("");
    }
  };

  const handleDiscardRecording = () => {
    setRecordedAudio(null);
    setRecordingNotice("");
  };

  const handleUseRecording = (recording: RecordingResult) => {
    setRecordedAudio(recording);

    if (transcript.trim()) {
      runMockTransformation();
      return;
    }

    setStatus("ready");
    setError("");
    setRecordingNotice(
      "Recording is ready for upload. Until transcription arrives, type the spoken sentence below to polish it.",
    );
  };

  const handleSaveWord = (word: LearnedWordInput) => {
    if (isWordSaved(word.word)) {
      return;
    }

    saveWord(word, "practice");
  };

  const isWordSaved = useCallback(
    (word: string) => savedWordKeys.has(word.trim().toLocaleLowerCase()),
    [savedWordKeys],
  );

  return (
    <div className="space-y-5">
      <GlassCard className="animate-floatIn p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="blue">Practice</StatusBadge>
          <StatusBadge tone={status === "completed" ? "green" : "gold"}>
            {statusLabel(status)}
          </StatusBadge>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_19rem]">
          <div className="min-w-0 space-y-4">
            <h1 className="text-balance text-3xl font-bold text-ink sm:text-4xl dark:text-white">
              Refine an everyday Hindi sentence.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-700 dark:text-zinc-300">
              Type a line, choose a hint, or launch the demo sentence to see the
              full Satya-Vachan practice loop with mock data.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleTryDemo}
                disabled={isProcessing}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-lg shadow-zinc-900/15 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ink/40 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:shadow-none dark:bg-white dark:text-zinc-950 dark:focus:ring-white/40 dark:focus:ring-offset-zinc-950"
              >
                <WandSparkles size={18} aria-hidden="true" />
                Try demo sentence
                <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isProcessing && !result}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-5 py-3 text-sm font-bold text-ink shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/12 dark:bg-white/10 dark:text-white dark:focus:ring-offset-zinc-950"
              >
                <RotateCcw size={17} aria-hidden="true" />
                Reset
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-white/70 bg-white/35 p-5 dark:border-white/15 dark:bg-white/5">
            <RecorderButton
              key={recorderResetKey}
              disabled={isProcessing}
              onDiscard={handleDiscardRecording}
              onProcess={handleUseRecording}
              onRecordingComplete={handleRecordingComplete}
              onStateChange={handleRecorderStateChange}
            />
            {recordedAudio ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge tone="green">
                  Audio ready
                </StatusBadge>
                <StatusBadge tone="blue">
                  {formatRecordingDuration(recordedAudio.durationMs)}
                </StatusBadge>
                <StatusBadge tone="gold">
                  {recordedAudio.mimeType}
                </StatusBadge>
              </div>
            ) : null}
            {recordingNotice ? (
              <p className="mt-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                {recordingNotice}
              </p>
            ) : null}
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <GlassCard className="animate-floatIn [animation-delay:80ms]">
          <div className="flex items-start gap-3">
            <WandSparkles
              className="mt-1 shrink-0 text-amber-600"
              size={20}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-ink dark:text-white">
                Hint prompts
              </h2>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                Tap a prompt to fill the transcript, then polish it with the
                mock transformer.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <HintPromptList
              hints={hints}
              selectedHint={selectedHint}
              disabled={isProcessing}
              onSelect={handleSelectHint}
            />
          </div>
        </GlassCard>

        <GlassCard className="animate-floatIn [animation-delay:120ms]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-400/16 text-sky-800 dark:text-sky-200">
                <Keyboard size={19} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-ink dark:text-white">
                  Transcript
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Edit before polishing.
                </p>
              </div>
            </div>
            <StatusBadge tone={canSubmit ? "green" : "rose"}>
              {transcript.trim().length} chars
            </StatusBadge>
          </div>

          <textarea
            value={transcript}
            disabled={isProcessing}
            onChange={(event) => handleTranscriptChange(event.target.value)}
            placeholder="Type your Hindi sentence here..."
            className="mt-5 min-h-36 w-full resize-y rounded-2xl border border-white/60 bg-white/55 p-4 text-sm font-semibold leading-7 text-ink outline-none transition placeholder:text-zinc-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-400/35 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/12 dark:bg-white/8 dark:text-white dark:placeholder:text-zinc-500"
          />

          {error ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-300/60 bg-rose-100/55 p-4 text-sm leading-6 text-rose-950 dark:border-rose-300/25 dark:bg-rose-300/12 dark:text-rose-100">
              <AlertCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
              <p>{error}</p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => runMockTransformation()}
              disabled={!canSubmit}
              className={cn(
                "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-ink/40 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:shadow-none dark:focus:ring-white/40 dark:focus:ring-offset-zinc-950",
                canSubmit
                  ? "bg-ink text-white shadow-lg shadow-zinc-900/15 hover:-translate-y-0.5 dark:bg-white dark:text-zinc-950"
                  : "bg-zinc-400/70 text-white dark:bg-zinc-700 dark:text-zinc-300",
              )}
            >
              <WandSparkles
                className={cn(isProcessing && "motion-safe:animate-spin")}
                size={18}
                aria-hidden="true"
              />
              {isProcessing ? "Polishing..." : "Polish sentence"}
            </button>
          </div>
        </GlassCard>
      </div>

      {status === "processing" ? (
        <GlassCard className="animate-floatIn">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400/18 text-amber-700 shadow-glow dark:text-amber-200">
              <WandSparkles
                className="motion-safe:animate-spin"
                size={20}
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-ink dark:text-white">
                Creating a mock transformation
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                No AI call is happening yet. This pause previews the future
                processing state.
              </p>
            </div>
          </div>
        </GlassCard>
      ) : null}

      {result ? (
        <GlassCard className="animate-floatIn">
          <TransformationResult
            result={result}
            isWordSaved={isWordSaved}
            onSaveWord={handleSaveWord}
          />
        </GlassCard>
      ) : null}
    </div>
  );
}

function statusLabel(status: PracticeStatus) {
  switch (status) {
    case "ready":
      return "Ready";
    case "processing":
      return "Mock processing";
    case "completed":
      return "Result ready";
    case "error":
      return "Needs sentence";
    case "idle":
    default:
      return "Idle";
  }
}
