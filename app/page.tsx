"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HindiText } from "@/components/hindi/HindiText";
import { GlassCard } from "@/components/ui/GlassCard";
import { getWordOfTheDay } from "@/data/words";
import { cn } from "@/lib/utils";
import type { HindiText as HindiTextValue } from "@/types";

export default function HomePage() {
  const todayWord = getWordOfTheDay();

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
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

        <div className="mt-5 grid gap-3 md:grid-cols-3 sm:mt-6 sm:gap-4">
          <Example
            label="Everyday usage"
            description="Natural everyday speech"
            text={todayWord.simpleExample}
          />
          <Example
            label="Improved version"
            description="A more elegant phrasing"
            text={todayWord.elevatedExample}
            featured
          />
          <Example
            label="Scholar version"
            description="A Sanskritized, formal register"
            text={todayWord.scholarExample}
          />
        </div>

        <Link
          href="/practice?challenge=today"
          className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-ink px-4 text-sm font-bold text-white shadow-md shadow-zinc-900/15 transition hover:-translate-y-0.5 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f5ef] active:translate-y-0 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-zinc-950"
        >
          Use it in a sentence
        </Link>
      </GlassCard>

      <GlassCard className="p-4 sm:p-5">
        <div className="grid gap-5 sm:grid-cols-2">
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

function Example({
  description,
  featured = false,
  label,
  text,
}: {
  description: string;
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
      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{description}</p>
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
