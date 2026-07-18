"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { RotateCcw, WandSparkles } from "lucide-react";
import {
  RecorderButton,
  type RecorderState,
} from "@/components/audio/RecorderButton";
import { ChallengeBanner } from "@/components/challenge/ChallengeBanner";
import { ChallengeFeedback } from "@/components/challenge/ChallengeFeedback";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingMeter } from "@/components/ui/LoadingMeter";
import { useTranscription } from "@/hooks/useTranscription";
import { requestJson } from "@/lib/api-client";
import { evaluateChallengeLocally, getSentenceStarters } from "@/lib/challenge";
import { useStreak } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { normalizeChallengeResponse, validateTranscript } from "@/lib/validators";
import type { ChallengeResponse, RecordingResult, WordEntry } from "@/types";

type ChallengeStatus =
  | "idle"
  | "recording"
  | "transcribing"
  | "transcriptReady"
  | "validating"
  | "challengeReady"
  | "error";

type FailedStep = "transcription" | "validation" | null;

type ChallengeState = {
  status: ChallengeStatus;
  selectedStarter: string;
  transcript: string;
  recordedAudio: RecordingResult | null;
  result: ChallengeResponse | null;
  fallbackNotice: string;
  transcriptionError: string;
  validationError: string;
  lastFailedStep: FailedStep;
};

type ChallengeAction =
  | { type: "recording_started" }
  | { type: "transcript_changed"; transcript: string; selectedStarter?: string }
  | { type: "transcription_started"; recording: RecordingResult }
  | { type: "transcription_succeeded"; transcript: string }
  | { type: "transcription_failed"; error: string }
  | { type: "validation_started"; transcript: string }
  | {
      type: "validation_succeeded";
      result: ChallengeResponse;
      fallbackNotice?: string;
    }
  | { type: "validation_failed"; error: string }
  | { type: "reset" };

const initialChallengeState: ChallengeState = {
  status: "idle",
  selectedStarter: "",
  transcript: "",
  recordedAudio: null,
  result: null,
  fallbackNotice: "",
  transcriptionError: "",
  validationError: "",
  lastFailedStep: null,
};

export function DailyChallenge({ word }: { word: WordEntry }) {
  const starters = useMemo(() => getSentenceStarters(word), [word]);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const { completedToday, completeToday } = useStreak();
  const [state, dispatch] = useReducer(challengeReducer, initialChallengeState);
  const [recorderResetKey, setRecorderResetKey] = useState(0);

  const isTranscribing = state.status === "transcribing";
  const isValidating = state.status === "validating";
  const isBusy = isTranscribing || isValidating;
  const canValidate = state.transcript.trim().length > 0 && !isBusy;
  const canRetryTranscription =
    Boolean(state.recordedAudio) &&
    state.lastFailedStep === "transcription" &&
    !isBusy;
  const canRetryValidation =
    state.transcript.trim().length > 0 &&
    state.lastFailedStep === "validation" &&
    !isBusy;

  useEffect(() => {
    if (state.result) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state.result]);

  const finishValidation = useCallback(
    (result: ChallengeResponse, fallbackNotice?: string) => {
      if (result.acceptableUsage && !completedToday) {
        completeToday();
      }
      dispatch({ type: "validation_succeeded", result, fallbackNotice });
    },
    [completeToday, completedToday],
  );

  const runValidation = useCallback(
    async (nextTranscript = state.transcript) => {
      const transcriptResult = validateTranscript(nextTranscript.trim(), 800);

      if (!transcriptResult.ok) {
        dispatch({ type: "validation_failed", error: transcriptResult.message });
        return;
      }

      dispatch({ type: "validation_started", transcript: transcriptResult.value });

      try {
        const payload = await requestJson<ChallengeResponse>("/api/challenge", {
          method: "POST",
          body: {
            transcript: transcriptResult.value,
            targetWord: word.elevated.roman,
            wordEntry: word,
          },
          fallbackMessage:
            "Challenge validation is unavailable. Using a careful local check.",
          timeoutMs: 30_000,
          validate: (value) =>
            normalizeChallengeResponse(value, transcriptResult.value),
        });
        finishValidation({ ...payload, transcript: transcriptResult.value });
      } catch {
        finishValidation(
          evaluateChallengeLocally(transcriptResult.value, word),
          "AI validation was unavailable, so this attempt used the local target-word check.",
        );
      }
    },
    [finishValidation, state.transcript, word],
  );

  const transcribeRecording = useTranscription({
    onError: useCallback((error: string) => {
      dispatch({ type: "transcription_failed", error });
    }, []),
    onStart: useCallback((recording: RecordingResult) => {
      dispatch({ type: "transcription_started", recording });
    }, []),
    onSuccess: useCallback((transcript: string) => {
      dispatch({ type: "transcription_succeeded", transcript });
    }, []),
  });

  const handleStarterSelect = useCallback(
    (starter: string) => {
      if (!isBusy) {
        dispatch({
          type: "transcript_changed",
          transcript: starter,
          selectedStarter: starter,
        });
      }
    },
    [isBusy],
  );

  const handleTranscriptChange = (value: string) => {
    if (!isBusy) {
      dispatch({
        type: "transcript_changed",
        transcript: value,
        selectedStarter: starters.includes(value) ? value : "",
      });
    }
  };

  const handleReset = () => {
    dispatch({ type: "reset" });
    setRecorderResetKey((key) => key + 1);
  };

  return (
    <section
      id="daily-challenge"
      aria-labelledby="daily-challenge-title"
      className="scroll-mt-24 space-y-4 sm:space-y-5"
    >
      <GlassCard className="animate-floatIn p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
              Daily challenge
            </p>
            <h2
              id="daily-challenge-title"
              className="mt-1 text-2xl font-bold tracking-[-0.025em] text-ink sm:text-3xl dark:text-white"
            >
              Try today&apos;s word
            </h2>
            <p className="mt-2 text-sm font-normal leading-6 text-zinc-600 dark:text-zinc-300">
              Say or type a sentence, then check how naturally you used it.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <ChallengeBanner
            completedToday={completedToday}
            disabled={isBusy}
            onStarterSelect={handleStarterSelect}
            selectedStarter={state.selectedStarter}
            starters={starters}
            word={word}
          />
        </div>

        <div className="mt-6">
          <RecorderButton
            key={recorderResetKey}
            className="border-0 bg-transparent p-0 dark:bg-transparent"
            disabled={isBusy}
            hideDuration
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
                  ? () =>
                      void transcribeRecording(
                        state.recordedAudio as RecordingResult,
                      )
                  : undefined
              }
            />
          ) : null}
        </div>

        <label className="mt-6 block">
          <span className="sr-only">Your sentence using today&apos;s word</span>
          <textarea
            value={state.transcript}
            disabled={isBusy}
            onChange={(event) => handleTranscriptChange(event.target.value)}
            placeholder={`Write a sentence using ${word.elevated.roman}...`}
            className="min-h-32 w-full resize-y rounded-xl border border-zinc-900/10 bg-white/58 p-4 text-sm font-normal leading-7 text-ink outline-none transition placeholder:text-zinc-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/12 dark:bg-white/8 dark:text-white dark:placeholder:text-zinc-500"
          />
        </label>

        {state.validationError ? (
          <ErrorNotice
            actionLabel={canRetryValidation ? "Retry challenge" : undefined}
            message={state.validationError}
            onAction={canRetryValidation ? () => void runValidation() : undefined}
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
            onClick={() => void runValidation()}
            disabled={!canValidate}
            className={cn(
              "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:shadow-none dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-zinc-950",
              canValidate
                ? "bg-ink text-white shadow-lg shadow-zinc-900/15 hover:-translate-y-0.5 dark:bg-white dark:text-zinc-950"
                : "bg-zinc-400/70 text-white dark:bg-zinc-700 dark:text-zinc-300",
            )}
          >
            <WandSparkles size={18} aria-hidden="true" />
            {isValidating ? "Checking..." : "Check My Answer"}
          </button>
        </div>
      </GlassCard>

      {isTranscribing || isValidating ? (
        <GlassCard className="animate-floatIn">
          <ChallengeLoadingState status={state.status} />
        </GlassCard>
      ) : null}

      {state.result ? (
        <div ref={resultRef} className="scroll-mt-24">
          <ChallengeFeedback
            fallbackNotice={state.fallbackNotice}
            result={state.result}
            targetWord={word.elevated.dev}
          />
        </div>
      ) : null}
    </section>
  );
}

