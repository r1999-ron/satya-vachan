import { ArrowRight, Check, Plus } from "lucide-react";
import { HindiText } from "@/components/hindi/HindiText";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import type { LearnedWordInput, WordReplacement } from "@/types";

type WordReplacementCardProps = {
  disabled?: boolean;
  isSaved: boolean;
  replacement: WordReplacement;
  saveableWord: LearnedWordInput;
  onSave: (word: LearnedWordInput) => void;
};

export function WordReplacementCard({
  disabled = false,
  isSaved,
  replacement,
  saveableWord,
  onSave,
}: WordReplacementCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition duration-200",
        isSaved
          ? "border-emerald-200/80 bg-emerald-100/42 motion-safe:animate-savePop dark:border-emerald-300/25 dark:bg-emerald-300/10"
          : "border-white/60 bg-white/36 hover:border-amber-200/80 hover:bg-white/46 dark:border-white/12 dark:bg-white/5 dark:hover:border-amber-300/20",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-lg font-bold">
            <HindiText text={replacement.original} kind="inline" className="text-wrap-anywhere text-zinc-600 line-through decoration-zinc-400/70 decoration-2 dark:text-zinc-400" />
            <ArrowRight
              className="text-amber-600"
              size={18}
              aria-hidden="true"
            />
            <HindiText text={replacement.replacement} kind="inline" className="text-wrap-anywhere text-ink dark:text-white" />
            <StatusBadge tone="blue">{replacement.naturalness}</StatusBadge>
          </div>
          <p className="text-wrap-anywhere text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {replacement.meaning}
          </p>
          <p lang="hi-Latn" className="text-wrap-anywhere text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            {replacement.whyBetter}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || isSaved}
          onClick={() => onSave(saveableWord)}
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-paper active:scale-95 disabled:cursor-not-allowed dark:focus:ring-offset-zinc-950",
            isSaved
              ? "bg-emerald-400/16 text-emerald-900 motion-safe:animate-savePop dark:text-emerald-100"
              : "bg-ink text-white shadow-lg shadow-zinc-900/15 hover:-translate-y-0.5 dark:bg-white dark:text-zinc-950",
          )}
        >
          {isSaved ? (
            <Check size={17} aria-hidden="true" />
          ) : (
            <Plus size={17} aria-hidden="true" />
          )}
          {isSaved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
