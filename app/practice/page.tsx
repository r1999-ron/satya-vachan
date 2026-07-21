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
import { motion } from "motion/react";
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
    <GlassCard className="p-6 sm:p-8" aria-busy="true">
      <p className="text-sm font-medium text-content-muted">Loading practice...</p>
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
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      <GlassCard className="p-4 sm:p-8">
        <PracticePipeline status={state.status} />
        <div>
          <RecorderButton
            key={recorderResetKey}
            className="border-0 bg-transparent p-0"
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
            placeholder="Write anything, in English, Hindi or Hinglish..."
            className="field min-h-32 resize-y text-sm leading-7"
          />
        </label>

        <div className="mt-4">
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleTryDemo}
              disabled={isBusy}
              className="btn btn-ghost min-h-8 px-2 text-xs text-accent"
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
            className="btn btn-outline min-h-12 w-full"
          >
            <RotateCcw size={17} aria-hidden="true" />
            Start Over
          </button>
          <button
            type="button"
            onClick={() => void runTransformation()}
            disabled={!canTransform}
            className="btn btn-solid min-h-12 w-full"
          >
            <WandSparkles size={18} aria-hidden="true" />
            {isTransforming ? "Enhancing..." : "Enhance"}
          </button>
        </div>
      </GlassCard>

      {isTranscribing || isTransforming || state.status === "ttsLoading" ? (
        <GlassCard className="">
          <LoadingState status={state.status} />
        </GlassCard>
      ) : null}

      {state.result ? (
        <div ref={resultRef}>
          <GlassCard className="">
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
      <motion.span
        animate={{ rotate: [0, 12, -8, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="grid size-12 shrink-0 place-items-center rounded-btn border-theme border-line bg-accent-soft text-accent"
      >
        <WandSparkles size={20} aria-hidden="true" />
      </motion.span>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold">{copy.title}</h2>
        <p className="mt-1 text-sm leading-6 text-content-muted">
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
    <GlassCard className="">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-display">
          <Clock3 className="text-accent" size={18} aria-hidden="true" />
          Recently used
        </h2>
        <span className="text-xs font-medium text-content-subtle">
          {history.length} saved
        </span>
      </div>
      <div className="mt-4 divide-y divide-line">
        {compactHistory.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-wrap-anywhere text-sm font-medium leading-6">
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
              className="btn btn-ghost min-h-9 shrink-0 px-3 text-xs text-accent"
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

