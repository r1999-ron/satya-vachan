"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { SaveDailyWordButton } from "@/components/challenge/SaveDailyWordButton";
import { HindiText } from "@/components/hindi/HindiText";
import { GlassCard } from "@/components/ui/GlassCard";
import { getWordOfTheDay } from "@/data/words";
import { cn } from "@/lib/utils";
import type { HindiText as HindiTextValue, WordEntry } from "@/types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function DailyWordCard({
  initialDateKey,
  initialWord,
}: {
  initialDateKey: string;
  initialWord: WordEntry;
}) {
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey);
  const isToday = selectedDateKey === initialDateKey;
  const word = useMemo(
    () => (isToday ? initialWord : getWordOfTheDay(dateFromKey(selectedDateKey))),
    [initialWord, isToday, selectedDateKey],
  );

  const goToPreviousDay = () => {
    setSelectedDateKey((current) => shiftDateKey(current, -1));
  };

  const goToNextDay = () => {
    setSelectedDateKey((current) =>
      current < initialDateKey ? shiftDateKey(current, 1) : current,
    );
  };

  return (
    <GlassCard className="overflow-hidden p-5 sm:p-7 lg:p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200">
            Today&apos;s word
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

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2 sm:mt-6 sm:gap-4">
        <Word value={word.common} />
        <div className="flex items-center justify-center">
          <ArrowRight className="text-amber-600" size={20} aria-hidden="true" />
        </div>
        <Word value={word.elevated} featured />
      </div>

      <p className="mt-4 text-sm font-normal leading-6 text-zinc-600 sm:mt-5 sm:text-base dark:text-zinc-300">
        {word.englishMeaning}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3 sm:mt-6 sm:gap-4">
        <Example label="Everyday usage" text={word.simpleExample} />
        <Example label="Improved version" text={word.elevatedExample} featured />
        <Example label="Scholar version" text={word.scholarExample} />
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

function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function shiftDateKey(dateKey: string, amount: number) {
  const date = dateFromKey(dateKey);
  date.setDate(date.getDate() + amount);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function formatWordDate(dateKey: string) {
  const date = dateFromKey(dateKey);
  return `${String(date.getDate()).padStart(2, "0")}-${MONTHS[date.getMonth()]}-${date.getFullYear()}`;
}

function Example({
  featured = false,
  label,
  text,
}: {
  featured?: boolean;
  label: string;
  text: HindiTextValue;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 sm:p-4",
        featured
          ? "border-amber-200 bg-amber-50/80 dark:border-amber-300/20 dark:bg-amber-300/10"
          : "border-zinc-200/80 bg-white/50 dark:border-white/10 dark:bg-white/[0.03]",
      )}
    >
      <p className={cn(
        "text-xs font-bold uppercase tracking-[0.12em]",
        featured ? "text-amber-800 dark:text-amber-200" : "text-zinc-600 dark:text-zinc-300",
      )}>
        {label}
      </p>
      <HindiText text={text} className="mt-3" />
    </div>
  );
}

function Word({
  featured = false,
  value,
}: {
  featured?: boolean;
  value: HindiTextValue;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl px-3 py-4 sm:px-5 sm:py-5",
        featured
          ? "bg-amber-100 ring-1 ring-amber-200 dark:bg-amber-300/10 dark:ring-amber-300/20"
          : "bg-zinc-900/[0.035] ring-1 ring-zinc-900/[0.06] dark:bg-white/5 dark:ring-white/10",
      )}
    >
      <HindiText
        text={value}
        kind="word"
        devClassName="text-wrap-anywhere text-lg leading-relaxed text-ink sm:text-3xl dark:text-white"
      />
    </div>
  );
}
