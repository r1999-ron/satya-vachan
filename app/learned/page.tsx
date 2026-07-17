"use client";

import { BookOpen, Search, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { emptyStateExamples, getStarterWords } from "@/data/demo";
import { useLearnedWords } from "@/lib/storage";

export default function LearnedPage() {
  const { removeWord, words } = useLearnedWords();
  const starterWords = getStarterWords(6);

  return (
    <div className="space-y-5">
      <GlassCard className="animate-floatIn p-6 sm:p-8">
        <StatusBadge tone="green">Learned Words</StatusBadge>
        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-balance text-3xl font-bold text-ink sm:text-4xl dark:text-white">
              Your personal Hindi refinement list.
            </h1>
            <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">
              Saved vocabulary stays on this device, with seed words shown until
              you begin shaping your own list.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/60 bg-white/45 px-4 dark:border-white/12 dark:bg-white/5">
              <BookOpen size={18} className="text-sky-700 dark:text-sky-200" aria-hidden="true" />
              <span className="text-sm font-bold text-ink dark:text-white">
                {words.length} {words.length === 1 ? "word" : "words"}
              </span>
            </div>
            <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/60 bg-white/45 px-4 dark:border-white/12 dark:bg-white/5">
              <Search size={18} className="text-zinc-500" aria-hidden="true" />
              <span className="text-sm font-semibold text-zinc-500">
                Search arrives later
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {words.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {words.map((word) => (
          <GlassCard key={word.id} interactive>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-wrap-anywhere text-2xl font-bold text-ink dark:text-white">
                    {word.word}
                  </h2>
                  <StatusBadge tone="blue" className="shrink-0">
                    {word.source}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-wrap-anywhere text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {word.meaning}
                </p>
                {word.simpleAlternative ? (
                  <p className="mt-3 text-wrap-anywhere text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                    Instead of {word.simpleAlternative}
                  </p>
                ) : null}
                <p className="mt-3 text-wrap-anywhere text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                  {word.exampleSentence}
                </p>
                <p className="mt-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Saved {word.savedAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeWord(word.id)}
                className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-400/14 text-rose-800 transition hover:scale-105 active:scale-95 dark:text-rose-200"
                aria-label={`Remove ${word.word}`}
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>
          </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="animate-floatIn">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-400/16 text-sky-800 dark:text-sky-200">
              <BookOpen size={19} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-ink dark:text-white">
                No saved words yet
              </h2>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                Practice words will appear here when you save them in later
                flows. For now, the starter corpus below gives you a useful
                reference.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <StatusBadge>Corpus Starters</StatusBadge>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {starterWords.map((word) => (
            <div
              key={word.id}
              className="min-w-0 rounded-2xl border border-white/60 bg-white/35 p-4 dark:border-white/12 dark:bg-white/5"
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-wrap-anywhere text-zinc-600 dark:text-zinc-300">
                  {word.common}
                </span>
                <span className="text-amber-600" aria-hidden="true">
                  -
                </span>
                <span className="text-wrap-anywhere text-ink dark:text-white">
                  {word.elevated}
                </span>
              </div>
              <p className="mt-2 text-wrap-anywhere text-xs leading-6 text-zinc-600 dark:text-zinc-400">
                {word.englishMeaning}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-5 md:grid-cols-2">
        {emptyStateExamples.map((example) => (
          <GlassCard key={example.title}>
            <h2 className="text-lg font-bold text-ink dark:text-white">
              {example.title}
            </h2>
            <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              {example.body}
            </p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
