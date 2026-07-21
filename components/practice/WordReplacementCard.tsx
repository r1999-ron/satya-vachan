"use client";

import { ArrowRight, Check, Plus } from "lucide-react";
import { motion } from "motion/react";
import { HindiText } from "@/components/hindi/HindiText";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { LearnedWordInput, WordReplacement } from "@/types";

type WordReplacementCardProps = {
  disabled?: boolean;
  isSaved: boolean;
  revealDelay?: number;
  replacement: WordReplacement;
  saveableWord: LearnedWordInput;
  onSave: (word: LearnedWordInput) => void;
};

export function WordReplacementCard({
  disabled = false,
  isSaved,
  revealDelay = 0,
  replacement,
  saveableWord,
  onSave,
}: WordReplacementCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitions.soft, delay: revealDelay / 1000 }}
      className={cn(
        "rounded-card border-theme p-4 transition-colors",
        isSaved ? "border-success/50 bg-success-soft" : "border-line bg-surface-2",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-lg font-bold">
            <HindiText
              text={replacement.original}
              kind="inline"
              className="text-wrap-anywhere text-content-subtle line-through decoration-danger/60 decoration-2"
            />
            <ArrowRight className="text-accent" size={18} aria-hidden="true" />
            <HindiText
              text={replacement.replacement}
              kind="inline"
              className="text-wrap-anywhere"
            />
            <StatusBadge tone="blue">{replacement.naturalness}</StatusBadge>
          </div>
          <p className="text-wrap-anywhere text-sm font-semibold text-content-muted">
            {replacement.meaning}
          </p>
          <p lang="hi-Latn" className="text-wrap-anywhere text-sm leading-7 text-content-subtle">
            {replacement.whyBetter}
          </p>
        </div>
        <motion.button
          type="button"
          disabled={disabled || isSaved}
          onClick={() => onSave(saveableWord)}
          whileTap={disabled || isSaved ? undefined : { scale: 0.96 }}
          transition={transitions.snappy}
          className={cn("btn shrink-0", isSaved ? "btn-outline" : "btn-solid")}
        >
          {isSaved ? (
            <Check size={17} aria-hidden="true" />
          ) : (
            <Plus size={17} aria-hidden="true" />
          )}
          {isSaved ? "Saved" : "Save"}
        </motion.button>
      </div>
    </motion.div>
  );
}
