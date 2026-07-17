import { TrendingUp } from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
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
        "grid gap-4 rounded-2xl border border-white/60 bg-white/35 p-4 dark:border-white/12 dark:bg-white/5 sm:grid-cols-[1fr_auto_1fr]",
        className,
      )}
    >
      <ScoreBlock label="Original" value={originalScore} tone="muted" />
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-100/70 px-3 py-2 text-xs font-bold text-emerald-900 dark:border-emerald-300/25 dark:bg-emerald-300/12 dark:text-emerald-100">
          <TrendingUp size={15} aria-hidden="true" />
          +{improvement}
        </div>
      </div>
      <ScoreBlock label="Polished" value={improvedScore} tone="bright" />
    </div>
  );
}

function ScoreBlock({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "muted" | "bright";
  value: number;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ProgressRing
        value={value}
        label={label}
        size={64}
        className={cn(tone === "bright" && "motion-safe:animate-scorePulse")}
      />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold text-ink dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}
