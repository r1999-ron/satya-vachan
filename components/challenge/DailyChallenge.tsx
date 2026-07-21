"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { RotateCcw, WandSparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
import { transitions } from "@/lib/motion";
import { useStreak } from "@/lib/storage";
import { readThemeColors } from "@/lib/theme";
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

export function DailyChallenge({
  isToday = true,
  word,
}: {
  isToday?: boolean;
  word: WordEntry;
}) {
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
        confetti({
          particleCount: 64,
          spread: 68,
          startVelocity: 32,
          gravity: 0.9,
          scalar: 0.86,
          origin: { x: 0.5, y: 0.72 },
          colors: readThemeColors([
            "--c-accent",
            "--c-accent-bright",
            "--c-secondary",
            "--c-success",
          ]),
          disableForReducedMotion: true,
        });
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
      <GlassCard className="p-4 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="daily-challenge-title"
              className="font-display text-2xl font-bold tracking-display sm:text-3xl"
            >
              {isToday ? "Try today's word" : "Try this word"}
            </h2>
          </div>
        </div>

        <div className="mt-4 sm:mt-5">
          <ChallengeBanner
            completedToday={completedToday}
            disabled={isBusy}
            isToday={isToday}
            onStarterSelect={handleStarterSelect}
            selectedStarter={state.selectedStarter}
            starters={starters}
            word={word}
          />
        </div>

        <div id="daily-challenge-recorder" className="mt-5 sm:mt-6">
          <RecorderButton
            key={recorderResetKey}
            className="border-0 bg-transparent p-0"
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

        <label className="mt-5 block sm:mt-6">
          <span className="sr-only">Your sentence using today&apos;s word</span>
          <textarea
            value={state.transcript}
            disabled={isBusy}
            onChange={(event) => handleTranscriptChange(event.target.value)}
            placeholder={`Write any sentence in English, Hindi or Hinglish using the word ${word.elevated.roman}...`}
            className="field min-h-32 resize-y text-sm leading-7"
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
          <motion.button
            type="button"
            onClick={handleReset}
            disabled={
              (state.status === "idle" && !state.transcript.trim()) ||
              (isBusy && !state.result)
            }
            whileTap={{ scale: 0.98 }}
            transition={transitions.snappy}
            className="btn btn-outline min-h-12 w-full"
          >
            <RotateCcw size={17} aria-hidden="true" />
            Start Over
          </motion.button>
          <motion.button
            type="button"
            onClick={() => void runValidation()}
            disabled={!canValidate}
            whileTap={canValidate ? { scale: 0.98 } : undefined}
            transition={transitions.snappy}
            className="btn btn-solid min-h-12 w-full"
          >
            <WandSparkles size={18} aria-hidden="true" />
            {isValidating ? "Checking..." : "Check Answer"}
          </motion.button>
        </div>
      </GlassCard>

      {isTranscribing || isValidating ? (
        <GlassCard>
          <ChallengeLoadingState status={state.status} />
        </GlassCard>
      ) : null}

      <AnimatePresence mode="wait">
        {state.result ? (
          <motion.div
            key={`${state.result.transcript}-${state.result.acceptableUsage}`}
            ref={resultRef}
            className="scroll-mt-24"
            initial={{ opacity: 0, y: 24, scale: 0.975 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.985 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
          >
            <ChallengeFeedback
              fallbackNotice={state.fallbackNotice}
              result={state.result}
              targetWord={word.elevated.dev}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
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
          body: "Your recording is being transcribed and formatted as mixed-script Hinglish.",
        }
      : {
          title: "Checking your sentence...",
          body: "Your use of today’s word is being reviewed.",
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
        <p className="mt-1 text-sm leading-6 text-content-muted">{copy.body}</p>
        <LoadingMeter />
      </div>
    </div>
  );
}
