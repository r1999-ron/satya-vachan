"use client";

import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { useState } from "react";
import { SaveDailyWordButton } from "@/components/challenge/SaveDailyWordButton";
import { HindiText } from "@/components/hindi/HindiText";
import { GlassCard } from "@/components/ui/GlassCard";
import { APP_TIME_ZONE, dateFromKey } from "@/lib/dates";
import { useScriptPreference } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { HindiText as HindiTextValue, ScriptPreference, WordEntry } from "@/types";

type ExampleTab = "everyday" | "improved" | "scholarly";

const EXAMPLE_TABS: { key: ExampleTab; label: string }[] = [
  { key: "everyday", label: "Everyday" },
  { key: "improved", label: "Enhanced" },
  { key: "scholarly", label: "Advanced" },
];

export function DailyWordCard({
  isToday,
  onNextDay,
  onPreviousDay,
  selectedDateKey,
  word,
}: {
  isToday: boolean;
  onNextDay: () => void;
  onPreviousDay: () => void;
  selectedDateKey: string;
  word: WordEntry;
}) {
  const [activeTab, setActiveTab] = useState<ExampleTab>("improved");
  const { preference } = useScriptPreference();

  const goToPreviousDay = () => {
    onPreviousDay();
    setActiveTab("improved");
  };

  const goToNextDay = () => {
    onNextDay();
    setActiveTab("improved");
  };

  const example =
    activeTab === "everyday"
      ? word.simpleExample
      : activeTab === "improved"
        ? word.elevatedExample
        : word.scholarExample;
  const highlightTarget = activeTab === "everyday" ? word.common : word.elevated;

  return (
    <GlassCard className="overflow-hidden p-5 sm:p-7 lg:p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200">
            {isToday ? "Today's word" : "Word of the day"}
          </p>
          {!isToday ? (
            <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {formatWordDate(selectedDateKey)}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center rounded-lg border border-zinc-200/80 bg-white/50 p-0.5 dark:border-white/10 dark:bg-white/[0.03]">
            <button
              type="button"
              onClick={goToPreviousDay}
              className="inline-flex size-8 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-900/5 hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Show the previous day's word"
              title="Previous day"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goToNextDay}
              disabled={isToday}
              className="inline-flex size-8 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-900/5 hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 disabled:cursor-not-allowed disabled:opacity-35 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Show the next day's word"
              title={isToday ? "Today's word" : "Next day"}
            >
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          <SaveDailyWordButton word={word} />
        </div>
      </div>

      <div className="mt-5 sm:mt-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="text-wrap-anywhere font-hindi text-5xl font-bold leading-[1.4] tracking-[-0.02em] text-ink sm:text-6xl dark:text-white">
            <span lang={preference === "roman" ? "hi-Latn" : "hi"}>
              {preference === "roman" ? word.elevated.roman : word.elevated.dev}
            </span>
          </p>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              instead of
            </p>
            <HindiText
              text={word.common}
              kind="inline"
              className="mt-1 block text-wrap-anywhere text-2xl font-bold text-zinc-700 sm:text-3xl dark:text-zinc-200"
            />
          </div>
        </div>

        <p className="mt-2 text-sm font-normal leading-6 text-zinc-600 sm:text-base dark:text-zinc-300">
          {preference !== "roman" ? (
            <span lang="hi-Latn" className="font-semibold text-amber-800 dark:text-amber-200">
              {word.elevated.roman}
              <span aria-hidden="true" className="mx-2 text-zinc-400">·</span>
            </span>
          ) : null}
          {word.englishMeaning}
        </p>
      </div>

      <div className="mt-5 sm:mt-6">
        <div
          role="tablist"
          aria-label="Example sentences"
          className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-zinc-900/[0.045] p-1 dark:bg-white/8"
        >
          {EXAMPLE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60",
                activeTab === tab.key
                  ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          key={`${word.id}-${activeTab}`}
          className={cn(
            "mt-2 animate-floatIn rounded-xl border p-4 sm:p-5",
            activeTab === "everyday"
              ? "border-zinc-200/80 bg-white/50 dark:border-white/10 dark:bg-white/[0.03]"
              : "border-amber-200 bg-amber-50/80 dark:border-amber-300/20 dark:bg-amber-300/10",
          )}
        >
          <HighlightedSentence
            text={example}
            target={highlightTarget}
            highlight={activeTab !== "everyday"}
            preference={preference}
          />
        </div>
      </div>

      <div className="mt-5 border-t border-zinc-900/8 pt-4 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Synonyms
          </span>
          {word.synonyms.map((synonym) => (
            <span
              key={synonym.roman}
              className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-950 dark:bg-amber-300/10 dark:text-amber-100"
            >
              <HindiText text={synonym} kind="inline" />
            </span>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs font-normal leading-5 text-zinc-500 dark:text-zinc-400">
          <Lightbulb className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={14} aria-hidden="true" />
          {word.usageNote}
        </p>
      </div>

      <a
        href="#daily-challenge"
        className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-ink px-4 text-sm font-bold text-white shadow-md shadow-zinc-900/15 transition hover:-translate-y-0.5 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f5ef] active:translate-y-0 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-zinc-950"
      >
        Use it in a sentence
      </a>
    </GlassCard>
  );
}

function HighlightedSentence({
  highlight,
  preference,
  target,
  text,
}: {
  highlight: boolean;
  preference: ScriptPreference;
  target: HindiTextValue;
  text: HindiTextValue;
}) {
  const showDev = preference !== "roman";
  const showRoman = preference !== "dev";

  return (
    <span className="block">
      {showDev ? (
        <span
          lang="hi"
          className="block text-wrap-anywhere font-hindi text-base font-medium leading-8 text-ink sm:text-lg dark:text-white"
        >
          {highlight ? highlightWord(text.dev, target.dev) : text.dev}
        </span>
      ) : null}
      {showRoman ? (
        <span
          lang="hi-Latn"
          className={cn(
            "block text-wrap-anywhere",
            showDev
              ? "mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400"
              : "text-base font-medium leading-8 text-ink sm:text-lg dark:text-white",
          )}
        >
          {highlight ? highlightWord(text.roman, target.roman, true) : text.roman}
        </span>
      ) : null}
    </span>
  );
}

function highlightWord(sentence: string, word: string, caseInsensitive = false) {
  const trimmedWord = word.trim();

  if (!trimmedWord) {
    return sentence;
  }

  const escapedWord = trimmedWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(`(${escapedWord})`, caseInsensitive ? "gi" : "g");

  // Splitting on a single capturing group puts every match at an odd index.
  return sentence.split(matcher).map((part, index) =>
    index % 2 === 1 ? (
      <mark
        key={index}
        className="rounded bg-amber-200/80 px-0.5 font-bold text-inherit dark:bg-amber-300/30"
      >
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

function formatWordDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dateFromKey(dateKey));
}
