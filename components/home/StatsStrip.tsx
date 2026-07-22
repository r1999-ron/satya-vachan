"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { BookMarked, Flame, Leaf, RotateCcw } from "lucide-react";
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
      label: "day streak",
      value: streak.currentStreak,
      Icon: Flame,
      href: null,
      // Banked विश्राम दिन surface as a quiet leaf so an earned safety net is
      // visible without turning the tile into a second number.
      badge: streak.restDayBank > 0 ? streak.restDayBank : null,
    },
    {
      key: "saved",
      label: "words saved",
      value: words.length,
      Icon: BookMarked,
      href: "/learned",
      badge: null,
    },
    {
      key: "due",
      label: "to revise",
      value: isLoaded ? dueCount : 0,
      Icon: RotateCcw,
      href: "/review",
      badge: null,
    },
  ] as const;

  return (
    <motion.ul
      variants={stagger(0.05, 0.1)}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-2 sm:gap-3"
    >
      {stats.map(({ key, label, value, Icon, href, badge }) => {
        const body = (
          <>
            <span className="inline-flex items-center gap-1">
              <Icon size={15} aria-hidden="true" className="text-accent" />
              {badge ? (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-bold text-success"
                  title={`${badge} rest ${badge === 1 ? "day" : "days"} banked`}
                >
                  <Leaf size={11} aria-hidden="true" />
                  {badge}
                </span>
              ) : null}
            </span>
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
