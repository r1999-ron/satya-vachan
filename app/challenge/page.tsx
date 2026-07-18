"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import {
  AlertCircle,
  BookOpenCheck,
  CheckCircle2,
  Keyboard,
  RotateCcw,
  Sparkles,
  Trophy,
  Upload,
} from "lucide-react";
import {
  RecorderButton,
  type RecorderState,
} from "@/components/audio/RecorderButton";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { HindiText } from "@/components/hindi/HindiText";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingMeter } from "@/components/ui/LoadingMeter";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getWordOfTheDay } from "@/data/words";
import { useTranscription } from "@/hooks/useTranscription";
import { requestJson } from "@/lib/api-client";
import { formatRecordingDuration } from "@/lib/audio";
import { formatReadableDate } from "@/lib/dates";
import { useLearnedWords, useStreak } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { containsTargetWord } from "@/lib/word-match";
import {
  normalizeChallengeResponse,
  validateTranscript,
} from "@/lib/validators";
import type { ChallengeResponse, HindiText as HindiTextValue, RecordingResult, WordEntry } from "@/types";

type ChallengeStatus =
  | "idle"
  | "recording"
  | "recorded"
  | "transcribing"
  | "transcriptReady"
  | "validating"
  | "completed"
  | "error";

type FailedStep = "transcription" | "validation" | null;

type ChallengeState = {
  status: ChallengeStatus;
  selectedStarter: string;
  transcript: string;
  recordedAudio: RecordingResult | null;
  recordingNotice: string;
  transcriptionError: string;
  validationError: string;
  fallbackNotice: string;
  result: ChallengeResponse | null;
  lastFailedStep: FailedStep;
};

type ChallengeAction =
  | { type: "recording_started" }
  | { type: "recording_complete"; recording: RecordingResult; notice: string }
  | { type: "recording_discarded" }
  | { type: "transcript_changed"; transcript: string; selectedStarter?: string }
  | { type: "transcription_started"; recording: RecordingResult }
  | { type: "transcription_succeeded"; transcript: string; notice: string }
  | { type: "transcription_failed"; error: string; notice: string }
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
  recordingNotice: "",
  transcriptionError: "",
  validationError: "",
  fallbackNotice: "",
  result: null,
  lastFailedStep: null,
};

