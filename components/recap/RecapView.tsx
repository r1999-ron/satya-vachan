"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookMarked,
  Flame,
  Mic2,
  Puzzle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  formatMonthName,
  getMonthKey,
  getPreviousMonthKey,
  getTodayKey,
} from "@/lib/dates";
import { fadeUp, stagger } from "@/lib/motion";
import { loadMonthlyRecap, markRecapSeen } from "@/lib/storage";
import type { MonthlyRecap } from "@/lib/recap";

type StatItem = {
  key: string;
  label: string;
  value: number;
  Icon: typeof Sparkles;
};

export function RecapView() {
  const [recap, setRecap] = useState<MonthlyRecap | null>(null);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) {
        return;
      }

      const monthKey = getPreviousMonthKey(getMonthKey(getTodayKey()));
      const built = loadMonthlyRecap(monthKey);
      setRecap(built);

      if (built.hasActivity) {
        markRecapSeen(monthKey);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  if (!recap) {
    return (
      <GlassCard>
        <p className="text-sm text-content-muted">Gathering your month...</p>
      </GlassCard>
    );
  }

  if (!recap.hasActivity) {
    return (
      <GlassCard className="text-center">
        <div className="flex flex-col items-center gap-3 py-6">
          <span className="grid size-12 place-items-center rounded-btn border-theme border-line bg-accent-soft text-accent">
            <Sparkles size={22} aria-hidden="true" />
          </span>
          <h2 lang="hi" className="font-hindi text-lg font-bold">
            आपकी पहली मासिक झलक अगले महीने तैयार होगी।
          </h2>
          <p className="max-w-sm text-sm leading-6 text-content-muted">
            Practice, play, and save a few words this month — your recap will be
            waiting when the month turns.
          </p>
          <Link href="/play" prefetch={false} className="btn btn-solid min-h-11 px-5 text-sm">
            Start today&apos;s game
          </Link>
        </div>
      </GlassCard>
    );
  }

  const { activity } = recap;
  const stats: StatItem[] = [
    { key: "practices", label: "sentences elevated", value: activity.practices, Icon: Mic2 },
    { key: "challenges", label: "challenges spoken", value: activity.challenges, Icon: Sparkles },
    { key: "puzzles", label: "games completed", value: activity.puzzlesCompleted, Icon: Puzzle },
    { key: "reviews", label: "words revised", value: activity.reviews, Icon: RotateCcw },
  ];

  return (
    <motion.div variants={stagger(0.07)} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={fadeUp}>
        <GlassCard className="border-accent/40 bg-accent-soft text-center">
          <p className="eyebrow text-accent">
            <span lang="hi" className="font-hindi">
              व्यक्तिगत शब्दकोश
            </span>
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-display sm:text-3xl">
            Your {formatMonthName(recap.monthKey)}
          </h1>
          <p className="mt-2 text-sm leading-6 text-content-muted">
            A quiet look at the Hindi you shaped this month.
          </p>
        </GlassCard>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
        {stats.map(({ key, label, value, Icon }) => (
          <GlassCard key={key} animateIn={false} className="text-center">
            <Icon size={16} aria-hidden="true" className="mx-auto text-accent" />
            <p className="mt-2 text-3xl font-bold tabular-nums leading-none">{value}</p>
            <p className="mt-1.5 text-xs font-medium text-content-muted">{label}</p>
          </GlassCard>
        ))}
      </motion.div>

      {recap.longestStreakInMonth > 0 ? (
        <motion.div variants={fadeUp}>
          <GlassCard className="flex items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-btn border-theme border-line bg-accent-soft text-accent">
              <Flame size={19} aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-bold">
                {recap.longestStreakInMonth}-day best streak
              </p>
              <p className="text-sm text-content-muted">
                Your longest unbroken run of daily challenges this month.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      ) : null}

      {recap.savedWords.length > 0 ? (
        <motion.div variants={fadeUp}>
          <GlassCard>
            <div className="flex items-center gap-2">
              <BookMarked size={16} aria-hidden="true" className="text-accent" />
              <h2 className="text-base font-bold">
                {recap.savedWords.length} words became yours
              </h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {recap.savedWords.slice(0, 16).map((word) => (
                <span
                  key={word.id}
                  lang="hi"
                  className="rounded-chip border-theme border-line bg-surface-2 px-3 py-1.5 font-hindi text-sm font-semibold"
                >
                  {word.wordDev || word.word}
                </span>
              ))}
            </div>
            {activity.puzzlePerfects > 0 || activity.twists > 0 ? (
              <p className="mt-3 border-t border-line/60 pt-3 text-xs text-content-muted">
                {activity.puzzlePerfects > 0
                  ? `${activity.puzzlePerfects} perfect ${activity.puzzlePerfects === 1 ? "game" : "games"}`
                  : ""}
                {activity.puzzlePerfects > 0 && activity.twists > 0 ? " · " : ""}
                {activity.twists > 0
                  ? `${activity.twists} bonus ${activity.twists === 1 ? "twist" : "twists"}`
                  : ""}
              </p>
            ) : null}
          </GlassCard>
        </motion.div>
      ) : null}

      <motion.div variants={fadeUp}>
        <GlassCard className="text-center">
          <p lang="hi" className="font-hindi text-base font-semibold leading-8">
            हर वाक्य के साथ आपकी हिंदी और निखरती जा रही है। इसी तरह बोलते रहिए।
          </p>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
