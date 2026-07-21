"use client";

import { MotionConfig } from "motion/react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { transitions } from "@/lib/motion";

/**
 * Wraps the app in a single MotionConfig so `reducedMotion="user"` is honoured
 * everywhere — individual components never have to check the media query — and
 * cross-fades the main content on route changes.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <MotionConfig reducedMotion="user" transition={transitions.soft}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={transitions.fade}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
