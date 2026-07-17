"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Flame,
  Mic2,
  Sparkles,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { defaultTransformationExample } from "@/data/demo";
import { getWordOfTheDay } from "@/data/words";
import { formatReadableDate } from "@/lib/dates";
import { useLearnedWords, useStreak } from "@/lib/storage";

export default function HomePage() {
  const todayWord = getWordOfTheDay();
  const { words } = useLearnedWords();
  const { completedToday, streak } = useStreak();
  const challengeProgress = completedToday ? 100 : streak.currentStreak > 0 ? 64 : 24;

  return (
    <div className="grid gap-5 md:grid-cols-[1.35fr_0.85fr] md:items-start">
      <section className="space-y-5">
        <GlassCard className="animate-floatIn p-6 sm:p-8">
          <StatusBadge tone="blue">{formatReadableDate()}</StatusBadge>
          <div className="mt-5 max-w-2xl space-y-4">
            <h1 className="text-balance text-4xl font-bold tracking-normal text-ink sm:text-5xl dark:text-white">
              Satya-Vachan
            </h1>
            <p className="text-balance text-lg leading-8 text-zinc-700 dark:text-zinc-300">
              Speak Hindi with clarity, grace, and confidence.
            </p>
            <p className="max-w-xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              Practice polished everyday Hindi, build a personal vocabulary, and
              keep a light daily rhythm with today&apos;s refined word.
            </p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Link
              href="/practice"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-lg shadow-zinc-900/15 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ink/40 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 dark:bg-white dark:text-zinc-950 dark:focus:ring-white/40 dark:focus:ring-offset-zinc-950"
            >
              <Mic2 size={18} aria-hidden="true" />
              Practice
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              href="/challenge"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-5 py-3 text-sm font-bold text-ink shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 dark:border-white/12 dark:bg-white/10 dark:text-white dark:focus:ring-offset-zinc-950"
            >
              <CalendarCheck size={18} aria-hidden="true" />
              Challenge
            </Link>
            <Link
              href="/learned"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-5 py-3 text-sm font-bold text-ink shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 dark:border-white/12 dark:bg-white/10 dark:text-white dark:focus:ring-offset-zinc-950"
            >
              <BookOpen size={18} aria-hidden="true" />
              Learned Words
            </Link>
          </div>
        </GlassCard>

        <GlassCard interactive className="animate-floatIn [animation-delay:90ms]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge>Word of the Day</StatusBadge>
                <StatusBadge tone="blue">{todayWord.difficulty}</StatusBadge>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="min-w-0 rounded-2xl border border-white/60 bg-white/40 p-4 dark:border-white/12 dark:bg-white/5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                    Common
                  </p>
                  <p className="mt-1 text-wrap-anywhere text-2xl font-bold text-zinc-700 dark:text-zinc-200">
                    {todayWord.common}
                  </p>
                </div>
                <ArrowRight
                  className="hidden text-amber-600 sm:block"
                  size={22}
                  aria-hidden="true"
                />
                <div className="min-w-0 rounded-2xl border border-amber-200/80 bg-amber-100/55 p-4 shadow-glow dark:border-amber-300/25 dark:bg-amber-300/10">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-200">
                    Refined
                  </p>
                  <p className="mt-1 text-wrap-anywhere text-2xl font-bold text-ink dark:text-white">
                    {todayWord.elevated}
                  </p>
                </div>
              </div>
              <p className="text-wrap-anywhere text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {todayWord.englishMeaning}
              </p>
              <div className="space-y-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                <p className="text-wrap-anywhere">
                  <span className="font-bold text-zinc-800 dark:text-zinc-100">
                    Simple:
                  </span>{" "}
                  {todayWord.simpleExample}
                </p>
                <p className="text-wrap-anywhere">
                  <span className="font-bold text-amber-800 dark:text-amber-200">
                    Polished:
                  </span>{" "}
                  {todayWord.elevatedExample}
                </p>
              </div>
              <p className="text-wrap-anywhere text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                {todayWord.usageNote}
              </p>
            </div>
            <ProgressRing value={78} label="Word refinement preview" />
          </div>
        </GlassCard>

        <GlassCard className="animate-floatIn [animation-delay:120ms]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge tone="green">Mini Transformation</StatusBadge>
            <Link
              href="/practice"
              className="inline-flex items-center gap-1 text-sm font-bold text-emerald-800 transition hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 dark:text-emerald-100 dark:hover:text-white"
            >
              Try it
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <p className="text-wrap-anywhere rounded-2xl border border-white/60 bg-white/35 p-4 text-sm leading-7 text-zinc-700 dark:border-white/12 dark:bg-white/5 dark:text-zinc-300">
              {defaultTransformationExample.transcript}
            </p>
            <p className="text-wrap-anywhere rounded-2xl border border-emerald-200/70 bg-emerald-100/40 p-4 text-sm font-semibold leading-7 text-emerald-950 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">
              {defaultTransformationExample.naturalPolishedVersion}
            </p>
          </div>
        </GlassCard>
      </section>

      <aside className="grid gap-5 sm:grid-cols-2 md:grid-cols-1">
        <GlassCard className="animate-floatIn [animation-delay:140ms]">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                Current streak
              </p>
              <p className="mt-1 text-3xl font-bold text-ink dark:text-white">
                {streak.currentStreak} {streak.currentStreak === 1 ? "day" : "days"}
              </p>
              <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {completedToday
                  ? "Daily challenge complete"
                  : `Longest: ${streak.longestStreak} ${
                      streak.longestStreak === 1 ? "day" : "days"
                    }`}
              </p>
            </div>
            <ProgressRing
              value={challengeProgress}
              label="Daily rhythm"
              className="motion-safe:animate-scorePulse"
            />
          </div>
        </GlassCard>

        <GlassCard className="animate-floatIn [animation-delay:190ms]">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                Learned words
              </p>
              <p className="mt-1 text-3xl font-bold text-ink dark:text-white">
                {words.length} {words.length === 1 ? "word" : "words"}
              </p>
              <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Saved on this device
              </p>
            </div>
            <Link
              href="/learned"
              className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-400/18 text-sky-800 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400/50 active:scale-95 dark:text-sky-200"
              aria-label="Open learned words"
            >
              <BookOpen size={22} aria-hidden="true" />
            </Link>
          </div>
        </GlassCard>

        <GlassCard className="animate-floatIn [animation-delay:230ms]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge tone={completedToday ? "green" : "rose"}>
              {completedToday ? "Completed Today" : "Challenge Preview"}
            </StatusBadge>
            <span className="grid size-10 place-items-center rounded-2xl bg-amber-400/20 text-amber-700 shadow-glow dark:text-amber-200">
              {completedToday ? (
                <Sparkles size={19} aria-hidden="true" />
              ) : (
                <Flame size={19} aria-hidden="true" />
              )}
            </span>
          </div>
          <p className="mt-3 text-wrap-anywhere text-sm font-semibold leading-7 text-zinc-700 dark:text-zinc-300">
            {todayWord.challengePrompt}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {todayWord.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/45 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-white/8 dark:text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
          <Link
            href="/challenge"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-2 text-sm font-bold text-white shadow-lg shadow-zinc-900/15 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ink/40 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 dark:bg-white dark:text-zinc-950 dark:focus:ring-white/40 dark:focus:ring-offset-zinc-950"
          >
            {completedToday ? "Review challenge" : "Start challenge"}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </GlassCard>
      </aside>
    </div>
  );
}