function challengeReducer(
  state: ChallengeState,
  action: ChallengeAction,
): ChallengeState {
  switch (action.type) {
    case "recording_started":
      return {
        ...state,
        status: "recording",
        recordedAudio: null,
        transcriptionError: "",
        validationError: "",
        result: null,
        fallbackNotice: "",
        lastFailedStep: null,
      };
    case "transcript_changed":
      return {
        ...state,
        status: action.transcript.trim() ? "transcriptReady" : "idle",
        selectedStarter: action.selectedStarter ?? "",
        transcript: action.transcript,
        validationError: "",
        result: null,
        fallbackNotice: "",
        lastFailedStep: null,
      };
    case "transcription_started":
      return {
        ...state,
        status: "transcribing",
        recordedAudio: action.recording,
        transcriptionError: "",
        validationError: "",
        result: null,
        fallbackNotice: "",
        lastFailedStep: null,
      };
    case "transcription_succeeded":
      return {
        ...state,
        status: "transcriptReady",
        transcript: action.transcript,
        selectedStarter: "",
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
    case "validation_started":
      return {
        ...state,
        status: "validating",
        transcript: action.transcript,
        validationError: "",
        result: null,
        fallbackNotice: "",
        lastFailedStep: null,
      };
    case "validation_succeeded":
      return {
        ...state,
        status: action.result.acceptableUsage
          ? "challengeReady"
          : "transcriptReady",
        validationError: "",
        result: action.result,
        fallbackNotice: action.fallbackNotice ?? "",
        lastFailedStep: null,
      };
    case "validation_failed":
      return {
        ...state,
        status: "error",
        validationError: action.error,
        result: null,
        lastFailedStep: "validation",
      };
    case "reset":
      return initialChallengeState;
    default:
      return state;
  }
}

function ChallengeLoadingState({ status }: { status: ChallengeStatus }) {
  const copy =
    status === "transcribing"
      ? {
          title: "Listening carefully...",
          body: "Your recording is being transcribed into an editable sentence.",
        }
      : {
          title: "Checking your sentence...",
          body: "Your use of today’s word is being reviewed.",
        };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-300/12 dark:text-amber-100">
        <WandSparkles size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold text-ink dark:text-white">{copy.title}</h2>
        <p className="mt-1 text-sm font-normal leading-6 text-zinc-600 dark:text-zinc-400">
          {copy.body}
        </p>
        <LoadingMeter />
      </div>
    </div>
  );
}
