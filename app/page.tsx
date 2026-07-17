"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
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
    <div className="space-y-4 sm:space-y-6">
      <section className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] lg:grid-cols-[1.25fr_0.75fr]">
        <GlassCard className="relative overflow-hidden bg-zinc-950 p-5 text-white [@media(max-width:767px)_and_(max-height:720px)]:p-4 sm:p-8 lg:p-10 dark:bg-white dark:text-zinc-950">
          <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-amber-400/25 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-amber-300 dark:text-amber-700">
                {formatReadableDate()}
              </p>
              <div className="flex items-center gap-2">
                <span className="hidden text-xs font-bold text-zinc-300 [@media(max-width:767px)_and_(max-height:720px)]:inline dark:text-zinc-700">
                  {streak.currentStreak} streak / {savedWordCount} saved
                </span>
                {completedToday ? (
                  <span className="grid size-9 place-items-center rounded-full bg-emerald-300/16 text-emerald-100 dark:bg-emerald-100 dark:text-emerald-700">
                    <Check size={18} aria-label="Challenge complete" />
                  </span>
                ) : null}
              </div>
            </div>
            <h1 className="mt-4 text-balance text-[2.45rem] font-bold leading-[1.02] [@media(max-width:767px)_and_(max-height:720px)]:mt-3 [@media(max-width:767px)_and_(max-height:720px)]:text-[2.1rem] sm:mt-7 sm:text-5xl lg:text-6xl">
              Better words.<br />Clearer Hindi.
            </h1>
            <div className="mt-5 grid grid-cols-2 gap-2.5 [@media(max-width:767px)_and_(max-height:720px)]:mt-4 sm:mt-8 sm:flex sm:flex-row sm:gap-3">
              <Link
                href="/practice"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-3 py-2 text-[13px] font-bold text-zinc-950 transition hover:-translate-y-0.5 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-zinc-950 active:translate-y-0 sm:min-h-12 sm:px-5 sm:py-3 sm:text-sm"
              >
                <Mic2 size={18} aria-hidden="true" />
                <span className="sm:hidden">Practice</span>
                <span className="hidden sm:inline">Start practicing</span>
                <ArrowRight className="hidden sm:block" size={17} aria-hidden="true" />
              </Link>
              <Link
                href="/challenge"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/16 bg-white/10 px-3 py-2 text-[13px] font-bold text-white transition hover:bg-white/16 focus:outline-none focus:ring-2 focus:ring-white/35 sm:min-h-12 sm:px-5 sm:py-3 sm:text-sm dark:border-zinc-900/15 dark:bg-zinc-900/5 dark:text-zinc-950"
              >
                <Sparkles className="sm:hidden" size={16} aria-hidden="true" />
                <span className="sm:hidden">Challenge</span>
                <span className="hidden sm:inline">Today&apos;s challenge</span>
              </Link>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 [@media(max-width:767px)_and_(max-height:720px)]:hidden md:hidden">
              <MobileMetric
                icon={<Flame size={17} aria-hidden="true" />}
                label="Streak"
                value={streak.currentStreak}
              />
              <MobileMetric
                icon={<BookOpen size={17} aria-hidden="true" />}
                label="Saved"
                value={savedWordCount}
              />
            </dl>
          </div>
        </GlassCard>

        <GlassCard className="hidden flex-col justify-between p-7 sm:p-8 md:flex">
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

      <GlassCard interactive className="p-5 [@media(max-width:767px)_and_(max-height:720px)]:p-4 sm:p-8">
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

        <div className="mt-5 grid gap-5 [@media(max-width:767px)_and_(max-height:720px)]:mt-3 [@media(max-width:767px)_and_(max-height:720px)]:gap-3 sm:mt-7 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2 sm:gap-3">
              <Word value={todayWord.common} />
              <div className="flex items-center justify-center">
                <ArrowRight className="text-amber-500" size={20} aria-hidden="true" />
              </div>
              <Word value={todayWord.elevated} featured />
            </div>
            <p className="mt-3 text-sm font-semibold text-zinc-600 [@media(max-width:767px)_and_(max-height:720px)]:text-xs sm:mt-5 dark:text-zinc-300">
              {todayWord.englishMeaning}
            </p>
          </div>

          <div className="hidden space-y-4 border-zinc-900/8 lg:block lg:border-l lg:pl-10 dark:border-white/10">
            <Example label="Everyday" value={todayWord.simpleExample} />
            <Example label="Refined" value={todayWord.elevatedExample} featured />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-zinc-900/8 bg-zinc-900/[0.025] p-4 [@media(max-width:767px)_and_(max-height:720px)]:mt-3 [@media(max-width:767px)_and_(max-height:720px)]:p-3 sm:mt-7 sm:border-t sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-5 dark:border-white/10 dark:bg-white/[0.035] sm:dark:bg-transparent">
          <p className="min-w-0 text-xs font-semibold leading-5 text-zinc-600 sm:text-sm dark:text-zinc-300">
            {todayWord.challengePrompt}
          </p>
          <Link
            href="/challenge"
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 focus:ring-offset-2 active:translate-y-0 sm:min-h-11 sm:rounded-2xl sm:px-4 sm:text-sm dark:bg-white dark:text-zinc-950"
          >
            <span className="sm:hidden">Use word</span>
            <span className="hidden sm:inline">Use this word</span>
            <Sparkles size={16} aria-hidden="true" />
          </Link>
        </div>
      </GlassCard>

      <GlassCard className="p-4 lg:hidden">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
            Examples
            <ChevronDown
              className="shrink-0 text-zinc-500 transition group-open:rotate-180 dark:text-zinc-400"
              size={18}
              aria-hidden="true"
            />
          </summary>
          <div className="mt-4 space-y-4">
            <Example label="Everyday" value={todayWord.simpleExample} />
            <Example label="Refined" value={todayWord.elevatedExample} featured />
          </div>
        </details>
      </GlassCard>
    </div>
  );
}

function MobileMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur-md dark:border-zinc-900/10 dark:bg-zinc-900/[0.04]">
      <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-amber-200 dark:text-amber-700">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-bold text-white dark:text-zinc-950">
        {value}
      </dd>
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
      <p className="mt-3 text-4xl font-bold text-ink dark:text-white">
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
          ? "rounded-2xl bg-amber-100 px-4 py-4 ring-1 ring-amber-200 [@media(max-width:767px)_and_(max-height:720px)]:px-3 [@media(max-width:767px)_and_(max-height:720px)]:py-3 sm:px-5 sm:py-5 dark:bg-amber-300/10 dark:ring-amber-300/20"
          : "rounded-2xl bg-zinc-900/[0.035] px-4 py-4 ring-1 ring-zinc-900/[0.06] [@media(max-width:767px)_and_(max-height:720px)]:px-3 [@media(max-width:767px)_and_(max-height:720px)]:py-3 sm:px-5 sm:py-5 dark:bg-white/5 dark:ring-white/10"
      }
    >
      <p lang="hi" className="text-wrap-anywhere text-[1.35rem] font-bold leading-tight text-ink [@media(max-width:767px)_and_(max-height:720px)]:text-lg sm:text-3xl dark:text-white">
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
      <p lang="hi" className="mt-1 text-wrap-anywhere text-sm font-semibold leading-7 text-zinc-700 dark:text-zinc-200">
        {value}
      </p>
    </div>
  );
}
