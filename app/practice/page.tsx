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
import { useSearchParams } from "next/navigation";
import { ArrowRight, Clock3, RotateCcw, WandSparkles } from "lucide-react";
import {
  RecorderButton,
  type RecorderState,
} from "@/components/audio/RecorderButton";
import { ChallengeBanner } from "@/components/challenge/ChallengeBanner";
import { ChallengeFeedback } from "@/components/challenge/ChallengeFeedback";
import { HindiText } from "@/components/hindi/HindiText";
import { HintPromptList } from "@/components/practice/HintPromptList";
import { TransformationResult } from "@/components/practice/TransformationResult";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingMeter } from "@/components/ui/LoadingMeter";
import { getDemoHints, defaultTransformationExample } from "@/data/demo";
import { SPEAK_BETTER_HINDI_TAGLINES } from "@/data/taglines";
import { getWordOfTheDay, wordCorpus } from "@/data/words";
import { useTranscription } from "@/hooks/useTranscription";
import { requestJson } from "@/lib/api-client";
import {
  evaluateChallengeLocally,
  getSentenceStarters,
} from "@/lib/challenge";
import {
  type PracticeHistoryItem,
  useLearnedWords,
  usePracticeHistory,
  useStreak,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import {
  normalizeChallengeResponse,
  normalizePracticeResponse,
  validateTranscript,
} from "@/lib/validators";
import type {
  ChallengeResponse,
  LearnedWordInput,
  PracticeResponse,
  RecordingResult,
  WordEntry,
} from "@/types";

type PracticeStatus =
  | "idle"
  | "recording"
  | "transcribing"
  | "transcriptReady"
  | "validating"
  | "challengeReady"
  | "transforming"
  | "resultReady"
  | "ttsLoading"
  | "error";

type FailedStep = "transcription" | "transformation" | "validation" | null;
type AudioStatus = "idle" | "loading" | "ready" | "playing" | "error";

type PracticeState = {
  status: PracticeStatus;
  selectedHint: string;
  selectedStarter: string;
  transcript: string;
  recordedAudio: RecordingResult | null;
  result: PracticeResponse | null;
  challengeResult: ChallengeResponse | null;
  challengeFallbackNotice: string;
  transcriptionError: string;
  transformError: string;
  validationError: string;
  lastFailedStep: FailedStep;
};

type PracticeAction =
  | { type: "recording_started" }
  | {
      type: "transcript_changed";
      transcript: string;
      selectedHint?: string;
      selectedStarter?: string;
    }
  | { type: "transcription_started"; recording: RecordingResult }
  | { type: "transcription_succeeded"; transcript: string }
  | { type: "transcription_failed"; error: string }
  | { type: "transformation_started"; transcript: string }
  | { type: "transformation_succeeded"; result: PracticeResponse }
  | { type: "transformation_failed"; error: string }
  | { type: "validation_started"; transcript: string }
  | {
      type: "validation_succeeded";
      result: ChallengeResponse;
      fallbackNotice?: string;
    }
  | { type: "validation_failed"; error: string }
  | { type: "tts_status_changed"; status: AudioStatus }
  | { type: "reset" };

const initialPracticeState: PracticeState = {
  status: "idle",
  selectedHint: "",
  selectedStarter: "",
  transcript: "",
  recordedAudio: null,
  result: null,
  challengeResult: null,
  challengeFallbackNotice: "",
  transcriptionError: "",
  transformError: "",
  validationError: "",
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
  const searchParams = useSearchParams();
  const wordParam = searchParams.get("word")?.trim() ?? "";
  const challengeMode = searchParams.get("challenge") === "today";
  const todayWord = useMemo(() => getWordOfTheDay(), []);
  const starters = useMemo(() => getSentenceStarters(todayWord), [todayWord]);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const challengeResultRef = useRef<HTMLDivElement | null>(null);
  const { saveWord, words } = useLearnedWords();
  const { history, saveHistory } = usePracticeHistory();
  const { completedToday, completeToday } = useStreak();
  const [state, dispatch] = useReducer(practiceReducer, initialPracticeState);
  const [recorderResetKey, setRecorderResetKey] = useState(0);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [typedTagline, setTypedTagline] = useState({
    tagline: "",
    text: "",
  });

  const currentTagline = SPEAK_BETTER_HINDI_TAGLINES[taglineIndex];

  useEffect(() => {
    let characterIndex = 0;
    const characters = Array.from(currentTagline);

    const typewriter = window.setInterval(() => {
      characterIndex += 1;
      setTypedTagline({
        tagline: currentTagline,
        text: characters.slice(0, characterIndex).join(""),
      });

      if (characterIndex >= characters.length) {
        window.clearInterval(typewriter);
      }
    }, 55);

    return () => window.clearInterval(typewriter);
  }, [currentTagline]);

  useEffect(() => {
    const shuffleTagline = window.setInterval(() => {
      setTaglineIndex((currentIndex) => {
        const offset = Math.floor(Math.random() * (SPEAK_BETTER_HINDI_TAGLINES.length - 1)) + 1;
        return (currentIndex + offset) % SPEAK_BETTER_HINDI_TAGLINES.length;
      });
    }, 5_000);

    return () => window.clearInterval(shuffleTagline);
  }, []);

  const practiceContext = useMemo<WordEntry | string | null>(() => {
    if (!wordParam) {
      return null;
    }

    const normalizedWord = wordParam.toLocaleLowerCase();
    return (
      wordCorpus.find((entry) =>
        [entry.id, entry.common, entry.elevated, ...entry.synonyms]
          .flatMap((value) =>
            typeof value === "string" ? [value] : [value.dev, value.roman],
          )
          .map((value) => value.trim().toLocaleLowerCase())
          .includes(normalizedWord),
      ) ?? wordParam
    );
  }, [wordParam]);

  const savedWordKeys = useMemo(
    () => new Set(words.map((word) => word.word.trim().toLocaleLowerCase())),
    [words],
  );
  const isTranscribing = state.status === "transcribing";
  const isTransforming = state.status === "transforming";
  const isValidating = state.status === "validating";
  const isBusy = isTranscribing || isTransforming || isValidating;
  const canTransform = state.transcript.trim().length > 0 && !isBusy;
  const canValidate = state.transcript.trim().length > 0 && !isBusy;
  const canRetryTranscription =
    Boolean(state.recordedAudio) &&
    state.lastFailedStep === "transcription" &&
    !isBusy;
  const canRetryTransformation =
    state.transcript.trim().length > 0 &&
    state.lastFailedStep === "transformation" &&
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

  useEffect(() => {
    if (state.challengeResult) {
      challengeResultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [state.challengeResult]);

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

  const finishChallengeValidation = useCallback(
    (result: ChallengeResponse, fallbackNotice?: string) => {
      if (result.acceptableUsage && !completedToday) {
        completeToday();
      }
      dispatch({ type: "validation_succeeded", result, fallbackNotice });
    },
    [completeToday, completedToday],
  );

  const runChallengeValidation = useCallback(
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
            targetWord: todayWord.elevated.roman,
            wordEntry: todayWord,
          },
          fallbackMessage:
            "Challenge validation is unavailable. Using a careful local check.",
          timeoutMs: 30_000,
          validate: (value) =>
            normalizeChallengeResponse(value, transcriptResult.value),
        });
        finishChallengeValidation({
          ...payload,
          transcript: transcriptResult.value,
        });
      } catch {
        finishChallengeValidation(
          evaluateChallengeLocally(transcriptResult.value, todayWord),
          "AI validation was unavailable, so this attempt used the local target-word check.",
        );
      }
    },
    [finishChallengeValidation, state.transcript, todayWord],
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

  const handleStarterSelect = useCallback((starter: string) => {
    if (!isBusy) {
      dispatch({
        type: "transcript_changed",
        transcript: starter,
        selectedStarter: starter,
      });
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
        !challengeMode && hints.some((hint) => hint.dev === value || hint.roman === value)
          ? value
          : "",
      selectedStarter: challengeMode && starters.includes(value) ? value : "",
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

  const handleUsePracticeContext = () => {
    if (isBusy || !practiceContext) {
      return;
    }
    const transcript =
      typeof practiceContext === "string"
        ? `Maine ${practiceContext} shabd ka prayog apne vaakya mein kiya.`
        : practiceContext.elevatedExample.dev;
    dispatch({ type: "transcript_changed", transcript });
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

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <GlassCard className="animate-floatIn p-5 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {challengeMode ? (
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                Daily challenge
              </p>
            ) : null}
            <h1
              lang="hi"
              aria-label={currentTagline}
              className="mt-2 rounded-2xl border border-amber-200/55 bg-gradient-to-r from-amber-100/70 via-orange-50/70 to-rose-100/60 px-4 py-3 text-balance font-hindi text-3xl font-bold leading-[1.35] tracking-[-0.035em] text-ink shadow-sm shadow-amber-900/5 sm:px-5 sm:text-5xl dark:border-amber-200/10 dark:from-amber-300/10 dark:via-orange-300/8 dark:to-rose-300/10 dark:text-white"
            >
              {typedTagline.tagline === currentTagline ? typedTagline.text : ""}
              <span aria-hidden="true" className="ml-0.5 inline-block h-[0.95em] w-0.5 animate-pulse bg-amber-700 align-[-0.08em] dark:bg-amber-200" />
            </h1>
          </div>
          {state.status !== "idle" || state.transcript.trim() ? (
            <button
              type="button"
              onClick={handleReset}
              disabled={isBusy && !state.result && !state.challengeResult}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-900/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-white/8 dark:hover:text-white"
            >
              <RotateCcw size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Start over</span>
            </button>
          ) : null}
        </div>

        {challengeMode ? (
          <div className="mt-5">
            <ChallengeBanner
              completedToday={completedToday}
              disabled={isBusy}
              onStarterSelect={handleStarterSelect}
              selectedStarter={state.selectedStarter}
              starters={starters}
              word={todayWord}
            />
          </div>
        ) : null}

        <div className="mt-6">
          <RecorderButton
            key={recorderResetKey}
            className="border-0 bg-transparent p-0 dark:bg-transparent"
            disabled={isBusy}
            onRecordingComplete={(recording) => void transcribeRecording(recording)}
            onStateChange={(nextState: RecorderState) => {
              if (nextState === "recording") {
                dispatch({ type: "recording_started" });
              }
            }}
          />
          {state.transcriptionError ? (
            <ErrorNotice
              actionLabel={canRetryTranscription ? "Retry transcription" : undefined}
              message={state.transcriptionError}
              onAction={
                canRetryTranscription && state.recordedAudio
                  ? () => void transcribeRecording(state.recordedAudio as RecordingResult)
                  : undefined
              }
            />
          ) : null}
        </div>

        {practiceContext && !challengeMode ? (
          <div className="mt-6">
            <PracticeContextPrompt
              context={practiceContext}
              disabled={isBusy}
              onUse={handleUsePracticeContext}
            />
          </div>
        ) : null}

        <label className="mt-6 block">
          <textarea
            value={state.transcript}
            disabled={isBusy}
            onChange={(event) => handleTranscriptChange(event.target.value)}
            placeholder="Type any sentence..."
            className="min-h-32 w-full resize-y rounded-xl border border-zinc-900/10 bg-white/58 p-4 text-sm font-normal leading-7 text-ink outline-none transition placeholder:text-zinc-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/12 dark:bg-white/8 dark:text-white dark:placeholder:text-zinc-500"
          />
        </label>

        {!challengeMode ? (
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
        ) : null}

        {state.transformError ? (
          <ErrorNotice
            actionLabel={canRetryTransformation ? "Retry polish" : undefined}
            message={state.transformError}
            onAction={canRetryTransformation ? () => void runTransformation() : undefined}
          />
        ) : null}
        {state.validationError ? (
          <ErrorNotice
            actionLabel={canRetryValidation ? "Retry challenge" : undefined}
            message={state.validationError}
            onAction={canRetryValidation ? () => void runChallengeValidation() : undefined}
          />
        ) : null}

        <button
          type="button"
          onClick={() =>
            challengeMode
              ? void runChallengeValidation()
              : void runTransformation()
          }
          disabled={challengeMode ? !canValidate : !canTransform}
          className={cn(
            "mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:shadow-none dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-zinc-950",
            (challengeMode ? canValidate : canTransform)
              ? "bg-ink text-white shadow-lg shadow-zinc-900/15 hover:-translate-y-0.5 dark:bg-white dark:text-zinc-950"
              : "bg-zinc-400/70 text-white dark:bg-zinc-700 dark:text-zinc-300",
          )}
        >
          <WandSparkles size={18} aria-hidden="true" />
          {isValidating
            ? "Checking..."
            : challengeMode
                ? "Check challenge"
                : "Enhance"}
        </button>
      </GlassCard>

      {isTranscribing || isTransforming || isValidating || state.status === "ttsLoading" ? (
        <GlassCard className="animate-floatIn">
          <LoadingState status={state.status} />
        </GlassCard>
      ) : null}

      {state.challengeResult ? (
        <div ref={challengeResultRef}>
          <ChallengeFeedback
            fallbackNotice={state.challengeFallbackNotice}
            onPolish={() => void runTransformation(state.challengeResult?.transcript)}
            polishDisabled={isBusy}
            polishInProgress={isTransforming}
            result={state.challengeResult}
            targetWord={todayWord.elevated.dev}
          />
        </div>
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

      {!challengeMode ? (
        <RecentPracticeHistory
          disabled={isBusy}
          history={history}
          onUse={(item) =>
            dispatch({ type: "transcript_changed", transcript: item.transcript })
          }
        />
      ) : null}
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
        validationError: "",
        result: null,
        challengeResult: null,
        challengeFallbackNotice: "",
        lastFailedStep: null,
      };
    case "transcript_changed":
      return {
        ...state,
        status: action.transcript.trim() ? "transcriptReady" : "idle",
        selectedHint: action.selectedHint ?? "",
        selectedStarter: action.selectedStarter ?? "",
        transcript: action.transcript,
        transformError: "",
        validationError: "",
        result: null,
        challengeResult: null,
        challengeFallbackNotice: "",
        lastFailedStep: null,
      };
    case "transcription_started":
      return {
        ...state,
        status: "transcribing",
        recordedAudio: action.recording,
        transcriptionError: "",
        transformError: "",
        validationError: "",
        result: null,
        challengeResult: null,
        challengeFallbackNotice: "",
        lastFailedStep: null,
      };
    case "transcription_succeeded":
      return {
        ...state,
        status: "transcriptReady",
        transcript: action.transcript,
        selectedHint: "",
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
    case "validation_started":
      return {
        ...state,
        status: "validating",
        transcript: action.transcript,
        validationError: "",
        result: null,
        challengeResult: null,
        challengeFallbackNotice: "",
        lastFailedStep: null,
      };
    case "validation_succeeded":
      return {
        ...state,
        status: action.result.acceptableUsage ? "challengeReady" : "transcriptReady",
        validationError: "",
        challengeResult: action.result,
        challengeFallbackNotice: action.fallbackNotice ?? "",
        lastFailedStep: null,
      };
    case "validation_failed":
      return {
        ...state,
        status: "error",
        validationError: action.error,
        challengeResult: null,
        lastFailedStep: "validation",
      };
    case "tts_status_changed":
      if (action.status === "loading") {
        return { ...state, status: "ttsLoading" };
      }
      if (state.status === "ttsLoading") {
        return {
          ...state,
          status: state.result
            ? "resultReady"
            : state.challengeResult
              ? "challengeReady"
              : "transcriptReady",
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
          body: "Your recording is being transcribed into an editable sentence.",
        }
      : status === "validating"
        ? {
            title: "Checking your sentence...",
            body: "Your use of today’s word is being reviewed.",
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

function PracticeContextPrompt({
  context,
  disabled,
  onUse,
}: {
  context: WordEntry | string;
  disabled: boolean;
  onUse: () => void;
}) {
  const word =
    typeof context === "string" ? { dev: context, roman: context } : context.elevated;
  const meaning =
    typeof context === "string"
      ? "Use this saved word in a fresh sentence."
      : context.englishMeaning;

  return (
    <div className="border-y border-emerald-200/70 py-4 dark:border-emerald-300/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-200">
            Practice word
          </p>
          <HindiText
            text={word}
            kind="inline"
            className="mt-1 text-wrap-anywhere text-lg font-bold text-ink dark:text-white"
          />
          <p className="mt-1 text-wrap-anywhere text-sm font-normal leading-6 text-zinc-600 dark:text-zinc-300">
            {meaning}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onUse}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-200 dark:text-emerald-950"
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
                text={item.naturalPolishedVersion}
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