export default function ChallengePage() {
  const todayWord = getWordOfTheDay();
  const starters = useMemo(() => getSentenceStarters(todayWord), [todayWord]);
  const { completedToday, completeToday, streak } = useStreak();
  const { saveWord, words } = useLearnedWords();
  const [state, dispatch] = useReducer(
    challengeReducer,
    initialChallengeState,
  );
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
  const todayWordSaved = useMemo(
    () =>
      words.some(
        (word) =>
          word.word.trim().toLocaleLowerCase() ===
            todayWord.elevated.roman.toLocaleLowerCase(),
      ),
    [todayWord.elevated, words],
  );

  const finishValidation = useCallback(
    (result: ChallengeResponse, fallbackNotice?: string) => {
      if (result.acceptableUsage && !completedToday) {
        completeToday();
      }

      dispatch({
        type: "validation_succeeded",
        result,
        fallbackNotice,
      });
    },
    [completeToday, completedToday],
  );

  const handleTranscriptionStart = useCallback((recording: RecordingResult) => {
    dispatch({ type: "transcription_started", recording });
  }, []);
  const handleTranscriptionSuccess = useCallback((transcript: string) => {
    dispatch({
      type: "transcription_succeeded",
      transcript,
      notice: "Transcript ready. Edit it, then check the challenge.",
    });
  }, []);
  const handleTranscriptionError = useCallback((error: string) => {
    dispatch({
      type: "transcription_failed",
      error,
      notice:
        "The recording is still available. You can retry upload or type the sentence below.",
    });
  }, []);
  const transcribeRecording = useTranscription({
    onError: handleTranscriptionError,
    onStart: handleTranscriptionStart,
    onSuccess: handleTranscriptionSuccess,
  });

  const validateChallenge = useCallback(
    async (nextTranscript = state.transcript) => {
      const cleanedTranscript = nextTranscript.trim();
      const transcriptResult = validateTranscript(
        cleanedTranscript,
        800,
      );

      if (!transcriptResult.ok) {
        dispatch({
          type: "validation_failed",
          error: transcriptResult.message,
        });
        return;
      }

      dispatch({
        type: "validation_started",
        transcript: transcriptResult.value,
      });

      try {
        const payload = await requestJson<ChallengeResponse>("/api/challenge", {
          method: "POST",
          body: {
            transcript: transcriptResult.value,
            targetWord: todayWord.elevated.roman,
            wordEntry: todayWord,
          },
          fallbackMessage:
            "Challenge validation is unavailable. Using a careful local check.",
          timeoutMs: 30_000,
          validate: (value) =>
            normalizeChallengeResponse(value, transcriptResult.value),
        });

        finishValidation({
          ...payload,
          transcript: transcriptResult.value,
        });
      } catch {
        finishValidation(
          evaluateChallengeLocally(transcriptResult.value, todayWord),
          "AI validation was unavailable, so this attempt used the local target-word check.",
        );
      }
    },
    [finishValidation, state.transcript, todayWord],
  );

  const handleStarterSelect = (starter: string) => {
    if (isBusy) {
      return;
    }

    dispatch({
      type: "transcript_changed",
      transcript: starter,
      selectedStarter: starter,
    });
  };

  const handleTranscriptChange = (value: string) => {
    if (isBusy) {
      return;
    }

    dispatch({
      type: "transcript_changed",
      transcript: value,
      selectedStarter: starters.includes(value) ? value : "",
    });
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

  const handleReset = () => {
    dispatch({ type: "reset" });
    setRecorderResetKey((key) => key + 1);
  };

  const handleSaveTodayWord = () => {
    if (todayWordSaved) {
      return;
    }

    saveWord(
      {
        word: todayWord.elevated.roman,
        wordDev: todayWord.elevated.dev,
        meaning: todayWord.englishMeaning,
        simpleAlternative: todayWord.common.roman,
        exampleSentence: todayWord.elevatedExample.roman,
      },
      "challenge",
    );
  };

  const progressValue = completedToday
    ? 100
    : state.result?.acceptableUsage
      ? 100
      : state.transcript.trim()
        ? 58
        : 20;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <section className="space-y-5">
        <GlassCard className="animate-floatIn p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Today</p>
            {completedToday || state.status !== "idle" ? (
              <StatusBadge tone={completedToday ? "green" : "blue"}>
                {completedToday ? "Completed" : statusLabel(state.status)}
              </StatusBadge>
            ) : null}
          </div>

          <div className="mt-6">
            <h1 className="text-balance text-4xl font-bold tracking-[-0.035em] text-ink sm:text-5xl dark:text-white">
              Use <HindiText text={todayWord.elevated} kind="inline" className="text-amber-700 dark:text-amber-300" /> in a sentence.
            </h1>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <WordPanel label="Common" value={todayWord.common} />
            <div className="hidden items-center text-amber-600 md:flex">
              <Sparkles size={24} aria-hidden="true" />
            </div>
            <WordPanel
              label="Target word"
              value={todayWord.elevated}
              featured
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <InfoPanel title="Meaning">{todayWord.englishMeaning}</InfoPanel>
            <InfoPanel title="Usage note">{todayWord.usageNote}</InfoPanel>
          </div>
        </GlassCard>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <GlassCard className="animate-floatIn [animation-delay:80ms]">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-400/16 text-amber-800 dark:text-amber-200">
                <Upload size={19} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-ink dark:text-white">Record</h2>
              </div>
            </div>

            <div className="mt-5">
              <RecorderButton
                key={recorderResetKey}
                disabled={isBusy}
                onDiscard={() => dispatch({ type: "recording_discarded" })}
                onProcess={(recording) => void transcribeRecording(recording)}
                onRecordingComplete={handleRecordingComplete}
                onStateChange={handleRecorderStateChange}
              />
            </div>

            {state.recordedAudio ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge tone="green">Audio ready</StatusBadge>
                <StatusBadge tone="blue">
                  {formatRecordingDuration(state.recordedAudio.durationMs)}
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
                actionLabel={
                  canRetryTranscription ? "Retry transcription" : undefined
                }
                message={state.transcriptionError}
                onAction={
                  canRetryTranscription
                    ? () => {
                        if (state.recordedAudio) {
                          void transcribeRecording(state.recordedAudio);
                        }
                      }
                    : undefined
                }
              />
            ) : null}
          </GlassCard>

          <GlassCard className="animate-floatIn [animation-delay:120ms]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-400/16 text-sky-800 dark:text-sky-200">
                  <Keyboard size={19} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-ink dark:text-white">Your sentence</h2>
                </div>
              </div>
            </div>

            <textarea
              value={state.transcript}
              disabled={isBusy}
              onChange={(event) => handleTranscriptChange(event.target.value)}
              placeholder={`Use “${todayWord.elevated.dev}” in one Hindi sentence...`}
              className="mt-5 min-h-36 w-full resize-y rounded-2xl border border-white/60 bg-white/55 p-4 text-sm font-semibold leading-7 text-ink outline-none transition placeholder:text-zinc-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-400/35 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/12 dark:bg-white/8 dark:text-white dark:placeholder:text-zinc-500"
            />

            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Starters
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {starters.map((starter) => {
                  const selected = state.selectedStarter === starter;

                  return (
                    <button
                      key={starter}
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleStarterSelect(starter)}
                      className={cn(
                        "rounded-full border px-3 py-2 text-left text-xs font-bold leading-5 transition focus:outline-none focus:ring-2 focus:ring-amber-400/45 disabled:cursor-not-allowed disabled:opacity-60",
                        selected
                          ? "border-amber-300/80 bg-amber-100/75 text-amber-950 dark:border-amber-300/30 dark:bg-amber-300/14 dark:text-amber-100"
                          : "border-white/60 bg-white/45 text-zinc-700 hover:-translate-y-0.5 dark:border-white/12 dark:bg-white/8 dark:text-zinc-300",
                      )}
                    >
                      {starter}
                    </button>
                  );
                })}
              </div>
            </div>

            {state.validationError ? (
              <ErrorNotice
                actionLabel={canRetryValidation ? "Retry check" : undefined}
                message={state.validationError}
                onAction={
                  canRetryValidation
                    ? () => void validateChallenge()
                    : undefined
                }
              />
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={!canValidate}
                onClick={() => void validateChallenge()}
                className={cn(
                  "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-ink/40 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:shadow-none dark:focus:ring-white/40 dark:focus:ring-offset-zinc-950",
                  canValidate
                    ? "bg-ink text-white shadow-lg shadow-zinc-900/15 hover:-translate-y-0.5 dark:bg-white dark:text-zinc-950"
                    : "bg-zinc-400/70 text-white dark:bg-zinc-700 dark:text-zinc-300",
                )}
              >
                <Sparkles
                  className={cn(isValidating && "motion-safe:animate-spin")}
                  size={18}
                  aria-hidden="true"
                />
                {isValidating ? "Checking..." : "Check challenge"}
              </button>
              {state.status !== "idle" || state.transcript.trim() ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleReset}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-5 py-3 text-sm font-bold text-ink shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/12 dark:bg-white/10 dark:text-white dark:focus:ring-offset-zinc-950"
                >
                  <RotateCcw size={17} aria-hidden="true" />
                  New attempt
                </button>
              ) : null}
            </div>
          </GlassCard>
        </div>

        {isTranscribing || isValidating ? (
          <GlassCard className="animate-floatIn">
            <LoadingState status={state.status} />
          </GlassCard>
        ) : null}

        {state.result ? (
          <ChallengeFeedback
            fallbackNotice={state.fallbackNotice}
            result={state.result}
            targetWord={todayWord.elevated.dev}
          />
        ) : null}
      </section>

      <aside className="space-y-5">
        <GlassCard className="animate-floatIn [animation-delay:100ms]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Challenge</p>
              <p className="mt-1 text-2xl font-bold text-ink dark:text-white">
                {formatReadableDate()}
              </p>
            </div>
            <ProgressRing
              value={progressValue}
              label="Challenge completion"
              className={completedToday ? "motion-safe:animate-scorePulse" : ""}
            />
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-400/14 px-4 py-3 text-sm font-bold text-emerald-900 dark:text-emerald-100">
            <Trophy size={18} aria-hidden="true" />
            {completedToday
              ? `Complete. Current streak: ${streak.currentStreak}`
              : `Current streak: ${streak.currentStreak}`}
          </div>
        </GlassCard>

        <GlassCard className="animate-floatIn [animation-delay:150ms]">
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Examples</p>
          <div className="mt-4 space-y-3 text-sm leading-7">
            <p className="text-wrap-anywhere text-zinc-600 dark:text-zinc-300">
              <span className="font-bold text-zinc-800 dark:text-zinc-100">
                Simple:
              </span>{" "}
              <HindiText text={todayWord.simpleExample} />
            </p>
            <p className="text-wrap-anywhere text-amber-900 dark:text-amber-100">
              <span className="font-bold">Polished:</span>{" "}
              <HindiText text={todayWord.elevatedExample} />
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {todayWord.synonyms.map((synonym) => (
              <span
                key={synonym.roman}
                className="rounded-full bg-white/45 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-white/8 dark:text-zinc-300"
              >
                <HindiText text={synonym} kind="inline" />
              </span>
            ))}
          </div>
          <button
            type="button"
            disabled={todayWordSaved}
            onClick={handleSaveTodayWord}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-2 text-sm font-bold text-white shadow-lg shadow-zinc-900/15 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ink/40 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:bg-emerald-700 disabled:shadow-none dark:bg-white dark:text-zinc-950 dark:focus:ring-white/40 dark:focus:ring-offset-zinc-950 dark:disabled:bg-emerald-200 dark:disabled:text-emerald-950"
          >
            {todayWordSaved ? (
              <CheckCircle2 size={16} aria-hidden="true" />
            ) : (
              <BookOpenCheck size={16} aria-hidden="true" />
            )}
            {todayWordSaved ? "Saved" : "Save word"}
          </button>
        </GlassCard>
      </aside>
    </div>
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
        recordingNotice: "",
        transcriptionError: "",
        validationError: "",
        fallbackNotice: "",
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
        validationError: "",
        fallbackNotice: "",
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
        selectedStarter: action.selectedStarter ?? "",
        transcript: action.transcript,
        validationError: "",
        fallbackNotice: "",
        result: null,
        lastFailedStep:
          state.lastFailedStep === "validation" ? null : state.lastFailedStep,
      };
    case "transcription_started":
      return {
        ...state,
        status: "transcribing",
        recordedAudio: action.recording,
        recordingNotice: "Listening carefully...",
        transcriptionError: "",
        validationError: "",
        fallbackNotice: "",
        result: null,
        lastFailedStep: null,
      };
    case "transcription_succeeded":
      return {
        ...state,
        status: "transcriptReady",
        transcript: action.transcript,
        selectedStarter: "",
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
    case "validation_started":
      return {
        ...state,
        status: "validating",
        transcript: action.transcript,
        validationError: "",
        fallbackNotice: "",
        result: null,
        lastFailedStep: null,
      };
    case "validation_succeeded":
      return {
        ...state,
        status: action.result.acceptableUsage ? "completed" : "transcriptReady",
        validationError: "",
        fallbackNotice: action.fallbackNotice ?? "",
        result: action.result,
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

function WordPanel({
  featured = false,
  label,
  value,
}: {
  featured?: boolean;
  label: string;
  value: HindiTextValue;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border p-5",
        featured
          ? "border-amber-200/80 bg-amber-100/55 shadow-glow dark:border-amber-300/25 dark:bg-amber-300/10"
          : "border-white/60 bg-white/38 dark:border-white/12 dark:bg-white/5",
      )}
    >
      <p
        className={cn(
          "text-xs font-bold uppercase tracking-[0.16em]",
          featured
            ? "text-amber-800 dark:text-amber-200"
            : "text-zinc-500 dark:text-zinc-400",
        )}
      >
        {label}
      </p>
      <HindiText
        text={value}
        kind="word"
        className="mt-2"
        devClassName={cn("text-3xl", featured ? "text-ink dark:text-white" : "text-zinc-700 dark:text-zinc-200")}
      />
    </div>
  );
}

