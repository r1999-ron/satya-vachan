"use client";

import {
  AlertCircle,
  CheckCircle2,
  Trophy,
  WandSparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { GlassCard } from "@/components/ui/GlassCard";
import { popIn, transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ChallengeResponse } from "@/types";

type ChallengeFeedbackProps = {
  fallbackNotice: string;
  onElevate?: () => void;
  elevateDisabled?: boolean;
  elevateInProgress?: boolean;
  result: ChallengeResponse;
  targetWord: string;
};

export function ChallengeFeedback({
  fallbackNotice,
  onElevate,
  elevateDisabled = false,
  elevateInProgress = false,
  result,
  targetWord,
}: ChallengeFeedbackProps) {
  const successful = result.acceptableUsage;

  return (
    <GlassCard
      className={cn(
        "relative",
        successful
          ? "border-success/50 bg-success-soft"
          : "border-accent/50 bg-accent-soft",
      )}
    >
      {successful ? <CompletionBurst /> : null}
      <div className="flex min-w-0 gap-3">
        <motion.span
          variants={popIn}
          initial="hidden"
          animate="visible"
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-btn border-theme border-line bg-surface",
            successful ? "text-success" : "text-accent",
          )}
        >
          {successful ? (
            <Trophy size={21} aria-hidden="true" />
          ) : (
            <AlertCircle size={21} aria-hidden="true" />
          )}
        </motion.span>
        <div className="min-w-0">
          <p className="eyebrow">
            {successful ? "Challenge accepted" : "Try once more"}
          </p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-display sm:text-2xl">
            {successful
              ? "That usage works nicely."
              : `Use ${targetWord} a little more directly.`}
          </h2>
          <p className="mt-2 text-wrap-anywhere text-sm leading-7 text-content-muted">
            {result.feedback}
          </p>
        </div>
      </div>

      {fallbackNotice ? (
        <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-content-subtle">
          {fallbackNotice}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-xs font-medium">
        <span className={result.usedTargetWord ? "text-success" : "text-content-muted"}>
          <CheckCircle2 className="mr-1.5 inline" size={14} aria-hidden="true" />
          Target word: {result.usedTargetWord ? "found" : "missing"}
        </span>
        <span className={result.acceptableUsage ? "text-success" : "text-content-muted"}>
          <CheckCircle2 className="mr-1.5 inline" size={14} aria-hidden="true" />
          Usage: {result.acceptableUsage ? "acceptable" : "needs revision"}
        </span>
      </div>

      {result.suggestedImprovement ? (
        <div className="mt-4 border-t border-line pt-4">
          <p className="eyebrow">Suggested version</p>
          <p className="mt-2 text-wrap-anywhere text-sm font-medium leading-7">
            {result.suggestedImprovement}
          </p>
        </div>
      ) : null}

      {successful && onElevate ? (
        <motion.button
          type="button"
          onClick={onElevate}
          disabled={elevateDisabled}
          whileTap={elevateDisabled ? undefined : { scale: 0.98 }}
          transition={transitions.snappy}
          className="btn btn-outline mt-5 w-full sm:w-auto"
        >
          <WandSparkles size={16} aria-hidden="true" />
          {elevateInProgress ? "Elevating…" : "Elevate this sentence too"}
        </motion.button>
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
        <motion.span
          key={index}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.85] }}
          transition={{ delay: index * 0.07, ...transitions.bouncy }}
          className="absolute size-2 rounded-full bg-success"
          style={{
            left: `${12 + index * 13}px`,
            top: `${index % 2 === 0 ? 8 : 26}px`,
          }}
        />
      ))}
    </div>
  );
}
