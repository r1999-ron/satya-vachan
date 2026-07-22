"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { popIn, transitions } from "@/lib/motion";
import {
  findNewMilestone,
  reachedMilestoneIds,
  type Milestone,
} from "@/lib/milestones";
import {
  LEARNED_EVENT,
  PUZZLE_EVENT,
  initializeMilestonesSeen,
  loadMilestoneStats,
  loadMilestonesSeen,
  markMilestoneSeen,
} from "@/lib/storage";
import { readThemeColors } from "@/lib/theme";

const STREAK_EVENT = "satya-vachan:streak";

/**
 * Watches for newly-crossed milestones and celebrates at most one per session,
 * as a full-screen moment that is then never shown again. Mounted once in the
 * app shell.
 */
export function MilestoneCelebration() {
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const shownThisSession = useRef(false);

  const celebrate = useCallback((next: Milestone) => {
    setMilestone(next);
    markMilestoneSeen(next.id);
    shownThisSession.current = true;
    confetti({
      particleCount: 90,
      spread: 78,
      startVelocity: 38,
      gravity: 0.85,
      scalar: 0.95,
      origin: { x: 0.5, y: 0.5 },
      colors: readThemeColors([
        "--c-accent",
        "--c-accent-bright",
        "--c-secondary",
        "--c-success",
      ]),
      disableForReducedMotion: true,
    });
  }, []);

  useEffect(() => {
    // Seed seen-state on first run so pre-existing progress is not celebrated,
    // then only react to crossings that happen while the app is open.
    const initialStats = loadMilestoneStats();
    initializeMilestonesSeen(reachedMilestoneIds(initialStats));

    const check = () => {
      if (shownThisSession.current) {
        return;
      }

      const found = findNewMilestone(loadMilestoneStats(), loadMilestonesSeen());

      if (found) {
        celebrate(found);
      }
    };

    window.addEventListener(STREAK_EVENT, check);
    window.addEventListener(LEARNED_EVENT, check);
    window.addEventListener(PUZZLE_EVENT, check);

    return () => {
      window.removeEventListener(STREAK_EVENT, check);
      window.removeEventListener(LEARNED_EVENT, check);
      window.removeEventListener(PUZZLE_EVENT, check);
    };
  }, [celebrate]);

  return (
    <AnimatePresence>
      {milestone ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transitions.fade}
          className="fixed inset-0 z-[100] grid place-items-center bg-canvas/80 p-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Milestone reached"
          onClick={() => setMilestone(null)}
        >
          <motion.div
            variants={popIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(event) => event.stopPropagation()}
            className="card w-full max-w-sm p-7 text-center"
          >
            <motion.span
              animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto grid size-14 place-items-center rounded-full border-theme border-line bg-accent-soft text-accent"
            >
              <Sparkles size={26} aria-hidden="true" />
            </motion.span>
            <p className="eyebrow mt-4 text-accent">Milestone</p>
            <h2 lang="hi" className="mt-2 font-hindi text-2xl font-bold leading-snug">
              {milestone.headline}
            </h2>
            <p className="mt-3 text-sm leading-6 text-content-muted">{milestone.line}</p>
            <button
              type="button"
              onClick={() => setMilestone(null)}
              className="btn btn-solid mt-6 min-h-11 w-full"
            >
              <span lang="hi" className="font-hindi">
                धन्यवाद
              </span>
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
