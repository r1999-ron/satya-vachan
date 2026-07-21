"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Plus } from "lucide-react";
import { useMemo } from "react";
import { popIn, transitions } from "@/lib/motion";
import { useLearnedWords } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { WordEntry } from "@/types";

export function SaveDailyWordButton({ word }: { word: WordEntry }) {
  const { saveWord, words } = useLearnedWords();
  const normalizedWord = word.elevated.roman.trim().toLocaleLowerCase();
  const isSaved = useMemo(
    () =>
      words.some(
        (savedWord) =>
          savedWord.word.trim().toLocaleLowerCase() === normalizedWord,
      ),
    [normalizedWord, words],
  );

  const handleSave = () => {
    if (isSaved) {
      return;
    }

    saveWord(
      {
        word: word.elevated.roman,
        wordDev: word.elevated.dev,
        meaning: word.englishMeaning,
        simpleAlternative: word.common.roman,
        exampleSentence: word.elevatedExample.dev,
      },
      "challenge",
    );
  };

  return (
    <motion.button
      type="button"
      onClick={handleSave}
      disabled={isSaved}
      whileTap={isSaved ? undefined : { scale: 0.88 }}
      transition={transitions.snappy}
      aria-label={
        isSaved
          ? `${word.elevated.roman} is saved`
          : `Save ${word.elevated.roman} to Saved Words`
      }
      title={isSaved ? "Saved" : "Save word"}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-chip border-theme border-line transition-colors",
        isSaved
          ? "cursor-default bg-success-soft text-success"
          : "bg-accent-soft text-accent hover:bg-accent/20",
      )}
    >
      {/* The icon swap is the only confirmation of the save, so it gets a
          deliberate pop rather than an instant switch. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isSaved ? "saved" : "unsaved"}
          variants={popIn}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {isSaved ? (
            <Check size={17} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
