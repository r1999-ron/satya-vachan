import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { HindiText } from "@/components/hindi/HindiText";
import { cn } from "@/lib/utils";
import type { WordEntry } from "@/types";

type ChallengeBannerProps = {
  completedToday: boolean;
  disabled?: boolean;
  isToday?: boolean;
  onStarterSelect: (starter: string) => void;
  selectedStarter: string;
  starters: string[];
  word: WordEntry;
};

export function ChallengeBanner({
  completedToday,
  disabled = false,
  isToday = true,
  onStarterSelect,
  selectedStarter,
  starters,
  word,
}: ChallengeBannerProps) {
  return (
    <section className="rounded-2xl border border-amber-200/80 bg-amber-50/75 p-3.5 sm:p-5 dark:border-amber-300/20 dark:bg-amber-300/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200">
            <Sparkles size={14} aria-hidden="true" />
            {isToday ? "Today's challenge" : "Challenge"}
          </p>
          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <HindiText
              text={word.common}
              kind="inline"
              className="text-wrap-anywhere font-medium text-zinc-600 dark:text-zinc-300"
            />
            <ArrowRight className="shrink-0 text-amber-600" size={18} aria-hidden="true" />
            <HindiText
              text={word.elevated}
              kind="inline"
              className="text-wrap-anywhere text-lg font-bold text-ink dark:text-white"
            />
          </div>
          <p className="mt-2 text-sm font-normal leading-6 text-zinc-600 dark:text-zinc-300">
            {word.englishMeaning}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold",
            completedToday
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-300/15 dark:text-emerald-100"
              : "bg-white/75 text-zinc-600 ring-1 ring-zinc-900/8 dark:bg-white/8 dark:text-zinc-300 dark:ring-white/10",
          )}
        >
          {completedToday ? <CheckCircle2 size={14} aria-hidden="true" /> : null}
          {completedToday ? "Completed ✓" : "Not attempted"}
        </span>
      </div>

      {starters.length > 0 ? (
      <div className="mt-4 border-t border-amber-900/10 pt-4 dark:border-amber-100/10">
        {/* <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Start your sentence
        </p> */}
        <div className="mt-2 flex flex-wrap gap-2">
          {starters.map((starter) => (
            <button
              key={starter}
              type="button"
              disabled={disabled}
              onClick={() => onStarterSelect(starter)}
              aria-pressed={selectedStarter === starter}
              className={cn(
                "min-h-9 max-w-full rounded-xl px-3 py-2 text-left text-xs font-medium leading-5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 disabled:cursor-not-allowed disabled:opacity-60",
                selectedStarter === starter
                  ? "bg-amber-500 text-zinc-950"
                  : "bg-white/75 text-zinc-700 ring-1 ring-zinc-900/8 hover:bg-white dark:bg-white/8 dark:text-zinc-200 dark:ring-white/10 dark:hover:bg-white/12",
              )}
            >
              {starter}
            </button>
          ))}
        </div>
      </div>
      ) : null}
    </section>
  );
}
