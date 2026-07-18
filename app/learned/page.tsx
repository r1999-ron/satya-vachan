"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Filter,
  Mic2,
  RotateCcw,
  Search,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { HindiText } from "@/components/hindi/HindiText";
import { GlassCard } from "@/components/ui/GlassCard";
import { wordCorpus } from "@/data/words";
import { UI_FEEDBACK_DURATION_MS } from "@/lib/constants";
import { useLearnedWords } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { LearnedWord, WordEntry } from "@/types";

type SourceFilter = "all" | LearnedWord["source"];
type DifficultyFilter = "all" | WordEntry["difficulty"] | "uncategorized";
type RemovedWord = { word: LearnedWord; index: number };

const ADVANCED_FILTER_THRESHOLD = 10;

const sourceLabels: Record<SourceFilter, string> = {
  all: "All sources",
  seed: "Seed",
  practice: "Practice",
  challenge: "Challenge",
  manual: "Manual",
};

const difficultyLabels: Record<DifficultyFilter, string> = {
  all: "All levels",
  easy: "Easy",
  medium: "Medium",
  advanced: "Advanced",
  uncategorized: "Uncategorized",
};

export default function LearnedPage() {
  const { removeWord, restoreWord, words } = useLearnedWords();
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [removedWord, setRemovedWord] = useState<RemovedWord | null>(null);

  const sortedWords = useMemo(() => sortLearnedWords(words), [words]);
  const trimmedQuery = query.trim().toLocaleLowerCase();
  const advancedFiltersAvailable =
    sortedWords.length >= ADVANCED_FILTER_THRESHOLD;
  const appliedSourceFilter = advancedFiltersAvailable ? sourceFilter : "all";
  const appliedDifficultyFilter = advancedFiltersAvailable
    ? difficultyFilter
    : "all";
  const appliedTagFilter = advancedFiltersAvailable ? tagFilter : "all";

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    for (const word of sortedWords) {
      getCorpusMeta(word)?.tags.forEach((tag) => tags.add(tag));
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [sortedWords]);

  const filteredWords = useMemo(
    () =>
      sortedWords.filter((word) => {
        const meta = getCorpusMeta(word);
        const searchableText = [
          word.word,
          word.wordDev,
          word.meaning,
          word.simpleAlternative,
          word.exampleSentence,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();
        const matchesQuery =
          !trimmedQuery || searchableText.includes(trimmedQuery);
        const matchesSource =
          appliedSourceFilter === "all" || word.source === appliedSourceFilter;
        const matchesDifficulty =
          appliedDifficultyFilter === "all" ||
          (meta
            ? meta.difficulty === appliedDifficultyFilter
            : appliedDifficultyFilter === "uncategorized");
        const matchesTag =
          appliedTagFilter === "all" || Boolean(meta?.tags.includes(appliedTagFilter));

        return matchesQuery && matchesSource && matchesDifficulty && matchesTag;
      }),
    [
      appliedDifficultyFilter,
      appliedSourceFilter,
      appliedTagFilter,
      sortedWords,
      trimmedQuery,
    ],
  );

  const hasAdvancedFilters =
    advancedFiltersAvailable &&
    (sourceFilter !== "all" ||
      difficultyFilter !== "all" ||
      tagFilter !== "all");
  const hasActiveFilters = Boolean(trimmedQuery) || hasAdvancedFilters;

  useEffect(() => {
    if (!removedWord) {
      return;
    }
    const removedId = removedWord.word.id;
    const timeout = window.setTimeout(() => {
      setRemovedWord((current) =>
        current?.word.id === removedId ? null : current,
      );
    }, UI_FEEDBACK_DURATION_MS.undoRemoval);
    return () => window.clearTimeout(timeout);
  }, [removedWord]);

  const clearAdvancedFilters = () => {
    setSourceFilter("all");
    setDifficultyFilter("all");
    setTagFilter("all");
  };

  const clearAllFilters = () => {
    setQuery("");
    clearAdvancedFilters();
  };

  const handleRemove = (word: LearnedWord) => {
    if (!word.id) {
      return;
    }
    const index = words.findIndex((candidate) => candidate.id === word.id);
    removeWord(word.id);
    setRemovedWord({ word, index: Math.max(0, index) });
  };

  const handleUndoRemove = () => {
    if (removedWord) {
      restoreWord(removedWord.word, removedWord.index);
      setRemovedWord(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="flex items-end justify-between gap-4 px-1 py-1">
        <div>
          <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
            Vocabulary
          </p>
          <h1 className="mt-1 text-balance text-4xl font-bold tracking-[-0.035em] text-ink sm:text-5xl dark:text-white">
            Saved Words
          </h1>
        </div>
        <p className="pb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {sortedWords.length} saved
        </p>
      </section>

      <GlassCard className="p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-zinc-900/10 bg-white/58 px-3 dark:border-white/12 dark:bg-white/8">
            <span className="sr-only">Search your words</span>
            <Search size={17} className="shrink-0 text-zinc-500" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your words"
              className="min-w-0 flex-1 bg-transparent text-sm font-normal text-ink outline-none placeholder:text-zinc-400 dark:text-white dark:placeholder:text-zinc-500"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="grid size-7 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-900/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Clear search"
              >
                <X size={15} aria-hidden="true" />
              </button>
            ) : null}
          </label>

          {advancedFiltersAvailable ? (
            <button
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
              aria-expanded={filtersOpen}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55",
                filtersOpen || hasAdvancedFilters
                  ? "bg-amber-100 text-amber-950 dark:bg-amber-300/12 dark:text-amber-100"
                  : "bg-zinc-900/[0.045] text-zinc-700 hover:bg-zinc-900/[0.075] dark:bg-white/8 dark:text-zinc-200 dark:hover:bg-white/12",
              )}
            >
              <Filter size={15} aria-hidden="true" />
              Filters
            </button>
          ) : null}
        </div>

        {advancedFiltersAvailable && filtersOpen ? (
          <div className="mt-4 grid gap-3 border-t border-zinc-900/8 pt-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] dark:border-white/10">
            <FilterSelect
              label="Source"
              value={sourceFilter}
              onChange={(value) => setSourceFilter(value as SourceFilter)}
              options={Object.entries(sourceLabels).map(([value, label]) => ({ value, label }))}
            />
            <FilterSelect
              label="Level"
              value={difficultyFilter}
              onChange={(value) => setDifficultyFilter(value as DifficultyFilter)}
              options={Object.entries(difficultyLabels).map(([value, label]) => ({ value, label }))}
            />
            <FilterSelect
              label="Tag"
              value={tagFilter}
              onChange={setTagFilter}
              options={[
                { value: "all", label: "All tags" },
                ...tagOptions.map((tag) => ({ value: tag, label: tag })),
              ]}
            />
            <button
              type="button"
              onClick={clearAdvancedFilters}
              disabled={!hasAdvancedFilters}
              className="inline-flex min-h-10 items-center justify-center gap-2 self-end rounded-xl px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-900/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-white/8 dark:hover:text-white"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </button>
          </div>
        ) : null}

        {hasActiveFilters ? (
          <p className="mt-3 text-xs font-normal text-zinc-500 dark:text-zinc-400">
            {filteredWords.length} {filteredWords.length === 1 ? "match" : "matches"}
          </p>
        ) : null}
      </GlassCard>

      {filteredWords.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWords.map((word, index) => (
            <LearnedWordCard
              key={word.id}
              index={index}
              word={word}
              onRemove={() => handleRemove(word)}
            />
          ))}
        </div>
      ) : (
        <EmptyDictionaryState
          hasActiveFilters={hasActiveFilters}
          hasWords={sortedWords.length > 0}
          onClear={clearAllFilters}
        />
      )}

      {removedWord ? (
        <div
          role="status"
          className="fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 items-center justify-between gap-3 rounded-xl bg-zinc-950 px-4 py-3 text-white shadow-2xl md:bottom-6 dark:bg-white dark:text-zinc-950"
        >
          <p className="min-w-0 truncate text-sm font-medium">
            Removed {removedWord.word.word}
          </p>
          <button
            type="button"
            onClick={handleUndoRemove}
            className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-xl px-2 text-xs font-bold text-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 dark:text-amber-700"
          >
            <Undo2 size={14} aria-hidden="true" />
            Undo
          </button>
        </div>
      ) : null}
    </div>
  );
}

