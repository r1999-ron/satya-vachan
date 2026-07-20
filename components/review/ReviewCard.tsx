"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Eye, SkipForward, WandSparkles } from "lucide-react";
import { RecorderButton, type RecorderState } from "@/components/audio/RecorderButton";
import { ChallengeFeedback } from "@/components/challenge/ChallengeFeedback";
import { HindiText } from "@/components/hindi/HindiText";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingMeter } from "@/components/ui/LoadingMeter";
import { useTranscription } from "@/hooks/useTranscription";
import { requestJson } from "@/lib/api-client";
import { evaluateChallengeLocally } from "@/lib/challenge";
import { buildReviewWordEntry, getRecallCue } from "@/lib/review";
import { cn } from "@/lib/utils";
import { normalizeChallengeResponse, validateTranscript } from "@/lib/validators";
import type {
  ChallengeResponse,
  LearnedWord,
  RecordingResult,
  ReviewGrade,
} from "@/types";

type CardStatus = "idle" | "transcribing" | "checking" | "answered";

const TRANSCRIPT_LIMIT = 800;

export function ReviewCard({
  onNext,
  onSkip,
  position,
  total,
  word,
}: {
  onNext: (grade: ReviewGrade) => void;
  onSkip: () => void;
  position: number;
  total: number;
  word: LearnedWord;
}) {
  const entry = useMemo(() => buildReviewWordEntry(word), [word]);
  const cue = useMemo(() => getRecallCue(word, entry), [entry, word]);
  const [status, setStatus] = useState<CardStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<ChallengeResponse | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState("");
  const [transcriptionError, setTranscriptionError] = useState("");
  const [checkError, setCheckError] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<RecordingResult | null>(null);

  const isBusy = status === "transcribing" || status === "checking";
  const canCheck = transcript.trim().length > 0 && !isBusy && status !== "answered";

  const transcribeRecording = useTranscription({
    onError: useCallback((error: string) => {
      setTranscriptionError(error);
      setStatus("idle");
    }, []),
    onStart: useCallback((recording: RecordingResult) => {
      setRecordedAudio(recording);
      setTranscriptionError("");
      setStatus("transcribing");
    }, []),
    onSuccess: useCallback((nextTranscript: string) => {
      setTranscript(nextTranscript);
      setTranscriptionError("");
      setStatus("idle");
    }, []),
  });

  const runCheck = useCallback(async () => {
    const transcriptResult = validateTranscript(transcript.trim(), TRANSCRIPT_LIMIT);

    if (!transcriptResult.ok) {
      setCheckError(transcriptResult.message);
      return;
    }

    setCheckError("");
    setStatus("checking");

    try {
      const payload = await requestJson<ChallengeResponse>("/api/challenge", {
        method: "POST",
        body: {
          transcript: transcriptResult.value,
          targetWord: entry.elevated.roman || word.word,
          wordEntry: entry,
        },
        fallbackMessage: "Revision checking is unavailable. Using a careful local check.",
        timeoutMs: 30_000,
        validate: (value) => normalizeChallengeResponse(value, transcriptResult.value),
      });
      setResult({ ...payload, transcript: transcriptResult.value });
      setFallbackNotice("");
    } catch {
      setResult(evaluateChallengeLocally(transcriptResult.value, entry));
      setFallbackNotice(
        "AI checking was unavailable, so this attempt used the local target-word check.",
      );
    }

    // The word is revealed once an answer exists; hiding it after would only
    // make the feedback harder to read.
    setRevealed(true);
    setStatus("answered");
  }, [entry, transcript, word.word]);

  const grade: ReviewGrade = result?.acceptableUsage ? "good" : "again";

  return (
    <div className="space-y-4 sm:space-y-5">
      <GlassCard className="animate-floatIn p-4 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Word {position} of {total}
          </p>
          <button
            type="button"
            onClick={onSkip}
            disabled={isBusy}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-zinc-500 transition hover:bg-black/5 hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <SkipForward size={14} aria-hidden="true" />
            Skip
          </button>
        </div>

        <section className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/75 p-3.5 sm:p-5 dark:border-amber-300/20 dark:bg-amber-300/10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200">
            Say a sentence with this word
          </p>
          <p className="mt-3 text-lg font-bold leading-8 text-ink dark:text-white">
            {cue.meaning}
          </p>
          {cue.simpleForm ? (
            <p className="mt-2 text-sm font-normal leading-6 text-zinc-600 dark:text-zinc-300">
              The everyday word for it is{" "}
              <span lang="hi" className="font-hindi font-semibold">
                {cue.simpleForm}
              </span>
              .
            </p>
          ) : null}

          <div className="mt-4 border-t border-amber-900/10 pt-3 dark:border-amber-200/15">
            {revealed ? (
              <HindiText
                text={entry.elevated}
                kind="inline"
                className="text-wrap-anywhere text-lg font-bold text-ink dark:text-white"
              />
            ) : (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white/75 px-3.5 text-xs font-bold text-zinc-700 ring-1 ring-zinc-900/8 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-white/8 dark:text-zinc-200 dark:ring-white/10 dark:hover:bg-white/12"
              >
                <Eye size={14} aria-hidden="true" />
                Show the word
              </button>
            )}
          </div>
        </section>

        <div className="mt-5 sm:mt-6">
          <RecorderButton
            className="border-0 bg-transparent p-0 dark:bg-transparent"
            disabled={isBusy || status === "answered"}
            hideDuration
            variant="continuation"
            onRecordingComplete={(recording) => void transcribeRecording(recording)}
            onStateChange={(nextState: RecorderState) => {
              if (nextState === "recording") {
                setTranscriptionError("");
                setCheckError("");
              }
            }}
          />
          {transcriptionError ? (
            <ErrorNotice
              actionLabel={recordedAudio ? "Retry" : undefined}
              message={transcriptionError}
              onAction={
                recordedAudio ? () => void transcribeRecording(recordedAudio) : undefined
              }
            />
          ) : null}
        </div>

        <label className="mt-5 block sm:mt-6">
          <span className="sr-only">Your sentence using this word</span>
          <textarea
            value={transcript}
            disabled={isBusy || status === "answered"}
            onChange={(event) => {
              setTranscript(event.target.value);
              setCheckError("");
            }}
            placeholder="Speak or type a fresh sentence using this word..."
            className="min-h-28 w-full resize-y rounded-xl border border-zinc-900/10 bg-white/58 p-4 text-sm font-normal leading-7 text-ink outline-none transition placeholder:text-zinc-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/12 dark:bg-white/8 dark:text-white dark:placeholder:text-zinc-500"
          />
        </label>

        {checkError ? (
          <ErrorNotice
            actionLabel="Retry"
            message={checkError}
            onAction={() => void runCheck()}
          />
        ) : null}

        {status !== "answered" ? (
          <button
            type="button"
            onClick={() => void runCheck()}
            disabled={!canCheck}
            className={cn(
              "mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:shadow-none dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-zinc-950",
              canCheck
                ? "bg-ink text-white shadow-lg shadow-zinc-900/15 hover:-translate-y-0.5 dark:bg-white dark:text-zinc-950"
                : "bg-zinc-400/70 text-white dark:bg-zinc-700 dark:text-zinc-300",
            )}
          >
            <WandSparkles size={18} aria-hidden="true" />
            {status === "checking" ? "Checking..." : "Check my sentence"}
          </button>
        ) : null}
      </GlassCard>

      {isBusy ? (
        <GlassCard className="animate-floatIn">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-300/12 dark:text-amber-100">
              <WandSparkles size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-ink dark:text-white">
                {status === "transcribing"
                  ? "Listening carefully..."
                  : "Checking your sentence..."}
              </h2>
              <LoadingMeter />
            </div>
          </div>
        </GlassCard>
      ) : null}

      {result ? (
        <>
          <ChallengeFeedback
            fallbackNotice={fallbackNotice}
            result={result}
            targetWord={entry.elevated.dev}
          />
          <button
            type="button"
            onClick={() => onNext(grade)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-lg shadow-zinc-900/15 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2 focus-visible:ring-offset-paper dark:bg-white dark:text-zinc-950"
          >
            {position === total ? "Finish revision" : "Next word"}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </>
      ) : null}
    </div>
  );
}
