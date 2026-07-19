"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Clock3, RotateCcw, WandSparkles } from "lucide-react";
import {
  RecorderButton,
  type RecorderState,
} from "@/components/audio/RecorderButton";
import { HindiText } from "@/components/hindi/HindiText";
import { HintPromptList } from "@/components/practice/HintPromptList";
import { PracticePipeline } from "@/components/practice/PracticePipeline";
import { TransformationResult } from "@/components/practice/TransformationResult";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { GlassCard } from "@/components/ui/GlassCard";
import { getDemoHints, defaultTransformationExample } from "@/data/demo";
import { useTranscription } from "@/hooks/useTranscription";
import { requestJson } from "@/lib/api-client";
import {
  type PracticeHistoryItem,
  useLearnedWords,
  usePracticeHistory,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import { normalizePracticeResponse, validateTranscript } from "@/lib/validators";
import type {
  LearnedWordInput,
  PracticeResponse,
  RecordingResult,
} from "@/types";

type PracticeStatus =
  | "idle"
  | "recording"
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
  result: PracticeResponse | null;
  transcriptionError: string;
  transformError: string;
  lastFailedStep: FailedStep;
};

type PracticeAction =
  | { type: "recording_started" }
  | {
      type: "transcript_changed";
      transcript: string;
      selectedHint?: string;
    }
  | { type: "transcription_started"; recording: RecordingResult }
  | { type: "transcription_succeeded"; transcript: string }
  | { type: "transcription_failed"; error: string }
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
  result: null,
  transcriptionError: "",
  transformError: "",
  lastFailedStep: null,
};

function PracticePageFallback() {
  return (
    <GlassCard className="animate-floatIn p-6 sm:p-8" aria-busy="true">
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
        Loading practice...
      </p>
    </GlassCard>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<PracticePageFallback />}>
      <PracticeContent />
    </Suspense>
  );
}

