"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useReviewQueue } from "@/lib/storage";

/**
 * Only appears when saved words are actually waiting, so the home screen stays
 * quiet on days with nothing to revise.
 */
export function RevisionCallout() {
  const { dueCount, isLoaded } = useReviewQueue();

  if (!isLoaded || dueCount === 0) {
    return null;
  }

  return (
    <GlassCard
      interactive
      className="animate-floatIn border-amber-200/80 bg-amber-50/75 p-0 dark:border-amber-300/20 dark:bg-amber-300/10"
    >
      <Link
        href="/review"
        prefetch={false}
        className="flex items-center gap-4 rounded-2xl p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:p-5"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-300/15 dark:text-amber-100">
          <RotateCcw size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200">
            Revision ready
          </p>
          <p className="mt-1 text-base font-bold text-ink dark:text-white">
            {dueCount} saved {dueCount === 1 ? "word is" : "words are"} waiting to be
            spoken
          </p>
          <p className="mt-1 text-sm font-normal leading-6 text-zinc-600 dark:text-zinc-300">
            About a minute to bring them back into your speech.
          </p>
        </div>
        <ArrowRight className="shrink-0 text-amber-700 dark:text-amber-200" size={18} aria-hidden="true" />
      </Link>
    </GlassCard>
  );
}
