import {
  AlertCircle,
  CheckCircle2,
  Trophy,
  WandSparkles,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import type { ChallengeResponse } from "@/types";

type ChallengeFeedbackProps = {
  fallbackNotice: string;
  onPolish?: () => void;
  polishDisabled?: boolean;
  polishInProgress?: boolean;
  result: ChallengeResponse;
  targetWord: string;
};

export function ChallengeFeedback({
  fallbackNotice,
  onPolish,
  polishDisabled = false,
  polishInProgress = false,
  result,
  targetWord,
}: ChallengeFeedbackProps) {
  const successful = result.acceptableUsage;

  return (
    <GlassCard
      className={cn(
        "relative animate-floatIn",
        successful
          ? "border-emerald-200/80 bg-emerald-50/75 motion-safe:animate-savePop dark:border-emerald-300/25 dark:bg-emerald-300/10"
          : "border-amber-200/80 bg-amber-50/75 dark:border-amber-300/25 dark:bg-amber-300/10",
      )}
    >
      {successful ? <CompletionBurst /> : null}
      <div className="flex min-w-0 gap-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl",
            successful
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-300/15 dark:text-emerald-100"
              : "bg-amber-100 text-amber-800 dark:bg-amber-300/15 dark:text-amber-100",
          )}
        >
          {successful ? (
            <Trophy size={21} aria-hidden="true" />
          ) : (
            <AlertCircle size={21} aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            {successful ? "Challenge accepted" : "Try once more"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-ink sm:text-2xl dark:text-white">
            {successful
              ? "That usage works nicely."
              : `Use ${targetWord} a little more directly.`}
          </h2>
          <p className="mt-2 text-wrap-anywhere text-sm font-normal leading-7 text-zinc-700 dark:text-zinc-300">
            {result.feedback}
          </p>
        </div>
      </div>

      {fallbackNotice ? (
        <p className="mt-4 border-t border-zinc-900/8 pt-3 text-xs font-normal leading-5 text-zinc-600 dark:border-white/10 dark:text-zinc-400">
          {fallbackNotice}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-zinc-900/8 pt-4 text-xs font-medium dark:border-white/10">
        <span className={result.usedTargetWord ? "text-emerald-800 dark:text-emerald-200" : "text-amber-900 dark:text-amber-100"}>
          <CheckCircle2 className="mr-1.5 inline" size={14} aria-hidden="true" />
          Target word: {result.usedTargetWord ? "found" : "missing"}
        </span>
        <span className={result.acceptableUsage ? "text-emerald-800 dark:text-emerald-200" : "text-amber-900 dark:text-amber-100"}>
          <CheckCircle2 className="mr-1.5 inline" size={14} aria-hidden="true" />
          Usage: {result.acceptableUsage ? "acceptable" : "needs revision"}
        </span>
      </div>

      {result.suggestedImprovement ? (
        <div className="mt-4 border-t border-zinc-900/8 pt-4 dark:border-white/10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Suggested version
          </p>
          <p className="mt-2 text-wrap-anywhere text-sm font-medium leading-7 text-ink dark:text-white">
            {result.suggestedImprovement}
          </p>
        </div>
      ) : null}

      {successful && onPolish ? (
        <button
          type="button"
          onClick={onPolish}
          disabled={polishDisabled}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/70 bg-white/70 px-4 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:border-emerald-300/25 dark:bg-white/8 dark:text-emerald-100 dark:hover:bg-white/12"
        >
          <WandSparkles size={16} aria-hidden="true" />
          {polishInProgress ? "Polishing…" : "Polish this sentence too →"}
        </button>
      ) : null}
    </GlassCard>
  );
}

function CompletionBurst() {
  return (
    <div
      className="pointer-events-none absolute right-5 top-5 hidden h-16 w-20 overflow-hidden sm:block"
      aria-hidden="true"
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className="absolute size-2 rounded-full bg-emerald-400/80 shadow-glow motion-safe:animate-savePop"
          style={{
            left: `${12 + index * 13}px`,
            top: `${index % 2 === 0 ? 8 : 26}px`,
            animationDelay: `${index * 70}ms`,
          }}
        />
      ))}
    </div>
  );
}
