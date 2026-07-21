"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { BookMarked, Flame, RotateCcw } from "lucide-react";
import { fadeUp, stagger, transitions } from "@/lib/motion";
import { useLearnedWords, useReviewQueue, useStreak } from "@/lib/storage";

/**
 * A scannable "where am I" row directly under the hero. Everything it shows is
 * already in localStorage, so it costs no network and gives the home screen a
 * reason to be revisited daily.
 */
export function StatsStrip() {
  const { streak } = useStreak();
  const { words } = useLearnedWords();
  const { dueCount, isLoaded } = useReviewQueue();

  const stats = [
    {
      key: "streak",
      label: streak.currentStreak === 1 ? "day streak" : "day streak",
      value: streak.currentStreak,
      Icon: Flame,
      href: null,
    },
    {
      key: "saved",
      label: "words saved",
      value: words.length,
      Icon: BookMarked,
      href: "/learned",
    },
    {
      key: "due",
      label: "to revise",
      value: isLoaded ? dueCount : 0,
      Icon: RotateCcw,
      href: "/review",
    },
  ] as const;

  return (
    <motion.ul
      variants={stagger(0.05, 0.1)}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-2 sm:gap-3"
    >
      {stats.map(({ key, label, value, Icon, href }) => {
        const body = (
          <>
            <Icon size={15} aria-hidden="true" className="text-accent" />
            <span className="mt-1.5 block text-xl font-bold tabular-nums leading-none sm:text-2xl">
              {value}
            </span>
            <span className="mt-1 block text-[11px] font-medium leading-tight text-content-muted">
              {label}
            </span>
          </>
        );

        return (
          <motion.li key={key} variants={fadeUp}>
            {href ? (
              <motion.div whileTap={{ scale: 0.97 }} transition={transitions.snappy}>
                <Link
                  href={href}
                  prefetch={false}
                  className="card card-interactive block h-full px-3 py-3 text-center sm:px-4"
                >
                  {body}
                </Link>
              </motion.div>
            ) : (
              <div className="card h-full px-3 py-3 text-center sm:px-4">{body}</div>
            )}
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
