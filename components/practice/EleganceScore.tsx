import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type EleganceScoreProps = {
  originalScore: number;
  improvedScore: number;
  className?: string;
};

export function EleganceScore({
  originalScore,
  improvedScore,
  className,
}: EleganceScoreProps) {
  const improvement = Math.max(0, improvedScore - originalScore);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/35 p-4 dark:border-white/12 dark:bg-white/5",
        className,
      )}
    >
      <div>
        <p className="text-sm font-semibold text-ink dark:text-white">Expression upgrade</p>
        <p className="mt-1 text-sm font-normal text-zinc-600 dark:text-zinc-300">
          A playful estimate of how much more polished this version sounds.
        </p>
      </div>
      <div
        className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-100/70 px-3 py-2 text-xs font-semibold tabular-nums text-emerald-900 shadow-sm motion-safe:animate-savePop dark:border-emerald-300/25 dark:bg-emerald-300/12 dark:text-emerald-100"
        aria-label={`Elegance gain of ${improvement}`}
        aria-live="polite"
      >
        <TrendingUp size={15} aria-hidden="true" />
        +{improvement} elegance
      </div>
    </div>
  );
}