function InfoPanel({
  children,
  title,
}: {
  children: string;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/35 p-5 dark:border-white/12 dark:bg-white/5">
      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
        {title}
      </p>
      <p className="mt-2 text-wrap-anywhere text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        {children}
      </p>
    </div>
  );
}

function LoadingState({ status }: { status: ChallengeStatus }) {
  const copy =
    status === "transcribing"
      ? {
          title: "Listening carefully...",
          body: "Your challenge recording is becoming an editable transcript.",
        }
      : {
          title: "Checking usage...",
          body: "The coach is looking for natural use of today's refined word.",
        };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400/18 text-amber-700 shadow-glow dark:text-amber-200">
        <Sparkles
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

function ChallengeFeedback({
  fallbackNotice,
  result,
  targetWord,
}: {
  fallbackNotice: string;
  result: ChallengeResponse;
  targetWord: string;
}) {
  const successful = result.acceptableUsage;

  return (
    <GlassCard
      className={cn(
        "animate-floatIn relative",
        successful
          ? "border-emerald-200/80 bg-emerald-100/45 motion-safe:animate-savePop dark:border-emerald-300/25 dark:bg-emerald-300/10"
          : "border-amber-200/80 bg-amber-100/45 dark:border-amber-300/25 dark:bg-amber-300/10",
      )}
    >
      {successful ? <CompletionBurst /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-2xl shadow-glow",
              successful
                ? "bg-emerald-400/20 text-emerald-800 dark:text-emerald-200"
                : "bg-amber-400/20 text-amber-800 dark:text-amber-200",
            )}
          >
            {successful ? (
              <Trophy size={22} aria-hidden="true" />
            ) : (
              <AlertCircle size={22} aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={successful ? "green" : "gold"}>
                {successful ? "Challenge accepted" : "Try once more"}
              </StatusBadge>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-ink dark:text-white">
              {successful
                ? "That usage works nicely."
                : `Use ${targetWord} a little more directly.`}
            </h2>
            <p className="mt-2 text-wrap-anywhere text-sm leading-7 text-zinc-700 dark:text-zinc-300">
              {result.feedback}
            </p>
          </div>
        </div>
      </div>

      {fallbackNotice ? (
        <p className="mt-4 rounded-2xl border border-sky-200/70 bg-sky-100/45 p-3 text-xs font-semibold leading-5 text-sky-950 dark:border-sky-300/25 dark:bg-sky-300/10 dark:text-sky-100">
          {fallbackNotice}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <StatusTile
          label="Target word"
          success={result.usedTargetWord}
          value={result.usedTargetWord ? "Found" : "Missing"}
        />
        <StatusTile
          label="Usage"
          success={result.acceptableUsage}
          value={result.acceptableUsage ? "Acceptable" : "Needs revision"}
        />
      </div>

      {result.suggestedImprovement ? (
        <div className="mt-4 rounded-2xl border border-white/60 bg-white/38 p-4 dark:border-white/12 dark:bg-white/5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Suggested version
          </p>
          <p className="mt-2 text-wrap-anywhere text-sm font-semibold leading-7 text-ink dark:text-white">
            {result.suggestedImprovement}
          </p>
        </div>
      ) : null}
    </GlassCard>
  );
}

function CompletionBurst() {
  return (
    <div
      className="pointer-events-none absolute right-5 top-5 hidden h-16 w-20 overflow-hidden sm:block"
      aria-hidden="true"
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className="absolute size-2 rounded-full bg-emerald-400/80 shadow-glow motion-safe:animate-savePop"
          style={{
            left: `${12 + index * 13}px`,
            top: `${index % 2 === 0 ? 8 : 26}px`,
            animationDelay: `${index * 70}ms`,
          }}
        />
      ))}
    </div>
  );
}

function StatusTile({
  label,
  success,
  value,
}: {
  label: string;
  success: boolean;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/38 p-4 dark:border-white/12 dark:bg-white/5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 flex items-center gap-2 text-sm font-bold",
          success
            ? "text-emerald-800 dark:text-emerald-100"
            : "text-amber-900 dark:text-amber-100",
        )}
      >
        <CheckCircle2 size={16} aria-hidden="true" />
        {value}
      </p>
    </div>
  );
}