function PracticeContent() {
  const hints = getDemoHints(2);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLegacyChallenge = searchParams.get("challenge") === "today";
  const resultRef = useRef<HTMLDivElement | null>(null);
  const { saveWord, words } = useLearnedWords();
  const { history, saveHistory } = usePracticeHistory();
  const [state, dispatch] = useReducer(practiceReducer, initialPracticeState);
  const [recorderResetKey, setRecorderResetKey] = useState(0);
  useEffect(() => {
    if (isLegacyChallenge) {
      router.replace("/#daily-challenge");
    }
  }, [isLegacyChallenge, router]);

  const savedWordKeys = useMemo(
    () => new Set(words.map((word) => word.word.trim().toLocaleLowerCase())),
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
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state.result]);

  const isWordSaved = useCallback(
    (word: string) => savedWordKeys.has(word.trim().toLocaleLowerCase()),
    [savedWordKeys],
  );

  const runTransformation = useCallback(
    async (nextTranscript = state.transcript) => {
      const transcriptResult = validateTranscript(nextTranscript.trim());

      if (!transcriptResult.ok) {
        dispatch({ type: "transformation_failed", error: transcriptResult.message });
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
        const result = { ...payload, transcript: transcriptResult.value };
        saveHistory(result);
        dispatch({ type: "transformation_succeeded", result });
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

  const transcribeRecording = useTranscription({
    onError: useCallback((error: string) => {
      dispatch({
        type: "transcription_failed",
        error,
      });
    }, []),
    onStart: useCallback((recording: RecordingResult) => {
      dispatch({ type: "transcription_started", recording });
    }, []),
    onSuccess: useCallback((transcript: string) => {
      dispatch({
        type: "transcription_succeeded",
        transcript,
      });
    }, []),
  });

  const handleSelectHint = useCallback((hint: string) => {
    if (!isBusy) {
      dispatch({ type: "transcript_changed", transcript: hint, selectedHint: hint });
    }
  }, [isBusy]);

  const handleTranscriptChange = (value: string) => {
    if (isBusy) {
      return;
    }
    dispatch({
      type: "transcript_changed",
      transcript: value,
      selectedHint:
        hints.some((hint) => hint.dev === value || hint.roman === value)
          ? value
          : "",
    });
  };

  const handleTryDemo = () => {
    if (!isBusy) {
      dispatch({
        type: "transcript_changed",
        transcript: defaultTransformationExample.transcript,
        selectedHint: defaultTransformationExample.transcript,
      });
    }
  };

  const handleReset = () => {
    dispatch({ type: "reset" });
    setRecorderResetKey((key) => key + 1);
  };

  const handleSaveWord = (word: LearnedWordInput) => {
    if (word.word.trim() && word.meaning.trim() && !isWordSaved(word.word)) {
      saveWord(word, "practice");
    }
  };

  const handleAudioStatusChange = useCallback((status: AudioStatus) => {
    dispatch({ type: "tts_status_changed", status });
  }, []);

  if (isLegacyChallenge) {
    return <PracticePageFallback />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <GlassCard className="animate-floatIn p-5 sm:p-8">
        <PracticePipeline status={state.status} />
        <div>
          <RecorderButton
            key={recorderResetKey}
            className="border-0 bg-transparent p-0 dark:bg-transparent"
            disabled={isBusy}
            variant="continuation"
            onRecordingComplete={(recording) => void transcribeRecording(recording)}
            onStateChange={(nextState: RecorderState) => {
              if (nextState === "recording") {
                dispatch({ type: "recording_started" });
              }
            }}
          />
          {state.transcriptionError ? (
            <ErrorNotice
              actionLabel={canRetryTranscription ? "Retry" : undefined}
              message={state.transcriptionError}
              onAction={
                canRetryTranscription && state.recordedAudio
                  ? () => void transcribeRecording(state.recordedAudio as RecordingResult)
                  : undefined
              }
            />
          ) : null}
        </div>

        <label className="mt-6 block">
          <textarea
            value={state.transcript}
            disabled={isBusy}
            onChange={(event) => handleTranscriptChange(event.target.value)}
            placeholder="Type any sentence..."
            className="min-h-32 w-full resize-y rounded-xl border border-zinc-900/10 bg-white/58 p-4 text-sm font-normal leading-7 text-ink outline-none transition placeholder:text-zinc-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/12 dark:bg-white/8 dark:text-white dark:placeholder:text-zinc-500"
          />
        </label>

        <div className="mt-4">
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleTryDemo}
              disabled={isBusy}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 disabled:cursor-not-allowed disabled:opacity-60 dark:text-amber-200 dark:hover:bg-amber-300/10"
            >
              <WandSparkles size={14} aria-hidden="true" />
              Try an example
            </button>
          </div>
          <HintPromptList
            hints={hints}
            selectedHint={state.selectedHint}
            disabled={isBusy}
            onSelect={handleSelectHint}
          />
        </div>

        {state.transformError ? (
          <ErrorNotice
            actionLabel={canRetryTransformation ? "Retry elevation" : undefined}
            message={state.transformError}
            onAction={canRetryTransformation ? () => void runTransformation() : undefined}
          />
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={
              (state.status === "idle" && !state.transcript.trim()) ||
              (isBusy && !state.result)
            }
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-900/12 bg-white/55 px-4 py-3 text-sm font-bold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/8 dark:text-zinc-200 dark:hover:bg-white/12 dark:focus-visible:ring-white/30 dark:focus-visible:ring-offset-zinc-950"
          >
            <RotateCcw size={17} aria-hidden="true" />
            Start Over
          </button>
          <button
            type="button"
            onClick={() => void runTransformation()}
            disabled={!canTransform}
            className={cn(
              "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:shadow-none dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-zinc-950",
              canTransform
                ? "bg-ink text-white shadow-lg shadow-zinc-900/15 hover:-translate-y-0.5 dark:bg-white dark:text-zinc-950"
                : "bg-zinc-400/70 text-white dark:bg-zinc-700 dark:text-zinc-300",
            )}
          >
            <WandSparkles size={18} aria-hidden="true" />
            {isTransforming ? "Enhancing..." : "Enhance"}
          </button>
        </div>
      </GlassCard>

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
          dispatch({ type: "transcript_changed", transcript: item.transcript })
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
        transcriptionError: "",
        transformError: "",
        result: null,
        lastFailedStep: null,
      };
    case "transcript_changed":
      return {
        ...state,
        status: action.transcript.trim() ? "transcriptReady" : "idle",
        selectedHint: action.selectedHint ?? "",
        transcript: action.transcript,
        transformError: "",
        result: null,
        lastFailedStep: null,
      };
    case "transcription_started":
      return {
        ...state,
        status: "transcribing",
        recordedAudio: action.recording,
        transcriptionError: "",
        transformError: "",
        result: null,
        lastFailedStep: null,
      };
    case "transcription_succeeded":
      return {
        ...state,
        status: "transcriptReady",
        transcript: [state.transcript.trim(), action.transcript.trim()]
          .filter(Boolean)
          .join(" "),
        selectedHint: "",
        transcriptionError: "",
        lastFailedStep: null,
      };
    case "transcription_failed":
      return {
        ...state,
        status: "error",
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
        return { ...state, status: "ttsLoading" };
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

function LoadingState({ status }: { status: PracticeStatus }) {
  const copy =
    status === "transcribing"
      ? {
          title: "Listening carefully...",
        }
      : status === "ttsLoading"
          ? {
              title: "Preparing audio...",
            }
          : {
              title: "Elevating your expression...",
            };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-300/12 dark:text-amber-100">
        <WandSparkles size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold text-ink dark:text-white">{copy.title}</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          {status === "transforming"
            ? "Finding stronger words while keeping your meaning intact."
            : "One moment while we prepare the next step."}
        </p>
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
  const compactHistory = history.slice(0, 2);

  if (compactHistory.length === 0) {
    return null;
  }

  return (
    <GlassCard className="animate-floatIn">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink dark:text-white">
          <Clock3 className="text-amber-700 dark:text-amber-200" size={18} aria-hidden="true" />
          Recently used
        </h2>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {history.length} saved
        </span>
      </div>
      <div className="mt-4 divide-y divide-zinc-900/8 dark:divide-white/10">
        {compactHistory.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-wrap-anywhere text-sm font-medium leading-6 text-ink dark:text-white">
                {item.transcript}
              </p>
              <HindiText
                text={item.naturalElegantVersion}
                className="mt-1 line-clamp-2"
                showEnglish={false}
              />
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onUse(item)}
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 disabled:cursor-not-allowed disabled:opacity-60 dark:text-amber-200 dark:hover:bg-amber-300/10"
            >
              Use again
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
