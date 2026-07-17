"use client";

import { BookOpenCheck, Sparkles, Trophy } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getWordOfTheDay } from "@/data/words";
import { getTodayKey } from "@/lib/dates";
import { useStreak } from "@/lib/storage";

export default function ChallengePage() {
  const todayWord = getWordOfTheDay();
  const { completedToday, completeToday, streak } = useStreak();

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <GlassCard className="animate-floatIn p-6 sm:p-8">
        <StatusBadge>Daily Challenge</StatusBadge>
        <div className="mt-5 space-y-4">
          <h1 className="text-balance text-3xl font-bold text-ink sm:text-4xl dark:text-white">
            Use today&apos;s refined word in your own sentence.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            Today&apos;s challenge is static for now: read the word, study the
            examples, and mark it complete once you have tried a sentence aloud.
            Recording and validation arrive in later modules.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          <div className="min-w-0 rounded-2xl border border-white/60 bg-white/38 p-5 dark:border-white/12 dark:bg-white/5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Common
            </p>
            <p className="mt-2 text-wrap-anywhere text-3xl font-bold text-zinc-700 dark:text-zinc-200">
              {todayWord.common}
            </p>
          </div>
          <div className="hidden items-center text-amber-600 md:flex">
            <Sparkles size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0 rounded-2xl border border-amber-200/80 bg-amber-100/55 p-5 shadow-glow dark:border-amber-300/25 dark:bg-amber-300/10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-200">
              Target word
            </p>
            <p className="mt-2 text-wrap-anywhere text-3xl font-bold text-ink dark:text-white">
              {todayWord.elevated}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/60 bg-white/35 p-5 dark:border-white/12 dark:bg-white/5">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
              Meaning
            </p>
            <p className="mt-2 text-wrap-anywhere text-sm leading-7 text-zinc-700 dark:text-zinc-300">
              {todayWord.englishMeaning}
            </p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/35 p-5 dark:border-white/12 dark:bg-white/5">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
              Usage note
            </p>
            <p className="mt-2 text-wrap-anywhere text-sm leading-7 text-zinc-700 dark:text-zinc-300">
              {todayWord.usageNote}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-200/70 bg-emerald-100/35 p-5 dark:border-emerald-300/20 dark:bg-emerald-300/10">
          <div className="flex items-start gap-3">
            <BookOpenCheck
              className="mt-1 shrink-0 text-emerald-700 dark:text-emerald-200"
              size={20}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                Prompt
              </p>
              <p className="mt-2 text-wrap-anywhere text-sm leading-7 text-emerald-950 dark:text-emerald-100">
                {todayWord.challengePrompt}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      <aside className="space-y-5">
        <GlassCard className="animate-floatIn [animation-delay:100ms]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                Challenge date
              </p>
              <p className="mt-1 text-2xl font-bold text-ink dark:text-white">
                {getTodayKey()}
              </p>
            </div>
            <ProgressRing
              value={completedToday ? 100 : 0}
              label="Challenge completion"
            />
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-400/14 px-4 py-3 text-sm font-bold text-emerald-900 dark:text-emerald-100">
            <Trophy size={18} aria-hidden="true" />
            {completedToday
              ? `Complete. Current streak: ${streak.currentStreak}`
              : `Current streak: ${streak.currentStreak}`}
          </div>
          <button
            type="button"
            onClick={completeToday}
            disabled={completedToday}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-lg shadow-zinc-900/15 transition hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:shadow-none dark:bg-white dark:text-zinc-950 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-300"
          >
            <Trophy size={18} aria-hidden="true" />
            {completedToday ? "Completed for today" : "Mark today complete"}
          </button>
          <p className="mt-3 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
            Completing the same date again will not increase the streak.
          </p>
        </GlassCard>

        <GlassCard className="animate-floatIn [animation-delay:150ms]">
          <StatusBadge tone="blue">Examples</StatusBadge>
          <div className="mt-4 space-y-3 text-sm leading-7">
            <p className="text-wrap-anywhere text-zinc-600 dark:text-zinc-300">
              <span className="font-bold text-zinc-800 dark:text-zinc-100">
                Simple:
              </span>{" "}
              {todayWord.simpleExample}
            </p>
            <p className="text-wrap-anywhere text-amber-900 dark:text-amber-100">
              <span className="font-bold">Polished:</span>{" "}
              {todayWord.elevatedExample}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {todayWord.synonyms.map((synonym) => (
              <span
                key={synonym}
                className="rounded-full bg-white/45 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-white/8 dark:text-zinc-300"
              >
                {synonym}
              </span>
            ))}
          </div>
        </GlassCard>
      </aside>
    </div>
  );
}
