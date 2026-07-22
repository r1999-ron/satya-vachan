"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PuzzleRoundCard } from "@/components/play/PuzzleRoundCard";
import { PuzzleSummary } from "@/components/play/PuzzleSummary";
import { GlassCard } from "@/components/ui/GlassCard";
import { getTodayKey } from "@/lib/dates";
import { slideSwap } from "@/lib/motion";
import {
  PUZZLE_ROUND_COUNT,
  getDailyPuzzle,
  getRandomPuzzle,
  type PuzzleRound,
} from "@/lib/puzzle";
import { loadPuzzleState, recordPuzzleRound, useLearnedWords } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { LearnedWordInput } from "@/types";

type SessionState = {
  mode: "daily" | "free";
  dateKey: string;
  rounds: PuzzleRound[];
  results: boolean[];
  roundIndex: number;
};

export function PuzzleSession() {
  const [session, setSession] = useState<SessionState | null>(null);
  // Mirrors session so handleAnswer can record a round without reading state
  // inside the setState updater — updaters must stay pure (React double-invokes
  // them in dev, which would otherwise persist the round twice).
  const sessionRef = useRef<SessionState | null>(null);
  sessionRef.current = session;
  const { words, saveWord } = useLearnedWords();

  // The daily set and any stored progress live in localStorage, so both are
  // resolved after mount to keep server and first client render identical.
  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) {
        return;
      }

      const dateKey = getTodayKey();
      const stored = loadPuzzleState(dateKey);
      const results = stored?.results.map((round) => round.correct) ?? [];

      setSession({
        mode: "daily",
        dateKey,
        rounds: getDailyPuzzle(dateKey),
        results,
        roundIndex: Math.min(results.length, PUZZLE_ROUND_COUNT),
      });
    });

    return () => {
      isActive = false;
    };
  }, []);

  const handleAnswer = useCallback((correct: boolean) => {
    const current = sessionRef.current;

    if (!current) {
      return;
    }

    const round = current.rounds[current.roundIndex];

    if (current.mode === "daily" && round) {
      recordPuzzleRound(
        { wordId: round.answerWordId, correct },
        PUZZLE_ROUND_COUNT,
        current.dateKey,
      );
    }

    setSession((prev) =>
      prev ? { ...prev, results: [...prev.results, correct] } : prev,
    );
  }, []);

  const handleNext = useCallback(() => {
    setSession((current) =>
      current ? { ...current, roundIndex: current.roundIndex + 1 } : current,
    );
  }, []);

  const handlePlayAgain = useCallback(() => {
    setSession((current) =>
      current
        ? {
            ...current,
            mode: "free",
            rounds: getRandomPuzzle(),
            results: [],
            roundIndex: 0,
          }
        : current,
    );
  }, []);

  const isWordSaved = useCallback(
    (word: string) =>
      words.some(
        (existing) => existing.word.trim().toLocaleLowerCase() === word.trim().toLocaleLowerCase(),
      ),
    [words],
  );

  const handleSaveWord = useCallback(
    (input: LearnedWordInput) => {
      saveWord(input, "game");
    },
    [saveWord],
  );

  if (!session) {
    return (
      <GlassCard>
        <p className="text-sm text-content-muted">Setting up today&apos;s puzzle...</p>
      </GlassCard>
    );
  }

  const finished = session.roundIndex >= session.rounds.length;
  const currentRound = session.rounds[session.roundIndex];

  if (finished || !currentRound) {
    return (
      <PuzzleSummary
        results={session.results}
        isDaily={session.mode === "daily"}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <GlassCard className="p-4 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">
          {session.mode === "daily" ? "Today's set" : "Bonus round"} ·{" "}
          {session.roundIndex + 1}/{session.rounds.length}
        </p>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {session.rounds.map((_, index) => (
            <span
              key={index}
              className={cn(
                "size-2 rounded-full transition-colors",
                index < session.results.length
                  ? session.results[index]
                    ? "bg-success"
                    : "bg-danger/60"
                  : index === session.roundIndex
                    ? "bg-accent"
                    : "bg-content/15",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 sm:mt-5">
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={`${session.mode}-${session.roundIndex}-${currentRound.answerWordId}`}
            custom={1}
            variants={slideSwap}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <PuzzleRoundCard
              round={currentRound}
              isLast={session.roundIndex === session.rounds.length - 1}
              isSaved={isWordSaved(currentRound.word.elevated.roman)}
              onAnswer={handleAnswer}
              onNext={handleNext}
              onSaveWord={handleSaveWord}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
