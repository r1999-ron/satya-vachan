"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
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
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  defaultTransformationExample,
  getDemoHints,
} from "@/data/demo";
import { wordCorpus } from "@/data/words";
import { requestJson } from "@/lib/api-client";
import { formatRecordingDuration, recordingToFile } from "@/lib/audio";
import {
  type PracticeHistoryItem,
  useLearnedWords,
  usePracticeHistory,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import {
  isRecord,
  normalizePracticeResponse,
  validateTranscript,
} from "@/lib/validators";
import type {
  LearnedWordInput,
  PracticeResponse,
  RecordingResult,
  WordEntry,
} from "@/types";

type PracticeStatus =
  | "idle"
  | "recording"
  | "recorded"
  | "transcribing"
  | "transcriptReady"
  | "transforming"
  | "resultReady"
  | "ttsLoading"
  | "error";

type FailedStep = "transcription" | "transformation" | null;
type AudioStatus = "idle" | "loading" | "ready" | "playing" | "error";

type PracticeState = {
  status: PracticeStatus;
  selectedHint: string;
  transcript: string;
  recordedAudio: RecordingResult | null;
  recordingNotice: string;
  result: PracticeResponse | null;
  transcriptionError: string;
  transformError: string;
  lastFailedStep: FailedStep;
};

type PracticeAction =
  | { type: "recording_started" }
  | { type: "recording_complete"; recording: RecordingResult; notice: string }
  | { type: "recording_discarded" }
  | { type: "transcript_changed"; transcript: string; selectedHint?: string }
  | { type: "transcription_started"; recording: RecordingResult }
  | { type: "transcription_succeeded"; transcript: string; notice: string }
  | { type: "transcription_failed"; error: string; notice: string }
  | { type: "transformation_started"; transcript: string }
  | { type: "transformation_succeeded"; result: PracticeResponse }
  | { type: "transformation_failed"; error: string }
  | { type: "tts_status_changed"; status: AudioStatus }
  | { type: "reset" };

const initialPracticeState: PracticeState = {
  status: "idle",
  selectedHint: "",
  transcript: "",
  recordedAudio: null,
  recordingNotice: "",
  result: null,
  transcriptionError: "",
  transformError: "",
  lastFailedStep: null,
};

export default function PracticePage() {
  const hints = getDemoHints(6);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const { saveWord, words } = useLearnedWords();
  const { history, saveHistory } = usePracticeHistory();
  const [state, dispatch] = useReducer(practiceReducer, initialPracticeState);
  const [recorderResetKey, setRecorderResetKey] = useState(0);
  const [practiceContext, setPracticeContext] = useState<WordEntry | string | null>(null);

  const savedWordKeys = useMemo(
    () =>
      new Set(
        words.map((word) => word.word.trim().toLocaleLowerCase()),
      ),
    [words],
  );

  const isTranscribing = state.status === "transcribing";
  const isTransforming = state.status === "transforming";
  const isBusy = isTranscribing || isTransforming;
  const canTransform = state.transcript.trim().length > 0 && !isBusy;
  const canRetryTranscription =
    Boolean(state.recordedAudio) &&
    state.lastFailedStep === "transcription" &&
    !isBusy;
  const canRetryTransformation =
    state.transcript.trim().length > 0 &&
    state.lastFailedStep === "transformation" &&
    !isBusy;

  useEffect(() => {
    if (state.result) {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [state.result]);

  useEffect(() => {
    const wordParam = new URLSearchParams(window.location.search).get("word")?.trim();

    if (!wordParam) {
      return;
    }

    const normalizedWord = wordParam.toLocaleLowerCase();
    const matchingEntry = wordCorpus.find((entry) =>
      [entry.id, entry.common, entry.elevated, ...entry.synonyms]
        .map((value) => value.toLocaleLowerCase())
        .includes(normalizedWord),
    );

    queueMicrotask(() => {
      setPracticeContext(matchingEntry ?? wordParam);
    });
  }, []);

  const isWordSaved = useCallback(
    (word: string) => savedWordKeys.has(word.trim().toLocaleLowerCase()),
    [savedWordKeys],
  );

  const runTransformation = useCallback(
    async (nextTranscript = state.transcript) => {
      const cleanedTranscript = nextTranscript.trim();
      const transcriptResult = validateTranscript(cleanedTranscript);

      if (!transcriptResult.ok) {
        dispatch({
          type: "transformation_failed",
          error: transcriptResult.message,
        });
        return;
      }

      dispatch({
        type: "transformation_started",
        transcript: transcriptResult.value,
      });

      try {
        const payload = await requestJson<PracticeResponse>("/api/transform", {
          method: "POST",
          body: { transcript: transcriptResult.value },
          fallbackMessage:
            "Transformation failed. Please retry with the same transcript.",
          timeoutMs: 30_000,
          validate: (value) =>
            normalizePracticeResponse(value, transcriptResult.value),
        });

        saveHistory(payload);
        dispatch({ type: "transformation_succeeded", result: payload });
      } catch (caughtError) {
        dispatch({
          type: "transformation_failed",
          error:
            caughtError instanceof Error
              ? caughtError.message
              : "Transformation failed. Please retry with the same transcript.",
        });
      }
    },
    [saveHistory, state.transcript],
  );

  const transcribeRecording = useCallback(async (recording: RecordingResult) => {
    dispatch({ type: "transcription_started", recording });

    try {
      const formData = new FormData();
      formData.append("file", recordingToFile(recording));
      formData.append("durationMs", String(recording.durationMs));

      const payload = await requestJson<{ transcript: string }>("/api/transcribe", {
        method: "POST",
        body: formData,
        fallbackMessage: "Transcription failed. Please type your sentence.",
        timeoutMs: 30_000,
        validate: (value) => {
          const transcript =
            isRecord(value) && typeof value.transcript === "string"
              ? value.transcript.trim()
              : "";

          return transcript ? { transcript } : null;
        },
      });

      const nextTranscript = payload.transcript;

      dispatch({
        type: "transcription_succeeded",
        transcript: nextTranscript,
        notice: "Transcript ready. Edit it, then polish the sentence.",
      });
    } catch (caughtError) {
      dispatch({
        type: "transcription_failed",
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Transcription failed. Please type your sentence.",
        notice:
          "The recording is still available. You can retry upload or type the sentence below.",
      });
    }
  }, []);

  const handleSelectHint = useCallback(
    (hint: string) => {
      if (isBusy) {
        return;
      }

      dispatch({
        type: "transcript_changed",
        transcript: hint,
        selectedHint: hint,
      });
    },
    [isBusy],
  );

  const handleTranscriptChange = (value: string) => {
    if (isBusy) {
      return;
    }

    dispatch({
      type: "transcript_changed",
      transcript: value,
      selectedHint: hints.includes(value) ? value : "",
    });
  };

  const handleTryDemo = () => {
    if (isBusy) {
      return;
    }

    const demoTranscript = defaultTransformationExample.transcript;
    dispatch({
      type: "transcript_changed",
      transcript: demoTranscript,
      selectedHint: demoTranscript,
    });
    saveHistory(defaultTransformationExample);
    dispatch({
      type: "transformation_succeeded",
      result: defaultTransformationExample,
    });
  };

  const handleUsePracticeContext = () => {
    if (isBusy || !practiceContext) {
      return;
    }

    const transcript =
      typeof practiceContext === "string"
        ? `Maine ${practiceContext} shabd ka prayog apne vaakya mein kiya.`
        : practiceContext.elevatedExample;

    dispatch({
      type: "transcript_changed",
      transcript,
      selectedHint: "",
    });
  };

  const handleReset = () => {
    dispatch({ type: "reset" });
    setRecorderResetKey((key) => key + 1);
  };

  const handleRecordingComplete = (recording: RecordingResult) => {
    dispatch({
      type: "recording_complete",
      recording,
      notice: `Recording saved locally (${formatRecordingDuration(
        recording.durationMs,
      )}). Use it to create an editable transcript, or type below.`,
    });
  };

  const handleRecorderStateChange = (nextState: RecorderState) => {
    if (nextState === "recording") {
      dispatch({ type: "recording_started" });
    }
  };

  const handleDiscardRecording = () => {
    dispatch({ type: "recording_discarded" });
  };

  const handleUseRecording = (recording: RecordingResult) => {
    void transcribeRecording(recording);
  };

  const handleRetryTranscription = () => {
    if (state.recordedAudio) {
      void transcribeRecording(state.recordedAudio);
    }
  };

  const handleRetryTransformation = () => {
    void runTransformation();
  };

  const handleSaveWord = (word: LearnedWordInput) => {
    if (!word.word.trim() || !word.meaning.trim() || isWordSaved(word.word)) {
      return;
    }

    saveWord(word, "practice");
  };

  const handleAudioStatusChange = useCallback((status: AudioStatus) => {
    dispatch({ type: "tts_status_changed", status });
  }, []);

  return (
    <div className="space-y-5">
      <GlassCard className="animate-floatIn p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="blue">Practice</StatusBadge>
          <StatusBadge tone={state.status === "resultReady" ? "green" : "gold"}>
            {statusLabel(state.status)}
          </StatusBadge>
        </div>
        <PracticeSteps
          failedStep={state.lastFailedStep}
          hasTranscript={Boolean(state.transcript.trim())}
          status={state.status}
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_19rem]">
          <div className="min-w-0 space-y-4">
            <h1 className="text-balance text-3xl font-bold text-ink sm:text-4xl dark:text-white">
              Refine an everyday Hindi sentence.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-700 dark:text-zinc-300">
              Record or type a line, confirm the transcript, then let the coach
              polish the same meaning into clearer Hindi.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleTryDemo}
                disabled={isBusy}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-lg shadow-zinc-900/15 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ink/40 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:shadow-none dark:bg-white dark:text-zinc-950 dark:focus:ring-white/40 dark:focus:ring-offset-zinc-950"
              >
                <WandSparkles size={18} aria-hidden="true" />
                Try demo sentence
                <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isBusy && !state.result}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-5 py-3 text-sm font-bold text-ink shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/12 dark:bg-white/10 dark:text-white dark:focus:ring-offset-zinc-950"
              >
                <RotateCcw size={17} aria-hidden="true" />
                New practice
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-white/70 bg-white/35 p-5 dark:border-white/15 dark:bg-white/5">
            <RecorderButton
              key={recorderResetKey}
              disabled={isBusy}
              onDiscard={handleDiscardRecording}
              onProcess={handleUseRecording}
              onRecordingComplete={handleRecordingComplete}
              onStateChange={handleRecorderStateChange}
            />
            {state.recordedAudio ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge tone="green">Audio ready</StatusBadge>
                <StatusBadge tone="blue">
                  {formatRecordingDuration(state.recordedAudio.durationMs)}
                </StatusBadge>
                <StatusBadge tone="gold">
                  {state.recordedAudio.mimeType}
                </StatusBadge>
              </div>
            ) : null}
            {state.recordingNotice ? (
              <p className="mt-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                {state.recordingNotice}
              </p>
            ) : null}
            {state.transcriptionError ? (
              <ErrorNotice
                actionLabel={canRetryTranscription ? "Retry transcription" : undefined}
                message={state.transcriptionError}
                onAction={canRetryTranscription ? handleRetryTranscription : undefined}
              />
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
                transformer.
              </p>
            </div>
          </div>
          <div className="mt-5">
            {practiceContext ? (
              <PracticeContextPrompt
                context={practiceContext}
                disabled={isBusy}
                onUse={handleUsePracticeContext}
              />
            ) : null}
            <HintPromptList
              hints={hints}
              selectedHint={state.selectedHint}
              disabled={isBusy}
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
                  Editable transcript
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Confirm or revise before polishing.
                </p>
              </div>
            </div>
            <StatusBadge tone={canTransform ? "green" : "rose"}>
              {state.transcript.trim().length} chars
            </StatusBadge>
          </div>

          <textarea
            value={state.transcript}
            disabled={isBusy}
            onChange={(event) => handleTranscriptChange(event.target.value)}
            placeholder="Type your Hindi sentence here..."
            className="mt-5 min-h-36 w-full resize-y rounded-2xl border border-white/60 bg-white/55 p-4 text-sm font-semibold leading-7 text-ink outline-none transition placeholder:text-zinc-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-400/35 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/12 dark:bg-white/8 dark:text-white dark:placeholder:text-zinc-500"
          />

          {!state.transcript.trim() && !isBusy ? (
            <EmptyTranscriptNudge />
          ) : null}

          {state.transformError ? (
            <ErrorNotice
              actionLabel={canRetryTransformation ? "Retry polish" : undefined}
              message={state.transformError}
              onAction={canRetryTransformation ? handleRetryTransformation : undefined}
            />
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void runTransformation()}
              disabled={!canTransform}
              className={cn(
                "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-ink/40 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:shadow-none dark:focus:ring-white/40 dark:focus:ring-offset-zinc-950",
                canTransform
                  ? "bg-ink text-white shadow-lg shadow-zinc-900/15 hover:-translate-y-0.5 dark:bg-white dark:text-zinc-950"
                  : "bg-zinc-400/70 text-white dark:bg-zinc-700 dark:text-zinc-300",
              )}
            >
              <WandSparkles
                className={cn(isTransforming && "motion-safe:animate-spin")}
                size={18}
                aria-hidden="true"
              />
              {isTransforming ? "Polishing..." : "Polish sentence"}
            </button>
          </div>
        </GlassCard>
      </div>

      {isTranscribing || isTransforming || state.status === "ttsLoading" ? (
        <GlassCard className="animate-floatIn">
          <LoadingState status={state.status} />
        </GlassCard>
      ) : null}

      {state.result ? (
        <div ref={resultRef}>
          <GlassCard className="animate-floatIn">
            <TransformationResult
              result={state.result}
              isWordSaved={isWordSaved}
              onAudioStatusChange={handleAudioStatusChange}
              onSaveWord={handleSaveWord}
            />
          </GlassCard>
        </div>
      ) : null}

      <RecentPracticeHistory
        disabled={isBusy}
        history={history}
        onUse={(item) =>
          dispatch({
            type: "transcript_changed",
            transcript: item.transcript,
            selectedHint: "",
          })
        }
      />
    </div>
  );
}

function practiceReducer(
  state: PracticeState,
  action: PracticeAction,
): PracticeState {
  switch (action.type) {
    case "recording_started":
      return {
        ...state,
        status: "recording",
        recordedAudio: null,
        recordingNotice: "",
        transcriptionError: "",
        transformError: "",
        result: null,
        lastFailedStep: null,
      };
    case "recording_complete":
      return {
        ...state,
        status: "recorded",
        recordedAudio: action.recording,
        recordingNotice: action.notice,
        transcriptionError: "",
        transformError: "",
        result: null,
        lastFailedStep: null,
      };
    case "recording_discarded":
      return {
        ...state,
        status: state.transcript.trim() ? "transcriptReady" : "idle",
        recordedAudio: null,
        recordingNotice: "",
        transcriptionError: "",
        lastFailedStep:
          state.lastFailedStep === "transcription" ? null : state.lastFailedStep,
      };
    case "transcript_changed":
      return {
        ...state,
        status: action.transcript.trim() ? "transcriptReady" : "idle",
        selectedHint: action.selectedHint ?? "",
        transcript: action.transcript,
        recordingNotice: "",
        transformError: "",
        result: null,
        lastFailedStep:
          state.lastFailedStep === "transformation" ? null : state.lastFailedStep,
      };
    case "transcription_started":
      return {
        ...state,
        status: "transcribing",
        recordedAudio: action.recording,
        recordingNotice: "Listening carefully...",
        transcriptionError: "",
        transformError: "",
        result: null,
        lastFailedStep: null,
      };
    case "transcription_succeeded":
      return {
        ...state,
        status: "transcriptReady",
        transcript: action.transcript,
        selectedHint: "",
        recordingNotice: action.notice,
        transcriptionError: "",
        lastFailedStep: null,
      };
    case "transcription_failed":
      return {
        ...state,
        status: "error",
        recordingNotice: action.notice,
        transcriptionError: action.error,
        lastFailedStep: "transcription",
      };
    case "transformation_started":
      return {
        ...state,
        status: "transforming",
        transcript: action.transcript,
        transformError: "",
        result: null,
        lastFailedStep: null,
      };
    case "transformation_succeeded":
      return {
        ...state,
        status: "resultReady",
        result: action.result,
        transcript: action.result.transcript,
        transformError: "",
        lastFailedStep: null,
      };
    case "transformation_failed":
      return {
        ...state,
        status: "error",
        transformError: action.error,
        result: null,
        lastFailedStep: "transformation",
      };
    case "tts_status_changed":
      if (action.status === "loading") {
        return {
          ...state,
          status: "ttsLoading",
        };
      }

      if (state.status === "ttsLoading") {
        return {
          ...state,
          status: state.result ? "resultReady" : "transcriptReady",
        };
      }

      return state;
    case "reset":
      return initialPracticeState;
    default:
      return state;
  }
}

function PracticeSteps({
  failedStep,
  hasTranscript,
  status,
}: {
  failedStep: FailedStep;
  hasTranscript: boolean;
  status: PracticeStatus;
}) {
  const steps = [
    { key: "capture", label: "Capture" },
    { key: "transcript", label: "Confirm" },
    { key: "transform", label: "Polish" },
    { key: "listen", label: "Listen & save" },
  ] as const;
  const activeIndex = getStepIndex(status, failedStep, hasTranscript);

  return (
    <div className="mt-5 grid gap-2 sm:grid-cols-4">
      {steps.map((step, index) => {
        const isComplete = activeIndex > index;
        const isActive = activeIndex === index;

        return (
          <div
            key={step.key}
            className={cn(
              "flex min-h-12 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold transition",
              isActive
                ? "border-amber-300/70 bg-amber-100/60 text-amber-950 shadow-glow dark:border-amber-300/25 dark:bg-amber-300/12 dark:text-amber-100"
                : isComplete
                  ? "border-emerald-200/70 bg-emerald-100/55 text-emerald-950 dark:border-emerald-300/25 dark:bg-emerald-300/12 dark:text-emerald-100"
                  : "border-white/55 bg-white/35 text-zinc-600 dark:border-white/12 dark:bg-white/5 dark:text-zinc-400",
            )}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/55 dark:bg-white/10">
              {isComplete ? (
                <CheckCircle2 size={15} aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function LoadingState({ status }: { status: PracticeStatus }) {
  const copy =
    status === "transcribing"
      ? {
          title: "Listening carefully...",
          body: "Your recording is being transcribed into an editable sentence.",
        }
      : status === "ttsLoading"
        ? {
            title: "Preparing audio...",
            body: "The polished sentence is being prepared for playback.",
          }
        : {
            title: "Polishing your expression...",
            body: "The AI coach is preserving your meaning while refining the wording.",
          };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400/18 text-amber-700 shadow-glow dark:text-amber-200">
        <WandSparkles
          className="motion-safe:animate-spin"
          size={20}
          aria-hidden="true"
        />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold text-ink dark:text-white">
          {copy.title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {copy.body}
        </p>
        <LoadingMeter />
      </div>
    </div>
  );
}

function LoadingMeter() {
  return (
    <div className="mt-4 grid gap-2" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="loading-sheen h-2 rounded-full bg-white/55 dark:bg-white/10"
          style={{ "--sheen-delay": `${index * 120}ms` } as CSSProperties}
        />
      ))}
    </div>
  );
}

function EmptyTranscriptNudge() {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-sky-200/80 bg-sky-100/35 p-4 dark:border-sky-300/20 dark:bg-sky-300/10">
      <p className="text-sm font-bold text-sky-950 dark:text-sky-100">
        No transcript yet
      </p>
      <p className="mt-1 text-sm leading-6 text-sky-950/80 dark:text-sky-100/85">
        Choose a hint, type a sentence, or record one above. Your text will stay
        editable before polishing.
      </p>
    </div>
  );
}

function PracticeContextPrompt({
  context,
  disabled,
  onUse,
}: {
  context: WordEntry | string;
  disabled: boolean;
  onUse: () => void;
}) {
  const word = typeof context === "string" ? context : context.elevated;
  const meaning =
    typeof context === "string"
      ? "Use this saved word in a fresh sentence."
      : context.englishMeaning;
  const note =
    typeof context === "string"
      ? "Start with a simple sentence, then polish it through the normal practice flow."
      : context.usageNote;

  return (
    <div className="mb-4 rounded-2xl border border-emerald-200/70 bg-emerald-100/40 p-4 dark:border-emerald-300/20 dark:bg-emerald-300/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="green">Practice word</StatusBadge>
            <span className="text-wrap-anywhere text-lg font-bold text-ink dark:text-white">
              {word}
            </span>
          </div>
          <p className="mt-2 text-wrap-anywhere text-sm font-semibold leading-6 text-emerald-950 dark:text-emerald-100">
            {meaning}
          </p>
          <p className="mt-1 text-wrap-anywhere text-xs leading-5 text-emerald-900 dark:text-emerald-100">
            {note}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onUse}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-400/45 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-200 dark:text-emerald-950 dark:focus:ring-offset-zinc-950"
        >
          Use prompt
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function RecentPracticeHistory({
  disabled,
  history,
  onUse,
}: {
  disabled: boolean;
  history: PracticeHistoryItem[];
  onUse: (item: PracticeHistoryItem) => void;
}) {
  const compactHistory = history.slice(0, 3);

  if (compactHistory.length === 0) {
    return null;
  }

  return (
    <GlassCard className="animate-floatIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-400/16 text-emerald-800 dark:text-emerald-200">
            <Clock3 size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink dark:text-white">
              Recent practice
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Reuse a previous sentence as your next starting point.
            </p>
          </div>
        </div>
        <StatusBadge tone="blue">{history.length} saved</StatusBadge>
      </div>

      <div className="mt-4 grid gap-3">
        {compactHistory.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-white/60 bg-white/35 p-4 dark:border-white/12 dark:bg-white/5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-wrap-anywhere text-sm font-bold leading-6 text-ink dark:text-white">
                  {item.transcript}
                </p>
                <p className="mt-1 line-clamp-2 text-wrap-anywhere text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  {item.naturalPolishedVersion}
                </p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onUse(item)}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-4 py-2 text-xs font-bold text-ink shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/12 dark:bg-white/10 dark:text-white dark:focus:ring-offset-zinc-950"
              >
                Use again
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function getStepIndex(
  status: PracticeStatus,
  failedStep: FailedStep,
  hasTranscript: boolean,
) {
  switch (status) {
    case "transcriptReady":
      return 1;
    case "transforming":
      return 2;
    case "resultReady":
    case "ttsLoading":
      return 3;
    case "recording":
    case "recorded":
    case "transcribing":
      return 0;
    case "error":
      if (failedStep === "transformation") {
        return 2;
      }

      if (hasTranscript) {
        return 1;
      }

      return 0;
    case "idle":
    default:
      return 0;
  }
}

function statusLabel(status: PracticeStatus) {
  switch (status) {
    case "recording":
      return "Recording";
    case "recorded":
      return "Audio ready";
    case "transcribing":
      return "Transcribing";
    case "transcriptReady":
      return "Transcript ready";
    case "transforming":
      return "Polishing";
    case "resultReady":
      return "Result ready";
    case "ttsLoading":
      return "Preparing audio";
    case "error":
      return "Needs attention";
    case "idle":
    default:
      return "Idle";
  }
}
