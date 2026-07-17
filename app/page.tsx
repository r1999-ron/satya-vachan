"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Flame,
  Mic2,
  Sparkles,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getWordOfTheDay } from "@/data/words";
import { formatReadableDate } from "@/lib/dates";
import { useLearnedWords, useStreak } from "@/lib/storage";

export default function HomePage() {
  const todayWord = getWordOfTheDay();
  const { words } = useLearnedWords();
  const { completedToday, streak } = useStreak();
  const savedWordCount = words.filter((word) => word.source !== "seed").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <GlassCard className="relative overflow-hidden bg-zinc-950 p-7 text-white sm:p-10 dark:bg-white dark:text-zinc-950">
          <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-amber-400/25 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="text-sm font-semibold text-amber-300 dark:text-amber-700">
              {formatReadableDate()}
            </p>
            <h1 className="mt-8 text-balance text-4xl font-bold tracking-[-0.045em] sm:text-6xl">
              Better words.<br />Clearer Hindi.
            </h1>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/practice"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:-translate-y-0.5 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-zinc-950 active:translate-y-0"
              >
                <Mic2 size={18} aria-hidden="true" />
                Start practicing
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href="/challenge"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/16 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/16 focus:outline-none focus:ring-2 focus:ring-white/35 dark:border-zinc-900/15 dark:bg-zinc-900/5 dark:text-zinc-950"
              >
                Today&apos;s challenge
              </Link>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between p-7 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
              Your progress
            </p>
            {completedToday ? (
              <span className="grid size-9 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-300/15 dark:text-emerald-200">
                <Check size={18} aria-label="Challenge complete" />
              </span>
            ) : null}
          </div>
          <div className="my-8 grid grid-cols-2 divide-x divide-zinc-900/10 dark:divide-white/10">
            <Metric
              icon={<Flame size={19} aria-hidden="true" />}
              label="day streak"
              value={streak.currentStreak}
            />
            <Metric
              icon={<BookOpen size={19} aria-hidden="true" />}
              label="saved words"
              value={savedWordCount}
            />
          </div>
          <Link
            href="/learned"
            className="inline-flex items-center justify-between rounded-2xl bg-zinc-900/[0.045] px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-900/[0.08] hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-400/50 dark:bg-white/8 dark:text-zinc-200 dark:hover:bg-white/12 dark:hover:text-white"
          >
            My Words
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </GlassCard>
      </section>

      <GlassCard interactive className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
              Today&apos;s word
            </p>
            <p className="mt-1 text-xs font-semibold capitalize text-zinc-500 dark:text-zinc-400">
              {todayWord.difficulty}
            </p>
          </div>
          <StatusBadge tone={completedToday ? "green" : "gold"}>
            {completedToday ? "Completed" : "Ready"}
          </StatusBadge>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <Word value={todayWord.common} />
              <ArrowRight className="hidden text-amber-500 sm:block" size={22} aria-hidden="true" />
              <Word value={todayWord.elevated} featured />
            </div>
            <p className="mt-5 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              {todayWord.englishMeaning}
            </p>
          </div>

          <div className="space-y-4 border-zinc-900/8 lg:border-l lg:pl-10 dark:border-white/10">
            <Example label="Everyday" value={todayWord.simpleExample} />
            <Example label="Refined" value={todayWord.elevatedExample} featured />
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-zinc-900/8 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            {todayWord.challengePrompt}
          </p>
          <Link
            href="/challenge"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 focus:ring-offset-2 active:translate-y-0 dark:bg-white dark:text-zinc-950"
          >
            Use this word
            <Sparkles size={16} aria-hidden="true" />
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="px-4 first:pl-0 last:pr-0">
      <div className="flex items-center gap-2 text-amber-600">{icon}</div>
      <p className="mt-3 text-4xl font-bold tracking-tight text-ink dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
    </div>
  );
}

function Word({ value, featured = false }: { value: string; featured?: boolean }) {
  return (
    <div
      className={
        featured
          ? "rounded-2xl bg-amber-100 px-5 py-5 ring-1 ring-amber-200 dark:bg-amber-300/10 dark:ring-amber-300/20"
          : "rounded-2xl bg-zinc-900/[0.035] px-5 py-5 ring-1 ring-zinc-900/[0.06] dark:bg-white/5 dark:ring-white/10"
      }
    >
      <p className="text-wrap-anywhere text-3xl font-bold tracking-tight text-ink dark:text-white">
        {value}
      </p>
    </div>
  );
}

function Example({
  featured = false,
  label,
  value,
}: {
  featured?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className={featured ? "text-xs font-bold text-amber-700 dark:text-amber-300" : "text-xs font-bold text-zinc-500 dark:text-zinc-400"}>
        {label}
      </p>
      <p className="mt-1 text-wrap-anywhere text-sm font-semibold leading-7 text-zinc-700 dark:text-zinc-200">
        {value}
      </p>
    </div>
  );
}
