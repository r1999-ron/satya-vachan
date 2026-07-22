"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Filter,
  RotateCcw,
  Search,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { HindiText } from "@/components/hindi/HindiText";
import { RevisionCallout } from "@/components/review/RevisionCallout";
import { GlassCard } from "@/components/ui/GlassCard";
import { findCorpusEntry } from "@/data/words";
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
  game: "Game",
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
      <RevisionCallout />

      <div>
        <div className="flex items-center gap-2">
          <label className="field flex min-h-11 min-w-0 flex-1 items-center gap-2 p-0 px-3">
            <span className="sr-only">Search your words</span>
            <Search size={17} className="shrink-0 text-content-subtle" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your words"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-content-subtle"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="icon-btn size-7 shrink-0 rounded-full"
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
                "btn min-h-11 shrink-0 px-3 text-xs",
                filtersOpen || hasAdvancedFilters
                  ? "border-line bg-accent-soft text-content"
                  : "btn-outline",
              )}
            >
              <Filter size={15} aria-hidden="true" />
              Filters
            </button>
          ) : null}
        </div>

        {advancedFiltersAvailable && filtersOpen ? (
          <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
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
              className="btn btn-ghost min-h-10 self-end px-3 text-xs"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </button>
          </div>
        ) : null}

        {hasActiveFilters ? (
          <p className="mt-3 text-xs text-content-subtle">
            {filteredWords.length} {filteredWords.length === 1 ? "match" : "matches"}
          </p>
        ) : null}
      </div>

      {filteredWords.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWords.map((word) => (
            <LearnedWordCard
              key={word.id}
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
          className="fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 items-center justify-between gap-3 rounded-btn border-theme border-line bg-content px-4 py-3 text-content-invert shadow-pop md:bottom-6"
        >
          <p className="min-w-0 truncate text-sm font-medium">
            Removed {removedWord.word.word}
          </p>
          <button
            type="button"
            onClick={handleUndoRemove}
            className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-chip px-2 text-xs font-bold text-accent"
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
  onRemove,
  word,
}: {
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
      className="flex min-h-0 flex-col p-4 [contain-intrinsic-size:240px] [content-visibility:auto]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0">
          <HindiText
            text={displayWord}
            kind="word"
            devClassName="text-wrap-anywhere text-xl"
          />
        </h2>
        <SourceBadge source={word.source} />
      </div>

      <p className="mt-3 text-wrap-anywhere text-sm leading-6 text-content-muted">
        {word.meaning}
      </p>

      {word.simpleAlternative ? (
        <p className="mt-2 text-wrap-anywhere text-xs leading-5 text-content-subtle">
          instead of{" "}
          <span className="font-medium text-content-muted">{word.simpleAlternative}</span>
        </p>
      ) : null}

      <p className="mt-3 text-wrap-anywhere text-sm italic leading-6 text-content-subtle">
        “{word.exampleSentence}”
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
        <p className="min-h-5 text-xs text-content-subtle">
          {word.source === "seed" ? "" : `Saved ${formatSavedDate(word.savedAt)}`}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onRemove}
            disabled={!word.id}
            className="icon-btn size-9 text-danger"
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
        "rounded-chip border-theme px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
        source === "challenge"
          ? "border-line bg-accent-soft text-content"
          : "border-line bg-surface-2 text-content-muted",
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
      <span className="eyebrow">{label}</span>
      <span className="field mt-2 flex min-h-10 items-center p-0 px-3">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
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
    <GlassCard className="p-7 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-btn border-theme border-line bg-accent-soft text-accent">
          <BookOpen size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-display">
            {hasActiveFilters ? "No matching words" : "No saved words yet"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-content-muted">
            {hasActiveFilters && hasWords
              ? "Try a broader search or clear the filters."
              : "Words you save while practicing will appear here."}
          </p>
          {hasActiveFilters ? (
            <button type="button" onClick={onClear} className="btn btn-solid mt-4 min-h-10">
              <RotateCcw size={15} aria-hidden="true" />
              Clear filters
            </button>
          ) : (
            <Link
              href="/practice"
              prefetch={false}
              className="btn btn-solid mt-4 min-h-10"
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
  return findCorpusEntry(word.word, word.simpleAlternative);
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
