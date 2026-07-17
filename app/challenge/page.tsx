import { Sparkles, Trophy } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function ChallengePage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <GlassCard className="animate-floatIn p-6 sm:p-8">
        <StatusBadge>Daily Challenge</StatusBadge>
        <div className="mt-5 space-y-4">
          <h1 className="text-balance text-3xl font-bold text-ink sm:text-4xl dark:text-white">
            Use the day&apos;s refined word in your own sentence.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            Module 2 adds the word corpus. Later modules add recording,
            validation, and streak updates.
          </p>
        </div>
        <div className="mt-7 rounded-2xl border border-white/60 bg-white/38 p-5 dark:border-white/12 dark:bg-white/5">
          <div className="flex items-start gap-3">
            <Sparkles
              className="mt-1 shrink-0 text-amber-600"
              size={20}
              aria-hidden="true"
            />
            <p className="text-wrap-anywhere text-sm leading-7 text-zinc-700 dark:text-zinc-300">
              Challenge prompt placeholder with supportive feedback and a calm
              completion state.
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="animate-floatIn [animation-delay:100ms]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              Completion
            </p>
            <p className="mt-1 text-2xl font-bold text-ink dark:text-white">
              Ready
            </p>
          </div>
          <ProgressRing value={0} label="Challenge completion" />
        </div>
        <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-400/14 px-4 py-3 text-sm font-bold text-emerald-900 dark:text-emerald-100">
          <Trophy size={18} aria-hidden="true" />
          Streak logic arrives in Module 3
        </div>
      </GlassCard>
    </div>
  );
}
