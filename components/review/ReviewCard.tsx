"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
import { scaleIn, transitions } from "@/lib/motion";
import { buildReviewWordEntry, getRecallCue } from "@/lib/review";
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
      <GlassCard className="p-4 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">
            Word {position} of {total}
          </p>
          <button
            type="button"
            onClick={onSkip}
            disabled={isBusy}
            className="btn btn-ghost min-h-8 px-3 text-xs"
          >
            <SkipForward size={14} aria-hidden="true" />
            Skip
          </button>
        </div>

        <section className="mt-4 rounded-card border-theme border-accent/50 bg-accent-soft p-3.5 sm:p-5">
          <p className="eyebrow text-accent">Say a sentence with this word</p>
          <p className="mt-3 text-lg font-bold leading-8">{cue.meaning}</p>
          {cue.simpleForm ? (
            <p className="mt-2 text-sm leading-6 text-content-muted">
              The everyday word for it is{" "}
              <span lang="hi" className="font-hindi font-semibold">
                {cue.simpleForm}
              </span>
              .
            </p>
          ) : null}

          <div className="mt-4 border-t border-line/60 pt-3">
            <AnimatePresence mode="wait" initial={false}>
              {revealed ? (
                <motion.span
                  key="revealed"
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="block"
                >
                  <HindiText
                    text={entry.elevated}
                    kind="inline"
                    className="text-wrap-anywhere text-lg font-bold"
                  />
                </motion.span>
              ) : (
                <motion.button
                  key="hidden"
                  type="button"
                  onClick={() => setRevealed(true)}
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileTap={{ scale: 0.97 }}
                  className="btn btn-outline min-h-9 px-3.5 text-xs"
                >
                  <Eye size={14} aria-hidden="true" />
                  Show the word
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </section>

        <div className="mt-5 sm:mt-6">
          <RecorderButton
            className="border-0 bg-transparent p-0"
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
            className="field min-h-28 resize-y text-sm leading-7"
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
          <motion.button
            type="button"
            onClick={() => void runCheck()}
            disabled={!canCheck}
            whileTap={canCheck ? { scale: 0.98 } : undefined}
            transition={transitions.snappy}
            className="btn btn-solid mt-5 min-h-12 w-full"
          >
            <WandSparkles size={18} aria-hidden="true" />
            {status === "checking" ? "Checking..." : "Check my sentence"}
          </motion.button>
        ) : null}
      </GlassCard>

      {isBusy ? (
        <GlassCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <motion.span
              animate={{ rotate: [0, 12, -8, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="grid size-12 shrink-0 place-items-center rounded-btn border-theme border-line bg-accent-soft text-accent"
            >
              <WandSparkles size={20} aria-hidden="true" />
            </motion.span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">
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
          <motion.button
            type="button"
            onClick={() => onNext(grade)}
            whileTap={{ scale: 0.98 }}
            transition={transitions.snappy}
            className="btn btn-solid min-h-12 w-full"
          >
            {position === total ? "Finish revision" : "Next word"}
            <ArrowRight size={17} aria-hidden="true" />
          </motion.button>
        </>
      ) : null}
    </div>
  );
}
