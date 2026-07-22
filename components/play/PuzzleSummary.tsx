"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { RotateCcw, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { fadeUp, stagger } from "@/lib/motion";
import { readThemeColors } from "@/lib/theme";

type PuzzleSummaryProps = {
  results: boolean[];
  isDaily: boolean;
  onPlayAgain: () => void;
};

export function PuzzleSummary({ results, isDaily, onPlayAgain }: PuzzleSummaryProps) {
  const score = results.filter(Boolean).length;
  const total = results.length;
  const perfect = total > 0 && score === total;
  const celebratedRef = useRef(false);

  useEffect(() => {
    if (perfect && !celebratedRef.current) {
      celebratedRef.current = true;
      confetti({
        particleCount: 64,
        spread: 68,
        startVelocity: 32,
        gravity: 0.9,
        scalar: 0.86,
        origin: { x: 0.5, y: 0.6 },
        colors: readThemeColors([
          "--c-accent",
          "--c-accent-bright",
          "--c-secondary",
          "--c-success",
        ]),
        disableForReducedMotion: true,
      });
    }
  }, [perfect]);

  const headline = perfect
    ? "उत्कृष्ट! सभी शब्द सही।"
    : score >= Math.ceil(total / 2)
      ? "सुंदर प्रयास।"
      : "हर शब्द एक शुरुआत है।";

  return (
    <GlassCard>
      <motion.div
        variants={stagger(0.08)}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-4 py-2 text-center"
      >
        <motion.div variants={fadeUp}>
          <ProgressRing
            value={total > 0 ? Math.round((score / total) * 100) : 0}
            label="Puzzle score"
            size={92}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <h2 lang="hi" className="font-hindi text-xl font-bold sm:text-2xl">
            {headline}
          </h2>
          <p className="mt-1 text-sm text-content-muted">
            {score} of {total} correct
            {isDaily ? " in today's set" : ""}
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="flex items-center gap-1.5">
          {results.map((correct, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={`size-2.5 rounded-full ${correct ? "bg-success" : "bg-danger/60"}`}
            />
          ))}
        </motion.div>

        {isDaily ? (
          <motion.p variants={fadeUp} className="text-xs text-content-muted">
            <span lang="hi" className="font-hindi">
              कल एक नया खेल आपकी प्रतीक्षा करेगा।
            </span>
          </motion.p>
        ) : null}

        <motion.button
          variants={fadeUp}
          type="button"
          onClick={onPlayAgain}
          className="btn btn-solid min-h-11 px-5 text-sm"
        >
          {isDaily ? <Sparkles size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}
          Play a bonus round
        </motion.button>
      </motion.div>
    </GlassCard>
  );
}
