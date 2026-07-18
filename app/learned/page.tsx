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
import { GlassCard } from "@/components/ui/GlassCard";
import { HindiText } from "@/components/hindi/HindiText";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { wordCorpus } from "@/data/words";
import { useLearnedWords } from "@/lib/storage";
import type { LearnedWord, WordEntry } from "@/types";

type SourceFilter = "all" | LearnedWord["source"];
type DifficultyFilter = "all" | WordEntry["difficulty"] | "uncategorized";
type RemovedWord = {
  word: LearnedWord;
  index: number;
};

const UNDO_DISMISS_MS = 8_000;

const sourceLabels: Record<SourceFilter, string> = {
  all: "All sources",
  seed: "Starter",
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
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [removedWord, setRemovedWord] = useState<RemovedWord | null>(null);

  const sortedWords = useMemo(
    () => sortLearnedWords(words),
    [words],
  );
  const trimmedQuery = query.trim().toLocaleLowerCase();

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();

    for (const word of sortedWords) {
      const meta = getCorpusMeta(word);
      meta?.tags.forEach((tag) => tags.add(tag));
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
          sourceFilter === "all" || word.source === sourceFilter;
        const matchesDifficulty =
          difficultyFilter === "all" ||
          (meta ? meta.difficulty === difficultyFilter : difficultyFilter === "uncategorized");
        const matchesTag =
          tagFilter === "all" || Boolean(meta?.tags.includes(tagFilter));

        return matchesQuery && matchesSource && matchesDifficulty && matchesTag;
      }),
    [difficultyFilter, sourceFilter, sortedWords, tagFilter, trimmedQuery],
  );

  const hasActiveFilters =
    Boolean(trimmedQuery) ||
    sourceFilter !== "all" ||
    difficultyFilter !== "all" ||
    tagFilter !== "all";

  useEffect(() => {
    if (!removedWord) {
      return;
    }

    const removedId = removedWord.word.id;
    const timeout = window.setTimeout(() => {
      setRemovedWord((current) =>
        current?.word.id === removedId ? null : current,
      );
    }, UNDO_DISMISS_MS);

    return () => window.clearTimeout(timeout);
  }, [removedWord]);

  const handleRemove = (word: LearnedWord) => {
    if (!word.id) {
      return;
    }

    const index = words.findIndex((candidate) => candidate.id === word.id);
    removeWord(word.id);
    setRemovedWord({ word, index: Math.max(0, index) });
  };

  const handleUndoRemove = () => {
    if (!removedWord) {
      return;
    }

    restoreWord(removedWord.word, removedWord.index);
    setRemovedWord(null);
  };

  const clearFilters = () => {
    setQuery("");
    setSourceFilter("all");
    setDifficultyFilter("all");
    setTagFilter("all");
  };

  return (
    <div className="space-y-5">
      <GlassCard className="animate-floatIn p-6 sm:p-8">
        <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Vocabulary</p>
        <div className="mt-5 flex items-end justify-between gap-4">
          <h1 className="text-balance text-4xl font-bold tracking-[-0.035em] text-ink sm:text-5xl dark:text-white">
            My Words
          </h1>
          <p className="pb-1 text-sm font-bold text-zinc-500 dark:text-zinc-400">
            {sortedWords.length} saved
          </p>
        </div>
      </GlassCard>

      <GlassCard className="animate-floatIn [animation-delay:80ms]">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto] lg:items-end">
          <label className="col-span-2 block lg:col-span-1">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Search
            </span>
            <span className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-4 dark:border-white/12 dark:bg-white/8">
              <Search size={17} className="shrink-0 text-zinc-500" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your words"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-zinc-400 dark:text-white dark:placeholder:text-zinc-500"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="grid size-7 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-white/70 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Clear search"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              ) : null}
            </span>
          </label>

          <FilterSelect
            label="Source"
            value={sourceFilter}
            onChange={(value) => setSourceFilter(value as SourceFilter)}
            options={Object.entries(sourceLabels).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <FilterSelect
            label="Level"
            value={difficultyFilter}
            onChange={(value) => setDifficultyFilter(value as DifficultyFilter)}
            options={Object.entries(difficultyLabels).map(([value, label]) => ({
              value,
              label,
            }))}
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
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm font-bold text-ink shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 dark:border-white/12 dark:bg-white/10 dark:text-white dark:focus:ring-offset-zinc-950"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>

        {hasActiveFilters ? (
          <p className="mt-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {filteredWords.length} {filteredWords.length === 1 ? "match" : "matches"}
          </p>
        ) : null}
      </GlassCard>

      {removedWord ? (
        <GlassCard className="animate-floatIn border-amber-200/80 bg-amber-100/45 dark:border-amber-300/25 dark:bg-amber-300/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold leading-6 text-amber-950 dark:text-amber-100">
              Removed <span className="font-bold">{removedWord.word.word}</span>
              . You can undo this action now.
            </p>
            <button
              type="button"
              onClick={handleUndoRemove}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-amber-700 px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400/45 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 dark:bg-amber-200 dark:text-amber-950 dark:focus:ring-offset-zinc-950"
            >
              <Undo2 size={15} aria-hidden="true" />
              Undo remove
            </button>
          </div>
        </GlassCard>
      ) : null}

      {filteredWords.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
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
          onClear={clearFilters}
        />
      )}

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
  const canRemove = Boolean(word.id);

  return (
    <GlassCard
      interactive
      className="p-5"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2><HindiText text={displayWord} kind="word" devClassName="text-2xl text-ink dark:text-white" /></h2>
              <StatusBadge tone={sourceTone(word.source)} className="shrink-0 capitalize">
                {word.source}
              </StatusBadge>
              {meta ? (
                <StatusBadge tone="gold" className="shrink-0 capitalize">
                  {meta.difficulty}
                </StatusBadge>
              ) : null}
            </div>
            <p className="mt-2 text-wrap-anywhere text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {word.meaning}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            className="grid size-10 shrink-0 place-items-center rounded-2xl bg-rose-400/14 text-rose-800 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-rose-400/45 focus:ring-offset-2 focus:ring-offset-paper active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-200 dark:focus:ring-offset-zinc-950"
            aria-label={`Remove ${word.word}`}
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-3">
          {word.simpleAlternative ? (
            <InfoLine label="Instead of" value={word.simpleAlternative} />
          ) : null}
          <InfoLine label="Example" value={word.exampleSentence} />
          <InfoLine label="Added" value={formatSavedDate(word.savedAt)} />
        </div>

        {meta ? (
          <div className="flex flex-wrap gap-2">
            {meta.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/45 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-white/8 dark:text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/practice?word=${encodeURIComponent(word.word)}`}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-2 text-sm font-bold text-white shadow-lg shadow-zinc-900/15 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ink/40 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 dark:bg-white dark:text-zinc-950 dark:focus:ring-white/40 dark:focus:ring-offset-zinc-950"
          >
            Practice this word
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </GlassCard>
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
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-3 dark:border-white/12 dark:bg-white/8">
        <Filter size={16} className="shrink-0 text-zinc-500" aria-hidden="true" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-ink outline-none dark:text-white"
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

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/35 p-3 dark:border-white/12 dark:bg-white/5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-wrap-anywhere text-sm font-semibold leading-6 text-zinc-700 dark:text-zinc-300">
        {value}
      </p>
    </div>
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
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-400/16 text-sky-800 dark:text-sky-200">
          <BookOpen size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-ink dark:text-white">
            {hasActiveFilters ? "No matching words" : "No saved words yet"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            {hasActiveFilters && hasWords
              ? "Try a broader search or clear the filters."
              : "Words you save while practicing will appear here."}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClear}
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ink/40 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 dark:bg-white dark:text-zinc-950 dark:focus:ring-white/40 dark:focus:ring-offset-zinc-950"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Clear filters
            </button>
          ) : (
            <Link
              href="/practice"
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ink/40 focus:ring-offset-2 active:translate-y-0 dark:bg-white dark:text-zinc-950"
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
    ].flatMap((value) =>
      typeof value === "string" ? [value] : [value.dev, value.roman],
    ).map(normalizeForLookup);

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

function sourceTone(source: LearnedWord["source"]) {
  switch (source) {
    case "practice":
      return "green";
    case "challenge":
      return "gold";
    case "manual":
      return "blue";
    case "seed":
    default:
      return "blue";
  }
}
