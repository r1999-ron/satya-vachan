"use client";

import { useState } from "react";
import { ArrowRight, BookmarkPlus, Check, CheckCircle2, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { HindiText } from "@/components/hindi/HindiText";
import { fadeUp, transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { PuzzleRound } from "@/lib/puzzle";
import type { LearnedWordInput } from "@/types";

type PuzzleRoundCardProps = {
  round: PuzzleRound;
  isLast: boolean;
  isSaved: boolean;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  onSaveWord: (input: LearnedWordInput) => void;
};

export function PuzzleRoundCard({
  round,
  isLast,
  isSaved,
  onAnswer,
  onNext,
  onSaveWord,
}: PuzzleRoundCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const answered = selectedId !== null;
  const wasCorrect = selectedId === round.answerWordId;

  const handleSelect = (wordId: string) => {
    if (answered) {
      return;
    }

    setSelectedId(wordId);
    onAnswer(wordId === round.answerWordId);
  };

  const saveableWord: LearnedWordInput = {
    word: round.word.elevated.roman,
    wordDev: round.word.elevated.dev,
    meaning: round.word.englishMeaning,
    simpleAlternative: round.word.common.roman,
    exampleSentence: round.word.elevatedExample.dev,
  };

  return (
    <div className="space-y-4">
      <div className="rounded-card border-theme border-line bg-surface-2 p-4 sm:p-5">
        {round.blankedSentence ? (
          <>
            <p className="eyebrow">Complete the sentence</p>
            <HindiText
              text={round.blankedSentence}
              className="mt-3"
              devClassName="text-xl font-bold leading-[1.7] sm:text-2xl"
            />
          </>
        ) : (
          <>
            <p className="eyebrow">Choose the elevated form</p>
            <p className="mt-3 flex items-center gap-3">
              <HindiText
                text={round.word.common}
                kind="inline"
                className="text-lg font-semibold text-content-muted"
              />
              <ArrowRight size={18} aria-hidden="true" className="text-accent" />
              <span className="text-lg font-bold">?</span>
            </p>
          </>
        )}
        <p className="mt-3 border-t border-line/60 pt-3 text-xs text-content-muted">
          <span lang="hi" className="font-hindi">
            आम बोलचाल:
          </span>{" "}
          <HindiText text={round.word.common} kind="inline" className="font-semibold" />
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {round.options.map((option) => {
          const isAnswer = option.wordId === round.answerWordId;
          const isPicked = option.wordId === selectedId;

          return (
            <motion.button
              key={option.wordId}
              type="button"
              disabled={answered}
              onClick={() => handleSelect(option.wordId)}
              whileTap={answered ? undefined : { scale: 0.97 }}
              transition={transitions.snappy}
              aria-pressed={isPicked}
              className={cn(
                "flex min-h-14 items-center justify-between gap-2 rounded-btn border-theme px-4 py-3 text-left transition-colors",
                !answered && "border-line bg-surface hover:bg-surface-2",
                answered && isAnswer && "border-success/60 bg-success-soft",
                answered && isPicked && !isAnswer && "border-danger/60 bg-danger-soft",
                answered && !isPicked && !isAnswer && "border-line bg-surface opacity-55",
              )}
            >
              <HindiText
                text={option.text}
                kind="inline"
                className="text-base font-bold"
              />
              {answered && isAnswer ? (
                <CheckCircle2 size={18} aria-hidden="true" className="shrink-0 text-success" />
              ) : null}
              {answered && isPicked && !isAnswer ? (
                <XCircle size={18} aria-hidden="true" className="shrink-0 text-danger" />
              ) : null}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {answered ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "rounded-card border-theme p-4 sm:p-5",
              wasCorrect ? "border-success/50 bg-success-soft" : "border-accent/50 bg-accent-soft",
            )}
          >
            <p className={cn("eyebrow", wasCorrect ? "text-success" : "text-accent")}>
              {wasCorrect ? "सुंदर!" : "याद रखने लायक"}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-2">
              <HindiText
                text={round.word.common}
                kind="inline"
                className="font-medium text-content-muted"
              />
              <ArrowRight size={16} aria-hidden="true" className="text-accent" />
              <HindiText text={round.word.elevated} kind="inline" className="text-lg font-bold" />
            </p>
            <p className="mt-1 text-sm text-content-muted">{round.word.englishMeaning}</p>
            <p className="mt-2 text-sm leading-6 text-content-muted">{round.word.usageNote}</p>
            <HindiText
              text={round.word.elevatedExample}
              className="mt-3 rounded-btn border-theme border-line/60 bg-surface p-3"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={isSaved}
                onClick={() => onSaveWord(saveableWord)}
                className="btn btn-outline min-h-10 px-3 text-xs"
              >
                {isSaved ? (
                  <Check size={15} aria-hidden="true" />
                ) : (
                  <BookmarkPlus size={15} aria-hidden="true" />
                )}
                {isSaved ? "Saved" : "Save word"}
              </button>
              <motion.button
                type="button"
                onClick={onNext}
                whileTap={{ scale: 0.97 }}
                transition={transitions.snappy}
                className="btn btn-solid min-h-10 px-4 text-sm"
              >
                {isLast ? "See result" : "Next"}
                <ArrowRight size={16} aria-hidden="true" />
              </motion.button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
