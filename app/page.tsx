"use client";

import Link from "next/link";
import { ArrowRight, Check, Flame } from "lucide-react";
import { HindiText } from "@/components/hindi/HindiText";
import { GlassCard } from "@/components/ui/GlassCard";
import { getWordOfTheDay } from "@/data/words";
import { formatReadableDate } from "@/lib/dates";
import { useLearnedWords, useStreak } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { HindiText as HindiTextValue } from "@/types";

export default function HomePage() {
  const todayWord = getWordOfTheDay();
  const { words } = useLearnedWords();
  const { completedToday, streak } = useStreak();

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
      <section className="flex items-start justify-between gap-3 px-1 py-1">
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
            {formatReadableDate()}
          </p>
          <p className="mt-1 text-xs font-normal text-zinc-500 sm:text-sm dark:text-zinc-400">
            Thoughtful Hindi, one sentence at a time · {words.length} saved {words.length === 1 ? "word" : "words"}
          </p>
        </div>
        <StreakChip completedToday={completedToday} count={streak.currentStreak} />
      </section>

      <GlassCard className="overflow-hidden p-5 sm:p-7 lg:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200">
          Today&apos;s word
        </p>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2 sm:mt-6 sm:gap-4">
          <Word value={todayWord.common} />
          <div className="flex items-center justify-center">
            <ArrowRight className="text-amber-600" size={20} aria-hidden="true" />
          </div>
          <Word value={todayWord.elevated} featured />
        </div>

        <p className="mt-4 text-sm font-normal leading-6 text-zinc-600 sm:mt-5 sm:text-base dark:text-zinc-300">
          {todayWord.englishMeaning}
        </p>
        <Link
          href="/practice?challenge=today"
          className="mt-5 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f5ef] dark:text-amber-200 dark:hover:bg-amber-300/10 dark:focus-visible:ring-offset-zinc-950"
        >
          Use it in a sentence
        </Link>
      </GlassCard>

      <GlassCard className="p-4 sm:p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Detail label="Everyday example">
            <HindiText text={todayWord.simpleExample} />
          </Detail>
          <Detail label="Refined example" featured>
            <HindiText text={todayWord.elevatedExample} />
          </Detail>
          <Detail label="Synonyms">
            <div className="flex flex-wrap gap-2">
              {todayWord.synonyms.map((synonym) => (
                <span
                  key={synonym.roman}
                  className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-950 dark:bg-amber-300/10 dark:text-amber-100"
                >
                  <HindiText text={synonym} kind="inline" />
                </span>
              ))}
            </div>
          </Detail>
          <Detail label="Usage note">
            <p className="text-sm font-normal leading-6 text-zinc-700 dark:text-zinc-300">
              {todayWord.usageNote}
            </p>
          </Detail>
        </div>
      </GlassCard>
    </div>
  );
}

function StreakChip({
  completedToday,
  count,
}: {
  completedToday: boolean;
  count: number;
}) {
  const label = completedToday
    ? `Done today · ${count} day streak`
    : count === 0
      ? "Start your streak today"
      : `${count} day streak`;

  return (
    <span
      className={cn(
        "inline-flex min-h-9 max-w-[11rem] shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold leading-4 sm:max-w-none sm:text-xs",
        completedToday
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-300/15 dark:text-emerald-100"
          : "bg-amber-100 text-amber-900 dark:bg-amber-300/12 dark:text-amber-100",
      )}
    >
      {completedToday ? (
        <Check className="shrink-0" size={14} aria-hidden="true" />
      ) : (
        <Flame className="shrink-0" size={14} aria-hidden="true" />
      )}
      {label}
    </span>
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

function Detail({
  children,
  featured = false,
  label,
}: {
  children: React.ReactNode;
  featured?: boolean;
  label: string;
}) {
  return (
    <div className="min-w-0">
      <p
        className={cn(
          "mb-2 text-xs font-bold uppercase tracking-[0.14em]",
          featured
            ? "text-amber-800 dark:text-amber-200"
            : "text-zinc-500 dark:text-zinc-400",
        )}
      >
        {label}
      </p>
      {children}
    </div>
  );
}