function LearnedWordCard({
  index,
  onRemove,
  word,
}: {
  index: number;
  onRemove: () => void;
  word: LearnedWord;
}) {
  const meta = getCorpusMeta(word);
  const displayWord = {
    dev: word.wordDev === word.word && meta ? meta.elevated.dev : word.wordDev,
    roman: word.word,
  };

  return (
    <GlassCard
      interactive
      className="flex min-h-0 flex-col p-4"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0">
          <HindiText
            text={displayWord}
            kind="word"
            devClassName="text-wrap-anywhere text-xl text-ink dark:text-white"
          />
        </h2>
        <SourceBadge source={word.source} />
      </div>

      <p className="mt-3 text-wrap-anywhere text-sm font-normal leading-6 text-zinc-700 dark:text-zinc-300">
        {word.meaning}
      </p>

      {word.simpleAlternative ? (
        <p className="mt-2 text-wrap-anywhere text-xs font-normal leading-5 text-zinc-500 dark:text-zinc-400">
          instead of <span className="font-medium text-zinc-700 dark:text-zinc-300">{word.simpleAlternative}</span>
        </p>
      ) : null}

      <p className="mt-3 text-wrap-anywhere text-sm font-normal italic leading-6 text-zinc-500 dark:text-zinc-400">
        “{word.exampleSentence}”
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-900/8 pt-3 dark:border-white/10">
        <p className="min-h-5 text-xs font-normal text-zinc-400 dark:text-zinc-500">
          {word.source === "seed" ? "" : `Saved ${formatSavedDate(word.savedAt)}`}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href={`/practice?word=${encodeURIComponent(word.word)}`}
            className="grid size-9 place-items-center rounded-xl text-amber-800 transition hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 dark:text-amber-200 dark:hover:bg-amber-300/10"
            aria-label={`Practice ${word.word}`}
          >
            <Mic2 size={16} aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={onRemove}
            disabled={!word.id}
            className="grid size-9 place-items-center rounded-xl text-rose-700 transition hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/45 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-200 dark:hover:bg-rose-300/10"
            aria-label={`Remove ${word.word}`}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

function SourceBadge({ source }: { source: LearnedWord["source"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
        source === "challenge"
          ? "bg-amber-100 text-amber-900 dark:bg-amber-300/12 dark:text-amber-100"
          : "bg-zinc-900/[0.05] text-zinc-600 dark:bg-white/8 dark:text-zinc-300",
      )}
    >
      {sourceLabels[source]}
    </span>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="mt-2 flex min-h-10 items-center rounded-xl border border-zinc-900/10 bg-white/58 px-3 dark:border-white/12 dark:bg-white/8">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none dark:text-white"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function EmptyDictionaryState({
  hasActiveFilters,
  hasWords,
  onClear,
}: {
  hasActiveFilters: boolean;
  hasWords: boolean;
  onClear: () => void;
}) {
  return (
    <GlassCard className="animate-floatIn p-7 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-300/12 dark:text-amber-100">
          <BookOpen size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-ink dark:text-white">
            {hasActiveFilters ? "No matching words" : "No saved words yet"}
          </h2>
          <p className="mt-2 text-sm font-normal leading-7 text-zinc-600 dark:text-zinc-400">
            {hasActiveFilters && hasWords
              ? "Try a broader search or clear the filters."
              : "Words you save while practicing will appear here."}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClear}
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 dark:bg-white dark:text-zinc-950"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Clear filters
            </button>
          ) : (
            <Link
              href="/practice"
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 dark:bg-white dark:text-zinc-950"
            >
              Start practicing
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function sortLearnedWords(words: LearnedWord[]) {
  return [...words].sort((a, b) => {
    if (a.source === "seed" && b.source !== "seed") {
      return 1;
    }
    if (a.source !== "seed" && b.source === "seed") {
      return -1;
    }
    return dateValue(b.savedAt) - dateValue(a.savedAt);
  });
}

function getCorpusMeta(word: LearnedWord) {
  const normalizedWord = normalizeForLookup(word.word);
  const normalizedAlternative = normalizeForLookup(word.simpleAlternative ?? "");

  return wordCorpus.find((entry) => {
    const candidates = [
      entry.id,
      entry.common.dev,
      entry.common.roman,
      entry.elevated.dev,
      entry.elevated.roman,
      ...entry.synonyms,
    ]
      .flatMap((value) =>
        typeof value === "string" ? [value] : [value.dev, value.roman],
      )
      .map(normalizeForLookup);

    return (
      candidates.includes(normalizedWord) ||
      Boolean(normalizedAlternative && candidates.includes(normalizedAlternative))
    );
  });
}

function normalizeForLookup(value: string) {
  return value.trim().toLocaleLowerCase();
}

function dateValue(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatSavedDate(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}
