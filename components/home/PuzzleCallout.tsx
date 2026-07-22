"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Puzzle } from "lucide-react";
import { motion } from "motion/react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getTodayKey } from "@/lib/dates";
import { PUZZLE_ROUND_COUNT } from "@/lib/puzzle";
import { loadPuzzleState } from "@/lib/storage";

/**
 * A quiet pointer to today's word game. It disappears once the daily set is
 * finished, so a completed day leaves the home screen calm.
 */
export function PuzzleCallout() {
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) {
        return;
      }

      const state = loadPuzzleState(getTodayKey());
      setProgress(state?.completed ? null : (state?.results.length ?? 0));
    });

    return () => {
      isActive = false;
    };
  }, []);

  if (progress === null) {
    return null;
  }

  return (
    <GlassCard interactive className="border-secondary/40 bg-secondary-soft p-0">
      <Link
        href="/play"
        prefetch={false}
        className="flex items-center gap-4 rounded-card p-4 sm:p-5"
      >
        <motion.span
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="grid size-11 shrink-0 place-items-center rounded-btn border-theme border-line bg-surface text-secondary"
        >
          <Puzzle size={19} aria-hidden="true" />
        </motion.span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-secondary">
            <span lang="hi" className="font-hindi">
              आज का खेल
            </span>
          </p>
          <p className="mt-1 text-base font-bold">
            {progress > 0
              ? `${progress}/${PUZZLE_ROUND_COUNT} done — finish today's set`
              : "Five sentences, five missing words"}
          </p>
          <p className="mt-1 text-sm leading-6 text-content-muted">
            A two-minute word game. Same five for everyone today.
          </p>
        </div>
        <motion.span
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="shrink-0 text-secondary"
        >
          <ArrowRight size={18} aria-hidden="true" />
        </motion.span>
      </Link>
    </GlassCard>
  );
}
