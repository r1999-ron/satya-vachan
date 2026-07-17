import Link from "next/link";
import { ArrowRight, BookOpen, Mic2, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatReadableDate } from "@/lib/dates";

export default function HomePage() {
  return (
    <div className="grid gap-5 md:grid-cols-[1.35fr_0.85fr] md:items-start">
      <section className="space-y-5">
        <GlassCard className="animate-floatIn p-6 sm:p-8">
          <StatusBadge tone="blue">{formatReadableDate()}</StatusBadge>
          <div className="mt-5 max-w-2xl space-y-4">
            <h1 className="text-balance text-4xl font-bold tracking-normal text-ink sm:text-5xl dark:text-white">
              Satya-Vachan
            </h1>
            <p className="text-balance text-lg leading-8 text-zinc-700 dark:text-zinc-300">
              Speak Hindi with clarity, grace, and confidence.
            </p>
            <p className="max-w-xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              Practice polished everyday Hindi, build a personal vocabulary, and
              keep a light daily rhythm. The full coaching loop arrives in later
              modules; this foundation is ready for it.
            </p>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/practice"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-lg shadow-zinc-900/15 transition hover:-translate-y-0.5 active:translate-y-0 dark:bg-white dark:text-zinc-950"
            >
              <Mic2 size={18} aria-hidden="true" />
              Start practice
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              href="/challenge"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-5 py-3 text-sm font-bold text-ink shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 active:translate-y-0 dark:border-white/12 dark:bg-white/10 dark:text-white"
            >
              <Sparkles size={18} aria-hidden="true" />
              Daily challenge
            </Link>
          </div>
        </GlassCard>

        <GlassCard interactive className="animate-floatIn [animation-delay:90ms]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <StatusBadge>Preview</StatusBadge>
              <h2 className="mt-3 text-xl font-bold text-ink dark:text-white">
                Today&apos;s refinement card
              </h2>
              <p className="mt-2 text-wrap-anywhere text-sm leading-7 text-zinc-650 dark:text-zinc-300">
                “Bahut achchha” can become “ati uttam” when the moment calls for
                a more graceful register.
              </p>
            </div>
            <ProgressRing value={72} label="Elegance preview" />
          </div>
        </GlassCard>
      </section>

      <aside className="grid gap-5 sm:grid-cols-2 md:grid-cols-1">
        <GlassCard className="animate-floatIn [animation-delay:140ms]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                Current streak
              </p>
              <p className="mt-1 text-3xl font-bold text-ink dark:text-white">
                0 days
              </p>
            </div>
            <span className="grid size-12 place-items-center rounded-2xl bg-amber-400/20 text-amber-700 shadow-glow dark:text-amber-200">
              <Sparkles size={22} aria-hidden="true" />
            </span>
          </div>
        </GlassCard>

        <GlassCard className="animate-floatIn [animation-delay:190ms]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                Learned words
              </p>
              <p className="mt-1 text-3xl font-bold text-ink dark:text-white">
                0 saved
              </p>
            </div>
            <Link
              href="/learned"
              className="grid size-12 place-items-center rounded-2xl bg-sky-400/18 text-sky-800 transition hover:scale-105 active:scale-95 dark:text-sky-200"
              aria-label="Open learned words"
            >
              <BookOpen size={22} aria-hidden="true" />
            </Link>
          </div>
        </GlassCard>
      </aside>
    </div>
  );
}
