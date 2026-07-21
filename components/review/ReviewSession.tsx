"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { ArrowRight, BookOpen, CalendarClock, CheckCircle2, RotateCcw } from "lucide-react";
import { popIn } from "@/lib/motion";
import { ReviewCard } from "@/components/review/ReviewCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { dateFromKey, formatReadableDate } from "@/lib/dates";
import { useReviewQueue, useStreak } from "@/lib/storage";
import { readThemeColors } from "@/lib/theme";
import type { ReviewGrade } from "@/types";

type SessionResult = { wordId: string; grade: ReviewGrade };

export function ReviewSession() {
  const { gradeWord, nextDueDate, restartSession, sessionWords, totalWords } =
    useReviewQueue();
  const { completeToday } = useStreak();
  const [sessionId, setSessionId] = useState(0);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);

  const queue = sessionWords;

  const finished = queue !== null && index >= queue.length;
  const recalled = useMemo(
    () => results.filter((result) => result.grade === "good").length,
    [results],
  );

  useEffect(() => {
    if (!finished || results.length === 0) {
      return;
    }

    completeToday();

    if (recalled > 0) {
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
    // Runs once, when the session reaches its end.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const handleNext = useCallback(
    (wordId: string, grade: ReviewGrade) => {
      gradeWord(wordId, grade);
      setResults((current) => [...current, { wordId, grade }]);
      setIndex((current) => current + 1);
    },
    [gradeWord],
  );

  const handleSkip = useCallback(() => {
    // Skipping should not punish the word, so no grade is recorded.
    setIndex((current) => current + 1);
  }, []);

  if (queue === null) {
    return <SessionSkeleton />;
  }

  if (queue.length === 0) {
    return <NothingDueState nextDueDate={nextDueDate} totalWords={totalWords} />;
  }

  if (finished) {
    return (
      <SessionSummary
        graded={results.length}
        onRestart={() => {
          restartSession();
          setIndex(0);
          setResults([]);
          setSessionId((current) => current + 1);
        }}
        recalled={recalled}
        skipped={queue.length - results.length}
      />
    );
  }

  const word = queue[index];

  return (
    <ReviewCard
      key={`${sessionId}-${word.id}`}
      onNext={(grade) => handleNext(word.id, grade)}
      onSkip={handleSkip}
      position={index + 1}
      total={queue.length}
      word={word}
    />
  );
}

function SessionSkeleton() {
  return (
    <GlassCard className="p-7">
      <div className="loading-sheen h-4 w-32 rounded-full bg-content/8" />
      <div className="loading-sheen mt-4 h-6 w-3/4 rounded-full bg-content/8" />
      <div className="loading-sheen mt-3 h-6 w-1/2 rounded-full bg-content/8" />
      <span className="sr-only">Loading your revision session</span>
    </GlassCard>
  );
}

function NothingDueState({
  nextDueDate,
  totalWords,
}: {
  nextDueDate: string | null;
  totalWords: number;
}) {
  const hasWords = totalWords > 0;

  return (
    <GlassCard className="p-7 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-btn border-theme border-line bg-success-soft text-success">
          {hasWords ? (
            <CheckCircle2 size={19} aria-hidden="true" />
          ) : (
            <BookOpen size={19} aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-display">
            {hasWords ? "Nothing to revise right now" : "No saved words yet"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-content-muted">
            {hasWords
              ? "Every word you have saved is resting. Words come back on a widening schedule so they stay easy to recall."
              : "Save a few words while practicing, and they will come back here for spoken revision."}
          </p>
          {hasWords && nextDueDate ? (
            <p className="chip mt-3">
              <CalendarClock size={14} aria-hidden="true" />
              Next word returns {formatReadableDate(dateFromKey(nextDueDate))}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/practice" prefetch={false} className="btn btn-solid min-h-10">
              Start practicing
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link href="/learned" prefetch={false} className="btn btn-outline min-h-10">
              <BookOpen size={15} aria-hidden="true" />
              See saved words
            </Link>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function SessionSummary({
  graded,
  onRestart,
  recalled,
  skipped,
}: {
  graded: number;
  onRestart: () => void;
  recalled: number;
  skipped: number;
}) {
  const attempted = graded > 0;

  return (
    <GlassCard className="border-success/50 bg-success-soft p-7 sm:p-8">
      <div className="flex items-start gap-4">
        <motion.span
          variants={popIn}
          initial="hidden"
          animate="visible"
          className="grid size-11 shrink-0 place-items-center rounded-btn border-theme border-line bg-surface text-success"
        >
          <CheckCircle2 size={19} aria-hidden="true" />
        </motion.span>
        <div className="min-w-0">
          <p className="eyebrow">Revision complete</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-display">
            {attempted
              ? `You spoke ${recalled} of ${graded} words back into use.`
              : "Session closed."}
          </h2>
          <p className="mt-2 text-sm leading-7 text-content-muted">
            {attempted
              ? "Words you recalled comfortably return later; the rest come back sooner."
              : "Nothing was graded this time. These words will still be waiting for you."}
            {skipped > 0 ? ` ${skipped} skipped.` : ""}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/" prefetch={false} className="btn btn-solid min-h-10">
              Back to home
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <button type="button" onClick={onRestart} className="btn btn-outline min-h-10">
              <RotateCcw size={15} aria-hidden="true" />
              Revise more
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
