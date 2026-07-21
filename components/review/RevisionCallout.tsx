"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useReviewQueue } from "@/lib/storage";

/**
 * Only appears when saved words are actually waiting, so the home screen stays
 * quiet on days with nothing to revise.
 */
export function RevisionCallout() {
  const { dueCount, isLoaded } = useReviewQueue();

  if (!isLoaded || dueCount === 0) {
    return null;
  }

  return (
    <GlassCard interactive className="border-accent/50 bg-accent-soft p-0">
      <Link
        href="/review"
        prefetch={false}
        className="flex items-center gap-4 rounded-card p-4 sm:p-5"
      >
        <motion.span
          animate={{ rotate: [0, -12, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="grid size-11 shrink-0 place-items-center rounded-btn border-theme border-line bg-surface text-accent"
        >
          <RotateCcw size={19} aria-hidden="true" />
        </motion.span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-accent">Revision ready</p>
          <p className="mt-1 text-base font-bold">
            {dueCount} saved {dueCount === 1 ? "word is" : "words are"} waiting to be
            spoken
          </p>
          <p className="mt-1 text-sm leading-6 text-content-muted">
            About a minute to bring them back into your speech.
          </p>
        </div>
        <motion.span
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="shrink-0 text-accent"
        >
          <ArrowRight size={18} aria-hidden="true" />
        </motion.span>
      </Link>
    </GlassCard>
  );
}
