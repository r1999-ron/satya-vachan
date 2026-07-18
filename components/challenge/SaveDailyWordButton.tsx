"use client";

import { Check, Plus } from "lucide-react";
import { useMemo } from "react";
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
    <button
      type="button"
      onClick={handleSave}
      disabled={isSaved}
      aria-label={
        isSaved
          ? `${word.elevated.roman} is saved`
          : `Save ${word.elevated.roman} to Saved Words`
      }
      title={isSaved ? "Saved" : "Save word"}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55",
        isSaved
          ? "cursor-default bg-emerald-100 text-emerald-800 dark:bg-emerald-300/15 dark:text-emerald-100"
          : "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-300/12 dark:text-amber-100 dark:hover:bg-amber-300/20",
      )}
    >
      {isSaved ? (
        <Check size={17} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
      )}
    </button>
  );
}
