import { BookOpen, Search } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function LearnedPage() {
  return (
    <div className="space-y-5">
      <GlassCard className="animate-floatIn p-6 sm:p-8">
        <StatusBadge tone="green">Learned Words</StatusBadge>
        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-balance text-3xl font-bold text-ink sm:text-4xl dark:text-white">
              Your personal Hindi refinement list.
            </h1>
            <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">
              Saved words, filters, removal, and practice routing are planned
              for later modules. The layout is already sized for long Hindi and
              romanized entries.
            </p>
          </div>
          <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/60 bg-white/45 px-4 dark:border-white/12 dark:bg-white/5">
            <Search size={18} className="text-zinc-500" aria-hidden="true" />
            <span className="text-sm font-semibold text-zinc-500">
              Search soon
            </span>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-5 md:grid-cols-2">
        {["karya", "prayas"].map((word) => (
          <GlassCard key={word} interactive>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-wrap-anywhere text-2xl font-bold text-ink dark:text-white">
                  {word}
                </h2>
                <p className="mt-2 text-wrap-anywhere text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                  Placeholder learned word card. Seed vocabulary arrives in
                  Module 2 and persistence in Module 3.
                </p>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-400/16 text-sky-800 dark:text-sky-200">
                <BookOpen size={19} aria-hidden="true" />
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
