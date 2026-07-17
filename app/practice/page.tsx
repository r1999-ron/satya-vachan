import { Mic2, WandSparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function PracticePage() {
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
              Recording, transcription, AI transformation, and saved vocabulary
              will be connected in later modules. This page is ready for that
              product loop.
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

      <div className="grid gap-5 md:grid-cols-3">
        {["Polish", "Explain", "Save"].map((step, index) => (
          <GlassCard key={step} interactive className="min-w-0">
            <div className="flex items-center gap-3">
              <ProgressRing value={(index + 1) * 25} label={step} size={58} />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-ink dark:text-white">
                  {step}
                </h2>
                <p className="text-wrap-anywhere text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Module {index + 5} expands this step.
                </p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="flex items-start gap-3">
          <WandSparkles
            className="mt-1 shrink-0 text-amber-600"
            size={20}
            aria-hidden="true"
          />
          <p className="text-wrap-anywhere text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            Placeholder result area: natural polished version, elevated version,
            score movement, and replacement cards will appear here.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
