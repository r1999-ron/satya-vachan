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
    <section className="rounded-card border-theme border-accent/50 bg-accent-soft p-3.5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="eyebrow flex items-center gap-2 text-accent">
            <Sparkles size={14} aria-hidden="true" />
            {isToday ? "Today's challenge" : "Challenge"}
          </p>
          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <HindiText
              text={word.common}
              kind="inline"
              className="text-wrap-anywhere font-medium text-content-muted"
            />
            <ArrowRight className="shrink-0 text-accent" size={18} aria-hidden="true" />
            <HindiText
              text={word.elevated}
              kind="inline"
              className="text-wrap-anywhere text-lg font-bold"
            />
          </div>
          <p className="mt-2 text-sm leading-6 text-content-muted">
            {word.englishMeaning}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-chip border-theme px-3 text-xs font-bold",
            completedToday
              ? "border-success/50 bg-success-soft text-success"
              : "border-line bg-surface text-content-muted",
          )}
        >
          {completedToday ? <CheckCircle2 size={14} aria-hidden="true" /> : null}
          {completedToday ? "Completed" : "Not attempted"}
        </span>
      </div>

      {starters.length > 0 ? (
        <div className="mt-4 border-t border-line/60 pt-4">
          <div className="mt-2 flex flex-wrap gap-2">
            {starters.map((starter) => (
              <button
                key={starter}
                type="button"
                disabled={disabled}
                onClick={() => onStarterSelect(starter)}
                aria-pressed={selectedStarter === starter}
                className={cn(
                  "min-h-9 max-w-full rounded-btn border-theme px-3 py-2 text-left text-xs font-medium leading-5 transition disabled:cursor-not-allowed disabled:opacity-60",
                  selectedStarter === starter
                    ? "border-line bg-accent text-accent-fg"
                    : "border-line bg-surface text-content-muted hover:text-content",
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
