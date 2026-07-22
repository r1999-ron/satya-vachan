"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ScrollText, X } from "lucide-react";
import { motion } from "motion/react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  formatMonthName,
  getMonthKey,
  getPreviousMonthKey,
  getTodayKey,
} from "@/lib/dates";
import { getMonthlyActivity, loadRecapSeenMonth, markRecapSeen } from "@/lib/storage";

/** How many days into a new month the recap invitation stays visible. */
const RECAP_WINDOW_DAYS = 7;

/**
 * Invites the user into last month's recap during the first week of a new
 * month — once per month, only when there is actually something to look back
 * on, and dismissible for good.
 */
export function RecapCallout() {
  const [recapMonth, setRecapMonth] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) {
        return;
      }

      const todayKey = getTodayKey();
      const dayOfMonth = Number(todayKey.slice(8, 10));

      if (dayOfMonth > RECAP_WINDOW_DAYS) {
        return;
      }

      const previousMonth = getPreviousMonthKey(getMonthKey(todayKey));
      const seen = loadRecapSeenMonth();

      if (seen && seen >= previousMonth) {
        return;
      }

      const activity = getMonthlyActivity(previousMonth);
      const hasActivity = Object.values(activity).some((count) => count > 0);

      if (hasActivity) {
        setRecapMonth(previousMonth);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  if (!recapMonth) {
    return null;
  }

  const dismiss = () => {
    markRecapSeen(recapMonth);
    setRecapMonth(null);
  };

  return (
    <GlassCard className="relative border-accent/40 bg-accent-soft p-0">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss monthly recap"
        className="icon-btn absolute right-2 top-2 z-10 size-8"
      >
        <X size={14} aria-hidden="true" />
      </button>
      <Link
        href="/recap"
        prefetch={false}
        className="flex items-center gap-4 rounded-card p-4 pr-12 sm:p-5"
      >
        <motion.span
          animate={{ rotate: [0, -6, 6, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          className="grid size-11 shrink-0 place-items-center rounded-btn border-theme border-line bg-surface text-accent"
        >
          <ScrollText size={19} aria-hidden="true" />
        </motion.span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-accent">
            <span lang="hi" className="font-hindi">
              व्यक्तिगत शब्दकोश
            </span>
          </p>
          <p className="mt-1 text-base font-bold">
            Your {formatMonthName(recapMonth)} in words is ready
          </p>
          <p className="mt-1 text-sm leading-6 text-content-muted">
            A one-minute look at what your Hindi gained last month.
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