function getSentenceStarters(wordEntry: WordEntry) {
  const starters = wordEntry.starters
    .map((starter) => starter.dev.trim())
    .filter(Boolean);

  return starters.length > 0 ? starters : [wordEntry.elevatedExample.dev];
}

function evaluateChallengeLocally(
  transcript: string,
  wordEntry: WordEntry,
): ChallengeResponse {
  const usedTargetWord =
    containsTargetWord(transcript, wordEntry.elevated.roman) ||
    containsTargetWord(transcript, wordEntry.elevated.dev);
  const reasonableLength =
    transcript.trim().length >= 18 && transcript.trim().split(/\s+/).length >= 4;

  if (!usedTargetWord) {
    return {
      transcript,
      usedTargetWord: false,
      acceptableUsage: false,
      feedback: `Aapka vaakya achha aarambh hai. Is baar "${wordEntry.elevated.dev}" shabd ko seedhe vaakya mein jod kar phir se koshish kijiye.`,
      suggestedImprovement: `${wordEntry.elevated.dev} shabd ka prayog karte hue ek poora vaakya kahiye.`,
      completed: false,
    };
  }

  if (!reasonableLength) {
    return {
      transcript,
      usedTargetWord: true,
      acceptableUsage: false,
      feedback:
        "Target word mil gaya. Ab ise thoda aur poore, natural vaakya mein istemal kijiye.",
      suggestedImprovement: wordEntry.elevatedExample.dev,
      completed: false,
    };
  }

  return {
    transcript,
    usedTargetWord: true,
    acceptableUsage: true,
    feedback:
      "Sundar prayog. Target word vaakya mein spasht hai aur usage natural lag raha hai.",
    completed: true,
  };
}

function statusLabel(status: ChallengeStatus) {
  switch (status) {
    case "recording":
      return "Recording";
    case "recorded":
      return "Audio ready";
    case "transcribing":
      return "Transcribing";
    case "transcriptReady":
      return "Transcript ready";
    case "validating":
      return "Checking";
    case "completed":
      return "Accepted";
    case "error":
      return "Needs attention";
    case "idle":
    default:
      return "Ready";
  }
}
