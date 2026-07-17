import { Mic2, WandSparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { defaultTransformationExample, getDemoHints } from "@/data/demo";

export default function PracticePage() {
  const hints = getDemoHints(6);

  return (
    <div className="space-y-5">
      <GlassCard className="animate-floatIn p-6 sm:p-8">
        <StatusBadge tone="blue">Practice</StatusBadge>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-4">
            <h1 className="text-balance text-3xl font-bold text-ink sm:text-4xl dark:text-white">
              Refine an everyday Hindi sentence.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-700 dark:text-zinc-300">
              Start with one of these realistic prompts, then compare how a
              simple sentence can become clearer, more graceful, and still easy
              to say aloud.
            </p>
          </div>
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/70 bg-white/35 p-6 dark:border-white/15 dark:bg-white/5">
            <button className="inline-flex min-h-14 items-center gap-3 rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-lg transition active:scale-95 dark:bg-white dark:text-zinc-950">
              <Mic2 size={19} aria-hidden="true" />
              Record soon
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="animate-floatIn [animation-delay:80ms]">
        <div className="flex items-start gap-3">
          <WandSparkles
            className="mt-1 shrink-0 text-amber-600"
            size={20}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-ink dark:text-white">
              Hint prompts
            </h2>
            <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              Module 5 will make these tappable. For now, they seed the product
              loop with useful everyday sentences.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {hints.map((hint) => (
            <div
              key={hint}
              className="text-wrap-anywhere rounded-2xl border border-white/60 bg-white/40 p-4 text-sm font-semibold leading-7 text-zinc-700 dark:border-white/12 dark:bg-white/5 dark:text-zinc-300"
            >
              {hint}
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-5 md:grid-cols-3">
        {[
          {
            step: "Original",
            value: defaultTransformationExample.originalEleganceScore,
          },
          {
            step: "Polished",
            value: defaultTransformationExample.improvedEleganceScore,
          },
          {
            step: "Saved",
            value: defaultTransformationExample.saveableWords.length * 20,
          },
        ].map(({ step, value }) => (
          <GlassCard key={step} interactive className="min-w-0">
            <div className="flex items-center gap-3">
              <ProgressRing value={value} label={step} size={58} />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-ink dark:text-white">
                  {step}
                </h2>
                <p className="text-wrap-anywhere text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Demo score preview
                </p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <StatusBadge tone="green">Canonical Demo</StatusBadge>
        <div className="mt-4 space-y-4">
          <p className="text-wrap-anywhere rounded-2xl border border-white/60 bg-white/35 p-4 text-sm leading-7 text-zinc-700 dark:border-white/12 dark:bg-white/5 dark:text-zinc-300">
            {defaultTransformationExample.transcript}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-100/40 p-4 dark:border-emerald-300/20 dark:bg-emerald-300/10">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-200">
                Natural polished
              </p>
              <p className="mt-2 text-wrap-anywhere text-sm font-semibold leading-7 text-emerald-950 dark:text-emerald-100">
                {defaultTransformationExample.naturalPolishedVersion}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200/80 bg-amber-100/45 p-4 dark:border-amber-300/20 dark:bg-amber-300/10">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-200">
                More elevated
              </p>
              <p className="mt-2 text-wrap-anywhere text-sm font-semibold leading-7 text-amber-950 dark:text-amber-100">
                {defaultTransformationExample.elevatedVersion}
              </p>
            </div>
          </div>
          <p className="text-wrap-anywhere text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            {defaultTransformationExample.feedback}
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
