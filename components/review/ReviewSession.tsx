"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { ArrowRight, BookOpen, CalendarClock, CheckCircle2, RotateCcw } from "lucide-react";
import { ReviewCard } from "@/components/review/ReviewCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { dateFromKey, formatReadableDate } from "@/lib/dates";
import { useReviewQueue, useStreak } from "@/lib/storage";
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
        colors: ["#f59e0b", "#f97316", "#fb7185", "#10b981"],
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
    <GlassCard className="animate-floatIn p-7">
      <div className="h-4 w-32 rounded-full bg-zinc-900/8 dark:bg-white/10" />
      <div className="mt-4 h-6 w-3/4 rounded-full bg-zinc-900/8 dark:bg-white/10" />
      <div className="mt-3 h-6 w-1/2 rounded-full bg-zinc-900/8 dark:bg-white/10" />
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
    <GlassCard className="animate-floatIn p-7 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-300/12 dark:text-emerald-100">
          {hasWords ? (
            <CheckCircle2 size={19} aria-hidden="true" />
          ) : (
            <BookOpen size={19} aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-ink dark:text-white">
            {hasWords ? "Nothing to revise right now" : "No saved words yet"}
          </h2>
          <p className="mt-2 text-sm font-normal leading-7 text-zinc-600 dark:text-zinc-400">
            {hasWords
              ? "Every word you have saved is resting. Words come back on a widening schedule so they stay easy to recall."
              : "Save a few words while practicing, and they will come back here for spoken revision."}
          </p>
          {hasWords && nextDueDate ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-1.5 text-xs font-bold text-zinc-600 ring-1 ring-zinc-900/8 dark:bg-white/8 dark:text-zinc-300 dark:ring-white/10">
              <CalendarClock size={14} aria-hidden="true" />
              Next word returns {formatReadableDate(dateFromKey(nextDueDate))}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/practice"
              prefetch={false}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 dark:bg-white dark:text-zinc-950"
            >
              Start practicing
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link
              href="/learned"
              prefetch={false}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-900/12 bg-white/55 px-4 py-2 text-xs font-bold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 dark:border-white/15 dark:bg-white/8 dark:text-zinc-200 dark:hover:bg-white/12"
            >
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
    <GlassCard className="animate-floatIn border-emerald-200/80 bg-emerald-50/75 p-7 sm:p-8 dark:border-emerald-300/25 dark:bg-emerald-300/10">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-300/15 dark:text-emerald-100">
          <CheckCircle2 size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Revision complete
          </p>
          <h2 className="mt-1 text-2xl font-bold text-ink dark:text-white">
            {attempted
              ? `You spoke ${recalled} of ${graded} words back into use.`
              : "Session closed."}
          </h2>
          <p className="mt-2 text-sm font-normal leading-7 text-zinc-700 dark:text-zinc-300">
            {attempted
              ? "Words you recalled comfortably return later; the rest come back sooner."
              : "Nothing was graded this time. These words will still be waiting for you."}
            {skipped > 0 ? ` ${skipped} skipped.` : ""}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/"
              prefetch={false}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 dark:bg-white dark:text-zinc-950"
            >
              Back to home
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-300/70 bg-white/70 px-4 py-2 text-xs font-bold text-emerald-950 transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45 dark:border-emerald-300/25 dark:bg-white/8 dark:text-emerald-100 dark:hover:bg-white/12"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Revise more
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
