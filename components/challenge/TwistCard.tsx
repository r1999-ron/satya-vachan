"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, ChevronDown, Sparkles, WandSparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { RecorderButton } from "@/components/audio/RecorderButton";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingMeter } from "@/components/ui/LoadingMeter";
import { useTranscription } from "@/hooks/useTranscription";
import { requestJson } from "@/lib/api-client";
import { fadeUp, transitions } from "@/lib/motion";
import { isTwistCompleted, markTwistCompleted } from "@/lib/storage";
import { readThemeColors } from "@/lib/theme";
import { evaluateTwistLocally, getTodaysTwist } from "@/lib/twists";
import { normalizeChallengeResponse, validateTranscript } from "@/lib/validators";
import { containsTargetWord } from "@/lib/word-match";
import type { ChallengeResponse, WordEntry } from "@/types";

type TwistStatus = "idle" | "transcribing" | "validating";

/**
 * The optional bonus round that appears once the daily challenge is done: the
 * same word, one extra condition. It never touches the streak — finishing it
 * is its own quiet reward.
 */
export function TwistCard({ word }: { word: WordEntry }) {
  const twist = useMemo(() => getTodaysTwist(), []);
  const [expanded, setExpanded] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<TwistStatus>("idle");
  const [result, setResult] = useState<ChallengeResponse | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (isActive) {
        setCompleted(isTwistCompleted());
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const isBusy = status !== "idle";

  const finishValidation = useCallback((next: ChallengeResponse, notice = "") => {
    setStatus("idle");
    setResult(next);
    setFallbackNotice(notice);

    if (next.acceptableUsage) {
      markTwistCompleted();
      setCompleted(true);
      confetti({
        particleCount: 40,
        spread: 55,
        startVelocity: 28,
        gravity: 0.9,
        scalar: 0.75,
        origin: { x: 0.5, y: 0.75 },
        colors: readThemeColors(["--c-accent", "--c-secondary", "--c-success"]),
        disableForReducedMotion: true,
      });
    }
  }, []);

  const runValidation = useCallback(async () => {
    const transcriptResult = validateTranscript(transcript.trim(), 800);

    if (!transcriptResult.ok) {
      setError(transcriptResult.message);
      return;
    }

    setError("");
    setResult(null);
    setFallbackNotice("");
    setStatus("validating");

    try {
      const payload = await requestJson<ChallengeResponse>("/api/challenge", {
        method: "POST",
        body: {
          transcript: transcriptResult.value,
          targetWord: word.elevated.roman,
          wordEntry: word,
          constraint: twist.constraint,
        },
        fallbackMessage: "Twist validation is unavailable. Using a careful local check.",
        timeoutMs: 30_000,
        validate: (value) => normalizeChallengeResponse(value, transcriptResult.value),
      });
      finishValidation({ ...payload, transcript: transcriptResult.value });
    } catch {
      const local = evaluateTwistLocally(transcriptResult.value, word, twist);
      const usedTargetWord =
        containsTargetWord(transcriptResult.value, word.elevated.roman) ||
        containsTargetWord(transcriptResult.value, word.elevated.dev);

      finishValidation(
        {
          transcript: transcriptResult.value,
          usedTargetWord,
          acceptableUsage: local.acceptable,
          feedback: local.acceptable
            ? local.unverified
              ? "Target word mil gaya. Is twist ki poori jaanch AI ke bina sambhav nahi thi, isliye ise sweekar kiya gaya."
              : "Sundar! Target word aur twist dono is vaakya mein spasht hain."
            : usedTargetWord
              ? `Target word to hai, par twist adhoora rah gaya: ${twist.labelRoman}.`
              : `Is baar "${word.elevated.dev}" shabd ko vaakya mein zaroor jodiye.`,
          completed: local.acceptable,
        },
        "AI validation was unavailable, so this attempt used the local twist check.",
      );
    }
  }, [finishValidation, transcript, twist, word]);

  const transcribeRecording = useTranscription({
    onError: useCallback((message: string) => {
      setStatus("idle");
      setError(message);
    }, []),
    onStart: useCallback(() => {
      setStatus("transcribing");
      setError("");
      setResult(null);
    }, []),
    onSuccess: useCallback((nextTranscript: string) => {
      setStatus("idle");
      setTranscript(nextTranscript);
    }, []),
  });

  return (
    <GlassCard className="border-secondary/40 p-0">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 rounded-card p-4 text-left sm:p-5"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-btn border-theme border-line bg-secondary-soft text-secondary">
          <Sparkles size={18} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="eyebrow block text-secondary">Bonus twist</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm font-bold">
            <span lang="hi" className="font-hindi">
              {twist.labelDev}
            </span>
            <span className="font-medium text-content-muted">· {twist.labelRoman}</span>
            {completed ? (
              <span className="inline-flex items-center gap-1 rounded-chip border-theme border-success/50 bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success">
                <CheckCircle2 size={12} aria-hidden="true" />
                Done
              </span>
            ) : null}
          </span>
        </span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={transitions.snappy}
          className="shrink-0 text-content-muted"
        >
          <ChevronDown size={18} aria-hidden="true" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transitions.fade}
            className="overflow-hidden"
          >
            <div className="border-t border-line/60 p-4 sm:p-5">
              <p className="text-sm leading-6 text-content-muted">
                Use{" "}
                <span lang="hi" className="font-hindi font-bold text-content">
                  {word.elevated.dev}
                </span>{" "}
                again — this time{" "}
                <span className="font-semibold text-content">{twist.labelRoman.toLocaleLowerCase()}</span>.
                Purely optional; your streak is already safe.
              </p>

              <div className="mt-4">
                <RecorderButton
                  className="border-0 bg-transparent p-0"
                  disabled={isBusy}
                  hideDuration
                  variant="continuation"
                  onRecordingComplete={(recording) => void transcribeRecording(recording)}
                />
              </div>

              <label className="mt-4 block">
                <span className="sr-only">Your twist sentence</span>
                <textarea
                  value={transcript}
                  disabled={isBusy}
                  onChange={(event) => setTranscript(event.target.value)}
                  placeholder={`A sentence with ${word.elevated.roman}, ${twist.labelRoman.toLocaleLowerCase()}...`}
                  className="field min-h-24 resize-y text-sm leading-7"
                />
              </label>

              {error ? <ErrorNotice message={error} /> : null}

              {status === "transcribing" || status === "validating" ? (
                <div className="mt-3">
                  <LoadingMeter />
                </div>
              ) : null}

              <div className="mt-4 flex justify-end">
                <motion.button
                  type="button"
                  onClick={() => void runValidation()}
                  disabled={!transcript.trim() || isBusy}
                  whileTap={transcript.trim() && !isBusy ? { scale: 0.98 } : undefined}
                  transition={transitions.snappy}
                  className="btn btn-solid min-h-11 px-5 text-sm"
                >
                  <WandSparkles size={16} aria-hidden="true" />
                  {status === "validating" ? "Checking..." : "Check twist"}
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key={`${result.transcript}-${result.acceptableUsage}`}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`mt-4 rounded-card border-theme p-4 ${
                      result.acceptableUsage
                        ? "border-success/50 bg-success-soft"
                        : "border-accent/50 bg-accent-soft"
                    }`}
                  >
                    <p className="eyebrow">
                      {result.acceptableUsage ? "Twist complete" : "Almost there"}
                    </p>
                    <p className="mt-1.5 text-wrap-anywhere text-sm leading-7 text-content-muted">
                      {result.feedback}
                    </p>
                    {result.suggestedImprovement ? (
                      <p lang="hi" className="mt-2 text-wrap-anywhere font-hindi text-sm leading-7">
                        {result.suggestedImprovement}
                      </p>
                    ) : null}
                    {fallbackNotice ? (
                      <p className="mt-2 text-xs leading-5 text-content-subtle">{fallbackNotice}</p>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </GlassCard>
  );
}
